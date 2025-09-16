---
applyTo: "**/*.{astro,tsx,jsx,css,html}"
description: "Design behavioral rules and UI standards for Chef Nam Catering website"
---

# Design Instructions

## Purpose
These instructions define HOW to implement design and UI for the Chef Nam Catering website. Follow these behavioral rules to ensure consistent, conversion-optimized, and accessible user experiences.

## Core Design Principles

### 1. Food-First Visual Hierarchy
- **Hero Images**: Always feature high-quality food photography as primary visual element
- **Food Placement**: Food images get priority placement over decorative elements
- **Image Quality**: Never use low-resolution or stock food photography
- **Authenticity**: Only use real Chef Nam dishes and events

### 2. Conversion-Optimized Layout
- **Above-the-Fold**: Value proposition, trust signals, and primary CTA must be visible
- **CTA Visibility**: Primary contact CTAs visible on every page
- **Trust Signals**: Include testimonials, reviews, or credentials on all service pages
- **Friction Reduction**: Minimize steps between discovery and contact

### 3. Mobile-First Implementation
- **Design Mobile First**: Start with mobile layout, enhance for desktop
- **Touch Targets**: Minimum 44px for all interactive elements
- **Thumb-Friendly**: Important actions within thumb reach zone
- **Performance**: Mobile loading speed is priority over desktop enhancements

## Component Design Rules

### 1. Button Standards
```astro
<!-- ✅ Primary CTA Button -->
<Button 
  variant="primary" 
  size="lg"
  class="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-4 px-8 rounded-lg transition-colors"
>
  Get Your Custom Quote
</Button>

<!-- ✅ Secondary Button -->
<Button 
  variant="secondary"
  size="md" 
  class="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white font-semibold py-3 px-6 rounded-lg transition-all"
>
  View Our Gallery
</Button>

<!-- ❌ Avoid weak CTAs -->
<button class="text-blue-500 underline">Click here</button>
```

#### Button Hierarchy Rules
- **Primary CTAs**: Amber background, white text, prominent placement
- **Secondary CTAs**: Outlined style with brand colors
- **Maximum**: 2 primary CTAs per page section
- **Text**: Action-oriented ("Get", "View", "Contact") not generic ("Click", "Learn")

### 2. Typography Implementation
```astro
<!-- ✅ Proper heading hierarchy -->
<h1 class="font-serif text-5xl font-semibold text-gray-900 mb-6">
  Thai Fusion Catering in Ann Arbor
</h1>

<h2 class="font-serif text-3xl font-medium text-gray-800 mb-4">
  Our Services
</h2>

<h3 class="font-sans text-xl font-semibold text-gray-900 mb-3">
  Corporate Events
</h3>

<p class="font-sans text-base leading-relaxed text-gray-700">
  Professional Thai fusion catering for your business needs.
</p>

<!-- ✅ Script font for personal touches -->
<span class="font-script text-lg text-amber-600">
  "Creating memorable culinary experiences" - Chef Nam
</span>
```

#### Typography Rules
- **H1**: Always Playfair Display, one per page, includes primary keyword
- **H2-H3**: Playfair Display for section headings, Montserrat for subsections
- **Body Text**: Montserrat only, 16px minimum size
- **Script Font**: Caveat for quotes, personal messages, handwritten feel only
- **Line Height**: 1.75 for body text, 1.2 for headings

### 3. Image Handling Standards
```astro
---
import { Image } from 'astro:assets'
import { urlFor } from '../lib/sanity'
---

<!-- ✅ Optimized food photography -->
<Image
  src={urlFor(foodImage).width(800).height(600).format('webp').url()}
  alt="Thai fusion appetizers featuring fresh herbs and vibrant spices"
  width={800}
  height={600}
  loading="eager" // Only for above-fold hero images
  class="rounded-lg shadow-md object-cover"
/>

<!-- ✅ Lazy loaded gallery images -->
<Image
  src={urlFor(galleryImage).width(400).height(300).format('webp').url()}
  alt="Wedding reception with elegant Thai fusion buffet setup"
  width={400}
  height={300}
  loading="lazy"
  class="rounded-lg shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
/>

<!-- ❌ Never use generic alt text -->
<img alt="food" /> <!-- Bad -->
<img alt="image" /> <!-- Bad -->
<img alt="photo" /> <!-- Bad -->
```

#### Image Quality Rules
- **Food Photos**: Bright, natural lighting, vibrant colors, appetizing presentation
- **Event Photos**: Candid moments, genuine smiles, diverse representation
- **Chef Photos**: Professional but approachable, action shots preferred
- **Compression**: <200KB per image while maintaining visual quality
- **Formats**: WebP with JPEG fallback, Progressive JPEG for compatibility

### 4. Color Application Rules
```css
/* ✅ Brand color usage patterns */
.primary-brand {
  color: #2C3E50; /* Deep Indigo Blue - headers, navigation */
}

.accent-brand {
  color: #F39C12; /* Golden Amber - CTAs, highlights, food accents */
}

.background-primary {
  background-color: #FFFEFA; /* Off White - main backgrounds */
}

.background-subtle {
  background-color: #ECF0F1; /* Soft Cream - section separators */
}

/* ❌ Avoid these color mistakes */
.error-too-bright {
  color: #FF0000; /* Too aggressive for food site */
}

.error-poor-contrast {
  color: #CCCCCC; /* Fails accessibility standards */
}
```

#### Color Usage Guidelines
- **Primary Blue**: Navigation, headers, professional content
- **Amber Accent**: CTAs, food highlights, premium indicators
- **Never**: Use colors that suppress appetite (bright reds, harsh blues)
- **Contrast**: Always test color combinations for WCAG AA compliance
- **Cultural Sensitivity**: Avoid color combinations that conflict with Thai cultural meanings

### 5. Layout Composition Rules
```astro
<!-- ✅ Proper section structure -->
<section class="py-16 bg-off-white">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="text-center mb-12">
      <h2 class="font-serif text-4xl font-semibold text-gray-900 mb-4">
        Our Catering Services
      </h2>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        Exceptional Thai fusion cuisine for every occasion
      </p>
    </div>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      <!-- Service cards -->
    </div>
  </div>
</section>

<!-- ❌ Avoid cramped layouts -->
<div class="p-2">
  <h2>Services</h2>
  <div class="grid gap-1">
    <!-- Too tight, poor user experience -->
  </div>
</div>
```

#### Layout Guidelines
- **Container**: Max-width 1280px (7xl), centered with horizontal padding
- **Sections**: Generous vertical padding (py-16), consistent spacing
- **Grids**: Responsive breakpoints (1/2/3 columns), adequate gap spacing
- **Whitespace**: Embrace empty space for breathing room and focus

## User Experience Rules

### 1. Navigation Design
```astro
<!-- ✅ Clear, accessible navigation -->
<nav class="bg-white shadow-sm sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <div class="flex-shrink-0">
        <img class="h-10 w-auto" src="/logo.svg" alt="Chef Nam Catering" />
      </div>
      
      <div class="hidden md:block">
        <div class="ml-10 flex items-baseline space-x-8">
          <a href="/" class="text-gray-900 hover:text-amber-600 font-medium">Home</a>
          <a href="/services" class="text-gray-900 hover:text-amber-600 font-medium">Services</a>
          <a href="/about" class="text-gray-900 hover:text-amber-600 font-medium">About</a>
          <a href="/gallery" class="text-gray-900 hover:text-amber-600 font-medium">Gallery</a>
          <a href="/contact" class="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 transition-colors">
            Get Quote
          </a>
        </div>
      </div>
    </div>
  </div>
</nav>
```

#### Navigation Rules
- **Sticky Header**: Navigation always accessible while scrolling
- **Logo Placement**: Top-left position, links to homepage
- **Menu Order**: Logical flow from general to specific (Home → Services → About → Gallery → Contact)
- **CTA in Nav**: Primary contact action always visible in navigation
- **Mobile Menu**: Hamburger menu for mobile, full-screen overlay

### 2. Call-to-Action Optimization
```astro
<!-- ✅ Strategic CTA placement -->
<section class="bg-primary-50 py-16">
  <div class="max-w-4xl mx-auto text-center px-4">
    <h2 class="font-serif text-4xl font-semibold text-gray-900 mb-6">
      Ready to Create Your Perfect Event?
    </h2>
    <p class="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
      Let's discuss your vision and create a custom menu that will delight your guests
    </p>
    
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <Button 
        href="/contact"
        variant="primary"
        size="lg"
        class="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-4 px-8 rounded-lg transition-colors"
      >
        Get Your Custom Quote
      </Button>
      
      <Button 
        href="tel:+1234567890"
        variant="secondary" 
        size="lg"
        class="border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white font-semibold py-4 px-8 rounded-lg transition-all"
      >
        Call Now: (123) 456-7890
      </Button>
    </div>
  </div>
</section>
```

#### CTA Best Practices
- **Above-the-Fold**: Primary CTA visible without scrolling
- **Action-Oriented**: Use verbs ("Get", "Book", "Contact") not passive text
- **Urgency**: Subtle urgency without being pushy ("Book Your Date")
- **Multiple Options**: Phone and form options for different preferences
- **Contrast**: High visual contrast with surrounding elements

### 3. Trust Signal Implementation
```astro
<!-- ✅ Trust-building elements -->
<section class="bg-white py-12">
  <div class="max-w-6xl mx-auto px-4">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
      
      <!-- Years of Experience -->
      <div class="text-center">
        <div class="text-4xl font-bold text-amber-600 mb-2">10+</div>
        <div class="text-gray-600">Years Serving Ann Arbor</div>
      </div>
      
      <!-- Client Testimonial -->
      <div class="text-center">
        <div class="flex justify-center mb-4">
          {/* 5 star rating */}
          <div class="flex text-amber-400">
            <StarIcon class="w-5 h-5" />
            <StarIcon class="w-5 h-5" />
            <StarIcon class="w-5 h-5" />
            <StarIcon class="w-5 h-5" />
            <StarIcon class="w-5 h-5" />
          </div>
        </div>
        <blockquote class="text-gray-700 italic">
          "The best wedding food our guests had ever tasted!"
        </blockquote>
        <cite class="text-sm text-gray-500 mt-2 block">- Sarah M., Bride</cite>
      </div>
      
      <!-- Certification -->
      <div class="text-center">
        <div class="text-sm text-gray-600 mb-2">Licensed & Insured</div>
        <div class="text-primary-600 font-semibold">Michigan Food Service</div>
      </div>
      
    </div>
  </div>
</section>
```

#### Trust Signal Rules
- **Quantified Success**: Use specific numbers (years, events, clients)
- **Real Testimonials**: Actual client quotes with attribution
- **Visual Proof**: Star ratings, badges, certifications
- **Local Connection**: Emphasize Ann Arbor community ties
- **Professional Credentials**: Food safety, insurance, business licenses

### 4. Form Design Standards
```astro
<!-- ✅ Conversion-optimized contact form -->
<form class="max-w-lg mx-auto space-y-6" action="/api/contact" method="POST">
  
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
    <div>
      <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
        First Name *
      </label>
      <input
        type="text"
        id="firstName"
        name="firstName"
        required
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
        placeholder="Enter your first name"
      />
    </div>
    
    <div>
      <label for="lastName" class="block text-sm font-medium text-gray-700 mb-2">
        Last Name *
      </label>
      <input
        type="text"
        id="lastName"
        name="lastName"
        required
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
        placeholder="Enter your last name"
      />
    </div>
  </div>
  
  <div>
    <label for="eventType" class="block text-sm font-medium text-gray-700 mb-2">
      Event Type *
    </label>
    <select
      id="eventType"
      name="eventType"
      required
      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors"
    >
      <option value="">Select your event type</option>
      <option value="wedding">Wedding</option>
      <option value="corporate">Corporate Event</option>
      <option value="social">Social Celebration</option>
      <option value="other">Other</option>
    </select>
  </div>
  
  <button
    type="submit"
    class="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-4 px-6 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
  >
    Send My Request
  </button>
  
</form>
```

#### Form Design Rules
- **Minimal Fields**: Only ask for essential information initially
- **Clear Labels**: Descriptive labels with required field indicators
- **Generous Spacing**: Adequate padding and margin for easy interaction
- **Focus States**: Clear visual feedback for keyboard and mouse users
- **Error Handling**: Inline validation with helpful error messages
- **Submit Button**: Clear action text, full-width on mobile

## Accessibility Implementation

### 1. Keyboard Navigation
```astro
<!-- ✅ Proper focus management -->
<button 
  class="focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 rounded-lg"
  aria-label="Open image gallery"
>
  View Gallery
</button>

<!-- ✅ Skip navigation link -->
<a 
  href="#main-content"
  class="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-amber-500 text-white px-4 py-2 rounded-lg z-50"
>
  Skip to main content
</a>

<main id="main-content" tabindex="-1">
  <!-- Main content -->
</main>
```

### 2. Screen Reader Support
```astro
<!-- ✅ Semantic HTML structure -->
<article role="article" aria-labelledby="service-title">
  <header>
    <h2 id="service-title">Wedding Catering Services</h2>
  </header>
  
  <div class="service-content">
    <img 
      src="/wedding-photo.jpg"
      alt="Elegant Thai fusion wedding buffet with colorful appetizers and traditional decorations"
      role="img"
    />
    
    <p>Our wedding catering creates unforgettable culinary experiences...</p>
  </div>
  
  <footer>
    <a 
      href="/services/wedding-catering"
      aria-label="Learn more about wedding catering services"
    >
      Learn More
    </a>
  </footer>
</article>

<!-- ✅ ARIA landmarks -->
<nav role="navigation" aria-label="Main navigation">
  <!-- Navigation items -->
</nav>

<aside role="complementary" aria-label="Customer testimonials">
  <!-- Testimonials -->
</aside>
```

### 3. Color and Contrast Rules
```css
/* ✅ WCAG AA compliant color combinations */
.text-primary-contrast {
  color: #2C3E50; /* 4.5:1 contrast ratio on white */
}

.text-secondary-contrast {
  color: #374151; /* Adequate contrast for body text */
}

.bg-amber-accessible {
  background-color: #D97706; /* Darker amber for better contrast */
  color: white;
}

/* ❌ Avoid insufficient contrast */
.poor-contrast {
  color: #F39C12; /* Fails on white background */
  background-color: white;
}
```

## Performance-Aware Design

### 1. Image Loading Strategy
```astro
<!-- ✅ Performance-optimized image loading -->
<!-- Hero image: Load immediately -->
<Image
  src={heroImage}
  alt="Chef Nam preparing signature Thai fusion dish"
  width={1200}
  height={800}
  loading="eager"
  priority={true}
  class="object-cover w-full h-96"
/>

<!-- Gallery images: Lazy load -->
<Image
  src={galleryImage}
  alt="Corporate event with Thai fusion appetizer station"
  width={400}
  height={300}
  loading="lazy"
  class="object-cover rounded-lg hover:scale-105 transition-transform"
/>
```

### 2. Animation Performance
```css
/* ✅ GPU-accelerated animations */
.smooth-hover {
  transform: translateZ(0); /* Force GPU layer */
  transition: transform 0.2s ease-out;
}

.smooth-hover:hover {
  transform: translateY(-4px) translateZ(0);
}

/* ✅ Respect user preferences */
@media (prefers-reduced-motion: reduce) {
  .smooth-hover {
    transition: none;
  }
  
  .smooth-hover:hover {
    transform: none;
  }
}

/* ❌ Avoid layout-triggering animations */
.bad-animation {
  transition: width 0.3s ease; /* Causes layout recalculation */
}
```

## Cross-Device Considerations

### 1. Responsive Image Strategy
```astro
<!-- ✅ Multiple image sizes for responsive design -->
<picture>
  <source 
    media="(min-width: 1024px)"
    srcset={urlFor(image).width(800).height(600).format('webp').url()}
  />
  <source 
    media="(min-width: 768px)"
    srcset={urlFor(image).width(600).height(450).format('webp').url()}
  />
  <img 
    src={urlFor(image).width(400).height(300).format('webp').url()}
    alt="Thai fusion catering display"
    class="w-full h-auto object-cover rounded-lg"
  />
</picture>
```

### 2. Touch vs Mouse Interactions
```css
/* ✅ Device-appropriate interactions */
@media (hover: hover) {
  .desktop-hover:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(0,0,0,0.1);
  }
}

@media (hover: none) {
  .mobile-touch {
    /* Touch-friendly styling without hover effects */
    padding: 1rem; /* Larger touch targets */
  }
}
```

## Quality Assurance Rules

### 1. Pre-Launch Design Checklist
- [ ] All images have descriptive alt text
- [ ] Color contrast meets WCAG AA standards
- [ ] All interactive elements have focus states
- [ ] Forms include proper labels and validation
- [ ] Text is readable at 16px base size
- [ ] Touch targets are minimum 44px
- [ ] Page layouts work on 320px wide screens
- [ ] All fonts load with proper fallbacks

### 2. Content Quality Standards
- [ ] Food photography is high-quality and appetizing
- [ ] All testimonials are real and attributed
- [ ] Trust signals are accurate and verifiable
- [ ] Contact information is current and tested
- [ ] CTAs use action-oriented language
- [ ] Error states provide helpful guidance

### 3. Performance Design Impact
- [ ] Critical CSS is inlined for above-fold content
- [ ] Non-essential images are lazy loaded
- [ ] Animations use transform and opacity only
- [ ] Font loading doesn't cause layout shift
- [ ] Image dimensions prevent cumulative layout shift

Remember: **Every design decision should enhance the user's journey from discovery to contacting Chef Nam for their catering needs.** Beautiful design that doesn't convert is unsuccessful design.