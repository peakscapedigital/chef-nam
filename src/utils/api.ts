import { client } from './sanity'
import { 
  homepageQuery, 
  servicesQuery, 
  latestPostsQuery, 
  allPostsQuery, 
  postBySlugQuery,
  serviceBySlugQuery 
} from './queries'
import type { HomePage, Service, Post } from './sanity'

// Homepage data
export async function getHomePage(): Promise<HomePage | null> {
  try {
    return await client.fetch(homepageQuery)
  } catch (error) {
    console.error('Error fetching homepage data:', error)
    return null
  }
}

// Services data
export async function getServices(): Promise<Service[]> {
  try {
    return await client.fetch(servicesQuery)
  } catch (error) {
    console.error('Error fetching services:', error)
    return []
  }
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  try {
    return await client.fetch(serviceBySlugQuery, { slug })
  } catch (error) {
    console.error('Error fetching service:', error)
    return null
  }
}

// Blog data
export async function getLatestPosts(): Promise<Post[]> {
  try {
    return await client.fetch(latestPostsQuery)
  } catch (error) {
    console.error('Error fetching latest posts:', error)
    return []
  }
}

export async function getAllPosts(): Promise<Post[]> {
  try {
    return await client.fetch(allPostsQuery)
  } catch (error) {
    console.error('Error fetching all posts:', error)
    return []
  }
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  try {
    return await client.fetch(postBySlugQuery, { slug })
  } catch (error) {
    console.error('Error fetching post:', error)
    return null
  }
}

// Fallback data for development
export const fallbackHomePage: HomePage = {
  hero: {
    headline: "Exceptional Thai-American Fusion Catering",
    subheading: "Bringing authentic Thai flavors to your special occasions in Ann Arbor and beyond",
    backgroundImage: {
      asset: { _id: '', url: '/hero-placeholder.jpg' },
      alt: "Chef Nam preparing Thai fusion dishes"
    },
    primaryCTA: "Get Your Quote",
    secondaryCTA: "View Menu"
  },
  services: [],
  testimonials: [
    {
      quote: "Chef Nam's catering made our wedding absolutely perfect. The Thai fusion menu was incredible!",
      author: "Sarah & Mike",
      rating: 5,
      event: "Wedding Reception"
    },
    {
      quote: "Professional, delicious, and beautifully presented. Our corporate event was a huge success.",
      author: "David Chen",
      rating: 5,
      event: "Corporate Event"
    }
  ]
}