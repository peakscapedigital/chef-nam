# Chef Nam Analytics - Data Inventory

**Generated**: 2026-01-17
**Project**: chef-nam-analytics
**Purpose**: Document all available data sources, date ranges, and limitations before analysis

---

## Executive Summary

| Dataset | Date Range | Rows | Status |
|---------|------------|------|--------|
| Leads | 2025-09-29 → 2026-01-16 | 38 | Active |
| Contacts | 2026-01-17 | 37 | Just created |
| Google Ads | 2026-01-06 → 2026-01-16 | 115 | 10 days only |
| GA4 Events | 2026-01-16 | 113 | 1 day only |
| GSC | 2025-08-21 → 2026-01-14 | 861 | 135 days |

**Critical Limitations**:
- Google Ads export only has 10 days of data (started Jan 6)
- GA4 BigQuery export only has 1 day of data (just enabled)
- All 38 leads have status "new" - no pipeline progression tracked yet
- No booking values recorded - cannot calculate revenue or ROAS

---

## Dataset Details

### 1. Leads (`leads.website_leads`)

**Date Range**: 2025-09-29 → 2026-01-16 (110 days)
**Total Rows**: 38 (0 test, 38 real)

#### Field Completeness

| Field | Has Data | Count |
|-------|----------|-------|
| email | ✓ | 38 (100%) |
| phone | ✓ | 38 (100%) |
| gclid | ✓ | 17 (45%) |
| ga_client_id | ✓ | 5 (13%) |
| status updated | ✗ | 0 (0%) |
| booking_value | ✗ | 0 (0%) |

#### Leads by Month

| Month | Total Leads | With GCLID | Organic/Direct |
|-------|-------------|------------|----------------|
| 2025-09 | 1 | 0 | 1 |
| 2025-10 | 13 | 2 | 11 |
| 2025-11 | 5 | 4 | 1 |
| 2025-12 | 10 | 6 | 4 |
| 2026-01 | 9 | 5 | 4 |

#### Lead Status Distribution

| Status | Count |
|--------|-------|
| new | 38 (100%) |

**Issue**: No leads have been moved through the pipeline. Cannot calculate conversion rates.

---

### 2. Contacts (`leads.contacts`)

**Date Range**: 2026-01-17 (just created via backfill)
**Total Rows**: 37

| Metric | Value |
|--------|-------|
| Has email | 37 (100%) |
| Has phone | 37 (100%) |
| Repeat contacts | 1 |
| Total leads tracked | 38 |

**Note**: Contacts table was just created. One contact has submitted 2 leads.

---

### 3. Google Ads (`google_ads_export.*`)

**Date Range**: 2026-01-06 → 2026-01-16 (10 days)
**Export Type**: BigQuery Data Transfer

#### Campaign Stats Summary

| Metric | Value |
|--------|-------|
| Campaigns | 1 ("Catering") |
| Total Clicks | 51 |
| Total Impressions | 2,658 |
| Total Cost | $90.33 |
| Conversions (reported) | 5.0 |

#### Click-Level Data (`p_ads_ClickStats`)

| Metric | Value |
|--------|-------|
| Total Clicks | 52 |
| Unique GCLIDs | 52 |
| Date Range | 2026-01-06 → 2026-01-16 |

#### GCLID Matching Analysis

| Metric | Count |
|--------|-------|
| Leads with GCLID (all time) | 17 |
| Clicks with GCLID (Jan 6-16) | 52 |
| **Matched GCLIDs** | **2** |

**Why low match rate?**
- 12 of 17 leads with GCLID are from before Jan 6 (outside export date range)
- Only 5 leads with GCLID occurred during Jan 6-16
- 2 of those 5 matched to click data
- The other 50 clicks did not convert to form submissions

#### Available Tables (Key)

- `p_ads_Campaign_*` - Campaign metadata
- `p_ads_CampaignStats_*` - Daily campaign performance
- `p_ads_ClickStats_*` - Click-level data with GCLID
- `p_ads_AdStats_*` - Ad-level performance
- `p_ads_KeywordStats_*` - Keyword performance

---

### 4. GA4 Events (`analytics_501458691.events_*`)

**Date Range**: 2026-01-16 (1 day only)
**Total Rows**: 113
**Unique Users**: 16

#### Event Distribution

| Event | Count |
|-------|-------|
| page_view | 41 |
| user_engagement | 28 |
| session_start | 18 |
| first_visit | 13 |
| form_start | 4 |
| scroll | 4 |
| form_submit | 3 |
| generate_lead | 2 |

**Limitation**: Only 1 day of data. Cannot perform meaningful analysis yet.

---

### 5. Search Console (`searchconsole.search_performance`)

**Date Range**: 2025-08-21 → 2026-01-14 (135 days)
**Total Rows**: 861
**Source**: GSC API backfill

#### Summary Metrics

| Metric | Value |
|--------|-------|
| Total Clicks | 25 |
| Total Impressions | 1,149 |
| Overall CTR | 2.18% |
| Unique Queries | 228 |
| Unique Pages | 16 |

#### Top Queries by Clicks

| Query | Clicks | Impressions | Avg Position | CTR |
|-------|--------|-------------|--------------|-----|
| charcuterie board ann arbor | 5 | 65 | 9.5 | 7.7% |
| ann arbor catering | 3 | 51 | 21.7 | 5.9% |
| catering near me | 2 | 99 | 6.8 | 2.0% |
| catering ann arbor | 2 | 93 | 18.8 | 2.2% |
| wedding catering ann arbor | 1 | 102 | 43.1 | 1.0% |

---

## Data Gaps & Issues

### Critical Gaps

1. **No lead pipeline data**
   - All leads are status "new"
   - Cannot calculate win rate, conversion rate, or sales cycle
   - No booking values to calculate revenue or ROAS

2. **Limited Google Ads history**
   - Only 10 days of data (Jan 6-16)
   - Cannot match historical leads (Oct-Dec) to ad spend
   - 12 of 17 paid leads have no associated cost data

3. **Minimal GA4 data**
   - Only 1 day exported to BigQuery
   - Cannot analyze user journey or behavior patterns

4. **No organic lead attribution**
   - Cannot tie GSC data to specific lead conversions
   - No way to measure organic lead quality vs paid

### Data Quality Issues

1. **GCLID matching**
   - Only 2 of 5 recent paid leads match to click data
   - Possible timing/session issues between click and form submit

2. **GA Client ID capture**
   - Only 5 of 38 leads (13%) have ga_client_id
   - Limits ability to join to GA4 user behavior

---

## What We CAN Report On

### PPC (Google Ads) - Limited

**Date Range**: Jan 6-16, 2026 only

| Metric | Value | Confidence |
|--------|-------|------------|
| Ad Spend | $90.33 | High |
| Ad Clicks | 51 | High |
| Leads (with GCLID, Jan 6-16) | 5 | High |
| Cost Per Lead | $18.07 | Medium |
| Click-to-Lead Rate | 9.8% | Medium |
| Reported Conversions | 5 | High |

**Cannot report**: ROAS, revenue per lead, lead quality

### Organic (GSC) - Good Coverage

**Date Range**: Aug 21, 2025 - Jan 14, 2026

| Metric | Value | Confidence |
|--------|-------|------------|
| Total Organic Clicks | 25 | High |
| Total Impressions | 1,149 | High |
| Average CTR | 2.18% | High |
| Ranking Queries | 228 | High |

**Cannot report**: Organic leads, organic conversion rate

### Overall Leads - Good Coverage

**Date Range**: Sep 29, 2025 - Jan 16, 2026

| Metric | Value | Confidence |
|--------|-------|------------|
| Total Leads | 38 | High |
| Paid Leads (all time) | 17 | High |
| Organic/Direct Leads | 21 | High |
| Lead Quality | Unknown | N/A |

---

## Recommendations

### Immediate Actions

1. **Start working leads in pipeline**
   - Update lead statuses (contacted, qualified, won, lost)
   - Add booking values when deals close
   - This unlocks conversion rate and ROAS reporting

2. **Wait for data accumulation**
   - GA4: Need 30+ days for meaningful analysis
   - Google Ads: Need 30+ days for trend analysis

### Data Collection Improvements

1. **Improve GA Client ID capture**
   - Currently only 13% of leads have this
   - Would enable user journey analysis

2. **Add UTM tracking for organic**
   - Would allow attributing organic leads to specific pages/queries

---

## Views Created

The following BigQuery views were created for ongoing reporting:

| View | Purpose |
|------|---------|
| `leads.v_channel_summary` | Leads by channel with funnel stages |
| `leads.v_organic_performance` | GSC queries with rankings & CTR |
| `leads.v_daily_metrics` | Daily lead counts (paid vs organic) |
| `leads.v_ppc_performance` | Campaign stats (needs date filtering) |

---

*Last Updated: 2026-01-17*
