---
applyTo: "**/*.{js,jsx,ts,tsx,astro,css,md,mdx}"
description: "Development behavioral rules and quality standards for Chef Nam Catering website"
---

# Development Instructions

## Purpose
These instructions define HOW to develop the Chef Nam Catering website using Astro + Sanity. Follow these behavioral rules for consistent, maintainable, and performant code.

## Core Development Principles

### 1. Performance First
- **Static by Default**: Use Astro's static generation, avoid unnecessary JavaScript
- **Islands Architecture**: Only hydrate components that need interactivity
- **Image Optimization**: Always use Astro's Image component with proper sizing
- **Bundle Analysis**: Monitor JavaScript bundle sizes, keep pages < 100KB

### 2. TypeScript Everywhere
- **Strict Mode**: Use TypeScript strict configuration
- **Type Definitions**: Create types for all Sanity schemas
- **No `any` Types**: Use proper typing or `unknown` with type guards
- **Interface First**: Define interfaces before implementation

### 3. Component Architecture
- **Single Responsibility**: Each component has one clear purpose
- **Composition Over Inheritance**: Use component composition patterns
- **Props Validation**: Define clear TypeScript interfaces for props
- **Astro Islands**: Mark interactive components with `client:*` directives

## File Organization Rules

### Directory Structure Standards
```
src/
├── components/
│   ├── layout/          # Layout components (Header, Footer, etc.)
│   ├── ui/              # Reusable UI components (Button, Card, etc.)
│   ├── sections/        # Page sections (Hero, Services, etc.)
│   └── forms/           # Form components
├── layouts/             # Page layouts
├── pages/               # Route pages (.astro files)
├── lib/                 # Utilities and configurations
├── types/               # TypeScript type definitions
└── styles/              # Global styles and Tailwind config
```

### Naming Conventions
- **Components**: PascalCase (`ServiceCard.astro`)
- **Files**: kebab-case (`service-card.astro` for non-components)
- **Variables**: camelCase (`serviceData`)
- **Constants**: SCREAMING_SNAKE_CASE (`API_BASE_URL`)
- **CSS Classes**: Tailwind classes preferred, custom classes kebab-case

## Astro-Specific Rules

### 1. Component Script Patterns
```astro
---
// ✅ CORRECT: TypeScript with proper imports
import type { ServiceData } from '../types/sanity'
import { getServices } from '../lib/sanity'

interface Props {
  service: ServiceData
  featured?: boolean
}

const { service, featured = false } = Astro.props

// Fetch data at build time
const services = await getServices()
---
```

### 2. Client Directives Usage
```astro
<!-- ✅ Static by default -->
<ServiceCard service={service} />

<!-- ✅ Interactive only when needed -->
<ContactForm client:load />
<ImageGallery client:visible />
<MobileMenu client:media="(max-width: 768px)" />

<!-- ❌ Avoid unnecessary hydration -->
<StaticContent client:load />
```

### 3. Content Collections
```typescript
// ✅ Define collections in src/content/config.ts
import { defineCollection, z } from 'astro:content'

const blogCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.date(),
    tags: z.array(z.string()).optional(),
  }),
})

export const collections = {
  blog: blogCollection,
}
```

## Sanity Integration Rules

### 1. Client Configuration
```typescript
// ✅ lib/sanity.ts - Single source of truth
import { createClient } from '@sanity/client'
import type { SanityDocument } from '@sanity/client'

export const sanityClient = createClient({
  projectId: import.meta.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.SANITY_DATASET,
  useCdn: import.meta.env.PROD, // Use CDN in production
  apiVersion: '2024-01-01',
})

// Type-safe query function
export async function sanityFetch<T = any>(
  query: string,
  params: Record<string, any> = {}
): Promise<T> {
  return await sanityClient.fetch(query, params)
}
```

### 2. GROQ Query Patterns
```typescript
// ✅ Descriptive query functions with proper typing
export async function getHomepageData(): Promise<Homepage> {
  return await sanityFetch<Homepage>(`
    *[_type == "homepage"][0] {
      title,
      heroImage {
        asset-> {
          _id,
          url,
          metadata {
            dimensions
          }
        }
      },
      services[]-> {
        title,
        slug,
        description
      }
    }
  `)
}

// ✅ Parameterized queries for dynamic content
export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return await sanityFetch<Service | null>(`
    *[_type == "service" && slug.current == $slug][0] {
      title,
      content,
      featuredImage,
      gallery[] {
        asset-> {
          _id,
          url,
          metadata
        }
      }
    }
  `, { slug })
}
```

### 3. Image Handling
```astro
---
import { Image } from 'astro:assets'
import { urlFor } from '../lib/sanity'

// ✅ Generate optimized image URLs
const imageUrl = urlFor(service.featuredImage)
  .width(800)
  .height(600)
  .format('webp')
  .url()
---

<!-- ✅ Use Astro Image with proper attributes -->
<Image
  src={imageUrl}
  alt={service.featuredImage.alt || service.title}
  width={800}
  height={600}
  loading="lazy"
  class="rounded-lg"
/>
```

## Styling Rules (Tailwind CSS)

### 1. Utility-First Approach
```astro
<!-- ✅ Use Tailwind utilities -->
<div class="max-w-4xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold text-gray-900 mb-6">
    {title}
  </h1>
</div>

<!-- ❌ Avoid custom CSS when Tailwind utility exists -->
<div class="custom-container">
  <h1 class="custom-heading">
    {title}
  </h1>
</div>
```

### 2. Component Patterns
```astro
---
interface Props {
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  class?: string
}

const { variant = 'primary', size = 'md', class: className = '' } = Astro.props

const baseClasses = 'font-semibold rounded-lg transition-colors'
const variantClasses = {
  primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
  secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300'
}
const sizeClasses = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-6 py-3 text-lg'
}

const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`
---

<button class={buttonClasses}>
  <slot />
</button>
```

### 3. Responsive Design Rules
```astro
<!-- ✅ Mobile-first responsive classes -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="p-4 bg-white rounded-lg shadow">
    <h3 class="text-lg md:text-xl font-semibold">
      {service.title}
    </h3>
  </div>
</div>

<!-- ✅ Use Tailwind breakpoints consistently -->
<!-- sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px -->
```

## SEO Implementation Rules

### 1. Meta Tags Pattern
```astro
---
import Layout from '../layouts/Layout.astro'

interface Props {
  title: string
  description: string
  keywords?: string[]
  ogImage?: string
}

const { title, description, keywords = [], ogImage } = Astro.props
const canonicalUrl = new URL(Astro.url.pathname, Astro.site)
---

<Layout>
  <head>
    <title>{title} | Chef Nam Catering</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalUrl} />
    
    {keywords.length > 0 && (
      <meta name="keywords" content={keywords.join(', ')} />
    )}
    
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    {ogImage && <meta property="og:image" content={ogImage} />}
  </head>
  
  <main>
    <slot />
  </main>
</Layout>
```

### 2. Structured Data Rules
```astro
---
const structuredData = {
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Chef Nam Catering",
  "image": "https://chefnamcatering.com/logo.jpg",
  "telephone": "+1-XXX-XXX-XXXX",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "Ann Arbor",
    "addressRegion": "MI"
  }
}
---

<script type="application/ld+json" set:html={JSON.stringify(structuredData)} />
```

## Performance Rules

### 1. Image Optimization
```astro
---
import { Image } from 'astro:assets'
import heroImage from '../assets/hero.jpg'
---

<!-- ✅ Use Astro Image component -->
<Image
  src={heroImage}
  alt="Chef Nam preparing Thai fusion cuisine"
  width={1200}
  height={800}
  loading="eager" // Above fold
  format="webp"
/>

<!-- ✅ Lazy load below-fold images -->
<Image
  src={galleryImage}
  alt="Wedding catering setup"
  width={400}
  height={300}
  loading="lazy"
  class="rounded-lg"
/>
```

### 2. Code Splitting Rules
```astro
<!-- ✅ Load heavy components only when needed -->
<ImageGallery client:visible />
<ContactForm client:load />

<!-- ✅ Media queries for conditional loading -->
<MobileMenu client:media="(max-width: 768px)" />
<DesktopNav client:media="(min-width: 769px)" />
```

## Error Handling Rules

### 1. Graceful Degradation
```astro
---
let services = []
try {
  services = await getServices()
} catch (error) {
  console.error('Failed to fetch services:', error)
  // Provide fallback content
}
---

{services.length > 0 ? (
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {services.map(service => (
      <ServiceCard service={service} />
    ))}
  </div>
) : (
  <div class="text-center py-12">
    <p class="text-gray-600">
      Services are temporarily unavailable. Please contact us directly.
    </p>
  </div>
)}
```

### 2. Form Validation
```typescript
// ✅ Client-side validation with TypeScript
interface ContactFormData {
  name: string
  email: string
  phone?: string
  message: string
  eventType: 'wedding' | 'corporate' | 'social'
}

function validateContactForm(data: ContactFormData): string[] {
  const errors: string[] = []
  
  if (!data.name.trim()) errors.push('Name is required')
  if (!data.email.includes('@')) errors.push('Valid email is required')
  if (!data.message.trim()) errors.push('Message is required')
  
  return errors
}
```

## Testing Rules

### 1. Component Testing
```typescript
// ✅ Test component props and rendering
import { test, expect } from 'vitest'
import { render } from '@astro/test-utils'
import ServiceCard from '../components/ServiceCard.astro'

test('ServiceCard renders with correct props', async () => {
  const service = {
    title: 'Wedding Catering',
    description: 'Beautiful wedding meals',
    slug: 'wedding-catering'
  }
  
  const component = await render(ServiceCard, { props: { service } })
  expect(component.text()).toContain('Wedding Catering')
})
```

### 2. SEO Testing
```typescript
// ✅ Validate meta tags and structured data
test('Homepage has correct SEO meta tags', async () => {
  const response = await fetch('/api/test/homepage')
  const html = await response.text()
  
  expect(html).toContain('<title>Thai Fusion Catering Ann Arbor')
  expect(html).toContain('application/ld+json')
})
```

## Common Pitfalls to Avoid

❌ **Over-hydration**: Don't use `client:load` on static components
❌ **Mixed Content**: Don't mix Astro and framework components unnecessarily
❌ **Inline Styles**: Use Tailwind classes instead of style attributes
❌ **Hardcoded URLs**: Use `Astro.site` and proper URL construction
❌ **Missing Alt Text**: Always provide descriptive alt text for images
❌ **Unoptimized Images**: Never use regular `<img>` tags, use Astro Image
❌ **API Calls in Components**: Fetch data in frontmatter, not in component body
❌ **Missing Error Boundaries**: Always handle potential fetch failures
❌ **Non-semantic HTML**: Use proper HTML5 semantic elements
❌ **Accessibility Oversights**: Test with screen readers and keyboard navigation

## Git Workflow Rules

### 1. Commit Messages
```
feat: add wedding catering service page
fix: resolve mobile navigation accessibility issue
style: update button hover states for consistency
docs: add component documentation
refactor: extract common form validation logic
```

### 2. Branch Naming
- `feature/wedding-catering-page`
- `fix/mobile-menu-accessibility`
- `hotfix/contact-form-validation`
- `chore/dependency-updates`

### 3. Pull Request Requirements
- [ ] All tests pass
- [ ] TypeScript compilation successful
- [ ] Lighthouse score > 90 for all metrics
- [ ] Mobile responsive design verified
- [ ] Accessibility tested
- [ ] SEO meta tags validated

## Environment Configuration

### 1. Environment Variables
```bash
# .env.local
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_API_TOKEN=your_api_token
SITE_URL=https://chefnamcatering.com
CONTACT_EMAIL=info@chefnamcatering.com
```

### 2. Development Scripts
```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "type-check": "tsc --noEmit",
    "lint": "eslint src/**/*.{js,ts,astro}",
    "format": "prettier --write src/**/*.{js,ts,astro,css,md}"
  }
}
```

Remember: **Quality over speed.** Take time to write maintainable, performant, and accessible code that will serve Chef Nam Catering well for years to come.