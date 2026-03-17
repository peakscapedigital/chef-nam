-- Reconcile BigQuery website_leads from Firestore changelog
--
-- The Firebase "Stream to BigQuery" extension writes every Firestore change
-- as a row in lead_status_changelog_raw_changelog. This query reads the
-- latest state from the changelog and updates website_leads.
--
-- Schedule: Run as a BigQuery Scheduled Query (every 1-6 hours)
-- Project: chef-nam-analytics (find/replace for new clients)
--
-- What it syncs:
--   - status (latest from changelog)
--   - status_updated_at (timestamp of latest status change)
--   - contacted_at (timestamp of first "contacted" status)
--   - booked_at (timestamp of first "booked" status)
--   - won_at (timestamp of first "won" status)
--   - notes (latest from changelog)
--   - booking_value (latest from changelog)

UPDATE `chef-nam-analytics.leads.website_leads` w
SET
  w.status = l.status,
  w.status_updated_at = l.changelog_timestamp,
  w.contacted_at = COALESCE(
    SAFE.PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', l.contacted_at),
    l.first_contacted_at,
    w.contacted_at
  ),
  w.booked_at = COALESCE(
    SAFE.PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', l.booked_at),
    l.first_booked_at,
    w.booked_at
  ),
  w.won_at = COALESCE(
    SAFE.PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', l.won_at),
    l.first_won_at,
    w.won_at
  ),
  w.notes = COALESCE(l.notes, w.notes),
  w.booking_value = COALESCE(l.booking_value, w.booking_value)
FROM (
  SELECT
    lead_id,
    status,
    notes,
    booking_value,
    contacted_at,
    booked_at,
    won_at,
    changelog_timestamp,
    first_contacted_at,
    first_booked_at,
    first_won_at
  FROM (
    SELECT
      JSON_EXTRACT_SCALAR(c.data, '$.lead_id') AS lead_id,
      JSON_EXTRACT_SCALAR(c.data, '$.status') AS status,
      JSON_EXTRACT_SCALAR(c.data, '$.notes') AS notes,
      SAFE_CAST(JSON_EXTRACT_SCALAR(c.data, '$.booking_value') AS FLOAT64) AS booking_value,
      JSON_EXTRACT_SCALAR(c.data, '$.contacted_at') AS contacted_at,
      JSON_EXTRACT_SCALAR(c.data, '$.booked_at') AS booked_at,
      JSON_EXTRACT_SCALAR(c.data, '$.won_at') AS won_at,
      c.timestamp AS changelog_timestamp,
      -- Derive milestone timestamps from status change history (fallback)
      MIN(CASE WHEN JSON_EXTRACT_SCALAR(c.data, '$.status') = 'contacted' THEN c.timestamp END)
        OVER (PARTITION BY JSON_EXTRACT_SCALAR(c.data, '$.lead_id')) AS first_contacted_at,
      MIN(CASE WHEN JSON_EXTRACT_SCALAR(c.data, '$.status') = 'booked' THEN c.timestamp END)
        OVER (PARTITION BY JSON_EXTRACT_SCALAR(c.data, '$.lead_id')) AS first_booked_at,
      MIN(CASE WHEN JSON_EXTRACT_SCALAR(c.data, '$.status') = 'won' THEN c.timestamp END)
        OVER (PARTITION BY JSON_EXTRACT_SCALAR(c.data, '$.lead_id')) AS first_won_at,
      ROW_NUMBER() OVER (
        PARTITION BY JSON_EXTRACT_SCALAR(c.data, '$.lead_id')
        ORDER BY c.timestamp DESC
      ) AS rn
    FROM `chef-nam-analytics.leads.lead_status_changelog_raw_changelog` c
    WHERE c.operation IN ('CREATE', 'UPDATE')
      AND JSON_EXTRACT_SCALAR(c.data, '$.lead_id') IS NOT NULL
  )
  WHERE rn = 1
) l
WHERE w.lead_id = l.lead_id
  AND (
    w.status != l.status
    OR (w.contacted_at IS NULL AND COALESCE(SAFE.PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', l.contacted_at), l.first_contacted_at) IS NOT NULL)
    OR (w.booked_at IS NULL AND COALESCE(SAFE.PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', l.booked_at), l.first_booked_at) IS NOT NULL)
    OR (w.won_at IS NULL AND COALESCE(SAFE.PARSE_TIMESTAMP('%Y-%m-%dT%H:%M:%E*SZ', l.won_at), l.first_won_at) IS NOT NULL)
    OR (l.notes IS NOT NULL AND l.notes != '' AND COALESCE(w.notes, '') != l.notes)
    OR (l.booking_value IS NOT NULL AND COALESCE(w.booking_value, 0) != l.booking_value)
  );
