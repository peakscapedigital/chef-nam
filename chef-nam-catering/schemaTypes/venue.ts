import {defineField, defineType} from 'sanity'

export default defineType({
  name: 'venue',
  title: 'Venues',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Venue Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'slug',
      title: 'Slug (Optional)',
      type: 'slug',
      options: {
        source: 'name',
        maxLength: 96,
      },
      description: 'Only needed if you want individual venue pages in the future'
      // Removed required validation - slug is now optional
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          {title: 'Historic', value: 'historic'},
          {title: 'Modern', value: 'modern'},
          {title: 'Garden', value: 'garden'},
          {title: 'Country Club', value: 'country-club'},
          {title: 'Classic', value: 'classic'},
          {title: 'Rustic', value: 'rustic'},
          {title: 'Boutique', value: 'boutique'}
        ]
      },
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'featuredImage',
      title: 'Featured Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative Text',
        }
      ]
    }),
    defineField({
      name: 'gallery',
      title: 'Photo Gallery',
      type: 'array',
      of: [
        {
          type: 'image',
          options: {
            hotspot: true,
          },
          fields: [
            {
              name: 'alt',
              type: 'string',
              title: 'Alternative Text',
            }
          ]
        }
      ]
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'capacity',
      title: 'Capacity Range',
      type: 'string',
      description: 'e.g., "50-300" or "20-500"',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'features',
      title: 'Key Features',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      }
    }),
    defineField({
      name: 'preferredMenus',
      title: 'Preferred Menu Styles',
      type: 'array',
      of: [{type: 'string'}],
      options: {
        layout: 'tags'
      },
      description: 'Types of menus that work well at this venue'
    }),
    defineField({
      name: 'eventsCount',
      title: 'Events Catered',
      type: 'number',
      description: 'Number of events Chef Nam has catered at this venue'
    }),
    defineField({
      name: 'website',
      title: 'Venue Website',
      type: 'url',
      description: 'Link to the venue\'s official website or event page'
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'object',
      fields: [
        {name: 'street', type: 'string', title: 'Street Address'},
        {name: 'city', type: 'string', title: 'City'},
        {name: 'state', type: 'string', title: 'State'},
        {name: 'zip', type: 'string', title: 'ZIP Code'}
      ]
    }),
    defineField({
      name: 'testimonial',
      title: 'Testimonial',
      type: 'object',
      fields: [
        {
          name: 'quote',
          type: 'text',
          title: 'Quote',
          rows: 3
        },
        {
          name: 'author',
          type: 'string',
          title: 'Author Name'
        },
        {
          name: 'title',
          type: 'string',
          title: 'Author Title',
          description: 'e.g., "Events Manager"'
        }
      ]
    }),
    defineField({
      name: 'featured',
      title: 'Featured Venue',
      type: 'boolean',
      description: 'Show this venue prominently on the venues page',
      initialValue: false
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      description: 'Order in which venues appear (lower numbers first)'
    })
  ],
  preview: {
    select: {
      title: 'name',
      subtitle: 'category',
      media: 'featuredImage'
    }
  }
})