-- ============================================
-- BigQuery Views for Lead Analytics
-- Run these after installing the Firestore → BigQuery extension
-- ============================================

-- ============================================
-- 1. LEAD RESPONSE TIME VIEW
-- Calculates time between lead submission and first "contacted" status
-- ============================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.lead_response_time` AS
WITH status_changes AS (
  SELECT
    REGEXP_EXTRACT(document_name, r'leads/(.*)') as lead_id,
    timestamp as changed_at,
    JSON_EXTRACT_SCALAR(data, '$.status') as new_status,
    operation
  FROM `chef-nam-analytics.leads.lead_status_changelog_raw_changelog`
  WHERE JSON_EXTRACT_SCALAR(data, '$.status') IS NOT NULL
),
first_contacted AS (
  SELECT
    lead_id,
    MIN(changed_at) as contacted_at
  FROM status_changes
  WHERE new_status = 'contacted'
  GROUP BY lead_id
)
SELECT
  w.lead_id,
  w.first_name,
  w.last_name,
  w.email,
  w.lead_source,
  w.utm_source,
  w.utm_medium,
  w.utm_campaign,
  w.gclid,
  w.submitted_at,
  f.contacted_at,
  TIMESTAMP_DIFF(f.contacted_at, w.submitted_at, MINUTE) as response_time_minutes,
  TIMESTAMP_DIFF(f.contacted_at, w.submitted_at, HOUR) as response_time_hours,
  CASE
    WHEN f.contacted_at IS NULL THEN 'not_contacted'
    WHEN TIMESTAMP_DIFF(f.contacted_at, w.submitted_at, MINUTE) <= 60 THEN 'under_1_hour'
    WHEN TIMESTAMP_DIFF(f.contacted_at, w.submitted_at, HOUR) <= 24 THEN 'under_24_hours'
    ELSE 'over_24_hours'
  END as response_bucket
FROM `chef-nam-analytics.leads.website_leads` w
LEFT JOIN first_contacted f ON w.lead_id = f.lead_id
WHERE w.is_spam = FALSE AND w.is_test = FALSE;


-- ============================================
-- 2. LEAD STATUS HISTORY VIEW
-- Flattened view of all status changes per lead
-- ============================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.lead_status_history` AS
SELECT
  REGEXP_EXTRACT(document_name, r'leads/(.*)') as lead_id,
  timestamp as changed_at,
  operation,
  JSON_EXTRACT_SCALAR(data, '$.status') as status,
  JSON_EXTRACT_SCALAR(data, '$.notes') as notes,
  CAST(JSON_EXTRACT_SCALAR(data, '$.booking_value') AS FLOAT64) as booking_value,
  JSON_EXTRACT_SCALAR(data, '$.name') as name,
  JSON_EXTRACT_SCALAR(data, '$.email') as email
FROM `chef-nam-analytics.leads.lead_status_changelog_raw_changelog`
ORDER BY timestamp DESC;


-- ============================================
-- 3. CURRENT LEAD STATUS VIEW
-- Latest status for each lead (joins Firestore changelog with BigQuery lead data)
-- ============================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.lead_current_status` AS
WITH latest_firestore AS (
  SELECT
    lead_id,
    status,
    notes,
    booking_value,
    changed_at as firestore_updated_at,
    ROW_NUMBER() OVER (PARTITION BY lead_id ORDER BY changed_at DESC) as rn
  FROM `chef-nam-analytics.leads.lead_status_history`
)
SELECT
  w.lead_id,
  w.contact_id,
  w.first_name,
  w.last_name,
  w.email,
  w.phone,
  w.event_type,
  w.event_date,
  w.guest_count,
  w.budget_range,
  w.gclid,
  w.ga_client_id,
  w.utm_source,
  w.utm_medium,
  w.utm_campaign,
  w.lead_source,
  w.submitted_at,
  -- Use Firestore status if available (more current), otherwise BigQuery
  COALESCE(f.status, w.status) as current_status,
  COALESCE(f.notes, w.notes) as current_notes,
  COALESCE(f.booking_value, w.booking_value) as current_booking_value,
  f.firestore_updated_at
FROM `chef-nam-analytics.leads.website_leads` w
LEFT JOIN latest_firestore f ON w.lead_id = f.lead_id AND f.rn = 1
WHERE w.is_spam = FALSE AND w.is_test = FALSE;


-- ============================================
-- 4. LEAD ATTRIBUTION SUMMARY
-- Aggregated metrics by source for offline conversion analysis
-- ============================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.lead_attribution_summary` AS
SELECT
  utm_source,
  utm_medium,
  utm_campaign,
  lead_source,
  COUNT(*) as total_leads,
  COUNTIF(current_status = 'contacted') as contacted,
  COUNTIF(current_status = 'proposal_sent') as proposals_sent,
  COUNTIF(current_status = 'converted') as converted,
  COUNTIF(current_status = 'lost') as lost,
  SUM(CASE WHEN current_status = 'converted' THEN current_booking_value ELSE 0 END) as total_revenue,
  AVG(CASE WHEN current_status = 'converted' THEN current_booking_value END) as avg_deal_value,
  SAFE_DIVIDE(COUNTIF(current_status = 'converted'), COUNT(*)) as conversion_rate
FROM `chef-nam-analytics.leads.lead_current_status`
GROUP BY utm_source, utm_medium, utm_campaign, lead_source
ORDER BY total_leads DESC;


-- ============================================
-- 5. GOOGLE ADS OFFLINE CONVERSION VIEW
-- Format for uploading to Google Ads (gclid + conversion data)
-- ============================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.google_ads_conversions` AS
SELECT
  gclid,
  'Lead Converted' as conversion_name,
  FORMAT_TIMESTAMP('%Y-%m-%d %H:%M:%S', firestore_updated_at) as conversion_time,
  current_booking_value as conversion_value,
  'USD' as conversion_currency
FROM `chef-nam-analytics.leads.lead_current_status`
WHERE
  gclid IS NOT NULL
  AND current_status = 'converted'
  AND current_booking_value IS NOT NULL;


-- ============================================
-- 6. GA4 OFFLINE CONVERSION VIEW
-- Format for GA4 Measurement Protocol (client_id + conversion data)
-- ============================================
CREATE OR REPLACE VIEW `chef-nam-analytics.leads.ga4_conversions` AS
SELECT
  ga_client_id as client_id,
  'purchase' as event_name,
  current_booking_value as value,
  'USD' as currency,
  lead_id as transaction_id,
  firestore_updated_at as conversion_timestamp
FROM `chef-nam-analytics.leads.lead_current_status`
WHERE
  ga_client_id IS NOT NULL
  AND current_status = 'converted'
  AND current_booking_value IS NOT NULL;
