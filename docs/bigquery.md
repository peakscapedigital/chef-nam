# BigQuery Reference

Chef Nam Analytics BigQuery project: `chef-nam-analytics`

## Datasets

| Dataset | Purpose | Data Start |
|---------|---------|------------|
| `leads` | Website form submissions | Sep 2025 |
| `google_ads_export` | Google Ads performance | Jan 2026 |
| `analytics_501458691` | GA4 events | Jan 16, 2026 |
| `searchconsole` | GSC impressions/clicks | Jan 16, 2026 |

---

## Google Ads Queries

### Use the Right View

**Use `AccountBasicStats` for totals** — NOT `CampaignStats` or `AccountStats`.

The Stats views are segmented by `click_type` (URL_CLICKS, SITELINKS, LOCATION_EXPANSION, AD_IMAGE, etc.) which overcounts impressions. Each impression is counted multiple times for each available click type.

```sql
-- CORRECT: Use AccountBasicStats for accurate totals
SELECT
  SUM(metrics_clicks) as clicks,
  SUM(metrics_impressions) as impressions,
  ROUND(SUM(metrics_cost_micros) / 1000000, 2) as cost
FROM `chef-nam-analytics.google_ads_export.ads_AccountBasicStats_3871181264`
WHERE segments_date BETWEEN "2026-01-01" AND "2026-01-31";
```

```sql
-- WRONG: CampaignStats/AccountStats overcount due to click_type segmentation
-- Will show ~2.5x actual impressions
SELECT SUM(metrics_impressions)
FROM `chef-nam-analytics.google_ads_export.ads_CampaignStats_3871181264`
-- Returns inflated numbers!
```

### Available Views

| View | Use For | Segmentation |
|------|---------|--------------|
| `AccountBasicStats` | Totals matching UI | Date, device |
| `CampaignStats` | Detailed analysis | Date, device, click_type (overcounts!) |
| `CampaignBasicStats` | Campaign totals | Date, device |
| `AdGroupBasicStats` | Ad group totals | Date, device |

### Cost Calculation

Cost is stored in micros (1/1,000,000 of currency unit):
```sql
ROUND(SUM(metrics_cost_micros) / 1000000, 2) as cost_dollars
```

---

## Leads Queries

### Count Valid Leads
```sql
SELECT COUNT(*)
FROM `chef-nam-analytics.leads.website_leads`
WHERE is_spam = FALSE AND is_test = FALSE;
```

### Monthly Lead Summary
```sql
SELECT
  FORMAT_DATE('%Y-%m', DATE(submitted_at)) as month,
  COUNT(*) as lead_count
FROM `chef-nam-analytics.leads.website_leads`
WHERE is_spam = FALSE AND is_test = FALSE
GROUP BY 1
ORDER BY 1 DESC;
```

---

## GA4 Queries

### Event Counts by Date
```sql
SELECT
  _TABLE_SUFFIX as date,
  COUNT(*) as event_count
FROM `chef-nam-analytics.analytics_501458691.events_*`
WHERE _TABLE_SUFFIX BETWEEN "20260101" AND "20260131"
GROUP BY 1
ORDER BY 1;
```

**Note:** GA4 data starts Jan 16, 2026. No historical data before this date.

---

## GSC Queries

### Search Performance
```sql
SELECT
  data_date,
  SUM(clicks) as clicks,
  SUM(impressions) as impressions
FROM `chef-nam-analytics.searchconsole.searchdata_site_impression`
WHERE data_date BETWEEN "2026-01-01" AND "2026-01-31"
GROUP BY 1
ORDER BY 1;
```

**Note:** GSC data starts Jan 16, 2026.

---

## CLI Commands

### Authentication
```bash
# If gcloud auth expires
CLOUDSDK_PYTHON="$HOME/.pyenv/shims/python3" gcloud auth login
```

### Run Queries
```bash
CLOUDSDK_PYTHON=/Users/jasonleinart/.pyenv/shims/python3 bq query --use_legacy_sql=false '
SELECT ... FROM ...'
```

### List Datasets/Tables
```bash
CLOUDSDK_PYTHON=/Users/jasonleinart/.pyenv/shims/python3 bq ls chef-nam-analytics
CLOUDSDK_PYTHON=/Users/jasonleinart/.pyenv/shims/python3 bq ls chef-nam-analytics:leads
```

---

## Known Issues

1. **GA4/GSC data starts Jan 16, 2026** — Tracking was installed on this date. Backfill attempts ran successfully but there was no data to backfill.

2. **Google Ads impression overcounting** — Using CampaignStats or AccountStats instead of BasicStats views will show ~2.5x actual impressions due to click_type segmentation.

3. **gcloud Python path** — Must use `CLOUDSDK_PYTHON=/Users/jasonleinart/.pyenv/shims/python3` prefix for bq/gcloud commands.

---

*Last updated: 2026-02-01*
