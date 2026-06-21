import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {schemaTypes} from './schemaTypes'

// Content-only Studio. The lead/CRM document types + custom "Mark as
// Qualified/Working/Converted" actions were retired 2026-06-21 — leads now run
// through Trello + the Operations Sheet, with conversions fired by the kit
// (api/webhooks/trello.ts → recordLeadEvent). See SH-014.

export default defineConfig({
  name: 'default',
  title: 'Chef Nam Catering',

  projectId: 'yojbqnd7',
  dataset: 'production',

  plugins: [
    structureTool(),
    visionTool(),
    media()
  ],

  schema: {
    types: schemaTypes,
  },
})
