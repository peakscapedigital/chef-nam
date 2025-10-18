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

#### 1. Create Page View Trigger
- **Name**: Thank You Page View
- **Trigger Type**: Page View
- **This trigger fires on**: Some Page Views
- **Page Path**: contains `/thank-you`

**Note**: We trigger on the thank-you page rather than form submission events because it's more reliable and ensures the conversion is only counted after successful form processing.

#### 2. Alternative: Custom Event Trigger
If you prefer to trigger on dataLayer events instead:
- **Name**: Generate Lead Event
- **Trigger Type**: Custom Event
- **Event name**: `generate_lead`
- **This trigger fires on**: All Custom Events

**Note**: We use `generate_lead` instead of `form_submit` because it's a GA4 Recommended Event that populates the Business Objectives > Generate Leads reports.

#### 3. Create Data Layer Variables
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

#### 4. Create GA4 Event Tag
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
- **Triggering**: Thank You Page View (or Generate Lead Event if using custom event trigger)

**Important**: These attribution parameters allow you to see in GA4 exactly which campaign/keyword generated each lead.

#### 5. Mark as Key Event in GA4
After creating the tag:
1. Navigate to GA4 → Admin → Events
2. Find `generate_lead` event
3. Toggle **"Mark as key event"** to ON
4. This makes the event appear in Business Objectives reports and conversion tracking

#### 6. Enable Business Objectives Collection (if not already enabled)
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

**All forms fire the `generate_lead` event** to populate GA4 Business Objectives reports.

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

### Lead Lifecycle Tracking

GA4 provides a complete lead lifecycle with these recommended events:

| Event Name | Purpose | When to Use |
|------------|---------|-------------|
| `generate_lead` | Initial lead capture | Form submission (automatically tracked) |
| `qualify_lead` | Lead qualification | After you review and qualify the lead |
| `working_lead` | Active sales process | When you start actively working the lead |
| `convert_lead` | Conversion to customer | When lead books/signs contract |

**Benefits:**
- Track full funnel from lead → qualification → working → conversion
- See conversion rates at each stage
- Identify where leads drop off in your sales process
- Measure time between stages

### How to Send Lifecycle Events to GA4

There are **3 main approaches** to send qualified lead data back to GA4:

#### Option 1: Manual Tracking via Sanity CMS (Simplest)

Add a "Lead Status" field to Sanity CMS and use the Measurement Protocol to send events when status changes.

**Implementation:**
1. Add lead status field to Sanity schema
2. Create a Cloudflare Worker to send events to GA4 Measurement Protocol
3. Trigger when lead status changes in Sanity

**Pros:** Simple, no additional tools needed
**Cons:** Manual process, requires remembering to update status

#### Option 2: Email Integration via Zapier/Make (Recommended)

Automatically track lead qualification based on your email interactions.

**Example Workflow:**
1. New form submission → Sanity + Email notification
2. You reply to the lead → Zapier detects sent email
3. Zapier sends `qualify_lead` event to GA4
4. You send calendar invite → Zapier sends `working_lead` event
5. You send contract → Zapier sends `convert_lead` event

**Pros:** Automatic, based on actual workflow
**Cons:** Requires Zapier/Make subscription

#### Option 3: CRM Integration (Most Powerful)

If you use a CRM (HubSpot, Salesforce, etc.), sync lead status changes to GA4.

**Pros:** Professional, automated, scalable
**Cons:** Requires CRM subscription and setup

### Implementation Guide: Measurement Protocol

To send events to GA4 from external sources, use the Measurement Protocol API.

**Required Information:**
- GA4 Measurement ID: G-XXXXXXXXXX
- GA4 API Secret: (Generate in GA4 Admin → Data Streams → Measurement Protocol API secrets)
- Client ID: Original user's GA4 client_id (captured in form submission)

**Step 1: Capture Client ID in Form Submissions**

Update form submission code to capture GA4 client_id:

```javascript
// In StartPlanningForm.astro (add to attribution capture)
const attribution = {
  // ... existing attribution fields
  ga_client_id: getCookie('_ga')?.split('.').slice(-2).join('.') || null
};

// Helper function to read cookies
function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}
```

**Step 2: Store Client ID in Sanity**

Add to Sanity schema:
```javascript
{
  name: 'ga_client_id',
  type: 'string',
  title: 'GA4 Client ID',
  description: 'Used to send lead lifecycle events back to GA4'
}
```

**Step 3: Create Cloudflare Worker to Send Events**

```javascript
// Example: Send qualify_lead event
export default {
  async fetch(request, env) {
    const { client_id, lead_value, currency } = await request.json();

    const measurementId = 'G-XXXXXXXXXX'; // Your GA4 Measurement ID
    const apiSecret = env.GA4_API_SECRET; // Store in Worker secrets

    const payload = {
      client_id: client_id,
      events: [{
        name: 'qualify_lead',
        params: {
          value: lead_value || 5000,
          currency: currency || 'USD',
          event_category: 'lead_lifecycle',
          lead_status: 'qualified'
        }
      }]
    };

    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        body: JSON.stringify(payload)
      }
    );

    return new Response(JSON.stringify({ success: true }));
  }
};
```

**Step 4: Trigger from Sanity or External System**

When you update lead status in Sanity:
1. Read the submission's `ga_client_id`
2. Call your Cloudflare Worker with client_id and event details
3. Worker sends event to GA4 Measurement Protocol

### Simplified Approach: Manual Event Sending

If you don't want to build automation yet, you can send lifecycle events manually.

**Create a simple HTML tool** (save as `send-lead-event.html`):

```html
<!DOCTYPE html>
<html>
<head>
  <title>Send Lead Event to GA4</title>
</head>
<body>
  <h1>Send Lead Lifecycle Event</h1>
  <form id="eventForm">
    <label>Client ID (from form submission):</label><br>
    <input type="text" id="client_id" required><br><br>

    <label>Event Type:</label><br>
    <select id="event_type">
      <option value="qualify_lead">Qualify Lead</option>
      <option value="working_lead">Working Lead</option>
      <option value="convert_lead">Convert Lead</option>
    </select><br><br>

    <label>Lead Value (optional):</label><br>
    <input type="number" id="value" placeholder="5000"><br><br>

    <button type="submit">Send Event</button>
  </form>

  <script>
    document.getElementById('eventForm').addEventListener('submit', async (e) => {
      e.preventDefault();

      const client_id = document.getElementById('client_id').value;
      const event_type = document.getElementById('event_type').value;
      const value = document.getElementById('value').value;

      // Call your Cloudflare Worker
      const response = await fetch('https://your-worker.workers.dev/send-lead-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ client_id, event_type, value })
      });

      alert('Event sent to GA4!');
    });
  </script>
</body>
</html>
```

### Quick Win: Retroactive Qualified Leads

To mark existing leads as qualified without full automation:

1. **Export form submissions from Sanity** with `ga_client_id`
2. **Filter to qualified leads** (those you want to track)
3. **Use the HTML tool above** to send `qualify_lead` events for each
4. GA4 will attribute these back to the original sessions

**Important:** You can send events up to **72 hours** after the original session. For older leads, GA4 will still accept them but may not attribute them to the original campaign.

### Sending Offline Conversions to Google Ads

In addition to GA4, you can send qualified/converted leads directly to Google Ads for better ROI tracking and automated bidding optimization.

#### Why Send to Google Ads?

- **Optimize Bidding**: Google Ads uses conversion data to optimize bids automatically
- **Track ROI**: See exactly which keywords/campaigns drive actual bookings (not just leads)
- **Import Offline Conversions**: Track conversions that happen offline (phone calls, in-person bookings)
- **Value-Based Bidding**: Tell Google Ads the actual booking value to optimize for revenue

#### Google Ads Offline Conversion Tracking

**Requirements:**
- GCLID (Google Click ID) captured in form submission (✅ already implemented)
- Google Ads API access
- Conversion Action set up in Google Ads

**Step 1: Create Conversion Action in Google Ads**

1. Navigate to **Tools → Conversions**
2. Click **+ New conversion action**
3. Select **Import** → **Other data sources or CRMs** → **Track conversions from clicks**
4. Name: "Qualified Lead" or "Booking - Offline"
5. Category: Lead or Purchase
6. Value: Use different values for each conversion (recommended)
7. Click-through conversion window: 90 days (or your typical sales cycle)
8. Save and note the **Conversion Action ID**

**Step 2: Set Up Google Ads API Access**

1. Create a Google Ads Manager Account (if you don't have one)
2. Enable Google Ads API in Google Cloud Console
3. Create OAuth credentials
4. Get your Customer ID from Google Ads

**Step 3: Create Cloudflare Worker to Send Conversions**

```javascript
// cloudflare-workers/google-ads-conversion-worker/index.js

export default {
  async fetch(request, env) {
    const { gclid, conversion_action, conversion_value, conversion_time, email, phone } = await request.json();

    // Google Ads API endpoint
    const customerId = env.GOOGLE_ADS_CUSTOMER_ID.replace(/-/g, ''); // Remove hyphens
    const url = `https://googleads.googleapis.com/v16/customers/${customerId}:uploadClickConversions`;

    // Get OAuth token (you'll need to implement token refresh)
    const accessToken = await getAccessToken(env);

    const payload = {
      conversions: [{
        gclid: gclid,
        conversion_action: conversion_action, // Format: customers/CUSTOMER_ID/conversionActions/CONVERSION_ID
        conversion_date_time: conversion_time, // ISO 8601 format
        conversion_value: conversion_value,
        currency_code: 'USD',
        // Enhanced conversions (optional but recommended)
        user_identifiers: [
          { hashed_email: await hashSHA256(email) },
          { hashed_phone_number: await hashSHA256(phone) }
        ]
      }]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    return new Response(JSON.stringify(result), { status: response.status });
  }
};

// Helper function to hash data for enhanced conversions
async function hashSHA256(data) {
  if (!data) return null;
  const normalized = data.trim().toLowerCase();
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function getAccessToken(env) {
  // Implement OAuth token refresh flow
  // Store refresh token in env.GOOGLE_ADS_REFRESH_TOKEN
  // Return access token
  // This is a simplified example - you'll need full OAuth implementation
  return env.GOOGLE_ADS_ACCESS_TOKEN;
}
```

**Step 4: Add Lead Status to Sanity Schema**

```javascript
// In chef-nam-catering/schemaTypes/index.ts

{
  name: 'leadStatus',
  type: 'string',
  title: 'Lead Status',
  options: {
    list: [
      { title: 'New', value: 'new' },
      { title: 'Qualified', value: 'qualified' },
      { title: 'Working', value: 'working' },
      { title: 'Converted', value: 'converted' },
      { title: 'Lost', value: 'lost' }
    ],
    layout: 'radio'
  },
  initialValue: 'new'
},
{
  name: 'bookingValue',
  type: 'number',
  title: 'Booking Value',
  description: 'The value of the booking (used for conversion tracking)'
},
{
  name: 'conversionSentToAds',
  type: 'boolean',
  title: 'Conversion Sent to Google Ads',
  description: 'Whether this conversion has been sent to Google Ads',
  initialValue: false,
  readOnly: true
},
{
  name: 'conversionSentToGA4',
  type: 'boolean',
  title: 'Conversion Sent to GA4',
  description: 'Whether lifecycle events have been sent to GA4',
  initialValue: false,
  readOnly: true
}
```

**Step 5: Create Sanity Action to Send Conversions**

```javascript
// In chef-nam-catering/sanity.config.ts

import { defineConfig } from 'sanity'

export default defineConfig({
  // ... your existing config
  document: {
    actions: (prev, context) => {
      if (context.schemaType === 'formSubmission') {
        return [
          ...prev,
          // Custom action to send qualified lead to GA4
          {
            name: 'sendQualifiedLead',
            title: 'Mark as Qualified Lead',
            onHandle: async ({ draft, published }) => {
              const doc = draft || published;

              // Send to GA4
              await fetch('/api/send-lead-lifecycle-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ga_client_id: doc.ga_client_id,
                  event_type: 'qualify_lead',
                  value: 5000
                })
              });

              // Update Sanity document
              await context.client.patch(doc._id)
                .set({ leadStatus: 'qualified', conversionSentToGA4: true })
                .commit();

              alert('Qualified lead event sent to GA4!');
            }
          },
          // Custom action to send converted lead to both GA4 and Google Ads
          {
            name: 'sendConvertedLead',
            title: 'Mark as Converted (Booked)',
            onHandle: async ({ draft, published }) => {
              const doc = draft || published;

              const bookingValue = prompt('Enter booking value:', '5000');
              if (!bookingValue) return;

              // Send to GA4
              await fetch('/api/send-lead-lifecycle-event', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ga_client_id: doc.ga_client_id,
                  event_type: 'convert_lead',
                  value: parseFloat(bookingValue)
                })
              });

              // Send to Google Ads (if GCLID exists)
              if (doc.gclid) {
                await fetch('/api/send-google-ads-conversion', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    gclid: doc.gclid,
                    conversion_value: parseFloat(bookingValue),
                    conversion_time: new Date().toISOString(),
                    email: doc.email,
                    phone: doc.phone
                  })
                });
              }

              // Update Sanity document
              await context.client.patch(doc._id)
                .set({
                  leadStatus: 'converted',
                  bookingValue: parseFloat(bookingValue),
                  conversionSentToGA4: true,
                  conversionSentToAds: !!doc.gclid
                })
                .commit();

              alert(`Conversion sent! GA4: ✓ | Google Ads: ${doc.gclid ? '✓' : '✗ (no GCLID)'}`);
            }
          }
        ];
      }
      return prev;
    }
  }
})
```

#### Simplified Approach: CSV Upload to Google Ads

If API integration is too complex initially, you can use **Google Ads offline conversion import**:

1. Export qualified leads from Sanity with GCLID and booking values
2. Format as CSV:
   ```
   Google Click ID,Conversion Name,Conversion Time,Conversion Value,Conversion Currency
   CjwKCAiA...,Qualified Lead,2025-01-15 10:30:00-05:00,5000,USD
   ```
3. Upload to Google Ads: **Tools → Conversions → Uploads**
4. Google Ads will attribute conversions back to campaigns/keywords

**CSV Export Frequency:** Weekly or monthly, depending on lead volume

#### Benefits of This Approach

**Using Sanity as Mini-CRM:**
- ✅ All leads in one place with full attribution data
- ✅ Track lead status progression
- ✅ One-click buttons to send conversions
- ✅ Historical record of all conversions sent
- ✅ No monthly CRM subscription needed

**Sending to GA4:**
- ✅ Full funnel visibility (lead → qualified → working → converted)
- ✅ Time-to-conversion metrics
- ✅ Drop-off analysis

**Sending to Google Ads:**
- ✅ Automated bidding optimization based on actual bookings
- ✅ ROI tracking at keyword level
- ✅ Value-based bidding (optimize for revenue, not just leads)
- ✅ Better conversion tracking than form submissions alone

#### Implementation Roadmap

**Phase 1 (Quick Start - 1 hour):**
1. Add lead status field to Sanity schema
2. Capture GA4 client_id in forms
3. Use CSV upload to Google Ads for initial conversions

**Phase 2 (Automated GA4 - 2-3 hours):**
1. Create Measurement Protocol worker for GA4
2. Add Sanity actions to send lifecycle events
3. Test with a few leads

**Phase 3 (Full Automation - 4-6 hours):**
1. Set up Google Ads API access
2. Create Google Ads conversion worker
3. Implement OAuth token management
4. Add automated conversion sending from Sanity

**Phase 4 (Advanced - Future):**
1. Add email integration (Zapier/Make)
2. Auto-qualify leads based on criteria
3. Build Sanity dashboard with lead metrics

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
3. Find your events: `generate_lead` and `phone_click`
4. Toggle **"Mark as key event"** for each event

**Note**: The `generate_lead` event is a GA4 Recommended Event that automatically populates Business Objectives reports.

### Create Custom Conversion Events (Optional)
1. **Admin → Events → Create event**
2. Examples:
   - **Event name**: `qualified_lead`
   - **Matching conditions**:
     - event_name equals generate_lead
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
   - `generate_lead` events
   - `phone_click` events
3. Click on events to see parameters and attribution data

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
1. **Lead Generation Performance**:
   - Dimension: form_name, form_type, campaign_source
   - Metrics: Event count, Users
   - Filter: event_name = generate_lead
   - **Shows**: Which campaigns drive form submissions

2. **Phone Engagement**:
   - Dimension: link_location, link_text
   - Metrics: Event count, Users
   - Filter: event_name = phone_click

3. **Attribution Analysis**:
   - Dimension: campaign_source, campaign_medium, campaign_name, campaign_term
   - Metrics: generate_lead events, conversion rate
   - **Shows**: Which marketing channels and keywords drive leads

### Recommended Audiences
1. **High-Intent Users**:
   - Include users who triggered generate_lead OR phone_click

2. **Event Planners**:
   - Include users where form_type = event_inquiry

3. **Engaged Visitors**:
   - Include users with 2+ phone_click events

4. **Google Ads Leads**:
   - Include users where utm_source = google AND utm_medium = cpc

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
2. Use consistent event naming (`generate_lead`)
3. Add appropriate form_name and form_type values
4. **Include attribution data from localStorage** in the submission
5. Update this documentation

**Code template for new forms:**
```javascript
// Read attribution data from localStorage
const attribution = {
  utm_source: localStorage.getItem('utm_source') || undefined,
  utm_medium: localStorage.getItem('utm_medium') || undefined,
  utm_campaign: localStorage.getItem('utm_campaign') || undefined,
  utm_term: localStorage.getItem('utm_term') || undefined,
  utm_content: localStorage.getItem('utm_content') || undefined,
  gclid: localStorage.getItem('gclid') || undefined,
  fbclid: localStorage.getItem('fbclid') || undefined,
  lead_source: localStorage.getItem('lead_source') || 'Direct',
  referrer: localStorage.getItem('referrer') || undefined,
  landing_page: localStorage.getItem('landing_page') || undefined
};

// Push to dataLayer with generate_lead event
window.dataLayer.push({
  event: 'generate_lead',
  form_name: 'your_form_name',
  form_type: 'your_form_type',
  form_destination: '/api/submit-form',
  event_category: 'engagement',
  event_label: 'Your Form Name',
  // Attribution data
  utm_source: attribution.utm_source,
  utm_medium: attribution.utm_medium,
  utm_campaign: attribution.utm_campaign,
  utm_term: attribution.utm_term,
  utm_content: attribution.utm_content,
  gclid: attribution.gclid,
  fbclid: attribution.fbclid,
  lead_source: attribution.lead_source,
  referrer: attribution.referrer,
  landing_page: attribution.landing_page
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
   - Metrics: generate_lead events, Users, Key Events
   - Filter: event_name = generate_lead
   - **Use Case**: See which campaigns drive the most leads

2. **Keyword Performance** (for paid search):
   - Dimensions: campaign_term, campaign_source
   - Metrics: generate_lead events, Cost per conversion
   - Filter: campaign_medium = cpc
   - **Use Case**: Optimize Google Ads keyword bidding

3. **Landing Page Analysis**:
   - Dimensions: landing_page, campaign_source
   - Metrics: generate_lead events, Conversion rate
   - **Use Case**: Shows which pages convert best by source

4. **Lead Source Breakdown**:
   - Dimensions: lead_source, form_type
   - Metrics: generate_lead events
   - **Use Case**: Quick overview of where leads come from

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