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

export const formSubmission = {
  name: 'formSubmission',
  title: 'Form Submissions',
  type: 'document',
  fields: [
    {
      name: 'firstName',
      title: 'First Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'lastName',
      title: 'Last Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule: any) => Rule.required().email()
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'preferredContact',
      title: 'Preferred Contact Method',
      type: 'string',
      options: {
        list: [
          { title: 'Email', value: 'email' },
          { title: 'Phone Call', value: 'phone' },
          { title: 'Text Message', value: 'text' }
        ],
        layout: 'radio'
      },
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'hasEvent',
      title: 'Has Specific Event',
      type: 'boolean',
      description: 'Whether they have a specific event in mind'
    },
    {
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          { title: 'Wedding', value: 'wedding' },
          { title: 'Corporate Event', value: 'corporate' },
          { title: 'Birthday Party', value: 'birthday' },
          { title: 'Anniversary', value: 'anniversary' },
          { title: 'Graduation', value: 'graduation' },
          { title: 'Holiday Party', value: 'holiday' },
          { title: 'Fundraiser', value: 'fundraiser' },
          { title: 'Other', value: 'other' }
        ]
      }
    },
    {
      name: 'eventDate',
      title: 'Event Date',
      type: 'date'
    },
    {
      name: 'eventTime',
      title: 'Event Time',
      type: 'string'
    },
    {
      name: 'guestCount',
      title: 'Guest Count',
      type: 'string'
    },
    {
      name: 'location',
      title: 'Event Location',
      type: 'string'
    },
    {
      name: 'serviceStyle',
      title: 'Service Style',
      type: 'string',
      options: {
        list: [
          { title: 'Plated Service', value: 'plated' },
          { title: 'Buffet Style', value: 'buffet' },
          { title: 'Family Style', value: 'family' },
          { title: 'Cocktail Reception', value: 'cocktail' },
          { title: 'Drop-off Catering', value: 'drop-off' },
          { title: 'Not Sure', value: 'not-sure' }
        ]
      }
    },
    {
      name: 'budgetRange',
      title: 'Budget Range',
      type: 'string'
    },
    {
      name: 'dietaryRequirements',
      title: 'Dietary Requirements',
      type: 'array',
      of: [{ type: 'string' }]
    },
    {
      name: 'message',
      title: 'Message',
      type: 'text'
    },
    {
      name: 'eventDescription',
      title: 'Event Description',
      type: 'text',
      description: 'Additional details about the event'
    },
    {
      name: 'source',
      title: 'Source Page',
      type: 'string',
      description: 'Which page the lead came from'
    },
    // Attribution fields for lead source tracking
    {
      name: 'utm_source',
      title: 'UTM Source',
      type: 'string',
      description: 'Traffic source (e.g., google, facebook)'
    },
    {
      name: 'utm_medium',
      title: 'UTM Medium',
      type: 'string',
      description: 'Marketing medium (e.g., cpc, organic, social)'
    },
    {
      name: 'utm_campaign',
      title: 'UTM Campaign',
      type: 'string',
      description: 'Campaign name'
    },
    {
      name: 'utm_term',
      title: 'UTM Term',
      type: 'string',
      description: 'Paid search keyword'
    },
    {
      name: 'utm_content',
      title: 'UTM Content',
      type: 'string',
      description: 'Ad variation or content identifier'
    },
    {
      name: 'gclid',
      title: 'Google Click ID',
      type: 'string',
      description: 'Google Ads click identifier'
    },
    {
      name: 'fbclid',
      title: 'Facebook Click ID',
      type: 'string',
      description: 'Facebook Ads click identifier'
    },
    {
      name: 'lead_source',
      title: 'Lead Source',
      type: 'string',
      description: 'Friendly name for lead source (e.g., "Google Ads", "Direct")'
    },
    {
      name: 'referrer',
      title: 'Referrer',
      type: 'string',
      description: 'URL of the referring page'
    },
    {
      name: 'landing_page',
      title: 'Landing Page',
      type: 'string',
      description: 'First page visited on the website'
    },
    {
      name: 'status',
      title: 'Lead Status',
      type: 'string',
      initialValue: 'new',
      options: {
        list: [
          { title: 'New', value: 'new' },
          { title: 'Contacted', value: 'contacted' },
          { title: 'Proposal Sent', value: 'proposal-sent' },
          { title: 'Converted', value: 'converted' },
          { title: 'Lost', value: 'lost' }
        ],
        layout: 'radio'
      }
    },
    {
      name: 'notes',
      title: 'Internal Notes',
      type: 'text',
      description: 'Notes for Chef Nam about this lead'
    },
    {
      name: 'submittedAt',
      title: 'Submitted At',
      type: 'datetime',
      initialValue: () => new Date().toISOString()
    },
    {
      name: 'updatedAt',
      title: 'Updated At',
      type: 'datetime',
      description: 'When the submission was last updated with additional details'
    }
  ],
  preview: {
    select: {
      title: 'firstName',
      subtitle: 'email',
      status: 'status',
      date: 'submittedAt'
    },
    prepare(selection: any) {
      const { title, subtitle, status, date } = selection;
      const dateStr = date ? new Date(date).toLocaleDateString() : '';
      return {
        title: `${title || 'Unknown'} - ${dateStr}`,
        subtitle: `${subtitle} | Status: ${status || 'new'}`
      };
    }
  },
  orderings: [
    {
      title: 'Newest First',
      name: 'submittedAtDesc',
      by: [
        { field: 'submittedAt', direction: 'desc' }
      ]
    }
  ],
  // Enable delete functionality
  __experimental_actions: [
    'create',
    'update',
    'delete',
    'publish'
  ]
}

// Lead schema - business object for CRM functionality
export const lead = {
  name: 'lead',
  title: 'Leads',
  type: 'document',
  fields: [
    // Basic Contact Info
    {
      name: 'firstName',
      title: 'First Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'lastName',
      title: 'Last Name',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'email',
      title: 'Email',
      type: 'string',
      validation: (Rule: any) => Rule.required().email()
    },
    {
      name: 'phone',
      title: 'Phone',
      type: 'string',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'preferredContact',
      title: 'Preferred Contact Method',
      type: 'string',
      options: {
        list: [
          { title: 'Email', value: 'email' },
          { title: 'Phone Call', value: 'phone' },
          { title: 'Text Message', value: 'text' }
        ]
      }
    },

    // Event Details
    {
      name: 'eventType',
      title: 'Event Type',
      type: 'string',
      options: {
        list: [
          { title: 'Wedding', value: 'wedding' },
          { title: 'Corporate Event', value: 'corporate' },
          { title: 'Birthday Party', value: 'birthday' },
          { title: 'Anniversary', value: 'anniversary' },
          { title: 'Graduation', value: 'graduation' },
          { title: 'Holiday Party', value: 'holiday' },
          { title: 'Fundraiser', value: 'fundraiser' },
          { title: 'Other', value: 'other' }
        ]
      }
    },
    {
      name: 'eventDate',
      title: 'Event Date',
      type: 'date'
    },
    {
      name: 'guestCount',
      title: 'Guest Count',
      type: 'string'
    },
    {
      name: 'location',
      title: 'Event Location',
      type: 'string'
    },
    {
      name: 'serviceStyle',
      title: 'Service Style',
      type: 'string'
    },
    {
      name: 'budgetRange',
      title: 'Budget Range',
      type: 'string'
    },

    // Lead Management (CRM)
    {
      name: 'leadStatus',
      title: 'Lead Status',
      type: 'string',
      options: {
        list: [
          { title: '🆕 New', value: 'new' },
          { title: '✅ Qualified', value: 'qualified' },
          { title: '💼 Working', value: 'working' },
          { title: '🎉 Converted', value: 'converted' },
          { title: '❌ Lost', value: 'lost' }
        ],
        layout: 'radio'
      },
      initialValue: 'new',
      validation: (Rule: any) => Rule.required()
    },
    {
      name: 'bookingValue',
      title: 'Booking Value',
      type: 'number',
      description: 'Final booking value (for converted leads)'
    },
    {
      name: 'notes',
      title: 'Internal Notes',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'note',
              title: 'Note',
              type: 'text'
            },
            {
              name: 'createdAt',
              title: 'Created At',
              type: 'datetime',
              initialValue: () => new Date().toISOString()
            }
          ],
          preview: {
            select: {
              title: 'note',
              subtitle: 'createdAt'
            },
            prepare(selection: any) {
              const { title, subtitle } = selection;
              const dateStr = subtitle ? new Date(subtitle).toLocaleDateString() : '';
              return {
                title: title?.substring(0, 60) + '...' || 'Note',
                subtitle: dateStr
              };
            }
          }
        }
      ]
    },

    // Attribution Data
    {
      name: 'attribution',
      title: '📊 Attribution Data',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: false
      },
      fields: [
        {
          name: 'utm_source',
          title: 'UTM Source',
          type: 'string',
          description: 'Traffic source (e.g., google, facebook)'
        },
        {
          name: 'utm_medium',
          title: 'UTM Medium',
          type: 'string',
          description: 'Marketing medium (e.g., cpc, organic, social)'
        },
        {
          name: 'utm_campaign',
          title: 'UTM Campaign',
          type: 'string',
          description: 'Campaign name'
        },
        {
          name: 'utm_term',
          title: 'UTM Term',
          type: 'string',
          description: 'Paid search keyword'
        },
        {
          name: 'utm_content',
          title: 'UTM Content',
          type: 'string',
          description: 'Ad variation or content identifier'
        },
        {
          name: 'gclid',
          title: 'Google Click ID (GCLID)',
          type: 'string',
          description: 'Required to send conversions back to Google Ads'
        },
        {
          name: 'fbclid',
          title: 'Facebook Click ID',
          type: 'string'
        },
        {
          name: 'lead_source',
          title: 'Lead Source',
          type: 'string',
          description: 'Friendly name (e.g., "Google Ads", "Direct")'
        },
        {
          name: 'referrer',
          title: 'Referrer',
          type: 'string'
        },
        {
          name: 'landing_page',
          title: 'Landing Page',
          type: 'string'
        }
      ]
    },

    // Analytics Integration
    {
      name: 'analytics',
      title: '📈 Analytics Integration',
      type: 'object',
      options: {
        collapsible: true,
        collapsed: true
      },
      fields: [
        {
          name: 'ga_client_id',
          title: 'GA4 Client ID',
          type: 'string',
          description: 'Used to send lifecycle events back to GA4'
        },
        {
          name: 'conversionSentToGA4',
          title: 'Conversion Sent to GA4',
          type: 'boolean',
          initialValue: false,
          readOnly: true
        },
        {
          name: 'conversionSentToAds',
          title: 'Conversion Sent to Google Ads',
          type: 'boolean',
          initialValue: false,
          readOnly: true
        },
        {
          name: 'lastGA4EventType',
          title: 'Last GA4 Event Type',
          type: 'string',
          description: 'Last lifecycle event sent (qualify_lead, working_lead, convert_lead)',
          readOnly: true
        },
        {
          name: 'lastGA4EventSentAt',
          title: 'Last GA4 Event Sent At',
          type: 'datetime',
          readOnly: true
        }
      ]
    },

    // Reference to original form submission
    {
      name: 'originalSubmission',
      title: 'Original Form Submission',
      type: 'reference',
      to: [{ type: 'formSubmission' }],
      description: 'Link to the original form submission record'
    },

    // Timestamps
    {
      name: 'createdAt',
      title: 'Created At',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      readOnly: true
    },
    {
      name: 'updatedAt',
      title: 'Last Updated',
      type: 'datetime',
      readOnly: true
    }
  ],
  preview: {
    select: {
      firstName: 'firstName',
      lastName: 'lastName',
      email: 'email',
      status: 'leadStatus',
      eventType: 'eventType',
      source: 'attribution.lead_source',
      date: 'createdAt'
    },
    prepare(selection: any) {
      const { firstName, lastName, email, status, eventType, source, date } = selection;
      const dateStr = date ? new Date(date).toLocaleDateString() : '';
      const statusEmoji = {
        'new': '🆕',
        'qualified': '✅',
        'working': '💼',
        'converted': '🎉',
        'lost': '❌'
      }[status] || '';

      return {
        title: `${statusEmoji} ${firstName} ${lastName}`,
        subtitle: `${eventType || 'No event'} | ${source || 'Direct'} | ${dateStr}`,
        description: email
      };
    }
  },
  orderings: [
    {
      title: 'Newest First',
      name: 'newestFirst',
      by: [{ field: 'createdAt', direction: 'desc' }]
    },
    {
      title: 'Status (New → Converted)',
      name: 'byStatus',
      by: [{ field: 'leadStatus', direction: 'asc' }]
    }
  ]
}

import venue from './venue'

export const schemaTypes = [post, homepage, gallery, formSubmission, lead, venue]
