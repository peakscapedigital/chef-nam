import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {schemaTypes} from './schemaTypes'

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

  document: {
    actions: (prev, context) => {
      // Add custom actions for Lead documents
      if (context.schemaType === 'lead') {
        return [
          ...prev,
          // Action to qualify a lead
          (props) => {
            const {draft, published} = props
            const doc = draft || published

            return {
              label: '✅ Mark as Qualified',
              onHandle: async () => {
                if (!doc) return

                // Check if GA4 client_id exists
                if (!doc.analytics?.ga_client_id) {
                  alert('⚠️ No GA4 Client ID found. Cannot send event to GA4.\n\nThis lead may be from before we started tracking client IDs.')
                  return
                }

                const confirmed = confirm(
                  `Mark ${doc.firstName} ${doc.lastName} as Qualified?\n\n` +
                  `This will:\n` +
                  `• Update lead status to "Qualified"\n` +
                  `• Send qualify_lead event to GA4\n` +
                  `${doc.attribution?.gclid ? '• Send qualified conversion to Google Ads\n' : ''}` +
                  `• Track attribution to original campaign`
                )

                if (!confirmed) return

                try {
                  // Send event to GA4
                  const ga4Response = await fetch('https://chefnamcatering.com/api/send-lead-event', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                      ga_client_id: doc.analytics.ga_client_id,
                      event_type: 'qualify_lead',
                      value: 5000, // Estimated qualified lead value
                      lead_source: doc.attribution?.lead_source,
                      event_type_name: doc.eventType
                    })
                  })

                  const ga4Result = await ga4Response.json()

                  // Send to Google Ads if GCLID exists
                  let adsSuccess = false
                  if (doc.attribution?.gclid) {
                    const adsResponse = await fetch('https://chefnamcatering.com/api/send-google-ads-conversion', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({
                        gclid: doc.attribution.gclid,
                        conversion_type: 'qualified',
                        value: 5000,
                        email: doc.email,
                        phone: doc.phone,
                        conversion_time: new Date().toISOString()
                      })
                    })

                    const adsResult = await adsResponse.json()
                    adsSuccess = adsResult.success
                  }

                  if (ga4Result.success) {
                    // Update Sanity document
                    await context.client
                      .patch(doc._id)
                      .set({
                        leadStatus: 'qualified',
                        'analytics.conversionSentToGA4': true,
                        'analytics.conversionSentToAds': adsSuccess,
                        'analytics.lastGA4EventType': 'qualify_lead',
                        'analytics.lastGA4EventSentAt': new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      })
                      .commit()

                    const message = adsSuccess
                      ? '✅ Lead qualified successfully!\n\nGA4: ✓ Sent\nGoogle Ads: ✓ Sent'
                      : '✅ Lead qualified successfully!\n\nGA4: ✓ Sent\nGoogle Ads: ' + (doc.attribution?.gclid ? '✗ Failed (check logs)' : 'N/A (no GCLID)')

                    alert(message)
                  } else {
                    alert(`❌ Failed to send event to GA4:\n${ga4Result.message}`)
                  }
                } catch (error) {
                  console.error('Error qualifying lead:', error)
                  alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
              }
            }
          },
          // Action to mark as working
          (props) => {
            const {draft, published} = props
            const doc = draft || published

            return {
              label: '💼 Mark as Working',
              onHandle: async () => {
                if (!doc) return

                if (!doc.analytics?.ga_client_id) {
                  alert('⚠️ No GA4 Client ID found. Cannot send event to GA4.')
                  return
                }

                const confirmed = confirm(
                  `Mark ${doc.firstName} ${doc.lastName} as Working?\n\n` +
                  `This will:\n` +
                  `• Update lead status to "Working"\n` +
                  `• Send working_lead event to GA4`
                )

                if (!confirmed) return

                try {
                  const response = await fetch('https://chefnamcatering.com/api/send-lead-event', {
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify({
                      ga_client_id: doc.analytics.ga_client_id,
                      event_type: 'working_lead',
                      value: 5000,
                      lead_source: doc.attribution?.lead_source,
                      event_type_name: doc.eventType
                    })
                  })

                  const result = await response.json()

                  if (result.success) {
                    await context.client
                      .patch(doc._id)
                      .set({
                        leadStatus: 'working',
                        'analytics.lastGA4EventType': 'working_lead',
                        'analytics.lastGA4EventSentAt': new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                      })
                      .commit()

                    alert('✅ Lead marked as working!')
                  } else {
                    alert(`❌ Failed to send event to GA4:\n${result.message}`)
                  }
                } catch (error) {
                  console.error('Error updating lead:', error)
                  alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
              }
            }
          },
          // Action to convert a lead
          (props) => {
            const {draft, published} = props
            const doc = draft || published

            return {
              label: '🎉 Mark as Converted',
              onHandle: async () => {
                if (!doc) return

                const bookingValue = prompt(
                  `🎉 Converting ${doc.firstName} ${doc.lastName}!\n\n` +
                  `Enter the booking value (in dollars):`,
                  doc.bookingValue?.toString() || '5000'
                )

                if (!bookingValue) return

                const value = parseFloat(bookingValue)
                if (isNaN(value) || value <= 0) {
                  alert('❌ Please enter a valid booking value')
                  return
                }

                try {
                  // Send to GA4 (if client_id exists)
                  let ga4Success = false
                  if (doc.analytics?.ga_client_id) {
                    const ga4Response = await fetch('https://chefnamcatering.com/api/send-lead-event', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({
                        ga_client_id: doc.analytics.ga_client_id,
                        event_type: 'convert_lead',
                        value: value,
                        lead_source: doc.attribution?.lead_source,
                        event_type_name: doc.eventType
                      })
                    })

                    const ga4Result = await ga4Response.json()
                    ga4Success = ga4Result.success
                  }

                  // Send to Google Ads (if GCLID exists)
                  let adsSuccess = false
                  if (doc.attribution?.gclid) {
                    const adsResponse = await fetch('https://chefnamcatering.com/api/send-google-ads-conversion', {
                      method: 'POST',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({
                        gclid: doc.attribution.gclid,
                        conversion_type: 'converted',
                        value: value,
                        email: doc.email,
                        phone: doc.phone,
                        conversion_time: new Date().toISOString()
                      })
                    })

                    const adsResult = await adsResponse.json()
                    adsSuccess = adsResult.success
                  }

                  // Update Sanity document
                  await context.client
                    .patch(doc._id)
                    .set({
                      leadStatus: 'converted',
                      bookingValue: value,
                      'analytics.conversionSentToGA4': ga4Success,
                      'analytics.conversionSentToAds': adsSuccess,
                      'analytics.lastGA4EventType': 'convert_lead',
                      'analytics.lastGA4EventSentAt': new Date().toISOString(),
                      updatedAt: new Date().toISOString()
                    })
                    .commit()

                  const message = ga4Success && adsSuccess
                    ? `✅ Lead converted successfully!\n\nBooking Value: $${value.toLocaleString()}\nGA4: ✓ Sent\nGoogle Ads: ✓ Sent`
                    : ga4Success
                      ? `✅ Lead converted successfully!\n\nBooking Value: $${value.toLocaleString()}\nGA4: ✓ Sent\nGoogle Ads: ${doc.attribution?.gclid ? '✗ Failed (check logs)' : 'N/A (no GCLID)'}`
                      : `✅ Lead converted successfully!\n\nBooking Value: $${value.toLocaleString()}\nGA4: ✗ No client ID\nGoogle Ads: ${adsSuccess ? '✓ Sent' : 'N/A'}`

                  alert(message)
                } catch (error) {
                  console.error('Error converting lead:', error)
                  alert(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
              }
            }
          }
        ]
      }

      return prev
    }
  }
})
