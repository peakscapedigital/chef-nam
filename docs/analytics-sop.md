# Chef Nam Analytics SOP

## Quick Reference: The Analytics Ecosystem

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           YOUR ANALYTICS STACK                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│    WEBSITE                    GTM                         DESTINATIONS          │
│  ┌─────────────┐         ┌─────────────┐                                       │
│  │ User visits │ ──────▶ │   Google    │ ────────┬─────▶ GA4 (Analytics)       │
│  │  website    │         │     Tag     │         │                              │
│  │             │         │   Manager   │         │       - Reports              │
│  │ - Clicks    │         │             │         │       - Key Events           │
│  │ - Forms     │         │ GTM-WCMPN842│         │       - Business Objectives  │
│  │ - Phone     │         │             │         │       - Audiences            │
│  └─────────────┘         │ Routes data │         │                              │
│                          │ to multiple │         └─────▶ Google Ads             │
│                          │ destinations│                                        │
│                          └─────────────┘                 - Conversion Tracking  │
│                                 │                        - Bidding Optimization │
│                                 │                        - ROAS Measurement     │
│                                 ▼                                               │
│                          ┌─────────────┐                                        │
│                          │  BigQuery   │ ◀──────── Lead-level ROI              │
│                          │   (Your     │          (joins ad spend to revenue)   │
│                          │   custom)   │                                        │
│                          └─────────────┘                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Understanding the Terminology (2024-2026 Changes)

### The Big Rename: Conversions → Key Events

In **March 2024**, Google renamed "Conversions" to "Key Events" in GA4. This caused massive confusion because:

| OLD Term (Pre-March 2024) | NEW Term (March 2024+) | Where It Applies |
|---------------------------|------------------------|------------------|
| Conversion | **Key Event** | GA4 only |
| Conversion | **Conversion** | Google Ads (unchanged) |

**Why the change?**
- GA4 "conversions" used different attribution than Google Ads "conversions"
- This caused confusion when comparing numbers between the two
- Now: GA4 has "Key Events" and only Google Ads has "Conversions"

### Current Terminology

| Term | What It Means | Where You See It |
|------|---------------|------------------|
| **Event** | Any tracked action (page view, click, scroll, etc.) | GA4 → Events |
| **Key Event** | An important event you've marked for tracking | GA4 → Events → "Mark as key event" |
| **Conversion** | An action tracked in Google Ads for bidding | Google Ads → Conversions |
| **Recommended Event** | Google's standard events with special features | `generate_lead`, `purchase`, etc. |

---

## Your Current Setup

### What's Working

1. **GTM Container**: GTM-WCMPN842 (installed correctly)
2. **GA4 Property**: Receiving data (see your screenshot)
3. **Attribution Tracking**: Capturing UTM, GCLID, referrers (recently fixed)
4. **Form Tracking**: Pushing `generate_lead` events
5. **Phone Tracking**: Pushing `phone_click` events
6. **BigQuery**: Storing leads with full attribution for ROI

### What Shows in Your Screenshot

Your GA4 Reports Snapshot shows:
- **229 Active Users** / **226 New Users** - Good engagement
- **37s Average Engagement** - Users spending time on site
- **267 Sessions** from multiple sources:
  - google/cpc: 127 sessions (Google Ads - your "Catering" campaign)
  - direct/none: 71 sessions (Direct traffic)
  - google/organic: 60 sessions (Organic search)
  - bing/organic: 5 sessions
  - chatgpt.com: 1 session (interesting!)

**Key Events**: 5 (google/cpc), 4 (direct), 2 (google/organic)
- These are your form submissions (generate_lead events)

---

## Three Levels of Tracking

### Level 1: GA4 (Aggregate Analytics)
**Purpose**: Understand overall website performance and user behavior

**What it answers:**
- How many visitors came to my site?
- Which pages are most popular?
- What's my overall conversion rate?
- Which traffic sources drive the most visits?

**Limitations:**
- Shows aggregate data, not individual leads
- Can't calculate true ROI without linking to revenue
- Attribution is session-based, not lead-level

### Level 2: Google Ads (Campaign Optimization)
**Purpose**: Optimize ad spend and bidding automatically

**What it answers:**
- Which keywords drive conversions?
- What's my cost per conversion?
- Should I increase/decrease bids?

**How to set up properly:**
1. Create conversion actions in Google Ads directly (not just import from GA4)
2. Track both online (form) and offline (booking) conversions
3. Send actual booking values for value-based bidding

### Level 3: BigQuery (Lead-Level ROI)
**Purpose**: Calculate true ROI by joining ad spend to actual revenue

**What it answers:**
- Which specific campaigns drove profitable bookings?
- What's my true cost per acquired customer?
- Which keywords have the best ROAS?

**You have this**: The system we built stores every lead with full attribution and booking values.

---

## GA4 Business Objectives Setup

The "Business Objectives" collection in GA4 provides tailored reports. Here's how to configure it for lead generation:

### Step 1: Enable Business Objectives Collection

1. Go to **GA4 → Reports → Library** (bottom left)
2. Look for "Business objectives" card
3. Click the three dots → **Publish**
4. If you don't see it, click **Create new collection** → Select **Business Objectives**

### Step 2: Configure "Generate Leads" Section

You should now see these reports under Business Objectives:
- **Generate leads** → Lead Acquisition
- **Drive sales** (may not apply to you)
- **View user engagement & retention**

### Step 3: Mark Key Events

Go to **GA4 → Admin → Events** and ensure these are marked as key events:

| Event Name | Mark as Key Event | Purpose |
|------------|-------------------|---------|
| `generate_lead` | ✅ Yes | Form submissions |
| `phone_click` | ✅ Yes | Phone number clicks |
| `qualify_lead` | ✅ Yes (when implemented) | Lead qualified |
| `convert_lead` | ✅ Yes (when implemented) | Lead becomes booking |

### Step 4: Create Custom Dimensions (for attribution)

Go to **GA4 → Admin → Custom definitions → Create custom dimensions**:

| Dimension Name | Scope | Event Parameter |
|----------------|-------|-----------------|
| Lead Source | Event | lead_source |
| Landing Page | Event | landing_page |
| UTM Campaign | Event | campaign_name |
| UTM Term | Event | campaign_term |

This enables filtering/grouping by these values in reports.

---

## Google Ads Conversion Tracking

### Why You Have Multiple Conversions

When you linked GA4 to Google Ads, it may have created additional conversion actions. Here's how to clean this up:

### Audit Your Conversion Actions

1. Go to **Google Ads → Goals → Conversions → Summary**
2. You'll see all conversion actions listed
3. Look for duplicates like:
   - "generate_lead" (from GA4)
   - "Form Submission" (if you created one manually)
   - "Website Lead" (if auto-created)

### Recommended Setup

For a lead generation business like catering, you want:

| Conversion Action | Source | Count | Value | Use for Bidding |
|-------------------|--------|-------|-------|-----------------|
| Form Submission | GTM/Website | Every | $0 | Primary |
| Phone Call Click | GTM/Website | Every | $0 | Primary |
| Qualified Lead | Offline Import | Every | $500 | Secondary |
| Booking (Won) | Offline Import | Every | Actual | Primary |

### How to Set Up Properly

**Option A: Track via GTM (Real-time)**
1. Create conversion action in Google Ads
2. Get the Conversion ID and Label
3. Create GTM tag that fires on form submission
4. This tracks the initial lead

**Option B: Import from GA4 (Simple but Less Accurate)**
1. Link GA4 to Google Ads (Admin → Product Links)
2. In Google Ads, go to Conversions → Import
3. Select GA4 key events to import
4. Note: Can underreport by 10-20%

**Option C: Offline Conversion Import (Best for Actual Bookings)**
1. Create "Booking - Offline" conversion action
2. Upload GCLID + booking value when lead converts
3. This is what your BigQuery system enables

### Recommended Configuration

For Chef Nam, I recommend:
1. **Keep GA4-imported `generate_lead`** for initial form tracking
2. **Create a manual "Booking" conversion** for offline import
3. **Set bidding to optimize for "Booking"** conversions once you have enough data

---

## The Advertising Section in GA4

You mentioned GA4 has an "Advertising" section. Here's what it does:

### What It Shows

**Advertising → All channels**: Shows conversions by marketing channel
**Advertising → Model comparison**: Compare different attribution models
**Advertising → Conversion paths**: See the journey before conversion

### Why It Created a New Conversion

When you link GA4 to Google Ads, GA4 imports Google Ads conversion data. This can create confusion because:

1. GA4 key events ≠ Google Ads conversions (different attribution)
2. You might see the same action counted differently
3. GA4's Advertising section shows Google Ads data

### How to Interpret

- **Business Objectives → Generate Leads**: Shows GA4 key events (form submissions)
- **Advertising section**: Shows how Google Ads sees conversions

**Best practice**: Use Business Objectives for understanding leads, use Advertising section for campaign optimization insights.

---

## Daily/Weekly Workflow

### Daily (5 minutes)
1. Check email notifications for new leads (includes attribution)
2. Update lead status in BigQuery admin (/admin/leads)

### Weekly (15 minutes)
1. **GA4 → Reports → Realtime**: Verify events are firing
2. **GA4 → Business Objectives → Generate leads**: Check lead volume by source
3. **Google Ads → Campaigns**: Check cost per conversion trend
4. **BigQuery Admin**: Update lead statuses, enter booking values for won deals

### Monthly (30 minutes)
1. **ROI Analysis**: Run BigQuery reports to see actual ROI by campaign
2. **GA4 → Explore**: Build custom report on lead sources
3. **Google Ads**: Send offline conversions (bookings) back to Google Ads
4. **GTM → Preview**: Test that all tags fire correctly

---

## Troubleshooting Common Issues

### Issue: Numbers Don't Match Between GA4 and Google Ads

**Why**: Different attribution models and timing
- GA4: Session-based, includes all traffic
- Google Ads: Click-based, only ad traffic

**Solution**: Don't expect them to match. Use GA4 for overall analytics, Google Ads for campaign optimization.

### Issue: Key Events Show $0 Revenue

**Why**: You're tracking leads, not purchases with values
**Solution**: This is expected. For revenue tracking, you'd need to send the booking value with a `convert_lead` event (future enhancement).

### Issue: "Data not available" Showing Up

**Why**: Users have ad blockers or privacy settings
**Solution**: Normal and expected (typically 5-15% of traffic). Can't fix this.

### Issue: Duplicate Conversions

**How to check**: Google Ads → Conversions → check for multiple actions counting same thing
**Solution**: Edit conversion settings → set one to "Primary" and others to "Secondary"

---

## Integration Diagram

```
WEBSITE VISITOR
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  Page Load (Layout.astro)                                    │
│  ├─ Capture attribution (UTM, GCLID, referrer)              │
│  ├─ Store in localStorage                                    │
│  └─ Initialize dataLayer for GTM                             │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  User Submits Form                                           │
│  ├─ Push generate_lead event to dataLayer                   │
│  ├─ Include all attribution data                             │
│  ├─ POST to /api/submit-form                                 │
│  │      ├─ Store in BigQuery (leads table)                   │
│  │      ├─ Store in Sanity CMS                               │
│  │      └─ Send email notification                           │
│  └─ Redirect to /thank-you                                   │
└──────────────────────────────────────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────────────────────────────┐
│  GTM Processes Event                                         │
│  ├─ generate_lead trigger fires                              │
│  ├─ GA4 Event Tag sends to Google Analytics                 │
│  └─ Google Ads Conversion Tag sends to Google Ads (if set up)│
└──────────────────────────────────────────────────────────────┘
       │
       ├─────────────────────┬─────────────────────────────────┐
       ▼                     ▼                                 ▼
┌──────────────┐     ┌──────────────┐               ┌──────────────┐
│     GA4      │     │  Google Ads  │               │   BigQuery   │
│              │     │              │               │              │
│ Key Events   │     │ Conversions  │               │ leads table  │
│ Reports      │     │ Bidding      │               │ Full ROI     │
│ Audiences    │     │ Optimization │               │ Attribution  │
└──────────────┘     └──────────────┘               └──────────────┘
```

---

## Next Steps / Recommendations

### Immediate (Today)
1. ✅ Verify Business Objectives collection is published in GA4
2. ✅ Check that `generate_lead` and `phone_click` are marked as key events
3. ✅ Review Google Ads conversion actions for duplicates

### This Week
1. Create custom dimensions in GA4 for lead_source, landing_page
2. Set up a Google Ads-native conversion tag in GTM (in addition to GA4 import)
3. Configure offline conversion import for bookings

### This Month
1. Build the Google Ads offline conversion helper (send booking values back)
2. Create GA4 Explore report for lead source analysis
3. Set up monthly ROI reporting from BigQuery

---

## Quick Reference Links

- **GTM Container**: https://tagmanager.google.com (GTM-WCMPN842)
- **GA4 Property**: https://analytics.google.com (Chef Nam Catering)
- **Google Ads**: https://ads.google.com
- **BigQuery Admin**: https://chefnamcatering.com/admin/leads
- **Detailed Conversion Tracking Doc**: /docs/conversion-tracking.md

---

## Glossary

| Term | Definition |
|------|------------|
| **Attribution** | Identifying which marketing source gets credit for a conversion |
| **Data Layer** | JavaScript object that passes data from website to GTM |
| **GCLID** | Google Click ID - unique identifier for each Google Ads click |
| **Key Event** | GA4's term for important tracked actions (formerly "conversions") |
| **Measurement Protocol** | API to send events to GA4 from server/offline sources |
| **ROAS** | Return on Ad Spend (revenue / ad cost) |
| **UTM** | Urchin Tracking Module - URL parameters for campaign tracking |

---

*Last Updated: January 16, 2026*
*Version: 1.0*
