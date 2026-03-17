import type { APIRoute } from 'astro';
import { getFirestoreLead, updateFirestoreLead } from '../../../lib/firestore';
import {
  LIST_STATUS_MAP,
  getLeadIdFromCard,
  CUSTOM_FIELD_QUOTE_AMOUNT,
  CUSTOM_FIELD_ORDER_AMOUNT,
} from '../../../lib/trello';
import {
  getGoogleAdsCredentials,
  uploadClickConversion,
  CONVERSION_ACTION_LEAD_QUALIFIED,
  CONVERSION_ACTION_QUOTE,
  CONVERSION_ACTION_PURCHASE,
} from '../../../lib/google-ads';
import { getGA4Credentials, sendGA4Event } from '../../../lib/ga4';

export const prerender = false;

/**
 * HEAD /api/webhooks/trello
 * Trello sends a HEAD request to verify the webhook URL exists.
 * Must return 200.
 */
export const HEAD: APIRoute = async () => {
  return new Response(null, { status: 200 });
};

/**
 * POST /api/webhooks/trello
 * Receives Trello webhook events and syncs changes to Firestore.
 * Also uploads offline conversions to Google Ads when:
 *   - Card reaches "Qualified" → Lead_Qualified conversion
 *   - Order Amount custom field is set → Purchase conversion
 *
 * Firestore is the real-time operational layer. BigQuery gets updated
 * via the Firebase "Stream to BigQuery" extension (changelog) and a
 * scheduled reconciliation job (every 6 hours).
 *
 * Handled events:
 * - updateCard (listAfter) - card moved between lists = status change
 * - updateCustomFieldItem  - custom field value changed (quote/order amounts)
 * - commentCard - comment added = append to notes
 */
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json() as {
      action: {
        type: string;
        data: {
          card?: { id: string; name: string };
          listAfter?: { id: string; name: string };
          listBefore?: { id: string; name: string };
          text?: string;
          old?: { idList?: string };
          customField?: { id: string; name: string };
          customFieldItem?: {
            value?: { number?: string };
          };
        };
        memberCreator?: { fullName: string; username: string };
      };
    };

    const { action } = body;
    const actionType = action.type;
    const cardId = action.data.card?.id;

    console.log(`🔔 Trello webhook: ${actionType} on card ${cardId}`);

    if (!cardId) {
      console.log('No card ID in webhook payload, skipping');
      return new Response('ok', { status: 200 });
    }

    // Get credentials
    const runtime = (locals as { runtime?: { env?: Record<string, string> } }).runtime;
    const env = runtime?.env || {};
    const projectId = env.BIGQUERY_PROJECT_ID;
    const fsCredentials = env.FIREBASE_CREDENTIALS;
    const trelloApiKey = env.TRELLO_API_KEY;
    const trelloApiToken = env.TRELLO_API_TOKEN;

    if (!projectId || !fsCredentials || !trelloApiKey || !trelloApiToken) {
      console.error('Missing required credentials for webhook processing');
      return new Response('ok', { status: 200 });
    }

    // Look up lead ID from the Trello card's custom fields
    const leadId = await getLeadIdFromCard(cardId, trelloApiKey, trelloApiToken);

    if (!leadId) {
      console.log(`No Lead ID found on card ${cardId}, skipping sync`);
      return new Response('ok', { status: 200 });
    }

    console.log(`📋 Lead ID: ${leadId} for card ${cardId}`);

    // Handle: Card moved between lists (status change)
    if (actionType === 'updateCard' && action.data.listAfter) {
      const newListId = action.data.listAfter.id;
      const newStatus = LIST_STATUS_MAP[newListId];

      if (!newStatus) {
        console.log(`Unknown list ID: ${newListId}, skipping`);
        return new Response('ok', { status: 200 });
      }

      console.log(`📊 Status change: ${action.data.listBefore?.name} → ${action.data.listAfter.name} (${newStatus})`);

      // Build Firestore updates
      const updates: {
        status: string;
        contacted_at?: string;
        booked_at?: string;
        won_at?: string;
      } = { status: newStatus };

      // Milestone timestamps — set once per lead
      if (newStatus === 'contacted') {
        updates.contacted_at = new Date().toISOString();
      }
      if (newStatus === 'booked') {
        updates.booked_at = new Date().toISOString();
      }
      if (newStatus === 'won') {
        updates.won_at = new Date().toISOString();
      }

      const fsResult = await updateFirestoreLead(leadId, updates, projectId, fsCredentials);
      if (fsResult.success) {
        console.log(`✅ Firestore updated: ${newStatus}`);
      } else {
        console.error('❌ Firestore update failed:', fsResult.error);
      }

      // Send conversion events for key status changes
      if (['qualified', 'lost', 'no_response'].includes(newStatus)) {
        const leadResult = await getFirestoreLead(leadId, projectId, fsCredentials);
        const lead = leadResult.success ? leadResult.lead : null;

        // Google Ads: Lead_Qualified conversion
        if (newStatus === 'qualified' && lead?.gclid) {
          const gadsCredentials = getGoogleAdsCredentials(env);
          if (gadsCredentials) {
            const result = await uploadClickConversion(gadsCredentials, {
              gclid: lead.gclid,
              conversionActionId: CONVERSION_ACTION_LEAD_QUALIFIED,
              conversionValue: 100.0,
            });
            if (result.success) {
              console.log(`✅ Lead_Qualified conversion uploaded for lead ${leadId}`);
            } else {
              console.error(`⚠️ Lead_Qualified upload failed: ${result.error || result.partialFailureError}`);
            }
          }
        }

        // GA4: lifecycle events
        if (lead?.ga_client_id) {
          const ga4Credentials = getGA4Credentials(env);
          if (ga4Credentials) {
            if (newStatus === 'qualified') {
              await sendGA4Event(ga4Credentials, lead.ga_client_id, 'qualify_lead', {
                value: 100.0, currency: 'USD',
              });
            } else if (newStatus === 'lost') {
              await sendGA4Event(ga4Credentials, lead.ga_client_id, 'disqualify_lead', {
                disqualified_lead_reason: 'Did not convert',
              });
            } else if (newStatus === 'no_response') {
              await sendGA4Event(ga4Credentials, lead.ga_client_id, 'close_unconvert_lead', {
                unconvert_lead_reason: 'Never responded',
              });
            }
          }
        }
      }
    }

    // Handle: Custom field value changed (quote/order amounts)
    if (actionType === 'updateCustomFieldItem' && action.data.customField) {
      const fieldId = action.data.customField.id;
      const rawValue = action.data.customFieldItem?.value?.number;
      const numValue = rawValue ? parseFloat(rawValue) : null;

      const fieldMap: Record<string, string> = {
        [CUSTOM_FIELD_QUOTE_AMOUNT]: 'quote_amount',
        [CUSTOM_FIELD_ORDER_AMOUNT]: 'order_amount',
      };

      const fieldName = fieldMap[fieldId];

      if (fieldName) {
        console.log(`💰 ${action.data.customField.name} set to ${numValue} on lead ${leadId}`);

        const fsResult = await updateFirestoreLead(
          leadId,
          { [fieldName]: numValue } as { quote_amount?: number | null; order_amount?: number | null },
          projectId,
          fsCredentials
        );
        if (fsResult.success) {
          console.log(`✅ Firestore ${fieldName} updated: ${numValue}`);
        } else {
          console.error(`❌ Firestore ${fieldName} update failed:`, fsResult.error);
        }

        // Send conversion events when quote/order amounts are set
        if (numValue && numValue > 0) {
          const leadResult = await getFirestoreLead(leadId, projectId, fsCredentials);
          const lead = leadResult.success ? leadResult.lead : null;

          if (fieldName === 'quote_amount') {
            // Google Ads: Quote conversion
            if (lead?.gclid) {
              const gadsCredentials = getGoogleAdsCredentials(env);
              if (gadsCredentials) {
                const result = await uploadClickConversion(gadsCredentials, {
                  gclid: lead.gclid,
                  conversionActionId: CONVERSION_ACTION_QUOTE,
                  conversionValue: numValue,
                });
                if (result.success) {
                  console.log(`✅ Quote conversion uploaded for lead ${leadId}: $${numValue}`);
                } else {
                  console.error(`⚠️ Quote upload failed: ${result.error || result.partialFailureError}`);
                }
              }
            }
            // GA4: working_lead (actively working the deal)
            if (lead?.ga_client_id) {
              const ga4Credentials = getGA4Credentials(env);
              if (ga4Credentials) {
                await sendGA4Event(ga4Credentials, lead.ga_client_id, 'working_lead', {
                  value: numValue, currency: 'USD', lead_status: 'Quoted',
                });
              }
            }
          }

          if (fieldName === 'order_amount') {
            // Google Ads: Purchase conversion
            if (lead?.gclid) {
              const gadsCredentials = getGoogleAdsCredentials(env);
              if (gadsCredentials) {
                const result = await uploadClickConversion(gadsCredentials, {
                  gclid: lead.gclid,
                  conversionActionId: CONVERSION_ACTION_PURCHASE,
                  conversionValue: numValue,
                });
                if (result.success) {
                  console.log(`✅ Purchase conversion uploaded for lead ${leadId}: $${numValue}`);
                } else {
                  console.error(`⚠️ Purchase upload failed: ${result.error || result.partialFailureError}`);
                }
              }
            }
            // GA4: close_convert_lead (revenue confirmed)
            if (lead?.ga_client_id) {
              const ga4Credentials = getGA4Credentials(env);
              if (ga4Credentials) {
                await sendGA4Event(ga4Credentials, lead.ga_client_id, 'close_convert_lead', {
                  value: numValue, currency: 'USD',
                });
              }
            }
          }
        }
      }
    }

    // Handle: Comment added to card (append to notes)
    if (actionType === 'commentCard' && action.data.text) {
      const commentText = action.data.text;
      const author = action.memberCreator?.fullName || action.memberCreator?.username || 'Unknown';
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      console.log(`💬 Comment by ${author}: ${commentText.substring(0, 50)}...`);

      // Get existing notes from Firestore to append
      const leadResult = await getFirestoreLead(leadId, projectId, fsCredentials);
      const existingNotes = leadResult.success ? (leadResult.lead?.notes || '') : '';
      const newNote = `[${timestamp} ${author}] ${commentText}`;
      const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

      const fsResult = await updateFirestoreLead(leadId, { notes: updatedNotes }, projectId, fsCredentials);
      if (fsResult.success) {
        console.log('✅ Firestore notes updated');
      } else {
        console.error('❌ Firestore notes update failed:', fsResult.error);
      }
    }

    // Always return 200 to prevent Trello from disabling the webhook
    return new Response('ok', { status: 200 });
  } catch (error) {
    console.error('❌ Trello webhook error:', error);
    // Still return 200 - Trello will disable the webhook if it gets too many errors
    return new Response('ok', { status: 200 });
  }
};
