// GROQ queries for production data fetching

export const homepageQuery = `
  *[_type == "homepage"][0] {
    hero {
      headline,
      subheading,
      backgroundImage {
        asset->{
          _id,
          url
        },
        alt
      },
      primaryCTA,
      secondaryCTA
    },
    testimonials[] {
      quote,
      author,
      rating,
      event
    }
  }
`

export const servicesQuery = `
  *[_type == "service"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    features,
    images[] {
      asset->{
        _id,
        url
      },
      alt
    },
    pricing
  }
`

export const latestPostsQuery = `
  *[_type == "post"] | order(publishedAt desc)[0...3] {
    _id,
    title,
    slug,
    excerpt,
    featuredImage {
      asset->{
        _id,
        url
      },
      alt
    },
    publishedAt,
    categories,
    author
  }
`

export const allPostsQuery = `
  *[_type == "post"] | order(publishedAt desc) {
    _id,
    title,
    slug,
    excerpt,
    featuredImage {
      asset->{
        _id,
        url
      },
      alt
    },
    publishedAt,
    categories,
    author
  }
`

export const postBySlugQuery = `
  *[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    excerpt,
    content,
    featuredImage {
      asset->{
        _id,
        url
      },
      alt
    },
    publishedAt,
    categories,
    author
  }
`

export const serviceBySlugQuery = `
  *[_type == "service" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    description,
    features,
    images[] {
      asset->{
        _id,
        url
      },
      alt
    },
    pricing
  }
`