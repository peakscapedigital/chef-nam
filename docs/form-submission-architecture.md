# Form Submission Architecture

> Complete documentation of the lead capture and data pipeline for Chef Nam Catering website.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              USER JOURNEY                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  1. User lands on site (UTM/gclid captured → localStorage)                  │
│  2. User fills form (ContactForm or StartPlanningForm)                      │
│  3. Form submits to /api/submit-form                                        │
│  4. API validates, writes to BigQuery + Firestore, sends emails             │
│  5. User redirected to /thank-you                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Form Submit                                                                 │
│       ↓                                                                      │
│  /api/submit-form.ts                                                         │
│       │                                                                      │
│       ├──→ Spam Detection (honeypot + mixed case)                           │
│       │         ↓ (if spam: return fake success, stop)                      │
│       │                                                                      │
│       ├──→ Contact Lookup (BigQuery: leads.contacts)                        │
│       │         ↓                                                            │
│       │    [Existing?] → Update contact (increment lead count)              │
│       │    [New?]      → Create contact record                              │
│       │                                                                      │
│       ├──→ BigQuery Insert (leads.website_leads)                            │
│       │         • Full lead data + all attribution fields                   │
│       │         • SHA256 hashes for enhanced conversions                    │
│       │         • Source of truth for analytics                             │
│       │                                                                      │
│       ├──→ Firestore Insert (leads/{lead_id})                               │
│       │         • Minimal CRM fields only                                   │
│       │         • Source of truth for operations                            │
│       │         • Syncs back to BigQuery via extension                      │
│       │                                                                      │
│       └──→ Email Worker (async)                                             │
│                 • Internal notification to Chef Nam                         │
│                 • Confirmation email to customer                            │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Files

| File | Purpose |
|------|---------|
| `src/layouts/Layout.astro` | Attribution capture script (lines 92-211) |
| `src/components/forms/ContactForm.astro` | Short homepage form |
| `src/components/forms/StartPlanningForm.astro` | Full planning form |
| `src/pages/api/submit-form.ts` | Form submission API endpoint |
| `src/lib/bigquery.ts` | BigQuery REST API client |
| `src/lib/firestore.ts` | Firestore REST API client |
| `email-worker/src/index.js` | Cloudflare Worker for email delivery |

---

## Attribution Capture

### How It Works

1. **On Page Load** (`Layout.astro`): Script checks localStorage for `_attribution_captured` flag
2. **First Visit**: Captures and stores attribution data permanently in localStorage
3. **Form Submission**: Form reads localStorage and includes attribution in payload

### Captured Fields

| Field | Source | Example |
|-------|--------|---------|
| `utm_source` | URL param | `google`, `facebook` |
| `utm_medium` | URL param | `cpc`, `organic`, `social` |
| `utm_campaign` | URL param | `spring-2025-wedding` |
| `utm_term` | URL param | `thai catering ann arbor` |
| `utm_content` | URL param | `ad-variant-a` |
| `gclid` | URL param (Google Ads auto-tag) | `CjwKCAiA...` |
| `fbclid` | URL param (Facebook auto-tag) | `IwAR3x...` |
| `ga_client_id` | `_ga` cookie | `GA1.1.123456.789` |
| `lead_source` | Derived from above | `Google Ads`, `Organic Search - Google` |
| `landing_page` | First page visited | `/services/weddings` |
| `referrer` | `document.referrer` | `https://google.com` |
| `submitted_from_url` | Current URL at submit | `/start-planning` |

### Lead Source Derivation Logic

```
Priority 1: gclid present       → "Google Ads"
Priority 1: fbclid present      → "Facebook Ads"
Priority 2: UTM params present  → Parse medium (cpc/organic/social/email)
Priority 3: Referrer exists     → Identify domain (search/social/referral)
Priority 4: Default             → "Direct"
```

---

## Form Components

### ContactForm.astro (Homepage)

**Location**: `/src/components/forms/ContactForm.astro`

**Fields**:
- firstName, lastName, email, phone, message
- Hidden: all attribution fields from localStorage
- Honeypot: `website` field (hidden, should be empty)

**Submission**: POST to `/api/submit-form` with `source: 'homepage'`

### StartPlanningForm.astro (Full Form)

**Location**: `/src/components/forms/StartPlanningForm.astro`

**Sections**:
1. **Personal Info**: firstName, lastName, email, phone, preferredContact
2. **Event Decision**: hasEvent (yes/no radio)
3. **Event Details** (if hasEvent=yes): eventType, eventDate, eventTime, guestCount, location
4. **Catering Preferences**: serviceStyle, budgetRange
5. **Special Requests**: dietaryRequirements (checkboxes), eventDescription

**Validation**:
- Required fields enforced client-side
- Honeypot field check
- Suspicious mixed case detection (spam filter)

**Submission**: POST to `/api/submit-form` with `source: 'start-planning'`

**Post-Submit**: Pushes `generate_lead` event to GA4 dataLayer

---

## API Endpoint: /api/submit-form.ts

### Request Flow

```typescript
1. Parse JSON body
2. Spam detection
   - Honeypot check (website field not empty = spam)
   - Mixed case pattern detection (>30% transitions = spam)
   - If spam: return 200 success (don't tip off bots), stop processing
3. Generate UUIDs
   - leadId = crypto.randomUUID()
   - contactId = existing or new UUID
4. Contact management
   - Query BigQuery for existing contact by email OR phone
   - If found: update contact (increment total_leads, add alternates)
   - If not found: create new contact record
5. BigQuery insert
   - Full lead data with all 40+ fields
   - SHA256 hashes of email/phone for enhanced conversions
   - Status defaults to 'new'
6. Firestore insert (if FIREBASE_CREDENTIALS configured)
   - Minimal CRM fields only (10 fields)
   - Same lead_id as BigQuery for joins
7. Email notification (async, non-blocking)
   - POST to email worker with lead data
8. Return { success: true, id: leadId }
```

### Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `BIGQUERY_PROJECT_ID` | GCP project ID (`chef-nam-analytics`) |
| `BIGQUERY_CREDENTIALS` | Base64 or raw JSON service account |
| `FIREBASE_CREDENTIALS` | Base64 or raw JSON Firebase service account |

### Error Handling

- BigQuery failure: Log error, continue (email still sends)
- Firestore failure: Log warning, continue (BigQuery is source of truth)
- Email failure: Log prominently, continue (form still succeeds)
- All failures: Return success to user (data is logged for recovery)

---

## BigQuery Schema

### Dataset: `leads`

### Table: `website_leads`

| Field | Type | Purpose |
|-------|------|---------|
| `lead_id` | STRING | Primary key (UUID) |
| `contact_id` | STRING | FK to contacts table |
| `first_name` | STRING | |
| `last_name` | STRING | |
| `email` | STRING | |
| `email_hash` | STRING | SHA256 for enhanced conversions |
| `phone` | STRING | |
| `phone_hash` | STRING | SHA256 for enhanced conversions |
| `preferred_contact` | STRING | email/phone/text |
| `has_event` | BOOL | |
| `event_type` | STRING | wedding/corporate/social/etc |
| `event_date` | DATE | |
| `event_time` | STRING | morning/lunch/afternoon/evening |
| `guest_count` | STRING | 1-10, 11-25, 26-50, etc |
| `location` | STRING | |
| `service_style` | STRING | plated/buffet/family-style/etc |
| `budget_range` | STRING | $15-25, $25-40, etc |
| `dietary_requirements` | ARRAY<STRING> | vegetarian, vegan, gluten-free, etc |
| `message` | STRING | Short form message |
| `event_description` | STRING | Full form description |
| `gclid` | STRING | Google Ads click ID |
| `ga_client_id` | STRING | GA4 client ID |
| `fbclid` | STRING | Facebook click ID |
| `utm_source` | STRING | |
| `utm_medium` | STRING | |
| `utm_campaign` | STRING | |
| `utm_term` | STRING | |
| `utm_content` | STRING | |
| `lead_source` | STRING | Derived friendly name |
| `landing_page` | STRING | |
| `referrer` | STRING | |
| `submitted_from_url` | STRING | |
| `status` | STRING | new/contacted/proposal_sent/converted/lost |
| `notes` | STRING | CRM notes |
| `booking_value` | FLOAT64 | Deal value when converted |
| `submitted_at` | TIMESTAMP | |
| `status_updated_at` | TIMESTAMP | |
| `notes_updated_at` | TIMESTAMP | |
| `won_at` | TIMESTAMP | |
| `form_source` | STRING | homepage/start-planning |
| `is_spam` | BOOL | |
| `is_test` | BOOL | Auto-detected from "test" in name/message |

### Table: `contacts`

Tracks returning customers across multiple leads.

| Field | Type | Purpose |
|-------|------|---------|
| `contact_id` | STRING | Primary key (UUID) |
| `email` | STRING | Primary email |
| `phone` | STRING | Primary phone (digits only) |
| `alternate_emails` | ARRAY<STRING> | Other emails used |
| `alternate_phones` | ARRAY<STRING> | Other phones used |
| `first_name` | STRING | |
| `last_name` | STRING | |
| `preferred_contact` | STRING | |
| `first_utm_source` | STRING | Attribution from first lead |
| `first_utm_medium` | STRING | |
| `first_utm_campaign` | STRING | |
| `first_lead_source` | STRING | |
| `first_landing_page` | STRING | |
| `first_referrer` | STRING | |
| `total_leads` | INT64 | Count of leads from this contact |
| `total_converted` | INT64 | Count of converted leads |
| `lifetime_value` | FLOAT64 | Sum of booking values |
| `first_lead_at` | TIMESTAMP | |
| `last_lead_at` | TIMESTAMP | |
| `created_at` | TIMESTAMP | |
| `updated_at` | TIMESTAMP | |

### Table: `lead_status_changelog` (Created by Firebase Extension)

Automatically populated by "Stream Firestore to BigQuery" extension.

| Field | Type | Purpose |
|-------|------|---------|
| `document_name` | STRING | `leads/{lead_id}` |
| `timestamp` | TIMESTAMP | When change occurred |
| `event_id` | STRING | Unique event ID |
| `operation` | STRING | CREATE/UPDATE/DELETE |
| `data` | STRING | JSON blob of document fields |

---

## Firestore Schema

### Collection: `leads`

Document ID: `{lead_id}` (same UUID as BigQuery)

| Field | Type | Purpose |
|-------|------|---------|
| `lead_id` | string | Join key to BigQuery |
| `name` | string | `${firstName} ${lastName}` |
| `email` | string | For display in CRM |
| `phone` | string | For display in CRM |
| `event_date` | string \| null | For sorting/filtering |
| `guest_count` | string \| null | Quick context |
| `status` | string | CRM operations (new/contacted/etc) |
| `notes` | string | CRM notes |
| `booking_value` | number \| null | Deal value |
| `created_at` | string | ISO timestamp |
| `updated_at` | string | ISO timestamp |

**Why minimal fields?** Firestore is for CRM operations only. BigQuery has full attribution data. The Firebase extension syncs Firestore changes back to BigQuery for analytics.

---

## Email Notification

### Worker Location

`email-worker/src/index.js` deployed to `https://chefnam-email-worker.jason-090.workers.dev`

### Emails Sent

1. **Internal Notification** → `nam@chefnamcatering.com` + `dspjson@gmail.com`
   - Subject: "🍽️ New Catering Inquiry from [Name]"
   - Contains: Contact info, event details, attribution data

2. **Customer Confirmation** → customer's email (BCC to Nam)
   - Subject: "Thank you for your catering inquiry, [Name]!"
   - Contains: Thank you message, event summary, next steps

### Email Provider

Resend API (API key stored in Worker environment)

---

## Analytics Integration

### Join Keys for Attribution

| Data Source | Join Key | Example Query |
|-------------|----------|---------------|
| GA4 | `ga_client_id` | Join to `analytics_501458691.events_*` on `user_pseudo_id` |
| Google Ads | `gclid` | Join to `google_ads_export` tables or upload offline conversions |
| Google Search Console | `landing_page` | Join to `searchconsole` on URL |

### Offline Conversion Flow

```
1. Lead converts in Retool (status → 'converted', booking_value set)
2. Firestore updates
3. Firebase extension syncs to BigQuery changelog
4. BigQuery view extracts gclid + conversion data
5. Upload to Google Ads via API or scheduled export
```

### Response Time Calculation

Uses the `lead_status_changelog` table to find time between:
- `submitted_at` (from BigQuery website_leads)
- First `status = 'contacted'` timestamp (from changelog)

See `scripts/bigquery-views.sql` for the exact query.

---

## Testing

### Test Submissions

Any submission with "test" in firstName, lastName, or message is flagged `is_test = TRUE` and excluded from analytics views by default.

### Spam Detection

1. **Honeypot**: Hidden `website` field must be empty
2. **Mixed Case**: Names/messages with >30% case transitions flagged as spam
3. **Spam Response**: Returns 200 success to not tip off bots, but stops processing

### Local Development

```bash
# Set environment variables
export BIGQUERY_PROJECT_ID=chef-nam-analytics
export BIGQUERY_CREDENTIALS=$(cat /path/to/service-account.json)
export FIREBASE_CREDENTIALS=$(cat /path/to/firebase-sa.json)

# Run dev server
npm run dev

# Test form at http://localhost:4321/start-planning
```

---

## Troubleshooting

### Lead not appearing in BigQuery

1. Check Cloudflare Pages logs for errors
2. Verify `BIGQUERY_CREDENTIALS` is set correctly
3. Check if marked as spam (honeypot/mixed case)
4. Check if `is_test = TRUE` (filtered from most queries)

### Lead not appearing in Firestore

1. Check if `FIREBASE_CREDENTIALS` is configured
2. Firestore write is non-blocking; BigQuery write may succeed while Firestore fails
3. Check Cloudflare logs for Firestore errors

### Email not sending

1. Check email worker logs in Cloudflare dashboard
2. Verify `RESEND_API_KEY` is set in worker environment
3. Email failures don't block form success; check logs for "EMAIL NOTIFICATION FAILED"

### Returning customer not detected

1. Contact lookup uses normalized email (lowercase) and phone (digits only)
2. Check if email/phone matches primary OR alternate fields
3. Query `leads.contacts` to verify contact exists

---

## Related Documentation

- `CLAUDE.md` - Project overview and environment setup
- `docs/image-optimization.md` - Image handling standards
- `scripts/bigquery-views.sql` - Analytics views
- `scripts/backfill-firestore.ts` - Migration script

---

*Last Updated: 2025-01-21*
