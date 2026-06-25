import type { APIRoute } from 'astro';
import { renderLlmsTxt } from '@peakscape/site-kit/site-index';
import { SITE, STATIC_PAGES, getDynamicSections } from '../utils/site-index';

// /llms.txt — a curated, AI-readable index (https://llmstxt.org). The markdown
// is assembled by the kit's renderLlmsTxt; this route only supplies the
// Chef Nam config and live sections (shared with /sitemap via site-index).

export const GET: APIRoute = async ({ site }) => {
  const text = renderLlmsTxt({
    ...SITE,
    base: site?.href ?? 'https://chefnamcatering.com/',
    pages: STATIC_PAGES,
    sections: await getDynamicSections(),
  });

  return new Response(text, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
