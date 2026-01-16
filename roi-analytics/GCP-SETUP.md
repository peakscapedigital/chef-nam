# GCP & BigQuery Setup Guide

## Overview
This guide walks through setting up the `chef-nam-analytics` GCP project for ROI reporting.

---

## Step 1: Create GCP Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Click the project dropdown (top left) → **New Project**
3. Settings:
   - **Project name**: `chef-nam-analytics`
   - **Project ID**: `chef-nam-analytics` (or auto-generated)
   - **Organization**: Your organization or "No organization"
4. Click **Create**
5. Wait for project creation, then select it from the dropdown

---

## Step 2: Enable BigQuery API

1. In the project, go to **APIs & Services** → **Library**
2. Search for "BigQuery API"
3. Click **BigQuery API** → **Enable**

---

## Step 3: Create Service Account

1. Go to **IAM & Admin** → **Service Accounts**
2. Click **+ Create Service Account**
3. Settings:
   - **Name**: `cloudflare-bigquery-writer`
   - **ID**: `cloudflare-bigquery-writer`
   - **Description**: "Service account for Cloudflare Pages to write leads to BigQuery"
4. Click **Create and Continue**
5. Grant roles:
   - `BigQuery Data Editor` (read/write data)
   - `BigQuery Job User` (run queries)
6. Click **Continue** → **Done**

### Generate JSON Key

1. Click on the newly created service account
2. Go to **Keys** tab
3. Click **Add Key** → **Create new key**
4. Select **JSON** → **Create**
5. Save the downloaded JSON file securely

### Base64 Encode for Cloudflare

```bash
# On macOS/Linux:
base64 -i path/to/service-account-key.json | tr -d '\n'

# Or use this one-liner to copy to clipboard (macOS):
base64 -i path/to/service-account-key.json | tr -d '\n' | pbcopy
```

---

## Step 4: Create BigQuery Dataset & Table

1. Go to **BigQuery** in the Cloud Console
2. In the Explorer panel, click the three dots next to your project
3. Click **Create dataset**
4. Settings:
   - **Dataset ID**: `leads`
   - **Location**: `US` (or your preferred region)
   - **Default table expiration**: Never
5. Click **Create Dataset**

### Create the Leads Table

1. Click on the `leads` dataset
2. Click **+ Create Table**
3. Select **Empty table**
4. Use the schema from `schema.sql` in this folder, or:
5. Click **Edit as text** and paste the schema JSON from `schema.json`

Alternatively, run the SQL in `schema.sql` directly in the BigQuery console.

---

## Step 5: Add Environment Variables to Cloudflare

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select the `chef-nam` Pages project
3. Go to **Settings** → **Environment variables**
4. Add these variables (for both Production and Preview):

| Variable | Value |
|----------|-------|
| `BIGQUERY_PROJECT_ID` | `chef-nam-analytics` |
| `BIGQUERY_CREDENTIALS` | `<base64-encoded-service-account-json>` |

5. Click **Save**

---

## Step 6: Set Up Native Google Exports (Optional - Do After Code Works)

### Google Ads → BigQuery
1. In BigQuery Console → **Data Transfers** → **Create Transfer**
2. Source: **Google Ads**
3. Link your Google Ads account
4. Select data: Click Performance, Campaign Stats
5. Schedule: Daily
6. Destination dataset: Create new `google_ads_export`

### GA4 → BigQuery
1. In GA4 Admin → **Product Links** → **BigQuery Links**
2. Click **Link**
3. Select `chef-nam-analytics` project
4. Enable daily export
5. Dataset will be auto-created as `analytics_XXXXXX`

### Search Console → BigQuery
1. In Search Console → **Settings** → **BigQuery Export**
2. Link to `chef-nam-analytics` project
3. Create dataset `searchconsole`

---

## Verification Checklist

- [ ] GCP project `chef-nam-analytics` created
- [ ] BigQuery API enabled
- [ ] Service account `cloudflare-bigquery-writer` created with correct roles
- [ ] JSON key downloaded and base64 encoded
- [ ] BigQuery dataset `leads` created
- [ ] Table `website_leads` created with correct schema
- [ ] Cloudflare env vars `BIGQUERY_PROJECT_ID` and `BIGQUERY_CREDENTIALS` set
- [ ] Test form submission writes to BigQuery

---

## Estimated Costs

- BigQuery storage: ~$0.02/MB/month (leads table will be tiny)
- BigQuery queries: $5/TB scanned (first 1TB/month free)
- Google exports: Free
- **Expected total: $5-15/month**
