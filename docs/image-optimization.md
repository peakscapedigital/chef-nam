# Image Optimization Standards

Standards for image optimization across the Chef Nam website. Follow these guidelines to maintain consistent performance and avoid LCP issues.

## Quick Reference

| Component | Sizes Required | Format | Quality | Max File Size |
|-----------|---------------|--------|---------|---------------|
| Hero (ServiceHero) | 640, 1024, 1920 | JPG | 85 | 300KB (1920) |
| Card images | 400, 800 | JPG | 85 | 100KB (800) |
| Thumbnails | 200, 400 | JPG | 80 | 50KB (400) |
| Logo/icons | Original size | PNG/SVG | Lossless | 50KB |

---

## Hero Images (ServiceHero Component)

Hero images are the most critical for LCP. Always use the responsive image pattern.

### Required Files

```
public/images/hero/
├── {name}-640.jpg    # Mobile (< 60KB target)
├── {name}-1024.jpg   # Tablet (< 120KB target)
└── {name}-1920.jpg   # Desktop (< 300KB target)
```

### ImageMagick Commands

```bash
# From source image, create all three sizes
magick {source}.jpg -quality 85 -resize 640x -strip {name}-640.jpg
magick {source}.jpg -quality 85 -resize 1024x -strip {name}-1024.jpg
magick {source}.jpg -quality 85 -resize 1920x -strip {name}-1920.jpg

# Remove source after optimization
rm {source}.jpg
```

### Usage in Astro Pages

```astro
<!-- In the page file (e.g., services/weddings.astro) -->

<!-- 1. Add preload in head slot for LCP optimization -->
<link
  rel="preload"
  as="image"
  href="/images/hero/{name}-640.jpg"
  imagesrcset="/images/hero/{name}-640.jpg 640w, /images/hero/{name}-1024.jpg 1024w, /images/hero/{name}-1920.jpg 1920w"
  imagesizes="100vw"
  fetchpriority="high"
  slot="head"
/>

<!-- 2. Use ServiceHero with responsive images -->
<ServiceHero
  title="Page Title"
  subtitle="Subtitle"
  description="Description text"
  backgroundImage="/images/hero/{name}-1920.jpg"
  backgroundAlt="Descriptive alt text"
  responsiveImages={{
    src640: "/images/hero/{name}-640.jpg",
    src1024: "/images/hero/{name}-1024.jpg",
    src1920: "/images/hero/{name}-1920.jpg"
  }}
  breadcrumbs={[...]}
/>
```

### What the Component Outputs

The ServiceHero component renders:

```html
<img
  src="/images/hero/{name}-1920.jpg"
  srcset="/images/hero/{name}-640.jpg 640w, /images/hero/{name}-1024.jpg 1024w, /images/hero/{name}-1920.jpg 1920w"
  sizes="100vw"
  alt="..."
  loading="eager"
  fetchpriority="high"
  decoding="async"
/>
```

---

## Card & Content Images

For images within page content (cards, galleries, inline images).

### Required Files

```
public/images/{category}/
├── {name}-400.jpg    # Small/mobile
└── {name}-800.jpg    # Large/desktop
```

### ImageMagick Commands

```bash
magick {source}.jpg -quality 85 -resize 400x -strip {name}-400.jpg
magick {source}.jpg -quality 85 -resize 800x -strip {name}-800.jpg
```

### Usage

```html
<img
  src="/images/{category}/{name}-800.jpg"
  srcset="/images/{category}/{name}-400.jpg 400w, /images/{category}/{name}-800.jpg 800w"
  sizes="(max-width: 640px) 100vw, 400px"
  alt="Descriptive alt text"
  loading="lazy"
  decoding="async"
/>
```

---

## Sanity-Hosted Images

For CMS-managed content (blog posts, dynamic pages), use Sanity's image URL builder.

### In Astro Components

```astro
---
import { urlFor } from '../utils/sanity';

const { image } = Astro.props;
---

<img
  src={urlFor(image).width(800).quality(85).auto('format').url()}
  srcset={`
    ${urlFor(image).width(400).quality(85).auto('format').url()} 400w,
    ${urlFor(image).width(800).quality(85).auto('format').url()} 800w
  `}
  sizes="(max-width: 640px) 100vw, 800px"
  alt={image.alt || ''}
  loading="lazy"
/>
```

### Key Parameters

- `.width(n)` - Resize to width
- `.height(n)` - Resize to height
- `.quality(85)` - JPEG quality (use 80-85)
- `.auto('format')` - Serve WebP when supported
- `.fit('crop')` - Crop to exact dimensions

---

## External Images (Unsplash, etc.)

**Avoid external images for above-fold content.** They add DNS lookup, connection, and TLS overhead (~300-500ms).

### If You Must Use External Images

1. Add preconnect in Layout.astro:
   ```html
   <link rel="preconnect" href="https://images.unsplash.com" />
   ```

2. Use Unsplash's built-in resizing:
   ```
   ?w=640&q=80   # Mobile
   ?w=1024&q=80  # Tablet
   ?w=1920&q=80  # Desktop
   ```

3. **Prefer self-hosting** - Download, optimize, and serve locally for any LCP-critical images.

---

## File Naming Convention

```
{descriptive-name}-{width}.{ext}

Examples:
  wedding-hero-640.jpg
  wedding-hero-1024.jpg
  wedding-hero-1920.jpg
  charcuterie-board-400.jpg
  charcuterie-board-800.jpg
```

Rules:
- Lowercase, kebab-case
- Descriptive name (not `img1`, `hero2`)
- Width suffix matches actual pixel width
- JPG for photos, PNG for graphics with transparency, SVG for icons/logos

---

## Performance Targets

| Metric | Target | How to Verify |
|--------|--------|---------------|
| LCP | < 2.5s | PageSpeed Insights |
| Hero image (mobile) | < 60KB | `ls -lh` |
| Hero image (desktop) | < 300KB | `ls -lh` |
| Total page images | < 500KB | DevTools Network tab |

---

## Pre-Publish Checklist

Before publishing any page with images:

- [ ] Hero image has all 3 sizes (640, 1024, 1920)
- [ ] Hero uses `responsiveImages` prop in ServiceHero
- [ ] Preload link added in head slot for hero
- [ ] All images have descriptive alt text
- [ ] File sizes within targets
- [ ] No external URLs for above-fold images
- [ ] `loading="lazy"` on below-fold images
- [ ] `loading="eager"` + `fetchpriority="high"` on hero only

---

## Existing Optimized Heroes

Reference implementations:

| Page | Hero Location | Sizes |
|------|---------------|-------|
| `/services/weddings` | `/images/hero/wedding-hero-*.jpg` | 640, 1024, 1920 |
| Homepage | `/images/hero/hero-catering-*.jpg` | 800, 1200, 1920 |

---

## Draft Pages Needing Optimization

Pages in `src/pages/_drafts/` that need hero image optimization before publishing:

- [ ] `graduation-catering.astro`
- [ ] `office-catering.astro`
- [ ] `private-parties.astro`

Follow the ServiceHero pattern from `/services/weddings` when moving these to production.

---

## Tools

### ImageMagick (recommended)

```bash
# Install on macOS
brew install imagemagick

# Check installation
magick --version
```

### Squoosh (alternative)

Web-based tool at https://squoosh.app for one-off optimizations.

### Checking file sizes

```bash
# List all hero images with sizes
ls -lh public/images/hero/

# Check total size of images directory
du -sh public/images/
```
