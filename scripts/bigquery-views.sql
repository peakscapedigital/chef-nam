-- BigQuery Views for Lead Analytics
-- Reference implementation: Chef Nam (chef-nam-analytics)
-- For new clients: find/replace project ID, Google Ads account ID, GA4 property ID

-- ============================================================
-- lead_response_time
-- Time from submission to first "contacted" status
-- ============================================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.lead_response_time` AS
SELECT
  l.lead_id,
  l.first_name,
  l.last_name,
  l.submitted_at,
  l.contacted_at,
  l.status,
  TIMESTAMP_DIFF(l.contacted_at, l.submitted_at, MINUTE) AS response_minutes,
  ROUND(TIMESTAMP_DIFF(l.contacted_at, l.submitted_at, MINUTE) / 60.0, 1) AS response_hours
FROM `chef-nam-analytics.leads.website_leads` l
WHERE l.is_spam = FALSE
  AND l.is_test = FALSE
  AND l.contacted_at IS NOT NULL;

-- ============================================================
-- lead_status_history
-- All status changes per lead from Firestore changelog
-- ============================================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.lead_status_history` AS
SELECT
  JSON_EXTRACT_SCALAR(data, '$.lead_id') AS lead_id,
  JSON_EXTRACT_SCALAR(data, '$.status') AS status,
  TIMESTAMP(JSON_EXTRACT_SCALAR(data, '$.updated_at')) AS changed_at,
  timestamp AS firestore_timestamp
FROM `chef-nam-analytics.leads.lead_status_changelog_raw_changelog`
WHERE operation IN ('UPDATE', 'CREATE')
  AND JSON_EXTRACT_SCALAR(data, '$.status') IS NOT NULL
ORDER BY timestamp;

-- ============================================================
-- lead_current_status
-- Latest status per lead, joining Firestore changelog with BigQuery
-- ============================================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.lead_current_status` AS
WITH latest_status AS (
  SELECT
    JSON_EXTRACT_SCALAR(data, '$.lead_id') AS lead_id,
    JSON_EXTRACT_SCALAR(data, '$.status') AS status,
    JSON_EXTRACT_SCALAR(data, '$.booking_value') AS booking_value,
    JSON_EXTRACT_SCALAR(data, '$.notes') AS notes,
    ROW_NUMBER() OVER (
      PARTITION BY JSON_EXTRACT_SCALAR(data, '$.lead_id')
      ORDER BY timestamp DESC
    ) AS rn
  FROM `chef-nam-analytics.leads.lead_status_changelog_raw_changelog`
  WHERE JSON_EXTRACT_SCALAR(data, '$.lead_id') IS NOT NULL
)
SELECT
  l.*,
  COALESCE(ls.status, l.status) AS current_status,
  SAFE_CAST(ls.booking_value AS FLOAT64) AS current_booking_value,
  ls.notes AS current_notes
FROM `chef-nam-analytics.leads.website_leads` l
LEFT JOIN latest_status ls ON l.lead_id = ls.lead_id AND ls.rn = 1
WHERE l.is_spam = FALSE AND l.is_test = FALSE;

-- ============================================================
-- lead_attribution_summary
-- Aggregated metrics by source with conversion funnel
-- ============================================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.lead_attribution_summary` AS
SELECT
  COALESCE(l.lead_source, 'Unknown') AS lead_source,
  COUNT(*) AS total_leads,
  COUNTIF(COALESCE(ls.status, l.status) = 'contacted') AS contacted,
  COUNTIF(COALESCE(ls.status, l.status) = 'qualified') AS qualified,
  COUNTIF(COALESCE(ls.status, l.status) = 'quoted') AS quoted,
  COUNTIF(COALESCE(ls.status, l.status) = 'tasting') AS tasting,
  COUNTIF(COALESCE(ls.status, l.status) = 'invoice_sent') AS invoice_sent,
  COUNTIF(COALESCE(ls.status, l.status) = 'booked') AS booked,
  COUNTIF(COALESCE(ls.status, l.status) = 'invoice_paid') AS invoice_paid,
  COUNTIF(COALESCE(ls.status, l.status) = 'won') AS won,
  COUNTIF(COALESCE(ls.status, l.status) = 'lost') AS lost,
  COUNTIF(COALESCE(ls.status, l.status) = 'no_response') AS no_response,
  SUM(CASE WHEN COALESCE(ls.status, l.status) IN ('invoice_paid', 'won')
    THEN SAFE_CAST(ls.booking_value AS FLOAT64) ELSE 0 END) AS total_revenue
FROM `chef-nam-analytics.leads.website_leads` l
LEFT JOIN (
  SELECT
    JSON_EXTRACT_SCALAR(data, '$.lead_id') AS lead_id,
    JSON_EXTRACT_SCALAR(data, '$.status') AS status,
    JSON_EXTRACT_SCALAR(data, '$.booking_value') AS booking_value,
    ROW_NUMBER() OVER (
      PARTITION BY JSON_EXTRACT_SCALAR(data, '$.lead_id')
      ORDER BY timestamp DESC
    ) AS rn
  FROM `chef-nam-analytics.leads.lead_status_changelog_raw_changelog`
  WHERE JSON_EXTRACT_SCALAR(data, '$.lead_id') IS NOT NULL
) ls ON l.lead_id = ls.lead_id AND ls.rn = 1
WHERE l.is_spam = FALSE AND l.is_test = FALSE
GROUP BY lead_source;

-- ============================================================
-- google_ads_conversions
-- Formatted for Google Ads offline conversion CSV upload
-- ============================================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.google_ads_conversions` AS
-- Lead_Qualified conversions (triggered at qualified stage — they responded)
SELECT
  l.gclid AS `Google Click ID`,
  'Lead_Qualified' AS `Conversion Name`,
  FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S-05:00', l.status_updated_at) AS `Conversion Time`,
  100.0 AS `Conversion Value`,
  'USD' AS `Conversion Currency`
FROM `chef-nam-analytics.leads.website_leads` l
WHERE l.is_spam = FALSE
  AND l.is_test = FALSE
  AND l.gclid IS NOT NULL
  AND l.status IN ('qualified', 'quoted', 'tasting', 'invoice_sent', 'booked', 'invoice_paid', 'won')

UNION ALL

-- Quote conversions (triggered when quote_amount is set)
SELECT
  l.gclid AS `Google Click ID`,
  'Quote' AS `Conversion Name`,
  FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S-05:00', l.status_updated_at) AS `Conversion Time`,
  l.quote_amount AS `Conversion Value`,
  'USD' AS `Conversion Currency`
FROM `chef-nam-analytics.leads.website_leads` l
WHERE l.is_spam = FALSE
  AND l.is_test = FALSE
  AND l.gclid IS NOT NULL
  AND l.quote_amount IS NOT NULL

UNION ALL

-- Purchase conversions (triggered when order_amount is set)
SELECT
  l.gclid AS `Google Click ID`,
  'Purchase' AS `Conversion Name`,
  FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S-05:00', COALESCE(l.booked_at, l.status_updated_at)) AS `Conversion Time`,
  COALESCE(l.order_amount, l.booking_value) AS `Conversion Value`,
  'USD' AS `Conversion Currency`
FROM `chef-nam-analytics.leads.website_leads` l
WHERE l.is_spam = FALSE
  AND l.is_test = FALSE
  AND l.gclid IS NOT NULL
  AND l.status IN ('invoice_paid', 'won');

-- ============================================================
-- ga4_conversions
-- Formatted for GA4 Measurement Protocol
-- ============================================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.ga4_conversions` AS
SELECT
  l.ga_client_id AS client_id,
  'purchase' AS event,
  COALESCE(l.order_amount, l.booking_value) AS value,
  'USD' AS currency,
  l.lead_id AS transaction_id
FROM `chef-nam-analytics.leads.website_leads` l
WHERE l.is_spam = FALSE
  AND l.is_test = FALSE
  AND l.ga_client_id IS NOT NULL
  AND l.status IN ('invoice_paid', 'won');

-- ============================================================
-- v_channel_summary
-- Leads by channel with funnel stages
-- ============================================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.v_channel_summary` AS
SELECT
  CASE
    WHEN gclid IS NOT NULL THEN 'Google Ads'
    WHEN utm_medium = 'organic' THEN CONCAT('Organic - ', COALESCE(utm_source, 'Unknown'))
    WHEN utm_medium = 'referral' THEN CONCAT('Referral - ', COALESCE(utm_source, 'Unknown'))
    WHEN utm_source IS NOT NULL THEN CONCAT(COALESCE(utm_source, ''), ' / ', COALESCE(utm_medium, ''))
    ELSE 'Direct'
  END AS channel,
  COUNT(*) AS total_leads,
  COUNTIF(status IN ('contacted', 'qualified', 'quoted', 'tasting', 'invoice_sent', 'booked', 'invoice_paid', 'won')) AS progressed,
  COUNTIF(status IN ('invoice_paid', 'won')) AS won
FROM `chef-nam-analytics.leads.website_leads`
WHERE is_spam = FALSE AND is_test = FALSE
GROUP BY channel
ORDER BY total_leads DESC;

-- ============================================================
-- v_daily_metrics
-- Daily lead counts
-- ============================================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.v_daily_metrics` AS
SELECT
  DATE(submitted_at) AS date,
  COUNT(*) AS leads,
  COUNTIF(gclid IS NOT NULL) AS from_ads,
  COUNTIF(gclid IS NULL) AS from_organic_or_other
FROM `chef-nam-analytics.leads.website_leads`
WHERE is_spam = FALSE AND is_test = FALSE
GROUP BY date
ORDER BY date DESC;

-- ============================================================
-- v_ppc_performance
-- Google Ads campaign stats from data transfer
-- Replace 3871181264 with client's Google Ads account ID
-- ============================================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.v_ppc_performance` AS
SELECT
  cs.segments_date AS date,
  c.campaign_name,
  cs.metrics_impressions AS impressions,
  cs.metrics_clicks AS clicks,
  ROUND(cs.metrics_cost_micros / 1000000, 2) AS cost,
  cs.metrics_conversions AS conversions,
  CASE WHEN cs.metrics_conversions > 0
    THEN ROUND(cs.metrics_cost_micros / 1000000 / cs.metrics_conversions, 2)
    ELSE NULL END AS cpa
FROM `chef-nam-analytics.google_ads_export.p_ads_CampaignStats_3871181264` cs
JOIN `chef-nam-analytics.google_ads_export.p_ads_Campaign_3871181264` c
  ON cs.campaign_id = c.campaign_id
ORDER BY cs.segments_date DESC;

-- ============================================================
-- v_organic_performance
-- Search Console queries with rankings
-- ============================================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.v_organic_performance` AS
SELECT
  query,
  SUM(impressions) AS impressions,
  SUM(clicks) AS clicks,
  ROUND(AVG(position), 1) AS avg_position,
  ROUND(SAFE_DIVIDE(SUM(clicks), SUM(impressions)) * 100, 2) AS ctr_pct
FROM `chef-nam-analytics.searchconsole.search_performance`
GROUP BY query
HAVING impressions > 10
ORDER BY clicks DESC;
