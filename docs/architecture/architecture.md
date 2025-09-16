# Architecture Documentation

## Overview
Chef Nam Catering website uses a modern JAMstack architecture with Astro as the static site generator, Sanity as the headless CMS, and cloud hosting for optimal performance and SEO.

## Architecture Principles

### 1. Performance First
- Static site generation for fastest possible load times
- Zero JavaScript shipped by default (Astro Islands)
- Optimized images with automatic WebP conversion
- CDN-first distribution

### 2. SEO Optimized
- Server-side rendering with static HTML
- Perfect Core Web Vitals scores
- Structured data and meta tags
- Mobile-first responsive design

### 3. Content Management
- Headless CMS for flexible content editing
- Real-time preview capabilities
- Version control for all content
- Multi-user collaboration

### 4. Developer Experience
- Modern tooling and frameworks
- TypeScript for type safety
- Component-based architecture
- Hot module replacement

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│                 │    │                 │    │                 │
│  Sanity Studio  │────│  Sanity Cloud   │────│  Astro Website  │
│   (Content)     │    │   (Headless)    │    │   (Frontend)    │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                       │
                                │                       │
                                ▼                       ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │                 │    │                 │
                       │   Build Hook    │    │   CDN/Hosting   │
                       │  (Rebuilds on   │    │   (Vercel/CF)   │
                       │   CMS updates)  │    │                 │
                       │                 │    │                 │
                       └─────────────────┘    └─────────────────┘
```

## Technology Stack

### Frontend (Astro)
- **Framework**: Astro 4.x
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Tailwind UI + Custom
- **Icons**: Heroicons or Lucide
- **Images**: Astro Image (Sharp)

### Content Management (Sanity)
- **CMS**: Sanity v3
- **Studio**: Self-hosted at `/admin`
- **API**: Content Lake (GraphQL/REST)
- **Real-time**: Webhook triggers
- **Preview**: Draft content preview

### Development Tools
- **Package Manager**: npm/pnpm
- **Build Tool**: Vite (via Astro)
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript strict mode
- **Git Hooks**: Husky + lint-staged

### Hosting & Infrastructure
- **Primary**: Vercel or Cloudflare Pages
- **CDN**: Global edge network
- **SSL**: Automatic certificates
- **Domain**: chefnamcatering.com
- **Analytics**: Google Analytics 4

### Third-Party Services
- **Forms**: Web3Forms or Formspree
- **Email**: Resend or SendGrid
- **Maps**: Google Maps API
- **Analytics**: GA4 + privacy-friendly alternatives

## Data Flow

### Content Publishing Flow
1. **Editor** creates/updates content in Sanity Studio
2. **Sanity** validates and stores content
3. **Webhook** triggers rebuild on content change
4. **Astro** fetches data during build
5. **Static site** generates optimized HTML/CSS/JS
6. **CDN** distributes globally cached assets

### User Request Flow
1. **User** requests page
2. **CDN** serves cached static assets
3. **HTML** loads instantly (no hydration)
4. **Interactive components** hydrate on demand
5. **Forms/contact** submit to third-party services

## File Structure

```
nam-website/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── layout/         # Layout components
│   │   ├── ui/             # Basic UI elements
│   │   └── sections/       # Page sections
│   ├── content/            # Markdown content (local)
│   ├── data/               # Static data files
│   ├── layouts/            # Page layouts
│   ├── lib/                # Utilities and configs
│   │   ├── sanity.ts       # Sanity client
│   │   └── utils.ts        # Helper functions
│   ├── pages/              # Route pages
│   │   ├── index.astro     # Homepage
│   │   ├── about.astro     # About page
│   │   ├── contact.astro   # Contact page
│   │   └── services/       # Service pages
│   ├── styles/             # Global styles
│   └── types/              # TypeScript definitions
├── sanity/                 # Sanity CMS configuration
│   ├── schemas/            # Content type definitions
│   ├── lib/                # Sanity utilities
│   └── sanity.config.ts    # Sanity configuration
├── public/                 # Static assets
│   ├── images/             # Optimized images
│   ├── icons/              # Favicons and icons
│   └── robots.txt          # SEO directives
├── docs/                   # Project documentation
├── instructions/           # Development guidelines
└── specs/                  # Implementation requirements
```

## Content Types (Sanity Schema)

### Core Content Types
```typescript
// Main content types in Sanity
- pages          // Static pages (About, Contact)
- services       // Service offerings
- menuItems      // Food/menu items
- testimonials   // Client reviews
- gallery        // Photo galleries
- blogPosts      // Blog content
- events         // Past events showcase
- faqs           // Frequently asked questions
```

### Content Structure
```typescript
// Example: Service content type
{
  title: string
  slug: string
  description: string
  content: PortableText
  featuredImage: Image
  gallery: Image[]
  pricing: PriceRange
  serviceAreas: string[]
  seo: {
    metaTitle: string
    metaDescription: string
    keywords: string[]
  }
}
```

## Performance Specifications

### Core Web Vitals Targets
- **LCP (Largest Contentful Paint)**: < 1.5s
- **FID (First Input Delay)**: < 50ms
- **CLS (Cumulative Layout Shift)**: < 0.1
- **TTFB (Time to First Byte)**: < 300ms

### Optimization Strategies
1. **Static Generation**: Pre-built HTML pages
2. **Image Optimization**: WebP/AVIF with fallbacks
3. **Code Splitting**: Minimal JavaScript bundles
4. **Critical CSS**: Above-fold styles inlined
5. **Resource Hints**: Preload/prefetch important assets

## Security Considerations

### Data Protection
- **Content Security Policy**: Strict CSP headers
- **HTTPS Only**: SSL/TLS encryption required
- **Input Sanitization**: All user inputs sanitized
- **Rate Limiting**: API request throttling

### CMS Security
- **Role-based Access**: Editor/admin permissions
- **API Keys**: Environment variable storage
- **Webhook Signatures**: Verified rebuild triggers
- **Data Validation**: Schema-based validation

## Deployment Strategy

### Development Workflow
```
Local Development → Git Push → Preview Deploy → Production Deploy
     ↓                ↓            ↓              ↓
  localhost:3000   GitHub     preview.vercel   chefnamcatering.com
```

### Environment Configuration
- **Development**: Local with Sanity preview
- **Staging**: Preview deploys on branches
- **Production**: Main branch auto-deploy

### Build Process
1. **Install dependencies** (npm install)
2. **Type checking** (TypeScript validation)
3. **Linting** (ESLint + Prettier)
4. **Fetch content** (Sanity API)
5. **Generate pages** (Astro build)
6. **Optimize assets** (Image compression)
7. **Deploy** (Upload to CDN)

## Monitoring & Analytics

### Performance Monitoring
- **Core Web Vitals**: Continuous monitoring
- **Uptime**: Service availability tracking
- **Build Times**: CI/CD performance
- **Error Tracking**: JavaScript error monitoring

### Business Analytics
- **Google Analytics 4**: User behavior tracking
- **Search Console**: SEO performance
- **Sanity Analytics**: Content performance
- **Form Analytics**: Conversion tracking

## Scalability Considerations

### Content Scaling
- **Pagination**: Large content collections
- **Image CDN**: Automatic optimization
- **Caching**: Long-term browser caching
- **API Limits**: Sanity usage monitoring

### Traffic Scaling
- **Global CDN**: Edge caching worldwide
- **Static Assets**: No server computation
- **Auto-scaling**: Serverless architecture
- **Cost Predictability**: No surprise bills

## Maintenance Requirements

### Regular Tasks
- **Security Updates**: Framework/dependency updates
- **Content Audits**: Quarterly content review
- **Performance Audits**: Monthly speed tests
- **SEO Audits**: Quarterly ranking review

### Backup Strategy
- **Git Repository**: Code version control
- **Sanity Backups**: Automated daily backups
- **Asset Backups**: Cloud storage redundancy
- **Database Exports**: Regular content exports

## Migration Considerations

### From Current Setup (Bluehost)
1. **Content Export**: Extract existing content
2. **URL Mapping**: Maintain SEO rankings
3. **Redirect Rules**: 301 redirects for old URLs
4. **DNS Migration**: Gradual traffic shifting
5. **Email Migration**: Preserve email functionality

### Future Migration Options
- **CMS Flexibility**: Content-first architecture
- **Framework Agnostic**: Can migrate from Astro if needed
- **Data Portability**: Sanity export capabilities
- **No Vendor Lock-in**: Open standards used