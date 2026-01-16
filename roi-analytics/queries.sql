-- ROI Reporting Queries for Chef Nam Analytics
-- These queries join website leads with Google Ads data for ROI analysis

-- ============================================================================
-- COST PER LEAD BY CAMPAIGN
-- Join leads to Google Ads click data via gclid
-- ============================================================================
SELECT
  ga.campaign_name,
  COUNT(l.lead_id) AS total_leads,
  COUNTIF(l.status = 'contacted') AS contacted,
  COUNTIF(l.status = 'qualified') AS qualified,
  COUNTIF(l.status = 'won') AS won,
  COUNTIF(l.status = 'lost') AS lost,

  SUM(ga.cost_micros) / 1000000 AS total_ad_spend,
  SUM(l.booking_value) AS total_revenue,

  -- Key metrics
  SAFE_DIVIDE(SUM(ga.cost_micros) / 1000000, COUNT(l.lead_id)) AS cost_per_lead,
  SAFE_DIVIDE(SUM(ga.cost_micros) / 1000000, COUNTIF(l.status = 'won')) AS cost_per_acquisition,
  SAFE_DIVIDE(SUM(l.booking_value), SUM(ga.cost_micros) / 1000000) AS roas

FROM `chef-nam-analytics.leads.website_leads` l
LEFT JOIN `chef-nam-analytics.google_ads_export.p_ClickStats_*` ga
  ON l.gclid = ga.gclid
WHERE l.gclid IS NOT NULL
  AND l.is_spam = FALSE
GROUP BY ga.campaign_name
ORDER BY total_leads DESC;


-- ============================================================================
-- CHANNEL COMPARISON (All Sources)
-- Compare performance across all traffic sources
-- ============================================================================
SELECT
  CASE
    WHEN gclid IS NOT NULL THEN 'Google Ads'
    WHEN fbclid IS NOT NULL THEN 'Facebook Ads'
    WHEN utm_medium = 'organic' THEN 'Organic Search'
    WHEN utm_source = 'google' AND utm_medium = 'cpc' THEN 'Google Ads'
    WHEN utm_source IS NOT NULL THEN CONCAT(utm_source, ' / ', COALESCE(utm_medium, 'unknown'))
    WHEN referrer IS NOT NULL AND referrer != '' THEN 'Referral'
    ELSE 'Direct'
  END AS channel,

  COUNT(*) AS total_leads,
  COUNTIF(status = 'new' OR status IS NULL) AS new_leads,
  COUNTIF(status = 'contacted') AS contacted,
  COUNTIF(status = 'qualified') AS qualified,
  COUNTIF(status = 'won') AS won,
  COUNTIF(status = 'lost') AS lost,

  SUM(booking_value) AS total_revenue,
  SAFE_DIVIDE(COUNTIF(status = 'won'), COUNT(*)) AS win_rate,
  SAFE_DIVIDE(SUM(booking_value), COUNTIF(status = 'won')) AS avg_deal_size

FROM `chef-nam-analytics.leads.website_leads`
WHERE is_spam = FALSE
GROUP BY channel
ORDER BY total_leads DESC;


-- ============================================================================
-- MONTHLY TRENDS
-- Track lead volume and conversion over time
-- ============================================================================
SELECT
  FORMAT_DATE('%Y-%m', DATE(submitted_at)) AS month,
  COUNT(*) AS total_leads,
  COUNTIF(status = 'won') AS won,
  SUM(booking_value) AS revenue,
  SAFE_DIVIDE(COUNTIF(status = 'won'), COUNT(*)) AS win_rate

FROM `chef-nam-analytics.leads.website_leads`
WHERE is_spam = FALSE
GROUP BY month
ORDER BY month DESC
LIMIT 12;


-- ============================================================================
-- EVENT TYPE PERFORMANCE
-- Which types of events convert best?
-- ============================================================================
SELECT
  COALESCE(event_type, 'Not specified') AS event_type,
  COUNT(*) AS total_leads,
  COUNTIF(status = 'won') AS won,
  SUM(booking_value) AS total_revenue,
  SAFE_DIVIDE(COUNTIF(status = 'won'), COUNT(*)) AS win_rate,
  SAFE_DIVIDE(SUM(booking_value), COUNTIF(status = 'won')) AS avg_deal_size

FROM `chef-nam-analytics.leads.website_leads`
WHERE is_spam = FALSE
GROUP BY event_type
ORDER BY total_leads DESC;


-- ============================================================================
-- LANDING PAGE PERFORMANCE
-- Which pages convert best?
-- ============================================================================
SELECT
  landing_page,
  COUNT(*) AS total_leads,
  COUNTIF(status = 'won') AS won,
  SUM(booking_value) AS revenue,
  SAFE_DIVIDE(COUNTIF(status = 'won'), COUNT(*)) AS win_rate

FROM `chef-nam-analytics.leads.website_leads`
WHERE is_spam = FALSE
  AND landing_page IS NOT NULL
GROUP BY landing_page
ORDER BY total_leads DESC
LIMIT 20;


-- ============================================================================
-- GOOGLE ADS KEYWORD PERFORMANCE (requires google_ads_export)
-- Which keywords drive the best leads?
-- ============================================================================
-- Note: Run this after Google Ads export is enabled
/*
SELECT
  ga.keyword_text,
  ga.campaign_name,
  COUNT(l.lead_id) AS leads,
  COUNTIF(l.status = 'won') AS won,
  SUM(ga.cost_micros) / 1000000 AS spend,
  SUM(l.booking_value) AS revenue,
  SAFE_DIVIDE(SUM(ga.cost_micros) / 1000000, COUNT(l.lead_id)) AS cost_per_lead,
  SAFE_DIVIDE(SUM(l.booking_value), SUM(ga.cost_micros) / 1000000) AS roas

FROM `chef-nam-analytics.leads.website_leads` l
JOIN `chef-nam-analytics.google_ads_export.p_ClickStats_*` ga
  ON l.gclid = ga.gclid
WHERE l.gclid IS NOT NULL
GROUP BY ga.keyword_text, ga.campaign_name
ORDER BY leads DESC
LIMIT 50;
*/


-- ============================================================================
-- RECENT LEADS (for admin dashboard)
-- ============================================================================
SELECT
  lead_id,
  first_name,
  last_name,
  email,
  phone,
  event_type,
  guest_count,
  status,
  booking_value,
  submitted_at,
  CASE
    WHEN gclid IS NOT NULL THEN 'Google Ads'
    WHEN fbclid IS NOT NULL THEN 'Facebook'
    WHEN utm_medium = 'organic' THEN 'Organic'
    ELSE COALESCE(lead_source, 'Direct')
  END AS source

FROM `chef-nam-analytics.leads.website_leads`
WHERE is_spam = FALSE
ORDER BY submitted_at DESC
LIMIT 100;


-- ============================================================================
-- PIPELINE VALUE
-- Current value in each stage
-- ============================================================================
SELECT
  COALESCE(status, 'new') AS status,
  COUNT(*) AS lead_count,
  SUM(CASE
    WHEN status = 'won' THEN booking_value
    ELSE 0
  END) AS closed_revenue,
  -- Estimate pipeline value based on avg deal size and stage conversion rates
  COUNT(*) * (
    SELECT SAFE_DIVIDE(SUM(booking_value), COUNTIF(status = 'won'))
    FROM `chef-nam-analytics.leads.website_leads`
    WHERE is_spam = FALSE
  ) AS potential_value

FROM `chef-nam-analytics.leads.website_leads`
WHERE is_spam = FALSE
GROUP BY status
ORDER BY
  CASE status
    WHEN 'new' THEN 1
    WHEN 'contacted' THEN 2
    WHEN 'qualified' THEN 3
    WHEN 'won' THEN 4
    WHEN 'lost' THEN 5
    ELSE 6
  END;
