# Chef Nam Catering Website Project

## Project Overview
Building a high-performance website for Chef Nam Catering, a women-owned Thai fusion catering business serving Ann Arbor, Michigan and surrounding areas. The business differentiates through authentic Thai heritage combined with American catering expertise.

## Architecture Decision
**Tech Stack**: Astro 4.0 + Sanity CMS + Cloudflare Pages
- **Frontend**: Astro (static site generation, islands architecture)
- **CMS**: Sanity (headless, real-time collaboration)
- **Styling**: Tailwind CSS with custom brand theme
- **Hosting**: Cloudflare Pages (LIVE - chef-nam-website project)
- **Language**: TypeScript throughout
- **Adapter**: @astrojs/cloudflare (SSR mode)

## Business Context

### Brand Identity
- **Name**: Chef Nam Catering
- **Positioning**: Thai fusion cuisine with local Michigan charm
- **Target Market**: Corporate events, weddings, social gatherings
- **Service Areas**: Ann Arbor, Ypsilanti, Dexter, Saline, Washtenaw County
- **Unique Value Prop**: Only Thai fusion caterer in competitive Ann Arbor market

### Brand Colors
- **Primary**: Deep Indigo Blue (#2C3E50)
- **Accent**: Golden Amber (#F39C12) for CTAs
- **Supporting**: Off White (#FFFEFA), Soft Cream (#ECF0F1)

### Competitive Landscape
- **Major Competitors**: Zingerman's Catering, Katherine's Catering, Food Art Catered Affairs
- **Opportunity**: Most competitors lack cuisine specialization and strong SEO
- **Market Size**: $370.9M Michigan catering industry, 3,219 businesses

## Technical Requirements

### Performance Targets
- **PageSpeed Score**: >95 mobile, >98 desktop
- **Core Web Vitals**: LCP <1.5s, FID <50ms, CLS <0.1
- **Bundle Size**: Main <50KB, pages <20KB each
- **Total Page Weight**: <1MB

### SEO Priorities
- **Primary Keywords**: "Thai fusion catering Ann Arbor", "Ann Arbor wedding caterer"
- **Local SEO**: Target all service cities individually
- **Content Strategy**: Blog posts, service pages, location pages
- **Schema Markup**: LocalBusiness, FoodEstablishment, Service types

### Content Management
- **CMS**: Sanity with real-time preview
- **Content Types**: Homepage, services, blog posts, testimonials, gallery
- **Users**: Chef Nam (content editor), developer (admin)
- **Workflow**: Draft � Preview � Publish with webhook rebuilds

## File Structure & Organization

### Documentation System
```
/docs/           # Reference materials
/instructions/   # Behavioral rules  
/specs/          # Implementation requirements
```

### Key Files Created
- `docs/seo.md` - SEO reference and best practices
- `instructions/seo.instructions.md` - SEO behavioral rules
- `specs/seo.spec.md` - SEO implementation requirements
- `docs/architecture.md` - System architecture reference
- `instructions/development.instructions.md` - Development standards
- `specs/architecture.spec.md` - Technical implementation specs
- `brand-guidelines.md` - Brand identity and visual guidelines
- `market-research.md` - Competitive analysis and keyword strategy

## Current Status

### Completed
-  Project planning and architecture decisions
-  SEO strategy and keyword research
-  Brand guidelines documentation
-  Technical specifications created
-  Documentation system established

### In Progress
- = Astro project initialization (ready to start)

### Next Steps
1. Initialize Astro + TypeScript + Tailwind project
2. Set up Sanity CMS with content schemas
3. Configure Astro � Sanity integration
4. Build base layout with SEO optimization
5. Create homepage with dynamic content
6. Test and choose hosting provider
7. Implement contact forms
8. Performance optimization and launch

## Key Decisions Made

### Why Astro?
- **SEO Performance**: Static HTML, zero JS by default
- **Perfect for Content Sites**: Built for Chef Nam's use case
- **Islands Architecture**: Interactive components only where needed
- **Performance**: Achieves 95-100 PageSpeed scores out of box

### Why Sanity?
- **User-Friendly**: Excellent CMS for non-technical users
- **Real-time**: Live preview and collaboration
- **Flexible**: Powerful content modeling
- **Developer Experience**: Great TypeScript integration

### Migration from Bluehost
- **Current**: chefnamcatering.com on Bluehost (~$195/year)
- **Future**: Modern stack (~$250/year) for massive performance gains
- **Timeline**: Build � Test � Gradual DNS migration

## Development Standards

### Code Quality
- **TypeScript Strict Mode**: No `any` types allowed
- **Component Architecture**: Single responsibility, composition over inheritance
- **Performance First**: Static by default, optimize for Core Web Vitals
- **SEO First**: Meta tags, structured data, semantic HTML

### Naming Conventions
- **Components**: PascalCase (`ServiceCard.astro`)
- **Files**: kebab-case (`service-card.astro`)
- **Variables**: camelCase (`serviceData`)
- **CSS Classes**: Tailwind preferred, custom classes kebab-case

### Testing Requirements
- **Performance**: Lighthouse CI integration
- **SEO**: Meta tags and structured data validation
- **Accessibility**: WCAG 2.1 AA compliance
- **Cross-browser**: Modern browsers + mobile

## Business Goals

### 3-Month Targets
- 50% increase in organic traffic
- Top 10 rankings for 10 primary keywords
- 25 positive reviews across platforms
- 3% conversion rate from organic traffic

### 6-Month Targets  
- 150% increase in organic traffic
- Top 5 rankings for 5 primary keywords
- Top 3 in local pack for "catering Ann Arbor"
- 5% conversion rate from organic traffic

### Success Metrics
- **Performance**: >95 PageSpeed, <1.5s load times
- **SEO**: Top 3 for "Thai fusion catering Ann Arbor"
- **Business**: Increased bookings, improved brand recognition
- **Technical**: 99.9% uptime, zero security issues

## Contact & Communication

### Primary Stakeholder
- **Chef Nam**: Business owner, content creator
- **Content Updates**: Via Sanity Studio
- **Technical Support**: Via development team

### Project Communication
- **Updates**: Track via todo system in development
- **Issues**: Document in project files
- **Decisions**: Update CLAUDE.md for future reference

## Important Notes

### Domain & DNS
- **Live Domain**: chefnamcatering.com (Cloudflare)
- **Custom Domain**: www.chefnamcatering.com (Cloudflare)
- **Hosting**: Cloudflare Pages (LIVE)
- **Old Hosting**: Migrated from Bluehost

### Content Migration
- **Existing Content**: Minimal, mostly recreating from scratch
- **SEO Preservation**: Implement redirects for any existing URLs
- **Asset Migration**: Photos and brand assets to new system

### Environment Setup
```bash
# Required environment variables
SANITY_PROJECT_ID=yojbqnd7
SANITY_DATASET=production
SANITY_API_TOKEN=skM6lGZRUGdMrX7gF2ouLCf1gNUJpv6IDiPOAjTJmjuqkzqcVp57cKfE74svy07jsZfMaEM1JX0d4WNXOvaBVH96k5UbcnlEg5TfOfOEmFMFAx2vQtbGCEKvyqzCFrPpkrs5SK4mEdlR57PWcsZTwheUK2snuB7SVE8USgo6x99h787Nq97O
PUBLIC_SITE_URL=https://chefnamcatering.com
RESEND_API_KEY=re_... (set in Cloudflare Worker env)
```

## Commands & Workflows

### Development Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run type-check   # TypeScript validation
npm run lint         # Code linting
```

### Deployment Commands

**IMPORTANT: Use exact project names - do not guess!**

#### Deploy Website (Cloudflare Pages)
```bash
# ALWAYS use this exact command:
npx wrangler pages deploy dist --project-name=chef-nam-website

# Project details:
# - Project Name: chef-nam-website (NOT chefnamcatering)
# - Live URL: https://chefnamcatering.com
# - Preview: https://chef-nam-website.pages.dev
# - Account: 7facb60658190425ab4758a2f4de8cc5
```

#### Deploy Email Worker (Cloudflare Workers)
```bash
cd email-worker
npm run deploy

# Worker details:
# - Worker Name: chefnam-email-worker
# - Live URL: https://chefnam-email-worker.dspjson.workers.dev
# - Purpose: Sends form notification emails via Resend
```

#### Deploy Sanity Studio (If Needed)
```bash
# Schema changes are deployed with main site
# Studio is accessed locally at /admin
# No separate deployment needed for schema updates
```

#### Check Cloudflare Projects
```bash
npx wrangler pages project list  # See all Cloudflare Pages projects
```

### Content Management
- **Sanity Studio**: Access at `https://chefnamcatering.com/admin`
- **Preview Mode**: Real-time content preview
- **Schema Changes**: Deploy with main site (no separate step)

## Documentation Domains Complete

### SEO Domain ✅
- `/docs/seo.md` - Reference and best practices
- `/instructions/seo.instructions.md` - Implementation rules
- `/specs/seo.spec.md` - Technical requirements

### Architecture Domain ✅
- `/docs/architecture.md` - System architecture reference
- `/instructions/development.instructions.md` - Development standards
- `/specs/architecture.spec.md` - Implementation specs

### Design Domain ✅
- `/docs/design.md` - UX strategy and visual guidelines
- `/instructions/design.instructions.md` - Design implementation rules
- `/specs/design.spec.md` - Detailed wireframes and specifications

**Key Design Features:**
- Conversion-optimized layouts with food-first visual hierarchy
- User personas mapped to conversion journeys
- Mobile-first responsive design with accessibility compliance
- Trust-building elements and strategic CTA placement
- Brand-aligned color palette and typography system

---

## Deployment Configuration Summary

### Live Infrastructure
- **Website**: Cloudflare Pages (chef-nam-website)
- **Email Worker**: Cloudflare Workers (chefnam-email-worker)
- **CMS**: Sanity.io (Project ID: yojbqnd7)
- **Domain**: chefnamcatering.com + www.chefnamcatering.com
- **Analytics**: Google Tag Manager (GTM-WCMPN842)

### Key Integrations
- **Email**: Resend API via Cloudflare Worker
- **Forms**: API route at `/api/submit-form` → Sanity + Email
- **Tracking**: GTM + GA4 + Google Ads conversion tracking
- **Attribution**: UTM tracking + GCLID capture for lead source

### Deployment Workflow
1. Make code changes
2. Test locally: `npm run dev`
3. Build: `npm run build`
4. Deploy: `npx wrangler pages deploy dist --project-name=chef-nam-website`
5. Verify at: https://chefnamcatering.com

**CRITICAL**: Always use exact project name `chef-nam-website` - never guess or abbreviate!

---

*Last Updated: 2025-01-14*
*Project Status: LIVE in production with full UTM tracking*
- I would prefer to not use mock setups and simple tests - let's work on production grade solutions