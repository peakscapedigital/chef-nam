import type { APIRoute } from 'astro';
import { serverEnv } from '@peakscape/site-kit/cloudflare';
import {
  getSheetLead,
  updateSheetLead,
  STATUS_DISPLAY,
  STATUS_TIMESTAMP_COLUMN,
} from '../../../lib/sheets';
import {
  LIST_STATUS_MAP,
  getLeadIdFromCard,
  CUSTOM_FIELD_QUOTE_AMOUNT,
  CUSTOM_FIELD_ORDER_AMOUNT,
} from '../../../lib/trello';
import {
  getGoogleAdsCredentials,
  uploadClickConversion,
  getGa4Credentials,
  sendGa4Event,
  recordPurchase,
} from '@peakscape/site-kit/analytics';
import {
  CONVERSION_ACTION_LEAD_QUALIFIED,
  CONVERSION_ACTION_QUOTE,
  CONVERSION_ACTION_PURCHASE,
} from '../../../lib/conversion-actions';
import {
  updateBrevoContactStatus,
  NEW_LEADS_LIST_ID,
  CUSTOMERS_LIST_ID,
} from '../../../lib/brevo';

export const prerender = false;

/**
 * HEAD /api/webhooks/trello
 * Trello sends a HEAD request to verify the webhook URL exists. Must return 200.
 */
export const HEAD: APIRoute = async () => {
  return new Response(null, { status: 200 });
};

/**
 * POST /api/webhooks/trello
 * Receives Trello webhook events. The Google Sheet (Leads tab) is the lead store:
 * this handler reads GCLID / GA Client ID / Email from the Sheet and writes the
 * lead's Status, milestone timestamps, quote/order amounts, and notes back to it.
 * It also uploads offline conversions to Google Ads + GA4 when:
 *   - Card reaches "Qualified" → Lead_Qualified conversion
 *   - Quote Amount custom field is set → Quote conversion
 *   - Order Amount custom field is set → Purchase conversion
 *
 * Trello remains the human kanban + the trigger. (Firestore/BigQuery/Airtable are
 * being retired; this handler no longer reads or writes them.)
 *
 * Handled events:
 * - updateCard (listAfter)  - card moved between lists = status change
 * - updateCustomFieldItem   - custom field value changed (quote/order amounts)
 * - commentCard             - comment added = append to notes
 */
export const POST: APIRoute = async ({ request }) => {
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

    // Credentials (Astro 6: from cloudflare:workers).
    const env = serverEnv();
    const sheetsCredentials = env.SHEETS_CREDENTIALS;
    const trelloApiKey = env.TRELLO_API_KEY;
    const trelloApiToken = env.TRELLO_API_TOKEN;

    if (!sheetsCredentials || !trelloApiKey || !trelloApiToken) {
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

      // Update the Sheet: Status + milestone timestamp (set once per stage)
      const updates: Record<string, string> = { Status: STATUS_DISPLAY[newStatus] || newStatus };
      const timestampCol = STATUS_TIMESTAMP_COLUMN[newStatus];
      if (timestampCol) {
        updates[timestampCol] = new Date().toISOString();
      }

      const sheetResult = await updateSheetLead(leadId, updates, sheetsCredentials);
      if (sheetResult.success) {
        console.log(`✅ Sheet updated: ${newStatus}`);
      } else {
        console.error('❌ Sheet update failed:', sheetResult.error);
      }

      // Read the lead once for Brevo + conversions (GCLID / GA Client ID / Email)
      const leadResult = await getSheetLead(leadId, sheetsCredentials);
      const lead = leadResult.success ? leadResult.lead : null;

      // Sync status to Brevo contact
      const brevoApiKey = env.BREVO_API_KEY;
      const leadEmail = lead?.['Email'];
      if (brevoApiKey && leadEmail) {
        const brevoOptions = newStatus === 'won'
          ? { addToList: CUSTOMERS_LIST_ID, removeFromList: NEW_LEADS_LIST_ID }
          : undefined;

        const brevoResult = await updateBrevoContactStatus(
          leadEmail, newStatus, brevoApiKey, brevoOptions
        );

        if (brevoResult.success) {
          console.log(`✅ Brevo status updated: ${newStatus}${newStatus === 'won' ? ' (moved to Customers list)' : ''}`);
        } else {
          console.error('⚠️ Brevo status update failed:', brevoResult.error);
        }
      } else if (brevoApiKey) {
        console.log('⚠️ No email found for lead, skipping Brevo sync');
      }

      // Send conversion events for key status changes
      if (['qualified', 'lost', 'no_response'].includes(newStatus)) {
        const gclid = lead?.['GCLID'];
        const gaClientId = lead?.['GA Client ID'];

        // Google Ads: Lead_Qualified conversion
        if (newStatus === 'qualified' && gclid) {
          const gadsCredentials = getGoogleAdsCredentials(env);
          if (gadsCredentials) {
            const result = await uploadClickConversion(gadsCredentials, {
              gclid,
              conversionActionId: CONVERSION_ACTION_LEAD_QUALIFIED,
              conversionValue: 100.0,
            });
            if (result.ok) {
              console.log(`✅ Lead_Qualified conversion uploaded for lead ${leadId}`);
            } else {
              console.error(`⚠️ Lead_Qualified upload failed: ${result.error || result.partialFailureError}`);
            }
          }
        }

        // GA4: lifecycle events
        if (gaClientId) {
          const ga4Credentials = getGa4Credentials(env);
          if (ga4Credentials) {
            if (newStatus === 'qualified') {
              await sendGa4Event(ga4Credentials, gaClientId, 'qualify_lead', {
                value: 100.0, currency: 'USD',
              });
            } else if (newStatus === 'lost') {
              await sendGa4Event(ga4Credentials, gaClientId, 'disqualify_lead', {
                disqualified_lead_reason: 'Did not convert',
              });
            } else if (newStatus === 'no_response') {
              await sendGa4Event(ga4Credentials, gaClientId, 'close_unconvert_lead', {
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

      // Trello custom field -> Sheet column
      const fieldMap: Record<string, string> = {
        [CUSTOM_FIELD_QUOTE_AMOUNT]: 'Quote Amount',
        [CUSTOM_FIELD_ORDER_AMOUNT]: 'Order Amount',
      };

      const sheetCol = fieldMap[fieldId];

      if (sheetCol) {
        console.log(`💰 ${action.data.customField.name} set to ${numValue} on lead ${leadId}`);

        const sheetResult = await updateSheetLead(
          leadId,
          { [sheetCol]: numValue },
          sheetsCredentials
        );
        if (sheetResult.success) {
          console.log(`✅ Sheet ${sheetCol} updated: ${numValue}`);
        } else {
          console.error(`❌ Sheet ${sheetCol} update failed:`, sheetResult.error);
        }

        // Send conversion events when quote/order amounts are set
        if (numValue && numValue > 0) {
          const leadResult = await getSheetLead(leadId, sheetsCredentials);
          const lead = leadResult.success ? leadResult.lead : null;
          const gclid = lead?.['GCLID'];
          const gaClientId = lead?.['GA Client ID'];

          if (sheetCol === 'Quote Amount') {
            // Google Ads: Quote conversion
            if (gclid) {
              const gadsCredentials = getGoogleAdsCredentials(env);
              if (gadsCredentials) {
                const result = await uploadClickConversion(gadsCredentials, {
                  gclid,
                  conversionActionId: CONVERSION_ACTION_QUOTE,
                  conversionValue: numValue,
                });
                if (result.ok) {
                  console.log(`✅ Quote conversion uploaded for lead ${leadId}: $${numValue}`);
                } else {
                  console.error(`⚠️ Quote upload failed: ${result.error || result.partialFailureError}`);
                }
              }
            }
            // GA4: working_lead (actively working the deal)
            if (gaClientId) {
              const ga4Credentials = getGa4Credentials(env);
              if (ga4Credentials) {
                await sendGa4Event(ga4Credentials, gaClientId, 'working_lead', {
                  value: numValue, currency: 'USD', lead_status: 'Quoted',
                });
              }
            }
          }

          if (sheetCol === 'Order Amount') {
            // Google Ads: Purchase conversion
            if (gclid) {
              const gadsCredentials = getGoogleAdsCredentials(env);
              if (gadsCredentials) {
                const result = await uploadClickConversion(gadsCredentials, {
                  gclid,
                  conversionActionId: CONVERSION_ACTION_PURCHASE,
                  conversionValue: numValue,
                });
                if (result.ok) {
                  console.log(`✅ Purchase conversion uploaded for lead ${leadId}: $${numValue}`);
                } else {
                  console.error(`⚠️ Purchase upload failed: ${result.error || result.partialFailureError}`);
                }
              }
            }
            // GA4: close_convert_lead (lead-lifecycle funnel) + purchase (ecommerce revenue)
            if (gaClientId) {
              const ga4Credentials = getGa4Credentials(env);
              if (ga4Credentials) {
                await sendGa4Event(ga4Credentials, gaClientId, 'close_convert_lead', {
                  value: numValue, currency: 'USD',
                });
              }
              // GA4 `purchase` so the won booking lands in purchaseRevenue/transactions —
              // only `purchase` populates GA4 ecommerce revenue. Offline close means no
              // client-side purchase, so this is the sole purchase event (no double-count).
              // transaction_id = leadId dedupes re-fires if Order Amount is edited.
              // GA4-only (no gclid): the Ads purchase OCI already fires above.
              await recordPurchase(env, {
                gaClientId,
                purchase: { transaction_id: leadId, value: numValue, currency: 'USD' },
              });
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

      // Append to the Sheet's Notes column
      const leadResult = await getSheetLead(leadId, sheetsCredentials);
      const existingNotes = leadResult.success ? (leadResult.lead?.['Notes'] || '') : '';
      const newNote = `[${timestamp} ${author}] ${commentText}`;
      const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

      const sheetResult = await updateSheetLead(leadId, { Notes: updatedNotes }, sheetsCredentials);
      if (sheetResult.success) {
        console.log('✅ Sheet notes updated');
      } else {
        console.error('❌ Sheet notes update failed:', sheetResult.error);
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
