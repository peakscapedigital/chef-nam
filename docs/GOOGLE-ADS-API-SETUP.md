# Google Ads API Setup Checklist

## Prerequisites
- Google Ads account with active campaigns
- Access to Google Cloud Console
- Node.js installed

## Complete Setup Steps

### ☐ Step 1: Google Cloud Project

1. Go to https://console.cloud.google.com
2. Create new project: `chef-nam-ads-integration`
3. Enable Google Ads API (APIs & Services → Library → Search "Google Ads API")

### ☐ Step 2: OAuth Credentials

1. Go to APIs & Services → Credentials
2. Configure OAuth consent screen:
   - User Type: External
   - App name: `Chef Nam Ads Integration`
   - Add scope: `https://www.googleapis.com/auth/adwords`
   - Add your email as test user
3. Create OAuth client ID:
   - Type: Desktop app
   - Download credentials JSON file
   - Save as `google-ads-credentials.json`

### ☐ Step 3: Get Developer Token

1. Go to https://ads.google.com
2. Tools → Setup → API Center
3. Apply for access (if needed) - wait for approval
4. Copy Developer Token (looks like: `AbCdEfGh...`)

### ☐ Step 4: Find Customer ID

1. Top right corner of Google Ads
2. Customer ID: `123-456-7890`
3. **Remove hyphens:** `1234567890`

### ☐ Step 5: Create Conversion Actions

1. Tools → Conversions → + New conversion action
2. Create TWO actions:

   **Qualified Lead:**
   - Import → Other data sources
   - Category: Lead
   - Name: `Qualified Lead`
   - Value: Different values for each conversion
   - Click-through window: 90 days

   **Booking Confirmed:**
   - Import → Other data sources
   - Category: Purchase
   - Name: `Booking Confirmed`
   - Value: Transaction-specific
   - Click-through window: 90 days

3. Click each action, note the ID from URL: `conversions/XXXXX`

### ☐ Step 6: Generate Refresh Token

1. Open `google-ads-credentials.json` you downloaded
2. Edit `scripts/get-google-ads-refresh-token.js`:
   ```javascript
   const CLIENT_ID = 'paste-from-json-file';
   const CLIENT_SECRET = 'paste-from-json-file';
   ```

3. Run the script:
   ```bash
   cd scripts
   npm install
   npm run get-refresh-token
   ```

4. Follow the prompts:
   - Open the URL in browser
   - Sign in and authorize
   - Copy the code
   - Paste into terminal

5. Save the **Refresh Token** output

### ☐ Step 7: Add Secrets to Cloudflare Pages

Run these commands and paste your values when prompted:

```bash
# Customer ID (without hyphens)
npx wrangler pages secret put GOOGLE_ADS_CUSTOMER_ID --project-name=chef-nam-website
# Paste: 1234567890

# Developer Token
npx wrangler pages secret put GOOGLE_ADS_DEVELOPER_TOKEN --project-name=chef-nam-website
# Paste: AbCdEfGh...

# OAuth Client ID
npx wrangler pages secret put GOOGLE_ADS_CLIENT_ID --project-name=chef-nam-website
# Paste: xxx.apps.googleusercontent.com

# OAuth Client Secret
npx wrangler pages secret put GOOGLE_ADS_CLIENT_SECRET --project-name=chef-nam-website
# Paste: GOCSPX-xxx

# Refresh Token (from step 6)
npx wrangler pages secret put GOOGLE_ADS_REFRESH_TOKEN --project-name=chef-nam-website
# Paste: 1//xxx

# Qualified Lead Conversion ID
npx wrangler pages secret put GOOGLE_ADS_QUALIFIED_CONVERSION_ID --project-name=chef-nam-website
# Paste: 123456789

# Booking Conversion ID
npx wrangler pages secret put GOOGLE_ADS_BOOKING_CONVERSION_ID --project-name=chef-nam-website
# Paste: 987654321
```

### ☐ Step 8: Test the Integration

1. Go to Sanity Studio: https://chef-nam-catering.sanity.studio
2. Find a lead with a GCLID
3. Click **✅ Mark as Qualified**
4. Should see: `GA4: ✓ Sent | Google Ads: ✓ Sent`
5. Check Google Ads → Tools → Conversions for the conversion (may take 3-6 hours)

## Troubleshooting

### "Developer token not approved"
- Go to API Center and check application status
- May need to provide more details about API usage
- Can take 24-48 hours for approval

### "Invalid client"
- Double-check CLIENT_ID and CLIENT_SECRET match downloaded JSON
- Make sure you created Desktop app (not Web app)

### "Refresh token not generated"
- Make sure you added `prompt: 'consent'` in the script
- Try revoking access and re-authorizing

### "Conversion not appearing in Google Ads"
- Conversions can take 3-6 hours to process
- Check GCLID is less than 90 days old
- Verify conversion action is enabled

## Values You'll Need

Create a secure note with these values:

```
GOOGLE_ADS_CUSTOMER_ID:
GOOGLE_ADS_DEVELOPER_TOKEN:
GOOGLE_ADS_CLIENT_ID:
GOOGLE_ADS_CLIENT_SECRET:
GOOGLE_ADS_REFRESH_TOKEN:
GOOGLE_ADS_QUALIFIED_CONVERSION_ID:
GOOGLE_ADS_BOOKING_CONVERSION_ID:
```

## Security Notes

- **Never commit** credentials to git
- **Delete** `get-google-ads-refresh-token.js` after getting token
- **Refresh token never expires** unless you revoke it
- Store credentials in password manager

## Alternative: Manual CSV Upload

If this seems too complex, you can skip API setup and use manual CSV uploads instead (see `docs/google-ads-offline-conversions.md`). Manual uploads work just as well for most small businesses!
