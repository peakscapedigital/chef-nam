# Chef Nam Analytics - Reporting Framework

**Generated**: 2026-01-17
**Purpose**: Define what reports are possible given current data availability

---

## Report Categories

### 1. PPC Performance Report

**Data Source**: `google_ads_export.*` + `leads.website_leads`
**Available Date Range**: 2026-01-06 → present
**Refresh**: Daily (via BigQuery Data Transfer)

#### Metrics We CAN Report

| Metric | Calculation | Notes |
|--------|-------------|-------|
| Ad Spend | SUM(metrics_cost_micros)/1000000 | Accurate |
| Clicks | SUM(metrics_clicks) | Accurate |
| Impressions | SUM(metrics_impressions) | Accurate |
| CTR | clicks / impressions | Accurate |
| Avg CPC | cost / clicks | Accurate |
| Leads (paid) | COUNT where gclid IS NOT NULL | Accurate for date range |
| Cost Per Lead | cost / leads | Only for overlapping dates |
| Click-to-Lead Rate | leads / clicks | Only for overlapping dates |

#### Metrics We CANNOT Report (Yet)

| Metric | Why Not | What's Needed |
|--------|---------|---------------|
| ROAS | No revenue data | Update lead booking_value |
| Revenue | No booking values | Update lead booking_value |
| Cost Per Acquisition | No "won" status | Update lead statuses |
| Lead Quality Score | No status progression | Update lead statuses |

#### SQL Query

```sql
-- PPC Performance for specific date range
SELECT
  DATE(s.segments_date) as date,
  c.campaign_name,
  SUM(s.metrics_clicks) as clicks,
  SUM(s.metrics_impressions) as impressions,
  ROUND(SUM(s.metrics_cost_micros)/1000000, 2) as cost,
  COUNT(DISTINCT l.lead_id) as leads,
  ROUND(SAFE_DIVIDE(SUM(s.metrics_cost_micros)/1000000, COUNT(DISTINCT l.lead_id)), 2) as cpl
FROM `chef-nam-analytics.google_ads_export.p_ads_CampaignStats_3871181264` s
JOIN `chef-nam-analytics.google_ads_export.p_ads_Campaign_3871181264` c
  ON s.campaign_id = c.campaign_id
LEFT JOIN `chef-nam-analytics.leads.website_leads` l
  ON l.gclid IS NOT NULL
  AND DATE(l.submitted_at) = DATE(s.segments_date)
  AND (l.is_test = FALSE OR l.is_test IS NULL)
GROUP BY date, c.campaign_name
ORDER BY date DESC
```

---

### 2. Organic Performance Report

**Data Source**: `searchconsole.search_performance`
**Available Date Range**: 2025-08-21 → 2026-01-14
**Refresh**: Daily (via GSC API, 3-day delay)

#### Metrics We CAN Report

| Metric | Calculation | Notes |
|--------|-------------|-------|
| Organic Clicks | SUM(clicks) | Accurate |
| Impressions | SUM(impressions) | Accurate |
| CTR | clicks / impressions | Accurate |
| Avg Position | AVG(position) | Per query/page |
| Ranking Queries | COUNT(DISTINCT query) | Accurate |
| Pages Indexed | COUNT(DISTINCT page) | Accurate |

#### Metrics We CANNOT Report (Yet)

| Metric | Why Not | What's Needed |
|--------|---------|---------------|
| Organic Leads | No attribution | UTM tracking or landing page matching |
| Organic Conversion Rate | No attribution | Landing page → lead mapping |
| Organic Revenue | No attribution + no revenue | Both |

#### SQL Query

```sql
-- Top Organic Queries
SELECT
  query,
  SUM(clicks) as clicks,
  SUM(impressions) as impressions,
  ROUND(AVG(position), 1) as avg_position,
  ROUND(SUM(clicks) / NULLIF(SUM(impressions), 0) * 100, 1) as ctr
FROM `chef-nam-analytics.searchconsole.search_performance`
WHERE query IS NOT NULL
GROUP BY query
HAVING SUM(impressions) >= 10
ORDER BY clicks DESC
LIMIT 20
```

---

### 3. Lead Volume Report

**Data Source**: `leads.website_leads`
**Available Date Range**: 2025-09-29 → present
**Refresh**: Real-time (streaming inserts)

#### Metrics We CAN Report

| Metric | Calculation | Notes |
|--------|-------------|-------|
| Total Leads | COUNT(*) | Accurate |
| Leads by Channel | GROUP BY channel logic | Accurate |
| Leads by Month | GROUP BY month | Accurate |
| Paid vs Organic Split | gclid presence | Accurate |

#### Channel Attribution Logic

```sql
CASE
  WHEN gclid IS NOT NULL THEN 'Google Ads'
  WHEN utm_medium = 'organic' THEN 'Organic Search'
  WHEN utm_source IS NOT NULL THEN CONCAT(utm_source, '/', utm_medium)
  ELSE 'Direct'
END as channel
```

#### SQL Query

```sql
-- Lead Volume by Channel and Month
SELECT
  FORMAT_DATE('%Y-%m', DATE(submitted_at)) as month,
  CASE
    WHEN gclid IS NOT NULL THEN 'Google Ads'
    ELSE 'Organic/Direct'
  END as channel,
  COUNT(*) as leads
FROM `chef-nam-analytics.leads.website_leads`
WHERE is_test = FALSE OR is_test IS NULL
GROUP BY month, channel
ORDER BY month DESC, channel
```

---

### 4. Lead Quality Report (BLOCKED)

**Status**: Cannot produce until lead statuses are updated

#### Required Data

- Lead status progression (new → contacted → qualified → won/lost)
- Booking values for won deals
- Status timestamps

#### Metrics (Once Available)

| Metric | Calculation |
|--------|-------------|
| Win Rate | won / total |
| Avg Deal Size | SUM(booking_value) / COUNT(won) |
| Sales Cycle | AVG(won_at - submitted_at) |
| Channel Quality | Win rate by channel |

---

## Current State Summary

### What We Can Report Today

| Report | Status | Confidence |
|--------|--------|------------|
| PPC: Spend & Clicks | ✅ Jan 6-16 only | High |
| PPC: Cost Per Lead | ✅ Jan 6-16 only | Medium |
| Organic: Rankings | ✅ Full history | High |
| Organic: Traffic | ✅ Full history | High |
| Lead Volume | ✅ Full history | High |
| Lead Quality | ❌ Blocked | N/A |
| ROAS | ❌ Blocked | N/A |
| Revenue | ❌ Blocked | N/A |

### Honest Assessment for VP Marketing

**What we know:**
- Spending ~$9/day on Google Ads (Jan 6-16 avg)
- Getting ~5 clicks/day, ~$1.80 CPC
- Converting ~9.8% of clicks to leads (5 leads from 51 clicks)
- Cost per lead: ~$18 (for this 10-day period)
- Organic visibility is low (25 clicks over 135 days)
- Top organic query is "charcuterie board ann arbor" (niche, good fit)

**What we don't know:**
- Are these leads any good? (no status tracking)
- What's the revenue from these leads? (no booking values)
- Is paid or organic driving better leads? (can't compare quality)
- What's the true ROAS? (blocked by missing data)

**Recommendation to VP:**
> We have lead volume data but zero pipeline data. Until leads are worked and statuses updated, we cannot measure what matters: conversion rates, revenue, and ROAS. The marketing machine is generating leads, but we're flying blind on quality.

---

## Next Steps

1. **Immediate**: Update lead statuses in the pipeline
2. **Immediate**: Add booking values when deals close
3. **Week 2**: Accumulate more GA4 data (currently 1 day)
4. **Week 4**: Produce first meaningful quality report
5. **Ongoing**: Build automated reporting dashboard

---

*Last Updated: 2026-01-17*
