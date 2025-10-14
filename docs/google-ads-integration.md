# Google Ads Integration Guide

## Overview

This guide covers setting up Google Ads conversion tracking and enhanced conversions with first-party data collection for Customer Match campaigns. The implementation captures user data from form submissions to improve ad attribution and enable powerful remarketing capabilities.

## First-Party Data Collection

### Data Captured from Forms

| Field | Source | Use Case |
|-------|--------|----------|
| Email Address | Required on all forms | Customer Match, Enhanced Conversions |
| Phone Number | Required on all forms | Customer Match, Enhanced Conversions |
| First Name | Required on all forms | Enhanced Conversions, Personalization |
| Last Name | Required on all forms | Enhanced Conversions, Personalization |
| Location/City | Event planning forms | Geographic targeting, Local campaigns |
| Guest Count | Event planning forms | Value-based bidding |
| Event Type | Event planning forms | Audience segmentation |

### DataLayer Structure

When a form is submitted, the following enhanced data is pushed to GTM dataLayer:

```javascript
{
  'event': 'form_submit',
  'form_name': 'start_planning' | 'contact',
  'form_type': 'event_inquiry' | 'general_inquiry' | 'contact_inquiry',
  'value': guestCount || 0,
  'user_data': {
    'email_address': 'user@example.com',
    'phone_number': '+17346239799',
    'address': {
      'first_name': 'John',
      'last_name': 'Smith',
      'city': 'Ann Arbor'
    }
  }
}
```

## Google Ads Setup

### Prerequisites

- Google Ads account with conversion tracking enabled
- Google Tag Manager container (GTM-WCMPN842)
- Enhanced conversions enabled in Google Ads
- Customer Match eligibility (requires policy compliance and account history)
- **Auto-tagging enabled** (captures GCLID automatically)
- **UTM tracking implemented** (see conversion-tracking.md)

### Step 1: Enable Auto-Tagging & Enhanced Conversions

1. **Enable Auto-Tagging** (Required for GCLID capture)
   - Navigate to Settings → Account Settings
   - Under "Auto-tagging", toggle ON
   - This automatically appends `gclid` parameter to all ad URLs
   - Example: `chefnamcatering.com?gclid=CjwKCA...`

2. **Enable Enhanced Conversions**
   - Navigate to Tools & Settings → Conversions
   - Select your conversion action
   - Click "Settings"
   - Enable "Enhanced conversions"
   - Choose "Google Tag Manager" as implementation method

### Step 2: Configure UTM Parameters in Google Ads

**Important**: Use UTM parameters in addition to auto-tagging for complete attribution.

1. **Campaign-Level UTM Setup**
   - Campaign URL options → Tracking template (optional)
   - Or use ValueTrack parameters in Final URL suffix

2. **Recommended UTM Structure**:
   ```
   utm_source=google
   utm_medium=cpc
   utm_campaign={campaignid}
   utm_term={keyword}
   utm_content={creative}
   ```

3. **Example Final URL**:
   ```
   https://chefnamcatering.com/services/weddings?utm_source=google&utm_medium=cpc&utm_campaign=summer-wedding-promo&utm_term={keyword}&utm_content={creative}
   ```

**Note**: GCLID (auto-tagging) provides Google Ads-specific tracking, while UTMs work across all platforms and are readable in Sanity CMS.

### Step 3: Create Google Ads Conversion Tag in GTM

1. **Create Conversion Tag**
   - GTM → Tags → New
   - Name: "Google Ads Conversion - Form Submit"
   - Tag Type: Google Ads Conversion Tracking
   - Conversion ID: [Your Google Ads Conversion ID]
   - Conversion Label: [Your Conversion Label]

2. **Configure Enhanced Conversions**
   - Enable "Use enhanced conversions"
   - User-provided data: From variable
   - Create new variable for user data

3. **Add GCLID Parameter** (Optional but recommended)
   - Google Click ID: {{dlv - gclid}}
   - This reinforces attribution even if cookies are blocked

### Step 4: Create User Data Variable in GTM

1. **Create Data Layer Variable**
   - Name: "Enhanced Conversion Data"
   - Variable Type: Data Layer Variable
   - Data Layer Variable Name: `user_data`

2. **Map User Data Fields**
   - Email: `{{Enhanced Conversion Data.email_address}}`
   - Phone: `{{Enhanced Conversion Data.phone_number}}`
   - First Name: `{{Enhanced Conversion Data.address.first_name}}`
   - Last Name: `{{Enhanced Conversion Data.address.last_name}}`
   - City: `{{Enhanced Conversion Data.address.city}}`

### Step 5: Set Conversion Values

For value-based bidding, configure dynamic conversion values:

1. **Create Conversion Value Variable**
   - Name: "Form Conversion Value"
   - Variable Type: Custom JavaScript
   - Code:
   ```javascript
   function() {
     var formType = {{dlv - form_type}};
     var guestCount = {{dlv - value}} || 0;
     
     // Assign values based on form type and guest count
     if (formType === 'event_inquiry') {
       if (guestCount >= 100) return 500;      // Large events
       if (guestCount >= 50) return 250;       // Medium events
       if (guestCount >= 20) return 100;       // Small events
       return 50;                              // Micro events
     } else {
       return 25;                              // General inquiries
     }
   }
   ```

## Customer Match Setup

### Audience Creation

1. **Google Ads Audience Manager**
   - Navigate to Tools & Settings → Audience Manager
   - Click "+" to create new audience
   - Choose "Customer list"
   - Select "Upload customer emails, phone numbers, or mailing addresses"

2. **First-Party Data Export**
   - Export email/phone data from Sanity CMS
   - Format: CSV with columns (Email, Phone, First Name, Last Name)
   - Hash emails/phones using SHA-256 (Google Ads can do this automatically)

### Automated Audience Updates

For ongoing automation, consider:
- **Zapier Integration**: Sanity → Google Ads audience updates
- **Google Ads API**: Programmatic audience management
- **Manual Weekly Updates**: Export and upload new leads

## Remarketing Campaigns

### High-Intent Audiences

1. **Form Submitters**
   - Users who completed any form
   - Exclude: Recent customers (last 30 days)
   - Campaign: Service-specific ads

2. **Event Planners**
   - Users with `form_type = 'event_inquiry'`
   - Campaign: Wedding/corporate event focus
   - Higher bid adjustments

3. **Phone Clickers**
   - Users who clicked phone numbers
   - Campaign: "Call today" focused ads
   - Mobile-first targeting

### Lookalike Audiences

1. **Similar to Form Submitters**
   - Source: Customer Match list of form submissions
   - Target: Users similar to your leads
   - Campaign: Prospecting campaigns

2. **Similar to High-Value Clients**
   - Source: Customers with events >100 guests
   - Target: Affluent demographics
   - Campaign: Premium service promotion

## Conversion Actions Setup

### Primary Conversions

1. **Lead Generation**
   - Action: Form submission (any form)
   - Value: Dynamic based on form type
   - Attribution: Data-driven

2. **High-Intent Lead**
   - Action: Event planning form with >50 guests
   - Value: Higher static value
   - Attribution: Data-driven

3. **Phone Engagement**
   - Action: Phone number click
   - Value: Lower static value
   - Attribution: Position-based

### Conversion Categories

| Conversion | Type | Value | Purpose |
|------------|------|-------|---------|
| Form Submit | Primary | Dynamic | Lead generation bidding |
| Phone Click | Secondary | $10 | Engagement measurement |
| High-Value Lead | Primary | $100 | Premium lead focus |
| Repeat Visitor | Auxiliary | $5 | Brand awareness |

## Implementation Checklist

### Technical Setup
- [ ] Enhanced conversion data added to dataLayer
- [ ] Google Ads conversion tag configured in GTM
- [ ] User data variable created and mapped
- [ ] Conversion values configured dynamically
- [ ] Enhanced conversions enabled in Google Ads
- [ ] Customer Match audiences created

### Campaign Setup
- [ ] Remarketing campaigns created for form submitters
- [ ] Lookalike audiences set up
- [ ] Conversion-based bidding strategies implemented
- [ ] Phone click tracking campaigns created
- [ ] Value-based bidding enabled for high-intent leads

### Testing & Validation
- [ ] Test form submissions trigger Google Ads conversions
- [ ] Verify enhanced conversion data appears in Google Ads
- [ ] Check Customer Match audience population
- [ ] Validate conversion values are calculated correctly
- [ ] Confirm remarketing tags fire properly

## Privacy & Compliance

### Data Collection Consent

Ensure compliance with privacy regulations:

1. **Privacy Policy Updates**
   - Disclose Google Ads tracking
   - Explain Customer Match usage
   - Provide opt-out mechanisms

2. **Cookie Consent**
   - Include Google Ads cookies in consent banner
   - Allow granular consent for advertising cookies
   - Respect user preferences

3. **Data Retention**
   - Follow Google Ads data retention policies
   - Implement data deletion requests
   - Regular audience list cleanup

### Customer Match Requirements

- **Account Eligibility**: Good payment history and policy compliance
- **Data Quality**: Clean, accurate customer data
- **Match Rates**: Aim for >70% match rate for effective campaigns
- **Audience Size**: Minimum 1,000 matched users for campaigns

## Reporting & Optimization

### Key Metrics

1. **Conversion Performance**
   - Conversion rate by traffic source
   - Cost per conversion by campaign
   - Enhanced conversion improvement vs. standard tracking

2. **Customer Match Performance**
   - Audience match rates
   - ROAS from remarketing campaigns
   - Lookalike audience performance

3. **Attribution Analysis**
   - Multi-touch attribution insights
   - Cross-device conversion paths
   - Phone vs. form conversion performance

4. **UTM-Based Attribution** (NEW)
   - See exactly which keywords convert in Sanity CMS
   - Match email notifications to specific campaigns
   - Calculate ROI by campaign using utm_campaign field
   - Track landing page performance by source

### Optimization Strategies

1. **Bid Adjustments**
   - Increase bids for high-intent audiences
   - Adjust by device based on phone click data
   - Geographic adjustments based on location data

2. **Audience Refinement**
   - Segment by event size/type
   - Create seasonal audience variations
   - Exclude recent converters appropriately

3. **Creative Optimization**
   - Personalize ads based on form data
   - Test different CTAs for different audience types
   - Use dynamic ad content based on user behavior

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Low conversion attribution | Check enhanced conversions setup and data quality |
| Poor Customer Match rates | Improve data formatting and hash consistency |
| Missing conversion data | Verify GTM tag firing and Google Ads integration |
| Audience not populating | Check data format and minimum audience requirements |
| **GCLID not captured** | **Verify auto-tagging is enabled in Google Ads settings** |
| **UTM parameters missing** | **Check URL structure in campaigns, ensure UTMs are appended** |
| **Attribution data not in emails** | **Verify localStorage capture script is running (see conversion-tracking.md)** |

### Debug Steps

1. **GTM Preview Mode**
   - Verify user_data appears in dataLayer
   - Check Google Ads conversion tag fires
   - Confirm enhanced conversion data is passed

2. **Google Ads Interface**
   - Check conversion import in Tools & Settings
   - Verify enhanced conversions are processing
   - Monitor Customer Match audience growth

3. **Data Validation**
   - Test with known email addresses
   - Verify phone number formatting
   - Check data accuracy in Sanity CMS

## File References

### Code Locations
- **Form Tracking with User Data**: 
  - `/src/pages/start-planning.astro` (lines 640-660)
  - `/src/pages/contact.astro` (lines 316-334)
- **GTM Integration**: `/src/layouts/Layout.astro`

### Related Documentation
- [Conversion Tracking Implementation](./conversion-tracking.md) - **See Section 1 for UTM tracking setup**
- [Multi-Environment GA4 Setup](./multi-environment-ga4-setup.md)

## Lead Source Visibility

### Where You'll See Attribution Data

1. **Email Notifications** (Immediate)
   - Every form submission email includes "Lead Source Information"
   - Shows: Source, Campaign, Medium, Keyword, Landing Page
   - Example: "Source: Google Ads | Campaign: summer-wedding-promo | Keyword: thai catering ann arbor"

2. **Sanity CMS** (Permanent Record)
   - All submissions stored with full attribution
   - Filter by utm_source, utm_campaign, etc.
   - Export to CSV for ROI analysis
   - Query leads: "Show all leads from Google Ads in July"

3. **Google Ads Console** (Conversion Tracking)
   - See conversions by keyword
   - Enhanced conversion data with user info
   - ROAS and cost per conversion by campaign

4. **GA4 Reports** (Analytics)
   - Campaign performance dashboard
   - Keyword-level conversion data
   - Landing page conversion rates by source

### Matching Leads to Campaigns

**Question**: "Which leads came from my Google Ads summer wedding campaign?"

**Answer Options**:
1. **In Email**: Search inbox for "Campaign: summer-wedding-promo"
2. **In Sanity**: Filter formSubmissions where utm_campaign = "summer-wedding-promo"
3. **In GA4**: Create exploration with filter campaign_name = "summer-wedding-promo"
4. **In Google Ads**: View conversions for that specific campaign

---

*Last Updated: January 14, 2025*
*Version: 2.0* - Added UTM tracking integration and lead source visibility