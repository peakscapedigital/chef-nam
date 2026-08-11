# Chef Nam Catering Website Project

## Project Overview
High-performance website for Chef Nam Catering, a women-owned Thai fusion catering business serving Ann Arbor, Michigan. Differentiates through authentic Thai heritage combined with American catering expertise.

## Tech Stack
- **Frontend**: Astro 6.4.x (SSR/server mode) on `@astrojs/cloudflare` v13. Migrated from Astro 5 in June 2026. Server endpoints read Cloudflare env/secrets via `import { env } from 'cloudflare:workers'` — `Astro.locals.runtime.env` was removed in Astro 6.
- **CMS**: Sanity.io (Project ID: yojbqnd7)
- **Styling**: Tailwind CSS with custom brand theme
- **Hosting**: Cloudflare Workers (Workers static assets + SSR), auto-deployed from GitHub via Actions. (Migrated off Cloudflare Pages; reconciled 2026-06-20.)
- **Email**: Cloudflare Workers + Resend API
- **Language**: TypeScript throughout
- **Analytics**: Google Tag Manager (GTM-WCMPN842)

## Live Infrastructure

### Domains & Hosting
- **Production**: https://chefnamcatering.com
- **www**: https://www.chefnamcatering.com
- **Cloudflare Worker**: `chef-nam` (prod) · `chef-nam-preview` (preview). Not a Pages project.
- **GitHub Repo**: peakscapedigital/chef-nam

### Key URLs
- **Website**: https://chefnamcatering.com
- **Sanity Studio**: https://chefnamcatering.com/admin

> There is **no standalone email worker**. `chefnam-email-worker` was never deployed and the
> send was folded into the site Worker (`src/lib/email.ts`, SYS-008) because a Worker cannot
> fetch another Worker on the same account by public URL (CF error 1042). The `email-worker/`
> directory in this repo is dead source — do not deploy it.

### Environment Variables
```bash
# Sanity CMS
SANITY_PROJECT_ID=yojbqnd7
SANITY_DATASET=production
SANITY_API_TOKEN=[stored in Cloudflare env]

# Site Config
PUBLIC_SITE_URL=https://chefnamcatering.com

# Email
RESEND_API_KEY=[Worker secret]   # transactional (lead notify + customer confirm)
BREVO_API_KEY=[Worker secret]    # marketing list

# Lead store (Google Sheet, system of record)
SHEETS_CREDENTIALS=[Worker secret]   # claude-automation SA, Editor on the Sheet

# Trello (status write-back)
TRELLO_API_KEY=[Worker secret]
TRELLO_API_TOKEN=[Worker secret]
```

All secrets are read from the `cloudflare:workers` virtual module via `serverEnv()`, not
`Astro.locals.runtime.env` (removed in Astro 6 / adapter v13). See `src/env.d.ts`.

## Lead Pipeline (system of record)

> **BigQuery + Firestore + the `/admin` dashboard were RETIRED 2026-06-30 (CN-006).**
> `src/lib/bigquery.ts` no longer exists and no `BIGQUERY_*` env var is read anywhere in
> `src/`. If you find a doc, script, or plan describing a BigQuery lead write, an
> `analytics.leads` insert, or a Supabase/marketing-crm attribution sync, that is the old
> reality — do not revive it. Canon: `systems-v2/capability-catalog.md` ("No Airtable,
> BigQuery, Looker, or warehouse is in any live path") and
> `systems-v2/conversion-tracking-standard.md:14`.

### The Google Sheet is the store of record

Lead writes go to the **Chef Nam Catering - Operations** Sheet, `Leads` tab, through the
shared kit writer (`@peakscape/site-kit/sheets` → `SheetsTable`) — the same header-name-based
writer Trombone and Sugar House use. It reads row 1 and maps by column NAME, so reordering
columns never breaks it. `create` / `get` / `update` are keyed on **Lead ID**.

- Adapter: `src/lib/sheets.ts` (thin wrapper, non-throwing `{ success, error }` helpers)
- Auth: `SHEETS_CREDENTIALS` Worker secret — the `claude-automation` SA, Editor on the Sheet
- Write path: `src/pages/api/submit-form.ts`
- Sheet-only consequence: there is **no contact-dedup / returning-customer layer**. Every
  submission gets a fresh UUID.

### Status write-back

`src/pages/api/webhooks/trello.ts` reads the GCLID from the Sheet and writes lead status
back to it. `src/lib/conversion-actions.ts` handles the Google Ads offline conversion upload.
Enhanced-conversion hashing (SHA-256 of email/phone, WebCrypto only) lives inline in
`submit-form.ts` — it was relocated there from the retired `lib/bigquery.ts`.

### What still lives in GCP `chef-nam-analytics`

The project is ACTIVE and **liened**, but the site does not write to it. It holds
platform-managed analytics exports and the automation identity:

| Dataset / resource | What it is | In the site's path? |
|---|---|---|
| `analytics_501458691` | GA4 BigQuery export (Google-managed) | No — read-only analytics |
| `google_ads_export` | Google Ads data transfer | No — read-only analytics |
| `searchconsole` | Search Console export | No — read-only analytics |
| `leads` | The RETIRED lead table | No — dead, retained data only |
| SA `claude-automation` | Default automation identity (Sheets/Drive/BQ/GTM) | Yes — mints the Sheets token |

Google Ads account: `3871181264`. Registry of record for all of the above:
`systems-v2/infrastructure-inventory.md`.

## Deployment Workflow

### Standard Deployment (GitHub Actions → Cloudflare Workers)
**PREFERRED METHOD** — push to `main`; GitHub Actions (`.github/workflows/deploy.yml`)
runs `astro check` (blocking quality gate) → `npm run build` → `wrangler deploy`, then
pushes runtime secrets to the Worker. Pushes to any non-`main` branch deploy a preview
Worker (`chef-nam-preview`) via `.github/workflows/preview.yml`. (Migrated off Cloudflare
Pages; reconciled 2026-06-20.)

```bash
# 1. Make changes and test locally
npm run dev

# 2. Commit + push (branch off main, then merge/push to main to deploy prod)
git add .
git commit -m "Description of changes

Co-Authored-By: Claude <noreply@anthropic.com>"
git push origin HEAD:main   # fast-forward main → triggers the prod deploy workflow

# 3. Watch the deploy
gh run list -R peakscapedigital/chef-nam --branch main --limit 3
```

> **NOTE (reconciled 2026-06-20):** Deploy is GitHub-Actions-driven `wrangler deploy` to the
> **Worker** `chef-nam`, NOT Cloudflare Pages. `wrangler pages …` commands and the Pages
> deployments API do not apply (the Pages project no longer exists). Doc-only commits are
> path-filtered out of the prod build. `DEPLOY.md` (project `chef-nam-website`,
> manual-wrangler-first, Pages-era) is stale — this section is authoritative.

### Manual Deployment (Only if needed)
```bash
# Build locally, then deploy the Worker
npm run build
npx wrangler deploy --name chef-nam
```

### Email Worker Deployment
**Removed.** Email sends from the site Worker (`src/lib/email.ts`) and ships with the normal
deploy above. Running `cd email-worker && npm run deploy` would publish a retired worker.

## Site Structure

### Live Pages
- `/` - Homepage
- `/about` - About Chef Nam
- `/services` - Services overview
  - `/services/corporate` - Corporate catering
  - `/services/weddings` - Wedding catering
  - `/services/social` - Social events
- `/menus` - Menus overview
  - `/menus/charcuterie` - Charcuterie boards & grazing tables
- `/graduation-catering` - Graduation catering (seasonal landing page)
- `/venues` - Venue partnerships
- `/blog` - Blog posts
  - `/blog/[slug]` - Individual blog posts
- `/start-planning` - Primary quote/contact form (lead capture)
- `/contact` - Contact page
- `/lp/catering` - Paid-search landing page
- `/thank-you` - Form submission confirmation
- `/admin` - Sanity Studio CMS (content only — blog/homepage/gallery/venue)

> `src/pages/_drafts/` (office-catering, private-parties) are unbuilt drafts, not live routes.

### Navigation Structure
- **Services** (dropdown)
  - Corporate Events
  - Weddings
  - Social Events
- **Menus** (dropdown)
  - Charcuterie Boards
- **Venues**
- **About**
- **Blog**
- **Start Planning** (CTA button)

## Content Strategy

### Target Keywords
- Primary: "Thai fusion catering Ann Arbor", "Ann Arbor catering"
- Secondary: "charcuterie board catering Ann Arbor", "wedding caterer Ann Arbor"
- Local SEO: Ann Arbor, Ypsilanti, Dexter, Saline, Washtenaw County

### Schema Markup Standards
All service/menu pages include:
- WebPage schema
- BreadcrumbList schema
- Service-specific schema (MenuItem, Offer, etc.)
- FAQPage schema (where applicable)

### Page Performance Targets
- PageSpeed Score: >95 mobile, >98 desktop
- Core Web Vitals: LCP <1.5s, FID <50ms, CLS <0.1
- Total Page Weight: <1MB

## Brand Guidelines

### Colors
- **Primary**: Deep Indigo Blue (#2C3E50) - `brand-indigo`
- **Accent**: Golden Amber (#F39C12) - `brand-amber`
- **Backgrounds**: Off White (#FFFEFA) - `brand-white`, Soft Cream (#ECF0F1) - `brand-cream`

### Typography
- **Headings**: Font Serif (Playfair Display or similar)
- **Body**: Sans-serif system font
- **Accent**: 'Caveat' cursive for special headings

### Design Patterns
- **Hero Sections**: Full-width image with gradient overlay, centered content
- **CTAs**: Golden amber buttons with hover effects
- **Cards**: White backgrounds with subtle shadows, hover states
- **Dropdowns**: White cards with amber hover states
- **Mobile**: Slide-in menu from right, backdrop blur

## Development Standards

### Code Quality
- TypeScript strict mode (no `any` types)
- Component single responsibility
- Performance-first: static by default
- SEO-first: meta tags, structured data, semantic HTML

### Critical: Research-First Approach
**WHEN IN DOUBT, RESEARCH FIRST. DO NOT MAKE AD HOC CHANGES.**

This is a **LIVE PRODUCTION SITE**. Always follow this protocol:

1. **Research Before Implementing**
   - Use WebSearch to find official documentation and best practices
   - Search for framework-specific solutions (e.g., "Astro trailing slash configuration")
   - Look for known issues on GitHub, Stack Overflow, community forums
   - Verify solutions are current (2024-2025) and apply to our tech stack

2. **Verify Before Deploying**
   - Test configuration changes locally with `npm run build` and `npm run preview`
   - Check live URLs with `curl -I` to understand current behavior
   - Verify which URLs return 200 vs 404 vs redirects
   - Test one change at a time, never batch multiple risky changes

3. **Framework-Native Solutions First**
   - Prefer framework configuration (Astro config) over workarounds (_redirects, middleware)
   - Check official documentation for built-in solutions
   - Understand how the framework handles the issue before adding custom code

4. **Never Assume**
   - Don't assume URLs exist at a certain path without testing
   - Don't assume redirects work a certain way without verifying
   - Don't assume framework behavior without reading docs
   - Don't deploy untested changes to production

5. **Examples of When to Research**
   - SEO issues (canonical tags, sitemaps, redirects)
   - Configuration changes (build settings, adapter options)
   - Framework-specific features (routing, SSR, trailing slashes)
   - Infrastructure changes (Cloudflare, deployment, caching)
   - Any issue that could break live pages

**If you're not 100% certain of the solution, STOP and research. Breaking a live production site is unacceptable.**

### Naming Conventions
- **Components**: PascalCase (`ServiceCard.astro`)
- **Files**: kebab-case (`service-card.astro`)
- **Variables**: camelCase (`serviceData`)
- **CSS Classes**: Tailwind utility classes

### Image Optimization
**Full standards documented in `/docs/image-optimization.md`**

Key requirements:
- **Hero images**: Must use responsive srcset with 3 sizes (640, 1024, 1920px)
- **ServiceHero component**: Always use `responsiveImages` prop + preload link
- **File naming**: `{name}-{width}.jpg` (e.g., `wedding-hero-640.jpg`)
- **Target sizes**: Hero mobile <60KB, desktop <300KB
- **No external images** for above-fold/LCP content (self-host instead)
- Set `loading="eager"` + `fetchpriority="high"` for hero only
- Set `loading="lazy"` for all below-fold images

Quick optimization command:
```bash
magick {source}.jpg -quality 85 -resize 640x -strip {name}-640.jpg
magick {source}.jpg -quality 85 -resize 1024x -strip {name}-1024.jpg
magick {source}.jpg -quality 85 -resize 1920x -strip {name}-1920.jpg
```

### Git Commit Format
```
Short description of changes (imperative mood)

- Bullet point details of what changed
- Include technical specifics
- Reference file paths when relevant

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

## Key Integrations

### Forms & Lead Tracking
- Form submissions → `/api/submit-form`, which fans ONE lead out to **3** destinations, in
  this order (see `src/pages/api/submit-form.ts`):
  1. **Google Sheet** (`Leads` tab, `LEADS_SHEET_ID` in `src/lib/sheets.ts`) — the system of
     record. Written first; everything else is downstream.
  2. **Trello card** — Nam's pipeline kanban (with LEAD_ID + LEAD_RECEIVED custom fields)
  3. **Brevo** contact — email lifecycle
- **BigQuery and Firestore are NOT destinations.** Both were retired 2026-06-30 (CN-006)
  along with the `/admin/leads` dashboard. The old note that BigQuery was "required" and that
  "submit-form 500s without it" was wrong as of that retirement — `src/lib/bigquery.ts` no
  longer exists and no `BIGQUERY_*` secret is read. Sanity is content/CMS only, never leads.
- **Consequence of Sheet-only:** no contact dedup and no returning-customer detection. Every
  submission gets a fresh UUID. That model was never re-implemented on the Sheet.
- **Trello card movement → Sheet** (`src/pages/api/webhooks/trello.ts`): moving a card
  between lists updates the Sheet Status + stage timestamp; setting a Trello custom field
  (e.g. Order Amount) writes to the Sheet column; also syncs status to Brevo and fires
  the lifecycle conversions. Trello is the human UI; the Sheet is the record.
- Email notifications via Resend API (Cloudflare Worker)
- Lead lifecycle + booking events → GA4 (Measurement Protocol) + Google Ads OCI, fired
  server-side from the Trello webhook via the kit `recordLeadEvent`
  (`@peakscape/site-kit/analytics`, ≥v0.16.3). Canonical funnel (shared with SH via the
  kit `STAGE_TO_LEAD_EVENT`): **"Qualified (Customer Respond)" list → `working_lead`**
  (first two-way reply, GA4-only); **Quote Amount set → `qualify_lead`** + Ads
  Lead_Qualified (the quote is the qualifying act); **Order Amount set →
  `close_convert_lead`** + Ads Purchase; **Lost → `close_unconvert_lead`**; **No Response
  → `disqualify_lead`**. The legacy bespoke routes `send-lead-event.ts` /
  `send-google-ads-conversion.ts` + the Sanity lead-CRM Studio actions were retired
  2026-06-21 (SH-014). No sGTM — client-side is a standard GTM web container
- UTM tracking + GCLID capture for attribution
- Google Ads conversion tracking (offline conversions via GCLID)

### Analytics Stack
- Google Tag Manager (GTM-WCMPN842)
- Google Analytics 4
- Google Ads conversion tracking
- UTM parameter tracking
- Lead source attribution

## Documentation Structure

### Organized Documentation
```
/docs/           # Reference materials
  - seo.md
  - architecture.md
  - design.md
/instructions/   # Behavioral rules
  - seo.instructions.md
  - development.instructions.md
  - design.instructions.md
/specs/          # Implementation specs
  - seo.spec.md
  - architecture.spec.md
  - design.spec.md
```

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Deployment (Cloudflare Workers via GitHub Actions)
git push origin HEAD:main                                  # prod deploy (deploy.yml: astro check → build → wrangler deploy)

# Check deploys
gh run list -R peakscapedigital/chef-nam --branch main --limit 3
npx wrangler deployments list --name chef-nam              # if wrangler auth is live

# Image optimization
magick convert input.jpg -quality 85 -resize 1920x1080^ -gravity center -extent 1920x1080 output.jpg
```

## Project Preferences

- **Production-grade solutions only** - No mock setups or simple tests
- **Auto-deployment preferred** - Push to GitHub, let Cloudflare build
- **Image optimization** - Always optimize images before adding
- **Performance first** - Maintain PageSpeed scores >95
- **SEO complete** - All pages need proper meta tags and schema

## Business Context

### Service Areas
Ann Arbor, Ypsilanti, Dexter, Saline, Washtenaw County

### Service Types
- Corporate catering (meetings, events, holiday parties)
- Wedding catering (full service, custom menus)
- Social events (parties, gatherings, celebrations)
- Charcuterie boards & grazing tables

### Unique Value Proposition
Only Thai fusion caterer in competitive Ann Arbor market, combining authentic Thai heritage with American catering expertise.

### Competitors
Zingerman's Catering, Katherine's Catering, Food Art Catered Affairs

## Success Metrics

### Technical
- 99.9% uptime
- PageSpeed >95 mobile/desktop
- Zero security issues
- Fast deployment (<5 min build time)

### Business
- Increased organic traffic
- Top 10 rankings for primary keywords
- Improved conversion rates
- Positive review growth

---

**Last Updated**: 2026-08-10 — reconciled against live `src/`. Removed the BigQuery/Firestore
lead architecture (retired 2026-06-30, CN-006): env vars, dataset tables, table schema, `bq`
commands, and the "Phase 2 marketing-crm / Supabase → BigQuery" plan, whose `PHASE-2-PLAN.md`
no longer exists. Corrected the fan-out from 4 destinations to 3 (Sheet → Trello → Brevo) and
removed the false claim that submit-form 500s without BigQuery. Removed the standalone email
worker URL and its deploy step (never deployed; folded into the site Worker, SYS-008).
Prior: 2026-06-21.
**Project Status**: LIVE in production with auto-deployment
**Current Phase**: Ongoing content expansion and optimization. **No CRM integration is
planned** — the marketing-crm product is shelved and the BigQuery attribution path it assumed
is retired (`systems-v2/capability-catalog.md`).
