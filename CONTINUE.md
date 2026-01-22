# Continue: Chef Nam Website & CRM

## Context

This is the **chefnamcatering.com** website and lead management system. The site is an Astro static site deployed to Cloudflare Pages, with a lead capture form that writes to BigQuery (analytics) and Firestore (CRM).

**Key components:**
- **Website**: Astro + Cloudflare Pages
- **Form submission**: Astro API route (`src/pages/api/submit-form.ts`)
- **Analytics**: BigQuery (`chef-nam-analytics.leads.website_leads`)
- **CRM data**: Firestore (`chef-nam-analytics` project, `leads` collection)
- **CRM app**: Retool Mobile (free plan)

---

## Current State (2026-01-22)

### What's Working

**Website & Form Submission**
- Astro site deployed to Cloudflare Pages
- Multi-step form at `/start-planning`
- Form submits to Astro API route → Cloudflare Worker
- Worker writes to BigQuery AND Firestore
- Spam detection (honeypot + mixed case heuristics)
- Email notifications via Resend

**BigQuery (Source of Truth)**
- 39 leads total (non-spam, non-test)
- All form fields captured
- Attribution data (UTM, gclid, ga_client_id)
- Views for analytics: `lead_response_time`, `lead_current_status`, etc.

**Firestore (CRM Operations)**
- 39 leads synced from BigQuery
- 20 fields per lead including all event details (fixed 2026-01-22)
- Dates in ISO format

**Retool Mobile CRM**
- List view with status filter dropdown
- Detail view with editable status, notes, booking_value
- Sorted by created_at descending (newest first)
- Dates formatted MM/DD/YYYY h:mm a
- Connected to Firestore via ChefNamFirestore resource

### What's NOT Working / Limitations

**Push Notifications**
- Retool Mobile push notifications require Business plan ($65/user/month)
- Not available on free plan despite some documentation suggesting otherwise

**Firestore → BigQuery Sync**
- Firebase extension installed but changelog table may not be populating correctly
- Views depend on `lead_status_changelog_raw_changelog` table
- Need to verify this is working

---

## Architecture

```
[Website Form]
      │
      ▼
[Cloudflare Worker: submit-form.ts]
      │
      ├──► BigQuery (source of truth)
      │    - All form fields
      │    - Attribution data
      │    - Spam/test flags
      │
      └──► Firestore (CRM operations)
           - Subset of fields for CRM
           - Status, notes, booking_value editable
           │
           ▼
      [Retool Mobile App]
           - View/filter leads
           - Update status, notes, booking_value
           - Changes write back to Firestore
```

**Data Flow for Status Updates:**
1. User updates status in Retool → Firestore updated
2. Firebase extension streams changes to BigQuery changelog
3. BigQuery views join changelog with website_leads for current status

---

## Key Files

**Form Submission:**
- `src/pages/api/submit-form.ts` - Astro API route handling form submission
- `src/lib/bigquery.ts` - BigQuery REST API client
- `src/lib/firestore.ts` - Firestore REST API client
- `src/components/forms/StartPlanningForm.astro` - Full planning form component
- `src/components/forms/ContactForm.astro` - Short homepage form

**Scripts:**
- `scripts/fix-all-firestore-leads.ts` - Rebuild all Firestore docs from BigQuery (use for backfills)
- `scripts/bigquery-views.sql` - BigQuery views for analytics

**Credentials (not in repo):**
- BigQuery: `~/Downloads/chef-nam-analytics-59584e2e7603.json`
- Firebase: `~/Downloads/chef-nam-analytics-firebase-adminsdk-fbsvc-44254e4f5d.json`

---

## Environment Variables

**Cloudflare Worker (production):**
```
BIGQUERY_PROJECT_ID=chef-nam-analytics
BIGQUERY_CREDENTIALS=<base64 encoded service account JSON>
FIREBASE_CREDENTIALS=<base64 encoded service account JSON>
RESEND_API_KEY=<resend API key>
TURNSTILE_SECRET_KEY=<cloudflare turnstile secret>
```

**Local scripts:**
```bash
BIGQUERY_PROJECT_ID=chef-nam-analytics \
BIGQUERY_CREDENTIALS=$(cat ~/Downloads/chef-nam-analytics-59584e2e7603.json) \
FIREBASE_CREDENTIALS=$(cat ~/Downloads/chef-nam-analytics-firebase-adminsdk-fbsvc-44254e4f5d.json) \
npx tsx scripts/<script-name>.ts
```

---

## Retool Mobile App

**App name:** Chef Nam CRM (or similar)

**Screens:**
1. **Main List** - CollectionView of leads with status filter
2. **Detail View** - Shows lead info, editable status/notes/booking_value

**Queries:**
- `getLeads` - Firestore query to get all leads
- `updateLead` - Firestore update for status, notes, booking_value

**Key bindings:**
- collectionView1 Data: `{{ (statusFilter.value === 'all' ? getLeads.data : getLeads.data.filter(lead => lead.status === statusFilter.value)).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) }}`
- Date formatting: `{{ moment(item.created_at).format('MM/DD/YYYY h:mm a') }}`
- Status dropdown default: `{{ selectedItem.value.status }}`

---

## Next Steps

### 1. Push Notifications (Pending Decision)

**Options evaluated:**
- ❌ Retool push notifications - Requires Business plan
- ❌ Custom Expo app - Overkill for 2 users
- ✅ **ntfy.sh** - Free, simple, works with Cloudflare Worker

**To implement ntfy:**
1. Chef Nam + you install ntfy app (iOS/Android)
2. Subscribe to topic: `chefnam-leads-<secret>`
3. Add to submit-form.ts after successful writes:
```javascript
await fetch('https://ntfy.sh/chefnam-leads-<secret>', {
  method: 'POST',
  body: `New lead: ${firstName} ${lastName} - ${eventType || 'General inquiry'}`
});
```

### 2. Verify Firestore → BigQuery Sync

Check if `lead_status_changelog_raw_changelog` table is being populated when status changes in Retool.

### 3. Publish Retool App

App is ready - needs to be shared with Chef Nam via Retool's share functionality.

---

## Common Tasks

### Rebuild Firestore from BigQuery
```bash
BIGQUERY_PROJECT_ID=chef-nam-analytics \
BIGQUERY_CREDENTIALS=$(cat ~/Downloads/chef-nam-analytics-59584e2e7603.json) \
FIREBASE_CREDENTIALS=$(cat ~/Downloads/chef-nam-analytics-firebase-adminsdk-fbsvc-44254e4f5d.json) \
npx tsx scripts/fix-all-firestore-leads.ts
```

### Check Lead Counts
```sql
-- BigQuery
SELECT COUNT(*) FROM `chef-nam-analytics.leads.website_leads`
WHERE is_spam = FALSE AND is_test = FALSE;
```

### Deploy Website
```bash
# Commits to main auto-deploy via Cloudflare Pages
git add . && git commit -m "message" && git push
```

---

## Known Issues

1. **Profile screen** in Retool shows logged-in Retool user, not Chef Nam's business info (this is expected behavior)

2. **Firestore dates** were showing "Invalid date" - fixed by using ISO format in BigQuery query

3. **6 leads had NULL is_spam/is_test** - fixed with BigQuery UPDATE statements

---

## Recent Fixes

### 2026-01-22: Firestore Missing Event Fields

**Problem:** Retool CRM was showing empty fields for event_type, event_time, location, service_style, budget_range, message, preferred_contact.

**Root cause:** Changes to `src/lib/firestore.ts` that added event detail fields were never committed to Git. The deployed code was writing minimal fields only.

**Fix:**
1. Committed firestore.ts changes (adds 9 event detail fields)
2. Pushed to GitHub → Cloudflare auto-deployed
3. Ran `scripts/fix-all-firestore-leads.ts` to backfill all 39 existing leads

**Firestore now has 20 fields per lead:**
- Core: lead_id, name, email, phone, status, notes, booking_value, created_at, updated_at
- Event: preferred_contact, event_date, event_time, event_type, guest_count, location, service_style, budget_range, dietary_requirements, message, event_description

---

## Related Projects

- `/Workspace/seo-tools` - SEO competitive intelligence (uses chefnamcatering.com as test subject)
