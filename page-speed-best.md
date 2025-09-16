# Optimizing PageSpeed with Astro + Sanity + Cloudflare Pages

This SOP outlines best practices and implementation patterns for achieving optimal PageSpeed scores when building websites using Astro, Sanity, and deploying on Cloudflare Pages.

---

## Quick Wins

- **Use Astro’s built-in image optimization** wherever possible to serve appropriately sized images.
- **Leverage Sanity’s image URL builder** to generate optimized image URLs with proper parameters like width, format, and quality.
- **Enable Cloudflare’s automatic image optimization** features such as Polish and Mirage.
- **Minify and compress assets** using Cloudflare’s built-in features.
- **Implement caching strategies** at Cloudflare to reduce load times.
- **Lazy-load images and non-critical assets** in Astro components.
- **Use Astro’s partial hydration** to reduce JavaScript payload.

---

## Sanity Image Rules

- Always **use Sanity’s `imageUrlBuilder`** to generate image URLs.
- Specify **width (`w`) and height (`h`) parameters** to avoid layout shifts.
- Use **`auto=format` and `q=75`** to serve optimized formats and quality.
- Use **`fit=crop` or `fit=max`** depending on the desired image behavior.
- Avoid requesting images larger than the display size.
- For responsive images, generate multiple widths and use `srcset`.

Example:

```js
const imageUrl = imageUrlBuilder(sanityClient)
  .image(image)
  .width(800)
  .auto('format')
  .quality(75)
  .url();
```

---

## Sanity API / GROQ Pitfalls

- Avoid fetching large datasets or unnecessary fields.
- Use projections to limit fields to only what is needed.
- Cache GROQ queries where possible.
- Beware of nested queries that may increase response size.
- Sanity API responses can be slow if overfetching; optimize queries accordingly.

---

## Implementation Pattern

1. **Fetch data at build time** using Astro’s server-side data fetching.
2. Use Sanity’s `imageUrlBuilder` to generate optimized image URLs.
3. Pass these URLs to Astro’s `<img>` or `<Image>` components.
4. Use responsive image techniques (`srcset`, `sizes`) to serve appropriate images.
5. Implement lazy loading for offscreen images with `loading="lazy"`.
6. Minimize JavaScript by leveraging Astro’s partial hydration and island architecture.
7. Use Cloudflare Pages for deployment with caching and image optimizations enabled.

---

## Cloudflare Specifics

- Enable **Polish** for automatic image optimization.
- Enable **Mirage** for mobile image optimization.
- Set up **Page Rules** to cache static assets aggressively.
- Use **Workers** if custom caching or edge logic is needed.
- Use **HTTP/3** and **TLS 1.3** for improved network performance.
- Enable **Rocket Loader** cautiously; test for compatibility.

---

## Extra Polish

- Use **preconnect** and **dns-prefetch** for critical third-party origins.
- Use **font-display: swap** for web fonts.
- Inline critical CSS if possible.
- Use Astro’s `<Head>` component to manage meta tags and preload assets.
- Monitor performance using Lighthouse and WebPageTest regularly.
- Automate performance budgets in your CI/CD pipeline.

---

## Common Gotchas

- Forgetting to specify image dimensions causing layout shifts.
- Overfetching data from Sanity leading to slow builds.
- Not enabling Cloudflare image optimizations.
- Serving images larger than needed.
- Excessive JavaScript payloads due to improper hydration.
- Not caching API responses or static assets properly.
- Using third-party scripts without async or defer.
- Not testing on real devices and network conditions.

---

Following this SOP will help you maintain a fast, responsive, and user-friendly website using Astro, Sanity, and Cloudflare Pages.
