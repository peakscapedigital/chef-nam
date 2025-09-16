import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: 'yojbqnd7',
  dataset: 'production',
  useCdn: true, // Enable CDN for faster reads (disable only for writes)
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

// Optimized image helper following Astro + Sanity best practices
export function urlForOptimized(source: any, width?: number, height?: number, quality = 75) {
  let imageBuilder = builder.image(source)
    .auto('format')        // Auto-detect best format (WebP, AVIF, etc.)
    .format('webp')        // Fallback to WebP
    .quality(quality)
    .fit('crop')           // Crop to exact dimensions
    .crop('center')        // Center crop for better composition
  
  if (width) {
    imageBuilder = imageBuilder.width(width)
  }
  
  if (height) {
    imageBuilder = imageBuilder.height(height)
  }
  
  return imageBuilder
}

// Generate responsive srcset for Astro Image component
export function generateResponsiveSrcset(source: any, maxWidth: number, quality = 75) {
  const breakpoints = [320, 640, 768, 1024, 1280, 1536, 1920]
  const sizes = breakpoints.filter(size => size <= maxWidth * 1.2) // Include up to 20% larger for sharpness
  
  return sizes.map(width => 
    `${urlForOptimized(source, width, undefined, quality).url()} ${width}w`
  ).join(', ')
}

// Mobile-first responsive sizes attribute
export function generateSizes(maxWidth: number) {
  if (maxWidth <= 768) {
    return `(max-width: 768px) ${maxWidth}px, ${maxWidth}px`
  }
  return `(max-width: 768px) 100vw, (max-width: 1200px) 80vw, ${maxWidth}px`
}

// Content types
export interface Post {
  _id: string
  title: string
  slug: { current: string }
  excerpt: string
  content: any[]
  featuredImage: {
    asset: any
    alt: string
  }
  publishedAt: string
  categories: string[]
  author: {
    name: string
    image: any
  }
}

export interface Service {
  _id: string
  title: string
  slug: { current: string }
  description: string
  features: string[]
  images: Array<{
    asset: any
    alt: string
  }>
  pricing: {
    starting: number
    description: string
  }
}

export interface HomePage {
  hero: {
    headline: string
    subheading: string
    backgroundImage: {
      asset: any
      alt: string
    }
    primaryCTA: string
    secondaryCTA: string
  }
  about: {
    headline: string
    description: string
    chefImage: {
      asset: any
      alt: string
    }
    credentials: string[]
  }
  gallery: Array<{
    image: {
      asset: any
      alt: string
    }
    caption?: string
  }>
  services: Service[]
  testimonials: Array<{
    quote: string
    author: string
    rating: number
    event: string
    platform?: string
  }>
}

// Blog post queries
export async function getPosts(limit?: number) {
  const query = `*[_type == "post"] | order(publishedAt desc) ${limit ? `[0...${limit}]` : ''} {
    _id,
    title,
    slug,
    excerpt,
    featuredImage {
      asset,
      alt
    },
    publishedAt,
    categories,
    author
  }`
  
  return await client.fetch(query)
}

export async function getPost(slug: string) {
  const query = `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    content,
    featuredImage {
      asset,
      alt
    },
    publishedAt,
    categories,
    author
  }`
  
  return await client.fetch(query, { slug })
}

export async function getRelatedPosts(categories: string[], excludeId: string, limit = 3) {
  // First try to get posts with matching categories
  const relatedQuery = `*[_type == "post" && _id != $excludeId && count((categories[])[@ in $categories]) > 0] | order(publishedAt desc) [0...${limit}] {
    _id,
    title,
    slug,
    excerpt,
    featuredImage {
      asset,
      alt
    },
    publishedAt,
    categories
  }`
  
  const relatedPosts = await client.fetch(relatedQuery, { categories, excludeId })
  
  // If we have enough related posts, return them
  if (relatedPosts.length >= limit) {
    return relatedPosts
  }
  
  // Otherwise, fill with most recent posts (excluding current post)
  const recentQuery = `*[_type == "post" && _id != $excludeId] | order(publishedAt desc) [0...${limit}] {
    _id,
    title,
    slug,
    excerpt,
    featuredImage {
      asset,
      alt
    },
    publishedAt,
    categories
  }`
  
  const recentPosts = await client.fetch(recentQuery, { excludeId })
  
  // Combine related posts with recent posts, avoiding duplicates
  const combined = [...relatedPosts]
  const usedIds = new Set(relatedPosts.map(post => post._id))
  
  for (const post of recentPosts) {
    if (!usedIds.has(post._id) && combined.length < limit) {
      combined.push(post)
    }
  }
  
  return combined
}

// Homepage content queries
export async function getHomepage() {
  const query = `*[_type == "homepage"][0] {
    logo {
      asset,
      alt
    },
    hero {
      headline,
      subheading,
      backgroundImage {
        asset,
        alt
      },
      primaryCTA,
      secondaryCTA
    },
    about {
      headline,
      description,
      chefImage {
        asset,
        alt
      },
      credentials
    },
    gallery[] {
      image {
        asset,
        alt
      },
      caption
    },
    testimonials[] {
      quote,
      author,
      rating,
      event,
      platform
    }
  }`
  
  return await client.fetch(query)
}

// Gallery images query
export async function getGalleryImages(limit?: number) {
  const query = `*[_type == "gallery"] | order(_createdAt desc) ${limit ? `[0...${limit}]` : ''} {
    _id,
    title,
    image {
      asset,
      alt
    },
    caption,
    category
  }`
  
  return await client.fetch(query)
}

// Venue types
export interface Venue {
  _id: string
  name: string
  slug: { current: string }
  category: string
  featuredImage?: {
    asset: any
    alt?: string
  }
  gallery?: Array<{
    asset: any
    alt?: string
  }>
  description: string
  capacity: string
  features?: string[]
  preferredMenus?: string[]
  eventsCount?: number
  website?: string
  address?: {
    street?: string
    city?: string
    state?: string
    zip?: string
  }
  testimonial?: {
    quote?: string
    author?: string
    title?: string
  }
  featured?: boolean
  order?: number
}

// Get all venues
export async function getVenues() {
  const query = `*[_type == "venue"] | order(coalesce(order, 999), name) {
    _id,
    name,
    slug,
    category,
    featuredImage {
      asset,
      alt
    },
    gallery[] {
      asset,
      alt
    },
    description,
    capacity,
    features,
    preferredMenus,
    eventsCount,
    website,
    address,
    testimonial,
    featured,
    order
  }`
  
  return await client.fetch(query)
}

// Get featured venues
export async function getFeaturedVenues() {
  const query = `*[_type == "venue" && featured == true] | order(coalesce(order, 999), name) {
    _id,
    name,
    slug,
    category,
    featuredImage {
      asset,
      alt
    },
    description,
    capacity,
    features,
    preferredMenus,
    eventsCount,
    website,
    testimonial
  }`
  
  return await client.fetch(query)
}

// Get single venue by slug
export async function getVenue(slug: string) {
  const query = `*[_type == "venue" && slug.current == $slug][0] {
    _id,
    name,
    slug,
    category,
    featuredImage {
      asset,
      alt
    },
    gallery[] {
      asset,
      alt
    },
    description,
    capacity,
    features,
    preferredMenus,
    eventsCount,
    website,
    address,
    testimonial,
    featured
  }`
  
  return await client.fetch(query, { slug })
}
