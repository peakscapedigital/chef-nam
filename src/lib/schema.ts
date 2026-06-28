// Chef Nam JSON-LD — site config + adapter over @peakscape/site-kit/seo.
//
// chefnam's structured data is the reference standard (richest of our sites):
// an @id-linked graph with a Caterer/Organization business node carrying NAP,
// hasOfferCatalog, founder, owns[], SearchAction, knowsAbout. The kit's
// createSchema was leveled up (v0.24.0) to emit all of it, so this config
// reproduces the prior hand-built node as a superset — no SEO regression.
import { createSchema } from '@peakscape/site-kit/seo';

const s = createSchema({
  siteUrl: 'https://chefnamcatering.com',
  name: 'Chef Nam Catering',
  alternateName: 'Chef Nam',
  logo: 'https://chefnamcatering.com/logo.png',
  // Primary node is typed ['Caterer','Organization'] and IS the publisher.
  businessType: 'Caterer',
  businessTypeAlso: ['Organization'],
  publisherId: 'https://chefnamcatering.com/#business',
  description:
    'Premier catering service in Ann Arbor, Michigan specializing in Thai fusion cuisine for weddings, corporate events, and social gatherings. Professional catering with authentic flavors and exceptional service.',
  telephone: '+1-734-623-9799',
  email: 'nam@chefnamcatering.com',
  hasMap: 'https://maps.app.goo.gl/myS6TpT33dQj8C1p6',
  image: [
    'https://images.unsplash.com/photo-1555244162-803834f70033?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
  ],
  address: {
    streetAddress: '',
    addressLocality: 'Ann Arbor',
    addressRegion: 'MI',
    postalCode: '48104',
    addressCountry: 'US',
  },
  geo: { latitude: 42.2808, longitude: -83.743 },
  areaServed: [
    { type: 'Place', name: 'Ann Arbor, Michigan' },
    { type: 'Place', name: 'Ypsilanti, Michigan' },
    { type: 'Place', name: 'Dexter, Michigan' },
    { type: 'Place', name: 'Saline, Michigan' },
    { type: 'Place', name: 'Washtenaw County, Michigan' },
  ],
  servesCuisine: ['Thai', 'Asian Fusion', 'American', 'Contemporary'],
  priceRange: '$$-$$$',
  currenciesAccepted: 'USD',
  paymentAccepted: ['Cash', 'Credit Card', 'Check', 'Invoice'],
  openingHoursText: 'Mo-Fr 09:00-18:00',
  sameAs: [
    'https://www.facebook.com/chefnamcatering',
    'https://www.instagram.com/chefnamcatering',
  ],
  foundingDate: '2020',
  founder: { name: 'Nam', jobTitle: 'Chef and Owner' },
  slogan: 'Authentic Thai Fusion Catering in Ann Arbor',
  knowsAbout: ['Thai Cuisine', 'Catering', 'Event Planning', 'Wedding Catering', 'Corporate Events'],
  offerCatalog: {
    name: 'Catering Services',
    services: [
      { name: 'Wedding Catering', description: 'Full-service wedding catering with customized menus' },
      { name: 'Corporate Catering', description: 'Professional business catering for meetings and events' },
      { name: 'Social Event Catering', description: 'Catering for parties, celebrations, and social gatherings' },
    ],
  },
  owns: [
    'https://chefnamcatering.com/services/weddings#weddingservice',
    'https://chefnamcatering.com/services/corporate#corporateservice',
    'https://chefnamcatering.com/services/social#socialservice',
  ],
  searchUrlTemplate: 'https://chefnamcatering.com/search?q={search_term_string}',
});

// The primary Caterer/Organization business node (home page).
export const caterer = s.localBusiness;
// Global WebSite node (with SearchAction) — emitted by Layout on every page.
export const webSite = s.webSite;
// 1:1 generators for inner-page consolidation (breadcrumbs / FAQ).
export const breadcrumbList = s.breadcrumbList;
export const faqPage = s.faqPage;
