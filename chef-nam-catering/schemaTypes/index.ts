export const post = {
  name: 'post',
  title: 'Blog Post',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      validation: (Rule: any) => Rule.required().max(200)
    },
    {
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (Rule: any) => Rule.required()
        }
      ]
    },
    {
      name: 'content',
      title: 'Content',
      type: 'array',
      of: [
        {
          type: 'block'
        },
        {
          type: 'image',
          options: {
            hotspot: true
          },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string'
            }
          ]
        },
        {
          type: 'object',
          name: 'tableOfContents',
          title: '📋 Table of Contents',
          fields: [
            {
              name: 'title',
              title: 'TOC Title',
              type: 'string',
              initialValue: 'In This Article:'
            }
          ]
        }
      ]
    },
    {
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'string' }],
      options: {
        list: [
          { title: 'Global Flavors', value: 'global-flavors' },
          { title: 'Wedding', value: 'wedding' },
          { title: 'Corporate', value: 'corporate' },
          { title: 'Social Events', value: 'social' },
          { title: 'Recipes', value: 'recipes' },
          { title: 'Tips', value: 'tips' }
        ]
      }
    },
    {
      name: 'publishedAt',
      title: 'Published At',
      type: 'datetime',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'author',
      title: 'Author',
      type: 'object',
      fields: [
        {
          name: 'name',
          title: 'Name',
          type: 'string',
          initialValue: 'Chef Nam'
        },
        {
          name: 'image',
          title: 'Image',
          type: 'image'
        }
      ]
    }
  ],
  preview: {
    select: {
      title: 'title',
      media: 'featuredImage'
    }
  }
}

export const homepage = {
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  fields: [
    {
      name: 'logo',
      title: 'Site Logo',
      type: 'image',
      options: {
        hotspot: false
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          initialValue: 'Chef Nam Catering Logo'
        }
      ],
      description: 'Logo appears in header and footer'
    },
    {
      name: 'hero',
      title: 'Hero Section',
      type: 'object',
      fields: [
        {
          name: 'headline',
          title: 'Headline',
          type: 'string',
          initialValue: 'Catering With Care For Moments That Matter'
        },
        {
          name: 'subheading',
          title: 'Subheading',
          type: 'string',
          initialValue: 'Chef Nam blends her deep appreciation for global flavors with thoughtful hospitality, crafting experiences that make people feel seen, celebrated, and well-fed.'
        },
        {
          name: 'backgroundImage',
          title: 'Background Image',
          type: 'image',
          options: {
            hotspot: true
          },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string'
            }
          ]
        },
        {
          name: 'primaryCTA',
          title: 'Primary CTA Text',
          type: 'string',
          initialValue: 'Get Your Quote'
        },
        {
          name: 'secondaryCTA',
          title: 'Secondary CTA Text',
          type: 'string',
          initialValue: 'View Menu'
        }
      ]
    },
    {
      name: 'about',
      title: 'About Section',
      type: 'object',
      fields: [
        {
          name: 'headline',
          title: 'Headline',
          type: 'string',
          initialValue: 'Rooted in Flavor.<br><span class="text-brand-amber">Driven By Heart.</span>'
        },
        {
          name: 'description',
          title: 'Description',
          type: 'text',
          initialValue: 'Chef Nam believes that the best events start with good food — and good food starts with heart. After years of working in professional kitchens and sharing meals with loved ones, she launched Chef Nam Catering to bring that same sense of care, connection, and celebration to every event.'
        },
        {
          name: 'chefImage',
          title: 'Chef Photo',
          type: 'image',
          options: {
            hotspot: true
          },
          fields: [
            {
              name: 'alt',
              title: 'Alt Text',
              type: 'string',
              initialValue: 'Chef Nam'
            }
          ]
        },
        {
          name: 'credentials',
          title: 'Credentials',
          type: 'array',
          of: [{ type: 'string' }],
          initialValue: [
            '15+ Years Professional Experience',
            'Ann Arbor Local Business',
            'Global Culinary Training',
            '5-Star Customer Rating'
          ]
        }
      ]
    },
    {
      name: 'gallery',
      title: 'Homepage Gallery',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'image',
              title: 'Image',
              type: 'image',
              options: {
                hotspot: true
              },
              fields: [
                {
                  name: 'alt',
                  title: 'Alt Text',
                  type: 'string',
                  validation: (Rule: any) => Rule.required()
                }
              ],
              validation: (Rule: any) => Rule.required()
            },
            {
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description: 'Optional caption that appears on hover'
            }
          ],
          preview: {
            select: {
              title: 'caption',
              media: 'image'
            },
            prepare(selection: any) {
              const { title, media } = selection;
              return {
                title: title || 'Gallery Image',
                media
              };
            }
          }
        }
      ],
      options: {
        layout: 'grid'
      },
      description: 'Add up to 6 images for the homepage gallery showcase'
    },
    {
      name: 'testimonials',
      title: 'Testimonials',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'quote',
              title: 'Quote',
              type: 'text'
            },
            {
              name: 'author',
              title: 'Author',
              type: 'string'
            },
            {
              name: 'rating',
              title: 'Rating',
              type: 'number',
              validation: (Rule: any) => Rule.min(1).max(5)
            },
            {
              name: 'event',
              title: 'Event Type',
              type: 'string'
            },
            {
              name: 'platform',
              title: 'Review Platform',
              type: 'string',
              options: {
                list: [
                  { title: 'Google Reviews', value: 'google' },
                  { title: 'Yelp', value: 'yelp' },
                  { title: 'Facebook', value: 'facebook' },
                  { title: 'Other', value: 'other' }
                ]
              },
              initialValue: 'google'
            }
          ]
        }
      ]
    }
  ]
}

export const gallery = {
  name: 'gallery',
  title: 'Gallery',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true
      },
      fields: [
        {
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          validation: (Rule: any) => Rule.required()
        }
      ],
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'caption',
      title: 'Caption',
      type: 'string'
    },
    {
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Food', value: 'food' },
          { title: 'Events', value: 'events' },
          { title: 'Team', value: 'team' },
          { title: 'Setup', value: 'setup' }
        ]
      }
    },
    {
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first'
    }
  ],
  preview: {
    select: {
      title: 'title',
      media: 'image'
    }
  }
}

import venue from './venue'

export const schemaTypes = [post, homepage, gallery, venue]
