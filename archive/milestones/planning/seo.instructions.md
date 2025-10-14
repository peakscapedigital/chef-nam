---
applyTo: "**/*.{js,jsx,ts,tsx,html,md,mdx}"
description: "SEO behavioral rules and quality standards for Chef Nam Catering website"
---

# SEO Instructions

## Purpose
These instructions define HOW to implement SEO across the Chef Nam Catering website. Follow these behavioral rules when creating or modifying any content, code, or configuration that impacts search visibility.

## Core Behavioral Rules

### 1. Keyword Integration Rules
- **Natural Integration**: Never force keywords - they must read naturally
- **Keyword Density**: Maintain 1-2% keyword density (avoid over-optimization)
- **Semantic Variations**: Use synonyms and related terms, not just exact matches
- **Context First**: User experience always trumps keyword placement

### 2. Content Creation Rules
- **Unique Content Only**: Never duplicate content across pages
- **Minimum Length**: Service pages require 500+ words, blog posts 800+ words
- **User Intent Match**: Content must directly answer the search query
- **Fresh Content**: Update existing pages quarterly, add new blog posts monthly

### 3. Technical Implementation Rules

#### Meta Tags
```html
<!-- ALWAYS include these meta tags -->
<title>{Primary Keyword} - {Secondary} | Chef Nam Catering</title>
<meta name="description" content="{Compelling 150-160 char description with keywords}">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="canonical" href="{absolute-url}">
```

#### Heading Hierarchy
- ✅ ONE H1 per page containing primary keyword
- ✅ H2s for main sections with related keywords
- ✅ Logical flow: H1 → H2 → H3 (never skip levels)
- ❌ Never use headings for styling only

#### Image Optimization
- ✅ Descriptive file names: `thai-fusion-wedding-catering-ann-arbor.jpg`
- ✅ Alt text with keywords: `alt="Thai fusion appetizers for Ann Arbor wedding"`
- ✅ Compress images to < 200KB when possible
- ✅ Use WebP format with fallbacks
- ❌ Never use generic names like `image1.jpg`

### 4. URL Structure Rules
- ✅ `/services/wedding-catering` (descriptive, hyphenated)
- ❌ `/page?id=123` (avoid parameters when possible)
- ✅ Lowercase only
- ✅ Maximum 3-4 words
- ✅ Include target keyword

### 5. Internal Linking Rules
- **Minimum Links**: 3-5 internal links per page
- **Anchor Text**: Descriptive, vary the text, include keywords naturally
- **Link Relevance**: Only link to topically related pages
- **Link Distribution**: Prioritize links to important pages

### 6. Local SEO Rules

#### NAP Consistency
```javascript
// Use this exact format everywhere:
const businessInfo = {
  name: "Chef Nam Catering",
  address: "[Exact address when determined]",
  phone: "[Format: (XXX) XXX-XXXX]",
  // Never vary this information across platforms
}
```

#### Location Keywords
- Always include city name in title tags for service pages
- Mention "Ann Arbor" and surrounding cities naturally in content
- Create location-specific landing pages for each service area

### 7. Schema Markup Rules
- ✅ Implement on EVERY page (appropriate type)
- ✅ Test with Google's Rich Results Test
- ✅ Use JSON-LD format (not microdata)
- ✅ Include LocalBusiness schema on every page footer

Example:
```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FoodEstablishment",
  "name": "Chef Nam Catering",
  "image": "[logo-url]",
  "servesCuisine": ["Thai Fusion", "American", "Thai"],
  // Complete all applicable fields
}
</script>
```

### 8. Performance Rules
- **Page Speed**: Must load in < 3 seconds on mobile
- **Core Web Vitals**: Must pass all three metrics
- **Mobile-First**: Design and test mobile version first
- **Lazy Loading**: Implement for images below the fold

### 9. Content Quality Checkpoints

Before publishing any page, verify:
- [ ] Title tag is unique and under 60 characters
- [ ] Meta description is unique and 150-160 characters
- [ ] H1 tag is present and contains primary keyword
- [ ] Content is 500+ words (for service pages)
- [ ] 3+ internal links with varied anchor text
- [ ] All images have descriptive alt text
- [ ] Schema markup is implemented and tested
- [ ] Page loads in under 3 seconds
- [ ] Mobile-friendly test passes
- [ ] No duplicate content issues

### 10. Link Building Rules
- **Quality Over Quantity**: One high-quality link > 10 low-quality links
- **Natural Profile**: Mix of homepage and deep page links
- **Anchor Text Diversity**: Brand, naked URL, and keyword anchors
- **Local Focus**: Prioritize local Ann Arbor area links
- **No Black Hat**: Never buy links or use PBNs

## Cross-Domain Coordination

### When Working with Design
- Ensure text is readable (16px minimum)
- Maintain color contrast for accessibility
- Design with mobile-first approach
- Keep important content above the fold

### When Working with Development
- Implement server-side rendering for SEO-critical content
- Use semantic HTML5 elements
- Ensure crawlable JavaScript
- Implement proper 301 redirects
- Create XML sitemap automatically

### When Working with Content
- Research keywords BEFORE writing
- Match search intent with content type
- Include related keywords naturally
- Add FAQ sections for voice search
- Update dates on refreshed content

## Testing and Validation

### Pre-Launch Checklist
1. Run Screaming Frog crawl
2. Check Google Search Console for errors
3. Validate all schema markup
4. Test page speed on all templates
5. Verify mobile responsiveness
6. Check for duplicate content
7. Validate XML sitemap
8. Test internal links for 404s

### Post-Launch Monitoring
- Daily: Check Search Console for errors
- Weekly: Monitor keyword rankings
- Monthly: Analyze organic traffic trends
- Quarterly: Conduct full technical audit

## Common Pitfalls to Avoid

❌ **Keyword Stuffing**: Unnatural keyword repetition
❌ **Thin Content**: Pages with < 300 words
❌ **Duplicate Content**: Same content on multiple pages
❌ **Broken Links**: Internal or external 404s
❌ **Missing Alt Text**: Images without descriptions
❌ **Slow Load Times**: Pages taking > 3 seconds
❌ **Non-Mobile Friendly**: Requires pinching/zooming
❌ **Over-Optimization**: Too many exact match keywords
❌ **Cloaking**: Showing different content to Google
❌ **Hidden Text**: Text same color as background

## Escalation and Questions

When uncertain about SEO impact:
1. Check against Google's Quality Guidelines
2. Reference `/docs/seo.md` for technical details
3. Test changes in staging environment first
4. Monitor impact for 2 weeks post-deployment
5. Document lessons learned for team

Remember: **User experience first, search engines second.** Good SEO enhances usability, never detracts from it.