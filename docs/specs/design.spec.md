# Design Implementation Specification

## Purpose
This specification defines WHAT design elements and layouts to implement for the Chef Nam Catering website. Each section includes detailed wireframes, component specifications, and acceptance criteria.

## 1. Homepage Design Specification

### 1.1 Hero Section Layout

**Section Purpose**: Immediate impact, value proposition, primary conversion

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│ Navigation Bar (Sticky)                                    │
├─────────────────────────────────────────────────────────────┤
│  Hero Content (Left 50%)           │  Hero Image (Right 50%) │
│                                    │                         │
│  H1: "Thai Fusion Catering        │                         │
│       in Ann Arbor"               │  [High-quality food     │
│                                    │   photography showing   │
│  Subheading: "Bringing authentic   │   colorful Thai fusion  │
│  Thai flavors with Michigan charm  │   dishes]               │
│  to your special events"           │                         │
│                                    │                         │
│  [Get Your Quote] [Call Now]       │                         │
│                                    │                         │
│  Trust signals: ⭐⭐⭐⭐⭐ 50+ Reviews │                         │
└─────────────────────────────────────────────────────────────┘
```

**Component Specifications**:

#### Hero Text Content
```astro
<div class="lg:w-1/2 lg:pr-8">
  <h1 class="text-4xl lg:text-6xl font-serif font-bold text-gray-900 mb-6 leading-tight">
    Thai Fusion Catering in 
    <span class="text-amber-600">Ann Arbor</span>
  </h1>
  
  <p class="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
    Bringing authentic Thai flavors with Michigan charm to your special events
  </p>
  
  <div class="flex flex-col sm:flex-row gap-4 mb-8">
    <Button 
      href="/contact"
      variant="primary"
      size="xl"
      class="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-all transform hover:scale-105"
    >
      Get Your Custom Quote
    </Button>
    
    <Button 
      href="tel:+1-734-555-0123"
      variant="secondary"
      size="xl" 
      class="border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white font-bold py-4 px-8 rounded-lg text-lg transition-all"
    >
      📞 Call Now
    </Button>
  </div>
  
  <div class="flex items-center space-x-2">
    <div class="flex text-amber-400">
      <!-- 5 star SVGs -->
    </div>
    <span class="text-gray-600 font-medium">4.9/5 from 50+ reviews</span>
  </div>
</div>
```

#### Hero Image Requirements
- **Dimensions**: 800x600px minimum, 1200x900px preferred
- **Content**: Signature Thai fusion dish with vibrant colors
- **Style**: Professional food photography with natural lighting
- **Alt Text**: "Chef Nam's signature Thai fusion appetizers featuring fresh herbs, colorful vegetables, and traditional spices"

**Acceptance Criteria**:
- [ ] Hero section is visible above-the-fold on all devices
- [ ] Primary CTA button has 6:1 color contrast ratio
- [ ] Hero image loads in <1.5 seconds
- [ ] Text is readable on smallest mobile devices (320px)
- [ ] Trust signals are prominent and verifiable

### 1.2 Services Overview Section

**Section Purpose**: Introduce three main service categories with visual appeal

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│                     Section Header                         │
│                                                             │
│  H2: "Our Catering Services"                              │
│  Subheading: "Exceptional cuisine for every occasion"      │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Corporate Card]  │  [Wedding Card]   │  [Social Card]    │
│                    │                   │                   │
│  [Service Image]   │  [Service Image]  │  [Service Image]  │
│  Corporate         │  Wedding          │  Social Events    │
│  Catering          │  Catering         │                   │
│                    │                   │                   │
│  Professional     │  Memorable         │  Celebratory      │
│  Thai fusion for   │  culinary          │  gatherings with  │
│  meetings, events  │  experiences for   │  friends & family │
│  & conferences     │  your special day  │                   │
│                    │                   │                   │
│  [Learn More]      │  [Learn More]     │  [Learn More]     │
└─────────────────────────────────────────────────────────────┘
```

**Service Card Component**:
```astro
<div class="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden group">
  <div class="relative h-64 overflow-hidden">
    <Image
      src={service.image}
      alt={service.imageAlt}
      width={400}
      height={256}
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
  </div>
  
  <div class="p-6">
    <h3 class="text-2xl font-serif font-semibold text-gray-900 mb-3">
      {service.title}
    </h3>
    
    <p class="text-gray-600 mb-6 leading-relaxed">
      {service.description}
    </p>
    
    <div class="flex items-center justify-between">
      <div class="text-sm text-gray-500">
        Starting at <span class="font-semibold text-amber-600">${service.startingPrice}</span>
      </div>
      
      <Button 
        href={`/services/${service.slug}`}
        variant="outline"
        size="sm"
        class="text-primary-600 border-primary-600 hover:bg-primary-600 hover:text-white transition-all"
      >
        Learn More →
      </Button>
    </div>
  </div>
</div>
```

**Acceptance Criteria**:
- [ ] Three service cards display in grid layout
- [ ] Cards are touch-friendly on mobile (44px minimum touch targets)
- [ ] Hover effects work on desktop, touch-appropriate on mobile
- [ ] Images are optimized and load progressively
- [ ] Each card links to appropriate service page

### 1.3 About Preview Section

**Section Purpose**: Build trust through Chef Nam's story and expertise

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│  Chef Photo (Left 40%)        │  Content (Right 60%)        │
│                               │                              │
│  [Professional photo of       │  H2: "Meet Chef Nam"        │
│   Chef Nam in kitchen or      │                              │
│   with signature dishes]      │  "Born in rural Thailand... │
│                               │   bringing authentic flavors │
│                               │   to Ann Arbor..."           │
│                               │                              │
│                               │  • 15+ years experience      │
│                               │  • Traditional techniques    │
│                               │  • Local ingredients         │
│                               │  • Women-owned business      │
│                               │                              │
│                               │  [Read Our Story]            │
└─────────────────────────────────────────────────────────────┘
```

**Content Requirements**:
- **Chef Photo**: Professional headshot or action shot in kitchen
- **Bio Text**: 150-200 words focusing on Thai heritage and local connection
- **Credentials**: Highlight experience, training, and business ownership
- **Personal Touch**: Include quote from Chef Nam in script font

### 1.4 Testimonials Section

**Section Purpose**: Social proof and credibility building

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│                    H2: "What Our Clients Say"              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Testimonial 1]    │  [Testimonial 2]    │  [Testimonial 3] │
│                     │                     │                  │
│  ⭐⭐⭐⭐⭐         │  ⭐⭐⭐⭐⭐         │  ⭐⭐⭐⭐⭐        │
│                     │                     │                  │
│  "The food was      │  "Professional      │  "Amazing Thai   │
│   absolutely        │   service and       │   fusion for our │
│   incredible..."    │   delicious..."     │   wedding..."    │
│                     │                     │                  │
│  - Sarah M.         │  - Tech Corp        │  - Jennifer K.   │
│    Wedding          │    Ann Arbor        │    Anniversary   │
└─────────────────────────────────────────────────────────────┘
```

**Testimonial Card Component**:
```astro
<div class="bg-white p-6 rounded-lg shadow-md">
  <div class="flex text-amber-400 mb-4">
    {/* 5 star icons */}
  </div>
  
  <blockquote class="text-gray-700 mb-4 italic leading-relaxed">
    "{testimonial.quote}"
  </blockquote>
  
  <footer class="border-t pt-4">
    <div class="flex items-center">
      {testimonial.photo && (
        <img 
          src={testimonial.photo}
          alt={testimonial.name}
          class="w-12 h-12 rounded-full mr-4"
        />
      )}
      <div>
        <cite class="font-semibold text-gray-900">{testimonial.name}</cite>
        <div class="text-sm text-gray-600">{testimonial.eventType}</div>
      </div>
    </div>
  </footer>
</div>
```

### 1.5 Latest Blog Posts Section

**Section Purpose**: Content engagement and expertise demonstration

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│                   Section Header                           │
│                                                             │
│  H2: "Latest from Our Kitchen"                             │
│  Subheading: "Fresh Ideas & Culinary Inspiration"          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Blog Post 1]     │  [Blog Post 2]     │  [Blog Post 3]   │
│                    │                    │                   │
│  [Featured Image]  │  [Featured Image]  │  [Featured Image] │
│  Date • Category   │  Date • Category   │  Date • Category  │
│  Post Title        │  Post Title        │  Post Title       │
│  Excerpt text...   │  Excerpt text...   │  Excerpt text...  │
│  [Read More →]     │  [Read More →]     │  [Read More →]    │
└─────────────────────────────────────────────────────────────┘
```

**Blog Card Component**:
```astro
<article class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow group">
  <div class="aspect-video overflow-hidden">
    <Image
      src={post.featuredImage.url}
      alt={post.featuredImage.alt}
      width={400}
      height={225}
      loading="lazy"
      class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
    />
  </div>
  
  <div class="p-6">
    <div class="flex items-center text-sm text-brand-indigo/60 mb-3">
      <time datetime={post.publishedAt}>
        {formatDate(post.publishedAt)}
      </time>
      <span class="mx-2">•</span>
      <span>{post.category}</span>
    </div>
    
    <h3 class="text-xl font-serif font-semibold text-brand-indigo mb-3 line-clamp-2">
      {post.title}
    </h3>
    
    <p class="text-brand-indigo/70 mb-4 line-clamp-3 leading-relaxed">
      {post.excerpt}
    </p>
    
    <a 
      href={`/blog/${post.slug}`}
      class="inline-flex items-center text-brand-amber hover:text-brand-amber/80 font-medium transition-colors group-hover:translate-x-1 duration-200"
    >
      Read More
      <svg class="w-4 h-4 ml-2" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    </a>
  </div>
</article>
```

**Content Requirements**:
- **Featured Image**: High-quality, relevant to post topic
- **Post Title**: SEO-optimized, under 60 characters
- **Excerpt**: 2-3 sentences summarizing the post
- **Category**: Clear categorization (Recipes, Tips, Events, etc.)
- **Read More Link**: Accessible and descriptive

### 1.6 Contact CTA Section

**Section Purpose**: Final conversion opportunity with urgency

**Layout Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│                Background: Subtle cream color               │
│                                                             │
│               H2: "Ready to Create Your Event?"            │
│                                                             │
│            "Let's discuss your vision and create a          │
│             custom menu that will delight your guests"     │
│                                                             │
│         [Get Your Quote Today]  [Call: (734) 555-0123]     │
│                                                             │
│              "📧 info@chefnamcatering.com"                 │
│            "📍 Serving Ann Arbor & Surrounding Areas"      │
└─────────────────────────────────────────────────────────────┘
```

## 2. Service Pages Design Specification

### 2.1 Service Page Layout Template

**Purpose**: Detailed service information with conversion optimization

**Page Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│ Navigation                                                  │
├─────────────────────────────────────────────────────────────┤
│ Service Hero Section                                        │
│ - Large background image                                    │
│ - Service title overlay                                     │
│ - Brief description                                         │
│ - Quick contact CTA                                         │
├─────────────────────────────────────────────────────────────┤
│ Service Details Section                                     │
│ - What's included                                           │
│ - Process overview                                          │
│ - Pricing information                                       │
├─────────────────────────────────────────────────────────────┤
│ Gallery Section                                             │
│ - Past event photos                                         │
│ - Food presentations                                        │
│ - Setup examples                                            │
├─────────────────────────────────────────────────────────────┤
│ FAQ Section                                                 │
│ - Service-specific questions                                │
│ - Process clarifications                                    │
│ - Pricing details                                           │
├─────────────────────────────────────────────────────────────┤
│ Related Services                                            │
│ - Cross-sell opportunities                                  │
│ - Service combinations                                      │
├─────────────────────────────────────────────────────────────┤
│ Latest Blog Posts Section                                   │
│ - 3-card layout with recent posts                          │
│ - Drive content engagement                                  │
├─────────────────────────────────────────────────────────────┤
│ Contact CTA Section                                         │
│ - Final conversion opportunity                              │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Corporate Catering Page Specifics

**Hero Section Content**:
```astro
<section class="relative h-96 lg:h-[500px] bg-gray-900 flex items-center justify-center overflow-hidden">
  <div class="absolute inset-0">
    <Image
      src="/images/corporate-catering-hero.jpg"
      alt="Professional Thai fusion lunch spread for corporate meeting"
      width={1200}
      height={500}
      class="w-full h-full object-cover opacity-70"
    />
  </div>
  
  <div class="relative z-10 text-center text-white max-w-4xl mx-auto px-4">
    <h1 class="text-4xl lg:text-6xl font-serif font-bold mb-6">
      Corporate Catering Excellence
    </h1>
    
    <p class="text-xl lg:text-2xl mb-8 max-w-2xl mx-auto">
      Impress your team and clients with authentic Thai fusion cuisine for meetings, conferences, and corporate events
    </p>
    
    <Button 
      href="/contact"
      variant="primary"
      size="xl"
      class="bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-8 rounded-lg text-lg"
    >
      Request Corporate Quote
    </Button>
  </div>
</section>
```

**Service Details Component**:
```astro
<section class="py-16 bg-white">
  <div class="max-w-6xl mx-auto px-4">
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
      
      <div>
        <h2 class="text-3xl font-serif font-semibold text-gray-900 mb-6">
          What's Included
        </h2>
        
        <ul class="space-y-4">
          <li class="flex items-start">
            <CheckIcon class="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 class="font-semibold text-gray-900">Custom Menu Planning</h3>
              <p class="text-gray-600">Tailored to your event size, dietary needs, and budget</p>
            </div>
          </li>
          
          <li class="flex items-start">
            <CheckIcon class="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 class="font-semibold text-gray-900">Professional Setup</h3>
              <p class="text-gray-600">Complete buffet or plated service with elegant presentation</p>
            </div>
          </li>
          
          <li class="flex items-start">
            <CheckIcon class="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" />
            <div>
              <h3 class="font-semibold text-gray-900">Dietary Accommodations</h3>
              <p class="text-gray-600">Vegetarian, vegan, gluten-free, and allergy-friendly options</p>
            </div>
          </li>
        </ul>
      </div>
      
      <div>
        <Image
          src="/images/corporate-service-details.jpg"
          alt="Corporate lunch buffet setup with Thai fusion dishes"
          width={600}
          height={400}
          class="rounded-lg shadow-lg"
        />
      </div>
      
    </div>
  </div>
</section>
```

### 2.3 Wedding Catering Page Specifics

**Emotional Design Elements**:
- **Color Scheme**: Softer palette with romantic lighting in photos
- **Typography**: More script font usage for personal touches
- **Imagery**: Focus on elegant presentations and happy couples
- **CTAs**: "Make Your Day Perfect" instead of generic "Get Quote"

**Unique Components**:
```astro
<!-- Tasting Process Section -->
<section class="py-16 bg-cream">
  <div class="max-w-4xl mx-auto px-4 text-center">
    <h2 class="text-3xl font-serif font-semibold text-gray-900 mb-6">
      Your Tasting Experience
    </h2>
    
    <div class="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
      <div class="text-center">
        <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl font-bold text-amber-600">1</span>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">Consultation</h3>
        <p class="text-gray-600">Discuss your vision, guest count, and preferences</p>
      </div>
      
      <div class="text-center">
        <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl font-bold text-amber-600">2</span>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">Custom Tasting</h3>
        <p class="text-gray-600">Sample our signature dishes and proposed menu</p>
      </div>
      
      <div class="text-center">
        <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="text-2xl font-bold text-amber-600">3</span>
        </div>
        <h3 class="font-semibold text-gray-900 mb-2">Perfect Day</h3>
        <p class="text-gray-600">Flawless execution of your dream wedding menu</p>
      </div>
    </div>
  </div>
</section>
```

## 3. Contact Page Design Specification

### 3.1 Contact Page Layout

**Purpose**: Maximum conversion with multiple contact methods

**Page Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│ Page Hero                                                   │
│ - "Get in Touch" heading                                    │
│ - "Ready to plan your event?" subheading                   │
├─────────────────────────────────────────────────────────────┤
│ Contact Form (Left 60%)      │ Contact Info (Right 40%)    │
│                              │                              │
│ [Comprehensive contact       │ 📞 Phone: (734) 555-0123    │
│  form with all necessary     │ 📧 Email: info@chef...      │
│  fields for quotes]          │ 📍 Service Areas            │
│                              │ 🕒 Hours: Mon-Fri 9-6       │
│                              │                              │
│                              │ [Map of service areas]      │
├─────────────────────────────────────────────────────────────┤
│ FAQ Section                                                 │
│ - Common questions about booking, pricing, etc.            │
├─────────────────────────────────────────────────────────────┤
│ Response Time Promise                                       │
│ - "We respond within 4 hours during business hours"        │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Contact Form Specification

**Form Purpose**: Gather enough information for accurate quotes

**Required Fields**:
```astro
<form class="space-y-6 bg-white p-8 rounded-lg shadow-lg">
  
  <!-- Personal Information -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label for="firstName" class="block text-sm font-medium text-gray-700 mb-2">
        First Name *
      </label>
      <input
        type="text"
        id="firstName"
        name="firstName"
        required
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      />
    </div>
  </div>
  
  <!-- Contact Information -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
        Email Address *
      </label>
      <input
        type="email"
        id="email"
        name="email"
        required
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      />
    </div>
    
    <div>
      <label for="phone" class="block text-sm font-medium text-gray-700 mb-2">
        Phone Number
      </label>
      <input
        type="tel"
        id="phone"
        name="phone"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      />
    </div>
  </div>
  
  <!-- Event Information -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label for="eventType" class="block text-sm font-medium text-gray-700 mb-2">
        Event Type *
      </label>
      <select
        id="eventType"
        name="eventType"
        required
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      >
        <option value="">Select your event type</option>
        <option value="wedding">Wedding</option>
        <option value="corporate">Corporate Event</option>
        <option value="social">Social Celebration</option>
        <option value="other">Other</option>
      </select>
    </div>
    
    <div>
      <label for="eventDate" class="block text-sm font-medium text-gray-700 mb-2">
        Event Date
      </label>
      <input
        type="date"
        id="eventDate"
        name="eventDate"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      />
    </div>
  </div>
  
  <!-- Event Details -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label for="guestCount" class="block text-sm font-medium text-gray-700 mb-2">
        Expected Guest Count
      </label>
      <select
        id="guestCount"
        name="guestCount"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      >
        <option value="">Select guest count</option>
        <option value="1-25">1-25 guests</option>
        <option value="26-50">26-50 guests</option>
        <option value="51-100">51-100 guests</option>
        <option value="101-200">101-200 guests</option>
        <option value="200+">200+ guests</option>
      </select>
    </div>
    
    <div>
      <label for="budget" class="block text-sm font-medium text-gray-700 mb-2">
        Budget Range
      </label>
      <select
        id="budget"
        name="budget"
        class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
      >
        <option value="">Select budget range</option>
        <option value="under-1000">Under $1,000</option>
        <option value="1000-2500">$1,000 - $2,500</option>
        <option value="2500-5000">$2,500 - $5,000</option>
        <option value="5000-10000">$5,000 - $10,000</option>
        <option value="10000+">$10,000+</option>
      </select>
    </div>
  </div>
  
  <!-- Message -->
  <div>
    <label for="message" class="block text-sm font-medium text-gray-700 mb-2">
      Tell us about your event *
    </label>
    <textarea
      id="message"
      name="message"
      rows="4"
      required
      placeholder="Please share any details about your event, dietary restrictions, venue, or special requests..."
      class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
    ></textarea>
  </div>
  
  <!-- Submit Button -->
  <button
    type="submit"
    class="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-4 px-6 rounded-lg transition-colors text-lg"
  >
    Send My Request
  </button>
  
  <p class="text-sm text-gray-600 text-center">
    We'll respond within 4 hours during business hours
  </p>
  
</form>
```

## 4. Component Design Specifications

### 4.1 Navigation Component

**Mobile Navigation**:
```astro
<!-- Mobile menu button -->
<button 
  type="button"
  class="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-amber-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
  aria-expanded="false"
  aria-label="Main menu"
>
  <HamburgerIcon class="w-6 h-6" />
</button>

<!-- Mobile menu overlay -->
<div class="md:hidden fixed inset-0 z-50 bg-white">
  <div class="flex flex-col h-full">
    <div class="flex items-center justify-between p-4 border-b">
      <img src="/logo.svg" alt="Chef Nam Catering" class="h-8" />
      <button class="p-2 text-gray-700">
        <XIcon class="w-6 h-6" />
      </button>
    </div>
    
    <nav class="flex-1 px-4 py-6 space-y-6">
      <a href="/" class="block text-2xl font-medium text-gray-900">Home</a>
      <a href="/services" class="block text-2xl font-medium text-gray-900">Services</a>
      <a href="/about" class="block text-2xl font-medium text-gray-900">About</a>
      <a href="/gallery" class="block text-2xl font-medium text-gray-900">Gallery</a>
      <a href="/contact" class="block text-2xl font-medium text-gray-900">Contact</a>
    </nav>
    
    <div class="p-4 border-t">
      <Button 
        href="/contact"
        variant="primary"
        size="lg"
        class="w-full bg-amber-500 text-white font-bold py-4 rounded-lg"
      >
        Get Your Quote
      </Button>
    </div>
  </div>
</div>
```

### 4.2 Footer Component

**Footer Layout**:
```astro
<footer class="bg-primary-600 text-white">
  <div class="max-w-7xl mx-auto px-4 py-12">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      
      <!-- Company Info -->
      <div class="md:col-span-2">
        <img src="/logo-white.svg" alt="Chef Nam Catering" class="h-12 mb-4" />
        <p class="text-primary-100 mb-4 max-w-md">
          Authentic Thai fusion catering bringing global flavors with local Michigan charm to your special events.
        </p>
        <div class="flex space-x-4">
          <a href="#" class="text-primary-100 hover:text-white transition-colors">
            <FacebookIcon class="w-6 h-6" />
          </a>
          <a href="#" class="text-primary-100 hover:text-white transition-colors">
            <InstagramIcon class="w-6 h-6" />
          </a>
        </div>
      </div>
      
      <!-- Quick Links -->
      <div>
        <h3 class="font-semibold text-white mb-4">Services</h3>
        <ul class="space-y-2">
          <li><a href="/services/corporate" class="text-primary-100 hover:text-white transition-colors">Corporate Catering</a></li>
          <li><a href="/services/wedding" class="text-primary-100 hover:text-white transition-colors">Wedding Catering</a></li>
          <li><a href="/services/social" class="text-primary-100 hover:text-white transition-colors">Social Events</a></li>
        </ul>
      </div>
      
      <!-- Contact Info -->
      <div>
        <h3 class="font-semibold text-white mb-4">Contact</h3>
        <ul class="space-y-2">
          <li class="flex items-center">
            <PhoneIcon class="w-5 h-5 mr-2" />
            <a href="tel:+1-734-555-0123" class="text-primary-100 hover:text-white transition-colors">
              (734) 555-0123
            </a>
          </li>
          <li class="flex items-center">
            <EmailIcon class="w-5 h-5 mr-2" />
            <a href="mailto:info@chefnamcatering.com" class="text-primary-100 hover:text-white transition-colors">
              info@chefnamcatering.com
            </a>
          </li>
          <li class="flex items-start">
            <LocationIcon class="w-5 h-5 mr-2 mt-1" />
            <span class="text-primary-100">
              Serving Ann Arbor & Washtenaw County
            </span>
          </li>
        </ul>
      </div>
      
    </div>
    
    <div class="border-t border-primary-500 mt-8 pt-8 text-center">
      <p class="text-primary-100">
        © 2024 Chef Nam Catering. All rights reserved. | 
        <a href="/privacy" class="hover:text-white transition-colors">Privacy Policy</a>
      </p>
    </div>
  </div>
</footer>
```

## 5. Gallery Design Specification

### 5.1 Gallery Layout

**Purpose**: Visual portfolio showcasing food quality and event success

**Layout Options**:
```
Option A: Masonry Grid
┌─────┐ ┌───────┐ ┌─────┐
│     │ │       │ │     │
│     │ │       │ │     │
└─────┘ │       │ └─────┘
┌─────┐ │       │ ┌─────┐
│     │ └───────┘ │     │
└─────┘ ┌─────┐   │     │
┌───────┐│     │   └─────┘
│       ││     │
│       │└─────┘

Option B: Uniform Grid (Recommended)
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│     │ │     │ │     │ │     │
│     │ │     │ │     │ │     │
└─────┘ └─────┘ └─────┘ └─────┘
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│     │ │     │ │     │ │     │
│     │ │     │ │     │ │     │
└─────┘ └─────┘ └─────┘ └─────┘
```

**Gallery Component**:
```astro
<section class="py-16 bg-white">
  <div class="max-w-7xl mx-auto px-4">
    <div class="text-center mb-12">
      <h2 class="text-4xl font-serif font-semibold text-gray-900 mb-4">
        Our Portfolio
      </h2>
      <p class="text-xl text-gray-600 max-w-3xl mx-auto">
        See the beautiful presentations and memorable moments we've created for our clients
      </p>
    </div>
    
    <!-- Filter Tabs -->
    <div class="flex justify-center mb-8">
      <div class="bg-gray-100 p-1 rounded-lg">
        <button class="px-4 py-2 rounded-md bg-white text-primary-600 font-medium shadow-sm">
          All Events
        </button>
        <button class="px-4 py-2 rounded-md text-gray-600 hover:text-primary-600 transition-colors">
          Weddings
        </button>
        <button class="px-4 py-2 rounded-md text-gray-600 hover:text-primary-600 transition-colors">
          Corporate
        </button>
        <button class="px-4 py-2 rounded-md text-gray-600 hover:text-primary-600 transition-colors">
          Social Events
        </button>
      </div>
    </div>
    
    <!-- Image Grid -->
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {galleryImages.map((image, index) => (
        <div class="group cursor-pointer" onclick={`openLightbox(${index})`}>
          <div class="aspect-square overflow-hidden rounded-lg bg-gray-100">
            <Image
              src={image.src}
              alt={image.alt}
              width={300}
              height={300}
              loading="lazy"
              class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        </div>
      ))}
    </div>
  </div>
</section>
```

## 6. Success Metrics & Testing

### 6.1 Conversion Optimization Metrics

**Primary KPIs**:
- Contact form submission rate: Target >3%
- Phone call click-through rate: Target >1%
- Time on site: Target >2 minutes
- Bounce rate: Target <60%
- Page load speed: Target <1.5 seconds

### 6.2 A/B Testing Opportunities

**Hero Section Tests**:
- CTA button text: "Get Quote" vs "Plan Your Event"
- Hero image: Food-focused vs event-focused
- Value proposition: "Thai Fusion" vs "Authentic Thai"

**Form Optimization Tests**:
- Form length: Full form vs progressive disclosure
- Field labels: Traditional vs conversational tone
- Submit button: "Send Request" vs "Get My Quote"

### 6.3 Accessibility Testing Checklist

**WCAG 2.1 AA Compliance**:
- [ ] Color contrast ratios meet 4.5:1 minimum
- [ ] All images have descriptive alt text
- [ ] Form fields have proper labels
- [ ] Keyboard navigation works throughout
- [ ] Focus indicators are clearly visible
- [ ] Screen reader testing completed
- [ ] Text scales to 200% without horizontal scrolling

**Acceptance Criteria**:
- [ ] All designs are mobile-responsive
- [ ] Core Web Vitals scores >90
- [ ] Cross-browser compatibility verified
- [ ] Touch targets are minimum 44px
- [ ] Forms include proper validation
- [ ] Images are optimized for web
- [ ] Typography scales appropriately
- [ ] Color schemes follow brand guidelines

This design specification provides the detailed blueprint for creating a conversion-optimized, accessible, and visually appealing website that effectively represents Chef Nam Catering's unique Thai fusion offering to the Ann Arbor market.