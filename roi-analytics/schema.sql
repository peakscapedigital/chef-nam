-- BigQuery Schema for Chef Nam ROI Reporting
-- Run this in BigQuery Console after creating the 'leads' dataset

-- Main leads table
CREATE TABLE IF NOT EXISTS `chef-nam-analytics.leads.website_leads` (
  -- Primary Key
  lead_id STRING NOT NULL,

  -- Contact Information
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

  -- Lead Management
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
  is_spam BOOL DEFAULT FALSE
)
PARTITION BY DATE(submitted_at)
CLUSTER BY status, gclid;

-- Index hint: gclid is the primary join key for Google Ads data
-- Clustering by status helps filter queries for lead management
-- Partitioning by date keeps queries efficient as data grows
