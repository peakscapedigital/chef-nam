-- BigQuery Schema for Chef Nam ROI Reporting
-- Project: chef-nam-analytics
-- Dataset: leads
-- ============================================================================

-- ============================================================================
-- CONTACTS TABLE (for returning customer tracking)
-- ============================================================================
-- A contact can have multiple leads over time
-- Deduplication key: email

CREATE TABLE IF NOT EXISTS `chef-nam-analytics.leads.contacts` (
  -- Primary Key
  contact_id STRING NOT NULL,

  -- Contact Information
  email STRING NOT NULL,
  phone STRING,
  first_name STRING,
  last_name STRING,
  preferred_contact STRING,

  -- First Touch Attribution
  first_utm_source STRING,
  first_utm_medium STRING,
  first_utm_campaign STRING,
  first_lead_source STRING,
  first_landing_page STRING,
  first_referrer STRING,

  -- Aggregated Metrics (updated via nightly sync)
  total_leads INT64 DEFAULT 1,
  total_converted INT64 DEFAULT 0,
  lifetime_value FLOAT64 DEFAULT 0,

  -- Timestamps
  first_lead_at TIMESTAMP,
  last_lead_at TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
CLUSTER BY email;

-- ============================================================================
-- WEBSITE LEADS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS `chef-nam-analytics.leads.website_leads` (
  -- Primary Key
  lead_id STRING NOT NULL,

  -- Contact Reference (links to contacts table)
  contact_id STRING,              -- FK to contacts.contact_id

  -- Contact Information (denormalized for query convenience)
  first_name STRING,
  last_name STRING,
  email STRING,
  email_hash STRING,              -- SHA256 for Google Ads enhanced conversions
  phone STRING,
  phone_hash STRING,              -- SHA256 for Google Ads enhanced conversions
  preferred_contact STRING,

  -- Event Details
  has_event BOOL,
  event_type STRING,
  event_date DATE,
  event_time STRING,
  guest_count STRING,
  location STRING,
  service_style STRING,
  budget_range STRING,
  dietary_requirements ARRAY<STRING>,
  message STRING,
  event_description STRING,

  -- Attribution (CRITICAL for ROI)
  gclid STRING,                   -- Google Ads click ID - PRIMARY JOIN KEY
  ga_client_id STRING,            -- GA4 client ID (user_pseudo_id)
  fbclid STRING,                  -- Facebook click ID
  utm_source STRING,
  utm_medium STRING,
  utm_campaign STRING,
  utm_term STRING,
  utm_content STRING,
  lead_source STRING,             -- Derived source (Direct, Organic, etc.)
  landing_page STRING,
  referrer STRING,
  submitted_from_url STRING,

  -- Lead Management (synced from Supabase nightly)
  status STRING DEFAULT 'new',    -- new, contacted, qualified, won, lost
  notes STRING,                   -- Free-text notes field
  booking_value FLOAT64,          -- Revenue when won

  -- Timestamps
  submitted_at TIMESTAMP NOT NULL,
  status_updated_at TIMESTAMP,
  notes_updated_at TIMESTAMP,
  won_at TIMESTAMP,

  -- Metadata
  form_source STRING,             -- Which form: 'start-planning', 'homepage', etc.
  is_spam BOOL DEFAULT FALSE,
  is_test BOOL DEFAULT FALSE
)
PARTITION BY DATE(submitted_at)
CLUSTER BY status, gclid, contact_id;

-- ============================================================================
-- MIGRATION: Add contact_id to existing table
-- ============================================================================
-- Run this if table already exists:
--
-- ALTER TABLE `chef-nam-analytics.leads.website_leads`
-- ADD COLUMN IF NOT EXISTS contact_id STRING;
--
-- ALTER TABLE `chef-nam-analytics.leads.website_leads`
-- ADD COLUMN IF NOT EXISTS is_test BOOL DEFAULT FALSE;

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- Join patterns:
--
-- 1. Get contact with all their leads:
--    SELECT c.*, l.*
--    FROM `chef-nam-analytics.leads.contacts` c
--    JOIN `chef-nam-analytics.leads.website_leads` l ON c.contact_id = l.contact_id
--    WHERE c.email = 'customer@email.com'
--
-- 2. Find returning customers:
--    SELECT * FROM `chef-nam-analytics.leads.contacts`
--    WHERE total_leads > 1
--    ORDER BY lifetime_value DESC
--
-- 3. Join leads with Google Ads by gclid:
--    SELECT l.*, ads.*
--    FROM `chef-nam-analytics.leads.website_leads` l
--    JOIN `chef-nam-analytics.google_ads_export.ads_CampaignStats_*` ads
--    ON l.gclid = ads.gclid
