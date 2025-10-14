# Conversion Tracking Implementation Guide

## Overview
This document outlines the conversion tracking implementation for Chef Nam Catering website, including form submissions and phone click tracking through Google Tag Manager (GTM) and Google Analytics 4 (GA4).

## Prerequisites
- Google Tag Manager container installed (GTM-WCMPN842)
- Google Analytics 4 property configured
- Access to GTM workspace
- Access to GA4 property

## 1. Lead Source & Attribution Tracking

### Overview
To properly attribute leads to their marketing source, the website captures UTM parameters, Google Click IDs (GCLID), and referral information. This allows you to match specific form submissions to their exact traffic source (e.g., "Google Ads - Wedding Catering Campaign - Keyword: thai catering ann arbor").

### UTM Parameters Captured

| Parameter | Description | Example |
|-----------|-------------|---------|
| `utm_source` | Traffic source | google, facebook, email |
| `utm_medium` | Marketing medium | cpc, organic, social, email |
| `utm_campaign` | Campaign name | summer-wedding-promo |
| `utm_term` | Paid search keyword | thai catering ann arbor |
| `utm_content` | Ad variation | text-ad-1, banner-a |
| `gclid` | Google Click ID | CjwKCAiA... (auto-captured) |
| `fbclid` | Facebook Click ID | IwAR0... (auto-captured) |

### Additional Attribution Data

| Field | Description | Use Case |
|-------|-------------|----------|
| `referrer` | Previous page URL | Understand traffic source |
| `landing_page` | First page visited | See which pages convert |
| `lead_source` | Friendly source name | "Google Ads", "Organic Search" |

### Implementation (Client-Side)
A client-side script captures UTM parameters and attribution data on page load and stores them in localStorage for persistence across page navigation.

**Location**: `/src/layouts/Layout.astro` (Global tracking script)

```javascript
// Capture UTM parameters and attribution on page load
(function() {
  const urlParams = new URLSearchParams(window.location.search);
  const storage = window.localStorage;

  // Only capture if not already stored (first visit takes precedence)
  if (!storage.getItem('utm_source') && urlParams.toString()) {
    // Capture UTM parameters
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(param => {
      const value = urlParams.get(param);
      if (value) storage.setItem(param, value);
    });

    // Capture referrer and landing page
    if (document.referrer) storage.setItem('referrer', document.referrer);
    storage.setItem('landing_page', window.location.pathname);
  }
})();
```

## 2. Form Submission Tracking

### Implementation (Code Side)
Form submission tracking is implemented in two key forms:
- **Start Planning Form** (`/start-planning`)
- **Contact Form** (`/contact`)

#### DataLayer Push Events
When a form is successfully submitted, the following event is pushed to the dataLayer **including attribution data**:

```javascript
window.dataLayer.push({
  'event': 'form_submit',
  'form_name': 'start_planning' | 'contact',
  'form_destination': '/api/submit-form',
  'form_type': 'event_inquiry' | 'general_inquiry' | 'contact_inquiry',
  'event_category': 'engagement',
  'event_label': 'Start Planning Form' | 'Contact Form',
  'value': guestCount || 0,  // For event forms only

  // Attribution data
  'utm_source': 'google',
  'utm_medium': 'cpc',
  'utm_campaign': 'summer-wedding-promo',
  'utm_term': 'thai catering ann arbor',
  'utm_content': 'text-ad-1',
  'gclid': 'CjwKCAiA...',
  'fbclid': null,
  'lead_source': 'Google Ads',
  'referrer': 'https://google.com',
  'landing_page': '/services/weddings'
});
```

### GTM Configuration

#### 1. Create Custom Event Trigger
- **Name**: Generate Lead Event
- **Trigger Type**: Custom Event
- **Event name**: `generate_lead`
- **This trigger fires on**: All Custom Events

**Note**: We use `generate_lead` instead of `form_submit` because it's a GA4 Recommended Event that populates the Business Objectives > Generate Leads reports.

#### 2. Create Data Layer Variables
Navigate to Variables → User-Defined Variables → New:

**Form Variables:**

| Variable Name | Type | Data Layer Variable Name |
|--------------|------|-------------------------|
| dlv - form_name | Data Layer Variable | form_name |
| dlv - form_type | Data Layer Variable | form_type |
| dlv - form_destination | Data Layer Variable | form_destination |
| dlv - event_label | Data Layer Variable | event_label |

**Attribution Variables (NEW):**

| Variable Name | Type | Data Layer Variable Name |
|--------------|------|-------------------------|
| dlv - utm_source | Data Layer Variable | utm_source |
| dlv - utm_medium | Data Layer Variable | utm_medium |
| dlv - utm_campaign | Data Layer Variable | utm_campaign |
| dlv - utm_term | Data Layer Variable | utm_term |
| dlv - utm_content | Data Layer Variable | utm_content |
| dlv - gclid | Data Layer Variable | gclid |
| dlv - fbclid | Data Layer Variable | fbclid |
| dlv - lead_source | Data Layer Variable | lead_source |
| dlv - referrer | Data Layer Variable | referrer |
| dlv - landing_page | Data Layer Variable | landing_page |

#### 3. Create GA4 Event Tag
- **Tag Type**: Google Analytics: GA4 Event
- **Configuration Tag**: [Select your GA4 Configuration]
- **Event Name**: `generate_lead`
- **Event Parameters**:
  - form_name: {{dlv - form_name}}
  - form_type: {{dlv - form_type}}
  - form_destination: {{dlv - form_destination}}
  - event_label: {{dlv - event_label}}
  - **campaign_source**: {{dlv - utm_source}}
  - **campaign_medium**: {{dlv - utm_medium}}
  - **campaign_name**: {{dlv - utm_campaign}}
  - **campaign_term**: {{dlv - utm_term}}
  - **campaign_content**: {{dlv - utm_content}}
  - **gclid**: {{dlv - gclid}}
  - **lead_source**: {{dlv - lead_source}}
  - **referrer**: {{dlv - referrer}}
  - **landing_page**: {{dlv - landing_page}}
- **Triggering**: Generate Lead Event

**Important**: These attribution parameters allow you to see in GA4 exactly which campaign/keyword generated each lead.

#### 4. Mark as Key Event in GA4
After creating the tag:
1. Navigate to GA4 → Admin → Events
2. Find `generate_lead` event
3. Toggle **"Mark as key event"** to ON
4. This makes the event appear in Business Objectives reports and conversion tracking

#### 5. Enable Business Objectives Collection (if not already enabled)
1. Navigate to GA4 → Reports → Library
2. Click **"Create new collection"**
3. Select **"Business Objectives"** template
4. Add the collection
5. You'll now see **"Generate Leads"** section with Lead Acquisition report

### Form Types Reference
| Form Name | Form Type | Description |
|-----------|-----------|-------------|
| start_planning | event_inquiry | User has a specific event |
| start_planning | general_inquiry | User doesn't have event yet |
| contact | contact_inquiry | General contact form |
| menus_contact | lead_capture | Menu inquiry form |

### Why `generate_lead` Instead of `form_submit`?

**GA4 Best Practice Change (2024-2025):**
- `generate_lead` is a **GA4 Recommended Event** that integrates with Business Objectives reporting
- `form_submit` is a generic event that doesn't populate Lead Generation reports
- Using `generate_lead` enables:
  - ✅ Lead Acquisition Report
  - ✅ Business Objectives > Generate Leads section
  - ✅ Lead audience templates
  - ✅ Google Ads enhanced conversion tracking for leads
  - ✅ Full lead lifecycle tracking (qualify_lead, working_lead, close_convert_lead)

**Migration Date**: January 14, 2025 - All forms updated from `form_submit` to `generate_lead`

## 3. Phone Click Tracking

### Implementation (Code Side)
Automatic tracking for all phone links (`tel:`) is implemented globally in `/src/layouts/Layout.astro`.

#### DataLayer Push Events
When any phone link is clicked, the following event is pushed:

```javascript
window.dataLayer.push({
  'event': 'phone_click',
  'phone_number': '+17346239799',
  'link_text': '(734) 623-9799',
  'link_location': 'header' | 'footer' | 'topbar' | 'unknown',
  'event_category': 'engagement',
  'event_label': 'Phone Click - (734) 623-9799'
});
```

### GTM Configuration

#### 1. Create Custom Event Trigger
- **Name**: Phone Click Event
- **Trigger Type**: Custom Event
- **Event name**: `phone_click`
- **This trigger fires on**: All Custom Events

#### 2. Create Data Layer Variables
| Variable Name | Type | Data Layer Variable Name |
|--------------|------|-------------------------|
| dlv - phone_number | Data Layer Variable | phone_number |
| dlv - link_text | Data Layer Variable | link_text |
| dlv - link_location | Data Layer Variable | link_location |

#### 3. Create GA4 Event Tag
- **Tag Type**: Google Analytics: GA4 Event
- **Configuration Tag**: [Select your GA4 Configuration]
- **Event Name**: `phone_click`
- **Event Parameters**:
  - phone_number: {{dlv - phone_number}}
  - link_location: {{dlv - link_location}}
  - link_text: {{dlv - link_text}}
- **Triggering**: Phone Click Event

### Phone Link Locations
Phone links appear in the following locations:
- TopBar (top of every page)
- Footer (bottom of every page)
- Contact page
- Start Planning page
- Service pages
- Menu page

## 3. Setting Up Conversions in GA4

### Navigate to GA4 Admin
1. Go to your GA4 property
2. Navigate to **Admin → Events**
3. Find your events: `form_submit` and `phone_click`
4. Toggle "Mark as conversion" for each event

### Create Custom Conversion Events
1. **Admin → Events → Create event**
2. Examples:
   - **Event name**: `qualified_lead`
   - **Matching conditions**: 
     - event_name equals form_submit
     - form_type equals event_inquiry
   
   - **Event name**: `phone_engagement`
   - **Matching conditions**:
     - event_name equals phone_click
     - link_location equals topbar

## 4. Testing & Validation

### GTM Preview Mode
1. In GTM, click **Preview**
2. Enter your website URL
3. Navigate through the site and test:
   - Submit a test form
   - Click phone numbers
4. Check the Tag Assistant panel to verify:
   - Events are firing
   - Variables are populated correctly
   - Tags are triggered

### GA4 Real-time Reports
1. In GA4, go to **Reports → Realtime**
2. Look for your events:
   - `form_submit` events
   - `phone_click` events
3. Click on events to see parameters

### Debug Tips
- Use browser console: `console.log(dataLayer)` to see all events
- Check Network tab for GA4 requests to `google-analytics.com/g/collect`
- Verify GTM container is published (not just saved)

## 5. Reporting & Analysis

### Built-in Reports
- **Engagement → Events**: See all tracked events
- **Engagement → Conversions**: Monitor conversion metrics
- **Acquisition → Traffic acquisition**: See which channels drive conversions

### Custom Reports
Create explorations for deeper analysis:
1. **Form Performance**:
   - Dimension: form_name, form_type
   - Metrics: Event count, Users
   - Filter: event_name = form_submit

2. **Phone Engagement**:
   - Dimension: link_location, link_text
   - Metrics: Event count, Users
   - Filter: event_name = phone_click

### Recommended Audiences
1. **High-Intent Users**:
   - Include users who triggered form_submit OR phone_click

2. **Event Planners**:
   - Include users where form_type = event_inquiry

3. **Engaged Visitors**:
   - Include users with 2+ phone_click events

## 6. Email Notification Tracking

### Email Worker Integration
Form submissions trigger email notifications via Cloudflare Worker:
- **Worker URL**: https://chefnam-email-worker.dspjson.workers.dev
- **Recipients**: nam@chefnamcatering.com, dspjson@gmail.com

### Lead Source in Email Notifications

**NEW**: Email notifications now include full lead attribution data so you can immediately see where each lead came from.

#### Email Format Example
```
New Event Inquiry - Chef Nam Catering

Contact Information:
Name: John Smith
Email: john@example.com
Phone: (734) 555-0123

Lead Source Information:
Source: Google Ads
Campaign: summer-wedding-promo-2025
Medium: CPC (Pay-Per-Click)
Keyword: "thai catering ann arbor"
Ad Content: text-ad-variation-a
Landing Page: /services/weddings
Referrer: https://www.google.com

Event Details:
Event Type: Wedding
Guest Count: 75
Date: June 15, 2025
...
```

#### Implementation
The form API (`/src/pages/api/submit-form.ts`) passes attribution data to the email worker:

```javascript
const emailData = {
  ...formData,
  attribution: {
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    utm_term: data.utm_term,
    utm_content: data.utm_content,
    gclid: data.gclid,
    lead_source: data.lead_source,
    referrer: data.referrer,
    landing_page: data.landing_page
  }
};
```

### Email Events (Future Enhancement)
Consider tracking:
- Email sent confirmations
- Email delivery status
- Email open rates (if using tracking pixels)

### Sanity CMS Storage
All form submissions, including attribution data, are stored in Sanity CMS for future reference and analysis.

#### Schema Fields (formSubmission)
The Sanity schema includes these attribution fields:

```javascript
{
  name: 'formSubmission',
  type: 'document',
  fields: [
    // Contact info...
    {name: 'firstName', type: 'string'},
    {name: 'email', type: 'string'},

    // Attribution fields
    {name: 'utm_source', type: 'string', title: 'UTM Source'},
    {name: 'utm_medium', type: 'string', title: 'UTM Medium'},
    {name: 'utm_campaign', type: 'string', title: 'UTM Campaign'},
    {name: 'utm_term', type: 'string', title: 'UTM Term'},
    {name: 'utm_content', type: 'string', title: 'UTM Content'},
    {name: 'gclid', type: 'string', title: 'Google Click ID'},
    {name: 'fbclid', type: 'string', title: 'Facebook Click ID'},
    {name: 'lead_source', type: 'string', title: 'Lead Source'},
    {name: 'referrer', type: 'string', title: 'Referrer'},
    {name: 'landing_page', type: 'string', title: 'Landing Page'},

    // Event info...
  ]
}
```

#### Querying Lead Source Data
In Sanity Studio, you can:
- Filter submissions by `utm_source` or `utm_campaign`
- Export data for ROI analysis
- Build custom dashboards showing lead distribution

**Example GROQ Query** (for API/reporting):
```groq
*[_type == "formSubmission" && utm_source == "google"] {
  firstName,
  lastName,
  email,
  utm_campaign,
  utm_term,
  eventType,
  submittedAt
}
```

## 7. Maintenance & Updates

### Adding New Forms
When adding new forms to the site:
1. Include the dataLayer.push code on successful submission
2. Use consistent event naming (`form_submit`)
3. Add appropriate form_name and form_type values
4. **Include attribution data from localStorage** in the submission
5. Update this documentation

**Code template for new forms:**
```javascript
// Read attribution data from localStorage
const attribution = {
  utm_source: localStorage.getItem('utm_source'),
  utm_medium: localStorage.getItem('utm_medium'),
  utm_campaign: localStorage.getItem('utm_campaign'),
  utm_term: localStorage.getItem('utm_term'),
  utm_content: localStorage.getItem('utm_content'),
  gclid: localStorage.getItem('gclid'),
  fbclid: localStorage.getItem('fbclid'),
  referrer: localStorage.getItem('referrer'),
  landing_page: localStorage.getItem('landing_page')
};

// Push to dataLayer
window.dataLayer.push({
  event: 'form_submit',
  form_name: 'your_form_name',
  ...attribution
});

// Include in API submission
const formData = {
  ...contactInfo,
  ...attribution
};
```

### Adding New Phone Numbers
The tracking automatically captures all `tel:` links, so new phone numbers will be tracked automatically.

### Regular Audits
Monthly checks:
- Verify all conversions are firing in GA4
- Review conversion rates
- Check for any JavaScript errors in console
- Ensure GTM container is up to date

## 8. Troubleshooting

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Events not appearing in GA4 | Check GTM is published, not just saved |
| Variables showing undefined | Verify data layer variable names match exactly |
| Phone clicks not tracking | Check for JavaScript errors blocking event listeners |
| Form submits not tracking | Ensure form submission is successful (check Network tab) |
| Duplicate events | Check for multiple GTM containers or GA4 tags |

### Support Contacts
- **Website Development**: [Your contact]
- **GTM/GA4 Setup**: [Analytics contact]
- **Form Submissions** (stored in): Sanity CMS

## Implementation Files Reference

### Code Locations
- **UTM Capture Script**:
  - `/src/layouts/Layout.astro` (Global head script - captures on all pages)
- **Form Tracking with Attribution**:
  - `/src/components/forms/StartPlanningForm.astro` (lines 433-632)
  - `/src/pages/contact.astro` (Contact form with attribution)
- **Phone Tracking**:
  - `/src/layouts/Layout.astro` (lines 132-183)
- **Form API with Attribution Storage**:
  - `/src/pages/api/submit-form.ts` (Stores attribution in Sanity)
- **Email Worker**:
  - `/email-worker/src/index.js` (Includes attribution in emails)
- **Sanity Schema**:
  - `/chef-nam-catering/schemas/formSubmission.ts` (Attribution fields)

### Environment Variables
- `RESEND_API_KEY`: Email service API key (set in Cloudflare Worker)
- `SANITY_API_TOKEN`: CMS write access token
- `SANITY_PROJECT_ID`: yojbqnd7

## 9. Lead Attribution Reporting

### GA4 Custom Reports
Create explorations to analyze lead sources:

1. **Campaign Performance Report**:
   - Dimensions: campaign_source, campaign_medium, campaign_name
   - Metrics: form_submit events, Users, Conversions
   - Filter: event_name = form_submit

2. **Keyword Performance** (for paid search):
   - Dimensions: campaign_term, campaign_source
   - Metrics: form_submit events, Cost per conversion
   - Filter: campaign_medium = cpc

3. **Landing Page Analysis**:
   - Dimensions: landing_page, campaign_source
   - Metrics: form_submit events, Conversion rate
   - Shows which pages convert best by source

### Matching Leads to Sources

#### In Email Notifications
Every email you receive shows the full lead source in a dedicated "Lead Source Information" section.

#### In Sanity CMS
1. Open Sanity Studio
2. Navigate to Form Submissions
3. Each submission shows attribution fields
4. Filter by utm_source to see all Google Ads leads
5. Export to CSV for ROI analysis

#### In Google Ads
1. Navigate to Conversions → Conversion Actions
2. View conversion details with enhanced data
3. See which keywords/campaigns drove form submissions
4. Use for bid optimization

### ROI Calculation Example
```
Google Ads Campaign: "Summer Wedding Promo"
Ad Spend: $500
Leads from this campaign (via utm_campaign): 15
Cost per Lead: $33.33
Conversion to booking: 20% = 3 bookings
Average booking value: $5,000
Revenue: $15,000
ROI: 2,900%
```

---

*Last Updated: January 14, 2025*
*Version: 2.1* - Added UTM tracking, lead attribution, and migrated to `generate_lead` event