import { client } from './sanity';
import { allPostsQuery } from './queries';

// Single source of truth for the site's page directory, consumed by both
// /llms.txt (AI index) and /sitemap (human directory page) so the two can
// never drift. Paths are site-relative with NO trailing slash (the site uses
// trailingSlash: 'never'); llms.txt prepends the origin.

export type IndexItem = { title: string; path: string; desc?: string };
export type IndexSection = { heading: string; items: IndexItem[] };

// Curated, stable pages. Order = importance. Descriptions are hand-written.
// Mirrors the sitemap.xml exclusion (no /admin) and skips utility/ad routes
// (api, thank-you, landing pages, drafts).
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

// Flattens a string or Portable Text block array down to plain text.
export const toText = (v: unknown): string => {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    return v
      .map((b: any) =>
        Array.isArray(b?.children) ? b.children.map((c: any) => c?.text ?? '').join('') : '',
      )
      .join(' ');
  }
  return '';
};

// Live Sanity collections that stay auto-fresh. Tolerates a query failure so a
// CMS hiccup degrades gracefully instead of breaking the page/build.
export async function getDynamicSections(): Promise<IndexSection[]> {
  const posts = await client.fetch(allPostsQuery).catch(() => []);

  const sections: IndexSection[] = [
    {
      heading: 'Blog Posts',
      items: (posts as any[]).map((p) => ({
        title: p.title,
        path: `/blog/${p.slug?.current ?? ''}`,
        desc: toText(p.excerpt),
      })),
    },
  ];

  // Drop empty sections and items missing a title/path.
  return sections
    .map((s) => ({ ...s, items: s.items.filter((i) => i.title && i.path) }))
    .filter((s) => s.items.length);
}
