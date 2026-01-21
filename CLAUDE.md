# Chef Nam Catering Website Project

## Project Overview
High-performance website for Chef Nam Catering, a women-owned Thai fusion catering business serving Ann Arbor, Michigan. Differentiates through authentic Thai heritage combined with American catering expertise.

## Tech Stack
- **Frontend**: Astro 4.0 (SSR mode with islands architecture)
- **CMS**: Sanity.io (Project ID: yojbqnd7)
- **Styling**: Tailwind CSS with custom brand theme
- **Hosting**: Cloudflare Pages (auto-deploy from GitHub)
- **Email**: Cloudflare Workers + Resend API
- **Language**: TypeScript throughout
- **Analytics**: Google Tag Manager (GTM-WCMPN842)

## Live Infrastructure

### Domains & Hosting
- **Production**: https://chefnamcatering.com
- **www**: https://www.chefnamcatering.com
- **Cloudflare Pages Project**: `chef-nam` (NOT chef-nam-website)
- **GitHub Repo**: peakscapedigital/chef-nam

### Key URLs
- **Website**: https://chefnamcatering.com
- **Sanity Studio**: https://chefnamcatering.com/admin
- **Email Worker**: https://chefnam-email-worker.dspjson.workers.dev

### Environment Variables
```bash
# Sanity CMS
SANITY_PROJECT_ID=yojbqnd7
SANITY_DATASET=production
SANITY_API_TOKEN=[stored in Cloudflare env]

# Site Config
PUBLIC_SITE_URL=https://chefnamcatering.com

# Email (Cloudflare Worker only)
RESEND_API_KEY=[stored in Worker env]

# Google Cloud / BigQuery
BIGQUERY_PROJECT_ID=chef-nam-analytics
BIGQUERY_CREDENTIALS=[base64 encoded service account JSON]
```

## Google Cloud Integration

### Project Configuration
- **Google Cloud Project ID**: `chef-nam-analytics`
- **Google Ads Account ID**: `3871181264`
- **Authentication**: Service Account with JWT (no Node.js SDK, uses REST API)

### BigQuery Datasets

| Dataset | Purpose | Key Tables/Views |
|---------|---------|------------------|
| `leads` | Website form submissions | `website_leads` (partitioned by `submitted_at`, clustered on `status`, `gclid`) |
| `google_ads_export` | Google Ads data transfer | 50+ views: `ads_CampaignStats_*`, `ads_AdStats_*`, `ads_ConversionStats_*`, etc. |
| `searchconsole` | Google Search Console data | Search performance data |
| `analytics_501458691` | GA4 BigQuery export | `events_*`, `pseudonymous_users_*` (daily tables) |

### BigQuery Architecture
The site uses a custom BigQuery REST API implementation (`src/lib/bigquery.ts`) that:
- Creates JWTs signed with service account private key
- Exchanges JWTs for access tokens via Google OAuth
- Performs streaming inserts and DML queries directly via REST

### Service Account Requirements
The service account needs these roles:
- `roles/bigquery.dataEditor` - Insert and update rows
- `roles/bigquery.jobUser` - Run queries

### Credentials Format
The `BIGQUERY_CREDENTIALS` env var accepts either:
1. **Raw JSON** - The full service account JSON file contents
2. **Base64 encoded** - `base64 -i service-account.json` (preferred for env vars)

### BigQuery Table Schema
```sql
-- leads.website_leads table structure
CREATE TABLE leads.website_leads (
  lead_id STRING NOT NULL,
  first_name STRING,
  last_name STRING,
  email STRING,
  email_hash STRING,        -- SHA256 for enhanced conversions
  phone STRING,
  phone_hash STRING,        -- SHA256 for enhanced conversions
  preferred_contact STRING,
  has_event BOOL,
  event_type STRING,
  event_date DATE,
  event_time STRING,
  guest_count STRING,
  location STRING,
  service_style STRING,
  budget_range STRING,
  dietary_requirements ARRAY<STRING>,
  message STRING,
  event_description STRING,
  gclid STRING,             -- Google Ads click ID
  ga_client_id STRING,      -- GA4 client ID
  fbclid STRING,
  utm_source STRING,
  utm_medium STRING,
  utm_campaign STRING,
  utm_term STRING,
  utm_content STRING,
  lead_source STRING,
  landing_page STRING,
  referrer STRING,
  submitted_from_url STRING,
  status STRING,
  notes STRING,
  booking_value FLOAT64,
  submitted_at TIMESTAMP,
  status_updated_at TIMESTAMP,
  notes_updated_at TIMESTAMP,
  won_at TIMESTAMP,
  form_source STRING,
  is_spam BOOL,
  is_test BOOL
);
```

### Local Development with BigQuery
```bash
# Set up local environment variables
export BIGQUERY_PROJECT_ID=chef-nam-analytics
export BIGQUERY_CREDENTIALS=$(cat /path/to/service-account.json | base64)

# Or use gcloud CLI for testing queries
gcloud config set project chef-nam-analytics
bq query --use_legacy_sql=false 'SELECT * FROM leads.website_leads LIMIT 10'
```

### Common BigQuery Commands
```bash
# List datasets
bq ls chef-nam-analytics:

# List tables in leads dataset
bq ls chef-nam-analytics:leads

# Query recent leads
bq query --use_legacy_sql=false \
  'SELECT lead_id, first_name, last_name, email, status, submitted_at
   FROM `chef-nam-analytics.leads.website_leads`
   ORDER BY submitted_at DESC LIMIT 20'

# Export leads to CSV
bq extract --destination_format=CSV \
  chef-nam-analytics:leads.website_leads \
  gs://your-bucket/leads-export.csv
```

### Integration with Marketing CRM (Phase 2)
The PHASE-2-PLAN.md outlines future integration:
1. Form submissions will also write to Supabase (marketing-crm)
2. Nightly sync from Supabase → BigQuery for attribution
3. BigQuery enables joining lead status with GA4/Ads data

## Deployment Workflow

### Standard Deployment (GitHub Auto-Deploy)
**PREFERRED METHOD** - Cloudflare Pages automatically builds and deploys from GitHub:

```bash
# 1. Make changes and test locally
npm run dev

# 2. Commit to GitHub
git add .
git commit -m "Description of changes

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
git push

# 3. Cloudflare Pages automatically builds and deploys
# Check deployment status:
npx wrangler pages deployment list --project-name=chef-nam
```

### Manual Deployment (Only if needed)
```bash
# Build locally
npm run build

# Deploy manually (rarely needed)
npx wrangler pages deploy dist --project-name=chef-nam

# CRITICAL: Project name is "chef-nam" NOT "chef-nam-website"
```

### Email Worker Deployment
```bash
cd email-worker
npm run deploy
```

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
- `/venues` - Venue partnerships
- `/blog` - Blog posts
- `/start-planning` - Contact/quote form
- `/thank-you` - Form submission confirmation
- `/admin` - Sanity Studio CMS

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
- Use ImageMagick for optimization: `magick convert input.jpg -quality 85 -resize 1920x1080^ -gravity center -extent 1920x1080 output.jpg`
- Store optimized images in `/public/images/`
- Use descriptive alt text for SEO
- Set `loading="eager"` for above-fold, `loading="lazy"` for below-fold

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
- Form submissions → `/api/submit-form`
- Data stored in Sanity CMS
- Email notifications via Resend API (Cloudflare Worker)
- UTM tracking + GCLID capture for attribution
- Google Ads conversion tracking

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

# Deployment
git push                 # Auto-deploys via Cloudflare Pages

# Check deployments
npx wrangler pages deployment list --project-name=chef-nam

# List all Cloudflare projects
npx wrangler pages project list

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

**Last Updated**: 2026-01-17
**Project Status**: LIVE in production with auto-deployment
**Current Phase**: Ongoing content expansion and optimization; Phase 2 CRM integration planned
