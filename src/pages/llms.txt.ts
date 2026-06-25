import type { APIRoute } from 'astro';
import { STATIC_PAGES, getDynamicSections, toText } from '../utils/site-index';

// Generates /llms.txt — a curated, AI-readable index of the site
// (https://llmstxt.org). Shares its data with the /sitemap page via
// ../utils/site-index so the two never drift.

const oneline = (s: unknown, n = 160): string => {
  const t = toText(s).replace(/\s+/g, ' ').trim();
  return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;
};

export const GET: APIRoute = async ({ site }) => {
  const base = (site?.href ?? 'https://chefnamcatering.com/').replace(/\/$/, '');
  const sections = await getDynamicSections();

  const sectionBlock = (heading: string, items: { title: string; path: string; desc?: string }[]) =>
    `\n## ${heading}\n${items
      .map((i) => {
        const d = oneline(i.desc);
        return `- [${i.title}](${base}${i.path})${d ? `: ${d}` : ''}`;
      })
      .join('\n')}\n`;

  const body = [
    '# Chef Nam Catering',
    '',
    '> Full-service catering in Ann Arbor, Michigan for weddings, corporate events, and special occasions, with global flavors and thoughtful hospitality.',
    '',
    'This file indexes the site for AI assistants. Pages and listings below link to the live site.',
    '',
    '## Pages',
    ...STATIC_PAGES.map((p) => `- [${p.title}](${base}${p.path}): ${oneline(p.desc)}`),
    '',
    ...sections.map((s) => sectionBlock(s.heading, s.items)),
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return new Response(body + '\n', {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
