# Conversion Tracking Implementation Guide

## Overview
This document outlines the conversion tracking implementation for Chef Nam Catering website, including form submissions and phone click tracking through Google Tag Manager (GTM) and Google Analytics 4 (GA4).

## Prerequisites
- Google Tag Manager container installed (GTM-WCMPN842)
- Google Analytics 4 property configured
- Access to GTM workspace
- Access to GA4 property

## 1. Form Submission Tracking

### Implementation (Code Side)
Form submission tracking is implemented in two key forms:
- **Start Planning Form** (`/start-planning`)
- **Contact Form** (`/contact`)

#### DataLayer Push Events
When a form is successfully submitted, the following event is pushed to the dataLayer:

```javascript
window.dataLayer.push({
  'event': 'form_submit',
  'form_name': 'start_planning' | 'contact',
  'form_destination': '/api/submit-form',
  'form_type': 'event_inquiry' | 'general_inquiry' | 'contact_inquiry',
  'event_category': 'engagement',
  'event_label': 'Start Planning Form' | 'Contact Form',
  'value': guestCount || 0  // For event forms only
});
```

### GTM Configuration

#### 1. Create Custom Event Trigger
- **Name**: Form Submit Event
- **Trigger Type**: Custom Event
- **Event name**: `form_submit`
- **This trigger fires on**: All Custom Events

#### 2. Create Data Layer Variables
Navigate to Variables → User-Defined Variables → New:

| Variable Name | Type | Data Layer Variable Name |
|--------------|------|-------------------------|
| dlv - form_name | Data Layer Variable | form_name |
| dlv - form_type | Data Layer Variable | form_type |
| dlv - form_destination | Data Layer Variable | form_destination |
| dlv - event_label | Data Layer Variable | event_label |

#### 3. Create GA4 Event Tag
- **Tag Type**: Google Analytics: GA4 Event
- **Configuration Tag**: [Select your GA4 Configuration]
- **Event Name**: `form_submit`
- **Event Parameters**:
  - form_name: {{dlv - form_name}}
  - form_type: {{dlv - form_type}}
  - form_destination: {{dlv - form_destination}}
  - event_label: {{dlv - event_label}}
- **Triggering**: Form Submit Event

### Form Types Reference
| Form Name | Form Type | Description |
|-----------|-----------|-------------|
| start_planning | event_inquiry | User has a specific event |
| start_planning | general_inquiry | User doesn't have event yet |
| contact | contact_inquiry | General contact form |

## 2. Phone Click Tracking

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

### Email Events (Future Enhancement)
Consider tracking:
- Email sent confirmations
- Email delivery status
- Email open rates (if using tracking pixels)

## 7. Maintenance & Updates

### Adding New Forms
When adding new forms to the site:
1. Include the dataLayer.push code on successful submission
2. Use consistent event naming (`form_submit`)
3. Add appropriate form_name and form_type values
4. Update this documentation

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
- **Form Tracking**: 
  - `/src/pages/start-planning.astro` (lines 639-650)
  - `/src/pages/contact.astro` (lines 315-325)
- **Phone Tracking**: 
  - `/src/layouts/Layout.astro` (lines 96-125)
- **Email Worker**: 
  - `/email-worker/src/index.js`
  - `/src/pages/api/submit-form.ts`

### Environment Variables
- `RESEND_API_KEY`: Email service API key (set in Cloudflare Worker)
- `SANITY_API_TOKEN`: CMS write access token
- `SANITY_PROJECT_ID`: yojbqnd7

---

*Last Updated: August 19, 2025*
*Version: 1.0*