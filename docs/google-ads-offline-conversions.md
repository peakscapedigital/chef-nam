# Google Ads Offline Conversion Tracking

## Overview
Send qualified leads and bookings back to Google Ads as offline conversions, allowing Google Ads to optimize bids based on actual bookings (not just form submissions).

## Two Implementation Options

### Option 1: Manual CSV Upload (Recommended to Start)

**Pros:** Simple, no API setup needed
**Cons:** Manual process

#### Steps:

1. **Create Conversion Actions in Google Ads**
   - Go to **Tools → Conversions → + New conversion action**
   - Select **Import → Other data sources or CRMs → Track conversions from clicks**

   Create TWO conversion actions:

   **A. Qualified Lead**
   - Name: "Qualified Lead"
   - Category: Lead
   - Value: Use different values for each conversion
   - Click-through window: 90 days
   - View-through window: 1 day

   **B. Booking Confirmed**
   - Name: "Booking Confirmed"
   - Category: Purchase
   - Value: Use transaction-specific value
   - Click-through window: 90 days
   - Count: One

2. **Export Leads from Sanity**

   In Sanity Studio, use Vision to run this GROQ query:

   ```groq
   // Qualified Leads
   *[_type == "lead" && leadStatus == "qualified" && attribution.gclid != null] {
     "Google Click ID": attribution.gclid,
     "Conversion Name": "Qualified Lead",
     "Conversion Time": _createdAt,
     "Conversion Value": 5000,
     "Conversion Currency": "USD"
   }

   // Converted Leads (Bookings)
   *[_type == "lead" && leadStatus == "converted" && attribution.gclid != null] {
     "Google Click ID": attribution.gclid,
     "Conversion Name": "Booking Confirmed",
     "Conversion Time": updatedAt,
     "Conversion Value": bookingValue,
     "Conversion Currency": "USD"
   }
   ```

3. **Format as CSV**

   Headers:
   ```
   Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency
   ```

   Example:
   ```csv
   Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency
   CjwKCAiA...,Qualified Lead,2025-01-15 10:30:00-05:00,5000,USD
   CjwKCAiB...,Booking Confirmed,2025-01-20 14:15:00-05:00,7500,USD
   ```

   **Important Time Format:**
   - Must be: `YYYY-MM-DD HH:MM:SS-TZ`
   - Include timezone offset
   - Example: `2025-01-15 10:30:00-05:00` (Eastern Time)

4. **Upload to Google Ads**
   - Go to **Tools → Conversions → Uploads**
   - Click **+ Upload**
   - Select your conversion action
   - Upload CSV file
   - Review and confirm

**Recommended Frequency:** Weekly or after each booking

---

### Option 2: Automated API Integration

**Pros:** Automatic, real-time
**Cons:** Complex setup, requires Google Cloud account

#### Setup Requirements:

1. **Google Cloud Project Setup**
   - Go to https://console.cloud.google.com
   - Create new project: "Chef Nam Ads Integration"
   - Enable Google Ads API

2. **OAuth Credentials**
   - APIs & Services → Credentials
   - Create OAuth 2.0 Client ID
   - Application type: Web application
   - Authorized redirect URIs: Add your domain
   - Save Client ID and Client Secret

3. **Google Ads API Access**
   - Apply for Google Ads API access
   - Get Developer Token from Google Ads account
   - Note your Customer ID (format: 123-456-7890)

4. **Get Refresh Token**

   Use this script to get OAuth refresh token:
   ```bash
   # Install dependencies
   npm install googleapis

   # Run OAuth flow
   node scripts/get-google-ads-refresh-token.js
   ```

   Follow the prompts and save the refresh token.

5. **Add Environment Variables to Cloudflare**

   ```bash
   npx wrangler pages secret put GOOGLE_ADS_CUSTOMER_ID
   # Enter: 1234567890 (without hyphens)

   npx wrangler pages secret put GOOGLE_ADS_DEVELOPER_TOKEN
   # Enter: your_developer_token

   npx wrangler pages secret put GOOGLE_ADS_CLIENT_ID
   # Enter: xxx.apps.googleusercontent.com

   npx wrangler pages secret put GOOGLE_ADS_CLIENT_SECRET
   # Enter: GOCSPX-xxx

   npx wrangler pages secret put GOOGLE_ADS_REFRESH_TOKEN
   # Enter: 1//xxx

   npx wrangler pages secret put GOOGLE_ADS_QUALIFIED_CONVERSION_ID
   # Enter: 123456789 (from Google Ads conversion action)

   npx wrangler pages secret put GOOGLE_ADS_BOOKING_CONVERSION_ID
   # Enter: 987654321 (from Google Ads conversion action)
   ```

6. **How It Works**

   Once configured, the Sanity buttons automatically:

   - **✅ Mark as Qualified** → Sends to GA4 + Google Ads
   - **🎉 Mark as Converted** → Sends to GA4 + Google Ads with booking value

   You'll see confirmation:
   ```
   ✅ Lead converted successfully!

   Booking Value: $5,000
   GA4: ✓ Sent
   Google Ads: ✓ Sent
   ```

---

## Conversion Action IDs

Find your conversion action IDs in Google Ads:

1. Go to **Tools → Conversions**
2. Click on conversion action
3. Look at URL: `.../conversions/xxxxx/...`
4. The `xxxxx` is your Conversion Action ID

---

## Benefits

### For Campaign Optimization:
- Google Ads optimizes for **bookings**, not just leads
- Smart Bidding learns which keywords drive revenue
- Automatically adjusts bids for high-value conversions

### For ROI Tracking:
```
Keyword: "thai catering ann arbor"
Clicks: 100
Cost: $500
Leads: 10
Qualified: 7
Bookings: 2
Revenue: $10,000
ROI: 1,900%
```

You'll see this full funnel in Google Ads reports!

### For Budget Allocation:
- See which campaigns drive actual bookings
- Shift budget to campaigns with best conversion rates
- Pause campaigns that generate leads but no bookings

---

## Troubleshooting

### CSV Upload Errors

**"Invalid time format"**
- Use: `2025-01-15 10:30:00-05:00`
- Include timezone offset
- Use 24-hour format

**"GCLID not found"**
- GCLID expired (>90 days old)
- GCLID from different account
- Check click-through window settings

**"Duplicate conversion"**
- Already uploaded this GCLID + time
- Use updated time or remove from CSV

### API Integration Errors

**"Authentication failed"**
- Refresh token expired → regenerate
- Wrong client ID/secret → check .env

**"Developer token invalid"**
- Need to apply for Google Ads API access
- Check token in Google Ads account

**"Conversion action not found"**
- Wrong Conversion Action ID
- Check format: `customers/1234567890/conversionActions/123456789`

---

## Testing

1. Submit a test form on your website
2. Check Sanity for the lead
3. Click "✅ Mark as Qualified"
4. Check Google Ads → Tools → Conversions
5. Look for conversion in last 24 hours

**Note:** Conversions may take 3-6 hours to appear in Google Ads reports

---

## Best Practices

1. **Mark leads qualified within 24-48 hours**
   - Fresh data improves bidding algorithms
   - Attribution is most accurate near click time

2. **Be consistent with qualification**
   - Only mark legitimate leads as qualified
   - Don't inflate numbers → hurts optimization

3. **Include actual booking values**
   - Helps Google Ads optimize for revenue
   - More accurate ROI tracking

4. **Review weekly**
   - Check conversion upload status
   - Monitor for errors
   - Adjust based on performance

---

## Recommended: Start with Option 1

1. Use manual CSV upload for first month
2. Track 10-20 conversions
3. Verify data accuracy
4. If working well, consider API automation

Most small businesses stick with CSV uploads and it works perfectly fine!
