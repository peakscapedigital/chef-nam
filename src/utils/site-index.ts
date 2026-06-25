import { toText, cleanSections, type IndexItem, type IndexSection } from '@peakscape/site-kit/site-index';
import { client } from './sanity';
import { allPostsQuery } from './queries';

// Per-site config for the shared /llms.txt + /sitemap surfaces. The identical
// plumbing (types, toText, cleanSections, the llms.txt assembler) lives in
// @peakscape/site-kit/site-index; this file holds only what's Chef Nam
// specific: the curated page list and the CMS-backed sections.
//
// Paths are site-relative with NO trailing slash (trailingSlash: 'never').

export type { IndexItem, IndexSection };

export const SITE = {
  title: 'Chef Nam Catering',
  blurb:
    'Full-service catering in Ann Arbor, Michigan for weddings, corporate events, and special occasions, with global flavors and thoughtful hospitality.',
};

// Curated, stable pages. Mirrors the sitemap.xml /admin exclusion and skips
// utility/ad routes (api, thank-you, landing pages, drafts).
export const STATIC_PAGES: IndexItem[] = [
  { path: '/', title: 'Home', desc: 'Chef Nam Catering: full-service catering in Ann Arbor, Michigan for weddings, corporate events, and special occasions with global flavors.' },
  { path: '/about', title: 'About Chef Nam', desc: 'The story behind the chef and the catering company.' },
  { path: '/services', title: 'Catering Services', desc: 'Full-service catering for every kind of occasion.' },
  { path: '/services/weddings', title: 'Wedding Catering', desc: 'Catering for weddings and receptions.' },
  { path: '/services/corporate', title: 'Corporate Catering', desc: 'Office lunches, meetings, and corporate events.' },
  { path: '/services/social', title: 'Social Event Catering', desc: 'Parties, showers, and private gatherings.' },
  { path: '/graduation-catering', title: 'Graduation Catering', desc: 'Graduation party catering packages.' },
  { path: '/menus', title: 'Catering Menus', desc: 'Browse menus and offerings by event type.' },
  { path: '/menus/charcuterie', title: 'Charcuterie', desc: 'Charcuterie boards and grazing tables.' },
  { path: '/venues', title: 'Venues', desc: 'Event venues in the area we cater.' },
  { path: '/blog', title: 'Nam Nom Blog', desc: 'Recipes, tips, and stories from Chef Nam.' },
  { path: '/contact', title: 'Contact', desc: 'Get in touch about your event.' },
  { path: '/start-planning', title: 'Start Planning', desc: 'Start planning your catered event.' },
];

// Live Sanity blog posts, kept auto-fresh. Tolerates a query failure so a CMS
// hiccup degrades gracefully. desc is flattened to a plain string here so the
// /sitemap page can render it directly (llms.txt re-truncates via the kit).
export async function getDynamicSections(): Promise<IndexSection[]> {
  const posts = await client.fetch(allPostsQuery).catch(() => []);

  return cleanSections([
    {
      heading: 'Blog Posts',
      items: (posts as any[]).map((p) => ({
        title: p.title,
        path: `/blog/${p.slug?.current ?? ''}`,
        desc: toText(p.excerpt),
      })),
    },
  ]);
}
