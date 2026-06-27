import { defineMiddleware } from 'astro:middleware';
import { applySecurityHeaders } from '@peakscape/site-kit/http';

// Baseline security headers on all SSR responses (security audit 2026-06-26, X2).
// Static/prerendered assets carry the same set via public/_headers (the Cloudflare
// asset layer bypasses this middleware). Same set as @peakscape/site-kit/http.
export const onRequest = defineMiddleware(async (_context, next) => {
  return applySecurityHeaders(await next());
});
