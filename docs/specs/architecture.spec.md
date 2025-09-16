# Architecture Implementation Specification

## Purpose
This specification defines WHAT to implement for the Chef Nam Catering website architecture using Astro + Sanity. Each requirement includes acceptance criteria and technical implementation details.

## 1. Project Setup and Configuration

### 1.1 Astro Project Initialization

**Requirement**: Set up Astro project with TypeScript and essential configurations

**Implementation Commands**:
```bash
npm create astro@latest nam-website
cd nam-website
npm install
```

**Configuration Files Required**:

#### astro.config.mjs
```javascript
import { defineConfig } from 'astro/config'
import tailwind from '@astrojs/tailwind'
import image from '@astrojs/image'
import sitemap from '@astrojs/sitemap'
import partytown from '@astrojs/partytown'

export default defineConfig({
  site: 'https://chefnamcatering.com',
  integrations: [
    tailwind(),
    image({
      serviceEntryPoint: '@astrojs/image/sharp'
    }),
    sitemap(),
    partytown({
      config: {
        forward: ['gtag']
      }
    })
  ],
  output: 'static',
  build: {
    inlineStylesheets: 'auto'
  },
  vite: {
    define: {
      __DATE__: `'${new Date().toISOString()}'`
    }
  }
})
```

#### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "allowJs": true,
    "checkJs": false,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "preserve",
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/layouts/*": ["./src/layouts/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/types/*": ["./src/types/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### tailwind.config.mjs
```javascript
import defaultTheme from 'tailwindcss/defaultTheme'

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          500: '#2C3E50', // Deep Indigo Blue
          600: '#1e293b',
          700: '#0f172a'
        },
        accent: {
          500: '#F39C12', // Golden Amber
          600: '#d97706'
        },
        cream: '#ECF0F1',
        'off-white': '#FFFEFA'
      },
      fontFamily: {
        sans: ['Montserrat', ...defaultTheme.fontFamily.sans],
        serif: ['Playfair Display', ...defaultTheme.fontFamily.serif],
        script: ['Caveat', 'cursive']
      },
      maxWidth: {
        '8xl': '88rem'
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms')
  ]
}
```

**Acceptance Criteria**:
- [ ] Astro project runs on `localhost:3000`
- [ ] TypeScript compilation successful
- [ ] Tailwind CSS working with custom theme
- [ ] Image optimization enabled
- [ ] Sitemap generation configured

### 1.2 Package Dependencies

**Required Dependencies**:
```json
{
  "dependencies": {
    "@astrojs/image": "^0.18.0",
    "@astrojs/sitemap": "^3.0.0",
    "@astrojs/tailwind": "^5.0.0",
    "@astrojs/partytown": "^2.0.0",
    "@sanity/client": "^6.4.0",
    "@sanity/image-url": "^1.0.2",
    "@portabletext/to-html": "^2.0.0",
    "astro": "^4.0.0",
    "tailwindcss": "^3.3.0",
    "typescript": "^5.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.45.0",
    "eslint-plugin-astro": "^0.29.0",
    "prettier": "^3.0.0",
    "prettier-plugin-astro": "^0.12.0"
  }
}
```

## 2. Sanity CMS Setup

### 2.1 Sanity Project Configuration

**Requirement**: Set up Sanity CMS with content schemas

**Implementation Commands**:
```bash
npm install sanity @sanity/cli
npx sanity init
```

**Directory Structure**:
```
sanity/
├── schemas/
│   ├── index.ts           # Schema registry
│   ├── documents/         # Document schemas
│   │   ├── page.ts
│   │   ├── service.ts
│   │   ├── blog-post.ts
│   │   └── testimonial.ts
│   └── objects/           # Reusable objects
│       ├── seo.ts
│       ├── image-with-alt.ts
│       └── portable-text.ts
├── lib/
│   ├── client.ts          # Sanity client configuration
│   └── image.ts           # Image URL builder
└── sanity.config.ts       # Main configuration
```

#### sanity.config.ts
```typescript
import { defineConfig } from 'sanity'
import { deskTool } from 'sanity/desk'
import { visionTool } from '@sanity/vision'
import { colorInput } from '@sanity/color-input'
import { schemas } from './schemas'

export default defineConfig({
  name: 'chef-nam-catering',
  title: 'Chef Nam Catering CMS',
  projectId: process.env.SANITY_PROJECT_ID!,
  dataset: process.env.SANITY_DATASET || 'production',
  plugins: [
    deskTool(),
    visionTool(),
    colorInput()
  ],
  schema: {
    types: schemas
  },
  tools: (prev, { currentUser }) => {
    if (currentUser?.role === 'administrator') {
      return prev
    }
    return prev.filter((tool) => tool.name !== 'vision')
  }
})
```

### 2.2 Content Schema Definitions

#### Core Document Types

**Homepage Schema** (`schemas/documents/homepage.ts`):
```typescript
export default {
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Page Title',
      type: 'string',
      validation: (Rule: any) => Rule.required().max(60)
    },
    {
      name: 'heroSection',
      title: 'Hero Section',
      type: 'object',
      fields: [
        {
          name: 'headline',
          title: 'Headline',
          type: 'string',
          validation: (Rule: any) => Rule.required().max(100)
        },
        {
          name: 'subheading',
          title: 'Subheading',
          type: 'text',
          validation: (Rule: any) => Rule.max(200)
        },
        {
          name: 'heroImage',
          title: 'Hero Image',
          type: 'imageWithAlt'
        },
        {
          name: 'ctaButtons',
          title: 'Call to Action Buttons',
          type: 'array',
          of: [
            {
              type: 'object',
              fields: [
                {
                  name: 'text',
                  title: 'Button Text',
                  type: 'string'
                },
                {
                  name: 'link',
                  title: 'Link',
                  type: 'string'
                },
                {
                  name: 'style',
                  title: 'Style',
                  type: 'string',
                  options: {
                    list: ['primary', 'secondary']
                  }
                }
              ]
            }
          ],
          validation: (Rule: any) => Rule.max(2)
        }
      ]
    },
    {
      name: 'servicesSection',
      title: 'Services Section',
      type: 'object',
      fields: [
        {
          name: 'title',
          title: 'Section Title',
          type: 'string'
        },
        {
          name: 'description',
          title: 'Description',
          type: 'text'
        },
        {
          name: 'featuredServices',
          title: 'Featured Services',
          type: 'array',
          of: [{ type: 'reference', to: [{ type: 'service' }] }],
          validation: (Rule: any) => Rule.max(3)
        }
      ]
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo'
    }
  ],
  preview: {
    select: {
      title: 'title'
    }
  }
}
```

**Service Schema** (`schemas/documents/service.ts`):
```typescript
export default {
  name: 'service',
  title: 'Service',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Service Title',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'serviceType',
      title: 'Service Type',
      type: 'string',
      options: {
        list: [
          { title: 'Corporate Catering', value: 'corporate' },
          { title: 'Wedding Catering', value: 'wedding' },
          { title: 'Social Events', value: 'social' }
        ]
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'description',
      title: 'Short Description',
      type: 'text',
      validation: (Rule: any) => Rule.required().max(200)
    },
    {
      name: 'content',
      title: 'Content',
      type: 'portableText'
    },
    {
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'imageWithAlt'
    },
    {
      name: 'gallery',
      title: 'Gallery',
      type: 'array',
      of: [{ type: 'imageWithAlt' }]
    },
    {
      name: 'pricing',
      title: 'Pricing Information',
      type: 'object',
      fields: [
        {
          name: 'startingPrice',
          title: 'Starting Price',
          type: 'number'
        },
        {
          name: 'priceRange',
          title: 'Price Range',
          type: 'string',
          options: {
            list: ['$', '$$', '$$$', '$$$$']
          }
        },
        {
          name: 'pricingNotes',
          title: 'Pricing Notes',
          type: 'text'
        }
      ]
    },
    {
      name: 'serviceAreas',
      title: 'Service Areas',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          'Ann Arbor',
          'Ypsilanti',
          'Dexter',
          'Saline',
          'Chelsea',
          'Milan',
          'Washtenaw County'
        ]
      }
    },
    {
      name: 'features',
      title: 'Service Features',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'seo',
      title: 'SEO',
      type: 'seo'
    }
  ],
  preview: {
    select: {
      title: 'title',
      media: 'featuredImage',
      subtitle: 'serviceType'
    }
  }
}
```

#### Reusable Object Types

**SEO Schema** (`schemas/objects/seo.ts`):
```typescript
export default {
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    {
      name: 'metaTitle',
      title: 'Meta Title',
      type: 'string',
      validation: (Rule: any) => Rule.max(60).warning('Meta titles over 60 characters may be truncated')
    },
    {
      name: 'metaDescription',
      title: 'Meta Description',
      type: 'text',
      validation: (Rule: any) => Rule.max(160).warning('Meta descriptions over 160 characters may be truncated')
    },
    {
      name: 'keywords',
      title: 'Keywords',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        layout: 'tags'
      }
    },
    {
      name: 'ogImage',
      title: 'Open Graph Image',
      type: 'image',
      description: 'Recommended size: 1200x630px'
    },
    {
      name: 'noIndex',
      title: 'No Index',
      type: 'boolean',
      description: 'Prevent this page from being indexed by search engines'
    }
  ]
}
```

**Image with Alt Text** (`schemas/objects/image-with-alt.ts`):
```typescript
export default {
  name: 'imageWithAlt',
  title: 'Image',
  type: 'image',
  options: {
    hotspot: true
  },
  fields: [
    {
      name: 'alt',
      title: 'Alt Text',
      type: 'string',
      validation: (Rule: any) => Rule.required().error('Alt text is required for accessibility')
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string'
    }
  ]
}
```

### 2.3 Sanity Client Configuration

**Client Setup** (`src/lib/sanity.ts`):
```typescript
import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'
import type { SanityImageSource } from '@sanity/image-url/lib/types/types'

export const sanityClient = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET || 'production',
  useCdn: import.meta.env.PROD,
  apiVersion: '2024-01-01',
  token: import.meta.env.SANITY_API_TOKEN
})

const builder = imageUrlBuilder(sanityClient)

export function urlFor(source: SanityImageSource) {
  return builder.image(source)
}

// Type-safe query function
export async function sanityFetch<T = any>(
  query: string,
  params: Record<string, any> = {},
  options: { cache?: RequestCache } = {}
): Promise<T> {
  const { cache = 'force-cache' } = options
  
  try {
    const result = await sanityClient.fetch(query, params, {
      cache,
      next: { revalidate: import.meta.env.PROD ? 3600 : 0 }
    })
    return result
  } catch (error) {
    console.error('Sanity fetch error:', error)
    throw error
  }
}
```

**Acceptance Criteria**:
- [ ] Sanity Studio accessible at `/admin`
- [ ] All content schemas implemented
- [ ] Image upload and optimization working
- [ ] Content API queries functional

## 3. Page Structure Implementation

### 3.1 Layout Components

**Base Layout** (`src/layouts/Layout.astro`):
```astro
---
export interface Props {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
  noIndex?: boolean
}

const { title, description, keywords = [], ogImage, noIndex = false } = Astro.props
const canonicalUrl = new URL(Astro.url.pathname, Astro.site)
const fullTitle = title.includes('Chef Nam') ? title : `${title} | Chef Nam Catering`
---

<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="generator" content={Astro.generator} />
  
  <!-- SEO Meta Tags -->
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={canonicalUrl} />
  
  {keywords.length > 0 && (
    <meta name="keywords" content={keywords.join(', ')} />
  )}
  
  {noIndex && (
    <meta name="robots" content="noindex, nofollow" />
  )}
  
  <!-- Open Graph -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content={canonicalUrl} />
  <meta property="og:title" content={fullTitle} />
  <meta property="og:description" content={description} />
  {ogImage && <meta property="og:image" content={ogImage} />}
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content={fullTitle} />
  <meta name="twitter:description" content={description} />
  {ogImage && <meta name="twitter:image" content={ogImage} />}
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&family=Playfair+Display:wght@400;500;600;700&family=Caveat:wght@400;500;600&display=swap" rel="stylesheet" />
  
  <!-- Schema.org structured data -->
  <script type="application/ld+json" set:html={JSON.stringify({
    "@context": "https://schema.org",
    "@type": "FoodEstablishment",
    "name": "Chef Nam Catering",
    "url": "https://chefnamcatering.com",
    "logo": "https://chefnamcatering.com/logo.png",
    "servesCuisine": ["Thai Fusion", "Thai", "American"],
    "priceRange": "$$",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Ann Arbor",
      "addressRegion": "MI",
      "addressCountry": "US"
    },
    "areaServed": ["Ann Arbor", "Ypsilanti", "Dexter", "Saline", "Washtenaw County"]
  })} />
</head>

<body class="font-sans bg-off-white text-gray-900">
  <slot />
  
  <!-- Google Analytics -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_MEASUREMENT_ID');
  </script>
</body>
</html>
```

### 3.2 Homepage Implementation

**Homepage** (`src/pages/index.astro`):
```astro
---
import Layout from '../layouts/Layout.astro'
import Hero from '../components/sections/Hero.astro'
import ServicesOverview from '../components/sections/ServicesOverview.astro'
import AboutPreview from '../components/sections/AboutPreview.astro'
import TestimonialsPreview from '../components/sections/TestimonialsPreview.astro'
import ContactCTA from '../components/sections/ContactCTA.astro'
import { sanityFetch } from '../lib/sanity'

const homepageData = await sanityFetch(`
  *[_type == "homepage"][0] {
    title,
    heroSection,
    servicesSection {
      title,
      description,
      featuredServices[]-> {
        title,
        slug,
        description,
        featuredImage,
        serviceType
      }
    },
    seo
  }
`)

const services = await sanityFetch(`
  *[_type == "service"] | order(title) {
    title,
    slug,
    description,
    featuredImage,
    serviceType
  }
`)
---

<Layout
  title={homepageData?.seo?.metaTitle || "Thai Fusion Catering Ann Arbor | Chef Nam Catering"}
  description={homepageData?.seo?.metaDescription || "Chef Nam Catering brings authentic Thai fusion cuisine to Ann Arbor weddings, corporate events, and celebrations. Women-owned, locally sourced. Get a quote today!"}
  keywords={homepageData?.seo?.keywords || ["Thai fusion catering", "Ann Arbor catering", "wedding catering", "corporate catering"]}
  ogImage={homepageData?.seo?.ogImage}
>
  <main>
    <Hero data={homepageData?.heroSection} />
    <ServicesOverview 
      data={homepageData?.servicesSection} 
      services={services} 
    />
    <AboutPreview />
    <TestimonialsPreview />
    <ContactCTA />
  </main>
</Layout>
```

### 3.3 Service Pages Implementation

**Service Page Template** (`src/pages/services/[slug].astro`):
```astro
---
import Layout from '../../layouts/Layout.astro'
import ServiceHero from '../../components/sections/ServiceHero.astro'
import ServiceContent from '../../components/sections/ServiceContent.astro'
import ServiceGallery from '../../components/sections/ServiceGallery.astro'
import ServiceFAQ from '../../components/sections/ServiceFAQ.astro'
import RelatedServices from '../../components/sections/RelatedServices.astro'
import ContactCTA from '../../components/sections/ContactCTA.astro'
import { sanityFetch } from '../../lib/sanity'

export async function getStaticPaths() {
  const services = await sanityFetch(`
    *[_type == "service"] {
      slug
    }
  `)
  
  return services.map((service: any) => ({
    params: { slug: service.slug.current }
  }))
}

const { slug } = Astro.params

const service = await sanityFetch(`
  *[_type == "service" && slug.current == $slug][0] {
    title,
    description,
    content,
    featuredImage,
    gallery,
    serviceType,
    pricing,
    serviceAreas,
    features,
    seo
  }
`, { slug })

if (!service) {
  return Astro.redirect('/404')
}

const relatedServices = await sanityFetch(`
  *[_type == "service" && slug.current != $slug && serviceType == $serviceType] {
    title,
    slug,
    description,
    featuredImage
  }
`, { slug, serviceType: service.serviceType })
---

<Layout
  title={service.seo?.metaTitle || `${service.title} | Chef Nam Catering`}
  description={service.seo?.metaDescription || service.description}
  keywords={service.seo?.keywords || []}
  ogImage={service.seo?.ogImage}
>
  <main>
    <ServiceHero service={service} />
    <ServiceContent service={service} />
    {service.gallery && service.gallery.length > 0 && (
      <ServiceGallery images={service.gallery} />
    )}
    <ServiceFAQ serviceType={service.serviceType} />
    {relatedServices.length > 0 && (
      <RelatedServices services={relatedServices} />
    )}
    <ContactCTA />
  </main>
</Layout>
```

### 3.4 Essential Component Requirements

**Hero Component** (`src/components/sections/Hero.astro`):
```astro
---
import { Image } from 'astro:assets'
import { urlFor } from '../../lib/sanity'
import Button from '../ui/Button.astro'

interface Props {
  data: {
    headline: string
    subheading: string
    heroImage: any
    ctaButtons: Array<{
      text: string
      link: string
      style: 'primary' | 'secondary'
    }>
  }
}

const { data } = Astro.props
---

<section class="relative bg-primary-50 overflow-hidden">
  <div class="max-w-7xl mx-auto">
    <div class="relative z-10 pb-8 bg-primary-50 sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
      <main class="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
        <div class="sm:text-center lg:text-left">
          <h1 class="text-4xl tracking-tight font-bold text-gray-900 sm:text-5xl md:text-6xl">
            <span class="block xl:inline font-serif">{data.headline}</span>
          </h1>
          <p class="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
            {data.subheading}
          </p>
          <div class="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
            {data.ctaButtons?.map((button) => (
              <div class="rounded-md shadow">
                <Button
                  href={button.link}
                  variant={button.style}
                  size="lg"
                  class="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md"
                >
                  {button.text}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  </div>
  
  <div class="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
    {data.heroImage && (
      <Image
        src={urlFor(data.heroImage).width(800).height(600).url()}
        alt={data.heroImage.alt || data.headline}
        width={800}
        height={600}
        loading="eager"
        class="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
      />
    )}
  </div>
</section>
```

**Acceptance Criteria**:
- [ ] Homepage loads with dynamic content from Sanity
- [ ] Service pages generate from CMS data
- [ ] All pages have proper SEO meta tags
- [ ] Images are optimized and responsive
- [ ] Core Web Vitals scores > 90

## 4. Performance Requirements

### 4.1 Image Optimization

**Implementation Requirements**:
- All images served in WebP format with fallbacks
- Lazy loading for below-fold images
- Responsive image sizing
- Image compression < 200KB per image

**Image Component Usage**:
```astro
---
import { Image } from 'astro:assets'
import { urlFor } from '../lib/sanity'

// For Sanity images
const optimizedUrl = urlFor(sanityImage)
  .width(800)
  .height(600)
  .format('webp')
  .quality(85)
  .url()
---

<Image
  src={optimizedUrl}
  alt={sanityImage.alt}
  width={800}
  height={600}
  loading="lazy"
  class="rounded-lg shadow-md"
/>
```

### 4.2 Bundle Optimization

**JavaScript Bundle Targets**:
- Main bundle: < 50KB gzipped
- Page bundles: < 20KB gzipped each
- Total page weight: < 1MB

**CSS Optimization**:
- Critical CSS inlined
- Non-critical CSS lazy loaded
- Tailwind purging enabled

### 4.3 Core Web Vitals Targets

**Performance Metrics**:
- **LCP**: < 1.5 seconds
- **FID**: < 50 milliseconds  
- **CLS**: < 0.1
- **PageSpeed Score**: > 95 (mobile and desktop)

## 5. SEO Implementation

### 5.1 Structured Data

**Required Schema Types**:
- LocalBusiness (all pages)
- FoodEstablishment (homepage)
- Service (service pages)
- FAQPage (FAQ sections)
- Review (testimonials)

### 5.2 XML Sitemap

**Sitemap Configuration**:
```javascript
// astro.config.mjs
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://chefnamcatering.com',
  integrations: [
    sitemap({
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      customPages: [
        'https://chefnamcatering.com/services/corporate-catering',
        'https://chefnamcatering.com/services/wedding-catering',
        'https://chefnamcatering.com/services/social-events'
      ]
    })
  ]
})
```

### 5.3 Meta Tag Implementation

**Page-Level Meta Tags**:
- Unique title and description per page
- Open Graph and Twitter Card tags
- Canonical URLs
- Appropriate keywords

## 6. Form Implementation

### 6.1 Contact Form

**Contact Form Component** (`src/components/forms/ContactForm.astro`):
```astro
---
// Contact form with validation and submission
---

<form
  action="https://api.web3forms.com/submit"
  method="POST"
  class="space-y-6"
  id="contact-form"
>
  <input type="hidden" name="access_key" value="YOUR_ACCESS_KEY" />
  
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700">
        Full Name *
      </label>
      <input
        type="text"
        name="name"
        id="name"
        required
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500"
      />
    </div>
    
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">
        Email Address *
      </label>
      <input
        type="email"
        name="email"
        id="email"
        required
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500"
      />
    </div>
  </div>
  
  <div>
    <label for="phone" class="block text-sm font-medium text-gray-700">
      Phone Number
    </label>
    <input
      type="tel"
      name="phone"
      id="phone"
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500"
    />
  </div>
  
  <div>
    <label for="event-type" class="block text-sm font-medium text-gray-700">
      Event Type *
    </label>
    <select
      name="event-type"
      id="event-type"
      required
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500"
    >
      <option value="">Select an event type</option>
      <option value="wedding">Wedding</option>
      <option value="corporate">Corporate Event</option>
      <option value="social">Social Event</option>
      <option value="other">Other</option>
    </select>
  </div>
  
  <div>
    <label for="message" class="block text-sm font-medium text-gray-700">
      Message *
    </label>
    <textarea
      name="message"
      id="message"
      rows="4"
      required
      class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-accent-500 focus:ring-accent-500"
    ></textarea>
  </div>
  
  <button
    type="submit"
    class="w-full bg-accent-500 text-white py-3 px-6 rounded-md font-medium hover:bg-accent-600 transition-colors"
  >
    Send Message
  </button>
</form>

<script>
  document.getElementById('contact-form')?.addEventListener('submit', async (e) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const formData = new FormData(form)
    
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: formData
      })
      
      if (response.ok) {
        form.reset()
        alert('Thank you! Your message has been sent.')
      } else {
        alert('There was an error sending your message. Please try again.')
      }
    } catch (error) {
      alert('There was an error sending your message. Please try again.')
    }
  })
</script>
```

## 7. Testing Requirements

### 7.1 Automated Testing

**Testing Setup**:
```json
{
  "scripts": {
    "test": "vitest",
    "test:e2e": "playwright test",
    "lighthouse": "lighthouse https://localhost:3000 --output=html --output-path=./lighthouse-report.html"
  }
}
```

### 7.2 Performance Testing

**Required Tests**:
- Lighthouse CI integration
- Core Web Vitals monitoring
- Bundle size analysis
- Image optimization verification

### 7.3 Accessibility Testing

**WCAG 2.1 AA Compliance**:
- Color contrast ratios
- Keyboard navigation
- Screen reader compatibility
- Focus management

## 8. Deployment Configuration

### 8.1 Build Configuration

**Build Process Requirements**:
```json
{
  "scripts": {
    "build": "astro build",
    "build:check": "astro check && npm run build",
    "preview": "astro preview"
  }
}
```

### 8.2 Environment Variables

**Required Environment Variables**:
```bash
# .env.local
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token
PUBLIC_SITE_URL=https://chefnamcatering.com
CONTACT_FORM_ACCESS_KEY=your_web3forms_key
GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

## 9. Success Metrics

### 9.1 Performance Targets

**Launch Metrics**:
- [ ] PageSpeed score > 95 (mobile)
- [ ] PageSpeed score > 98 (desktop)
- [ ] LCP < 1.5s
- [ ] FID < 50ms
- [ ] CLS < 0.1
- [ ] Total page weight < 1MB

### 9.2 SEO Targets

**SEO Metrics**:
- [ ] All pages have unique meta titles
- [ ] All pages have unique meta descriptions
- [ ] Structured data validates
- [ ] XML sitemap generates correctly
- [ ] Canonical URLs implemented
- [ ] 404 page exists

### 9.3 Content Management

**CMS Functionality**:
- [ ] Sanity Studio accessible
- [ ] Content updates trigger rebuilds
- [ ] Image uploads work properly
- [ ] Preview mode functional
- [ ] User permissions configured

## 10. Launch Checklist

### Pre-Launch Requirements
- [ ] All pages built and tested
- [ ] Performance targets met
- [ ] SEO implementation complete
- [ ] Forms tested and working
- [ ] Analytics configured
- [ ] Domain and SSL ready
- [ ] Content migrated from old site
- [ ] 301 redirects configured

### Post-Launch Tasks
- [ ] Submit sitemap to Google
- [ ] Set up Search Console
- [ ] Configure Analytics goals
- [ ] Monitor performance metrics
- [ ] Test all contact forms
- [ ] Verify all redirects work