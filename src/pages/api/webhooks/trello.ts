import type { APIRoute } from 'astro';
import { updateLead, getLeadById } from '../../../lib/bigquery';
import { updateFirestoreLead } from '../../../lib/firestore';
import { LIST_STATUS_MAP, getLeadIdFromCard } from '../../../lib/trello';

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
 * Receives Trello webhook events and syncs changes to Firestore + BigQuery.
 *
 * Handled events:
 * - updateCard (listAfter) - card moved between lists = status change
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
          text?: string; // comment text
          old?: { idList?: string };
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
    const projectId = runtime?.env?.BIGQUERY_PROJECT_ID;
    const bqCredentials = runtime?.env?.BIGQUERY_CREDENTIALS;
    const fsCredentials = runtime?.env?.FIREBASE_CREDENTIALS;
    const trelloApiKey = runtime?.env?.TRELLO_API_KEY;
    const trelloApiToken = runtime?.env?.TRELLO_API_TOKEN;

    if (!projectId || !bqCredentials || !trelloApiKey || !trelloApiToken) {
      console.error('Missing required credentials for webhook processing');
      return new Response('ok', { status: 200 });
    }

    // Look up lead ID from the Trello card description
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

      console.log(`📊 Status change: ${action.data.listBefore?.name} to ${action.data.listAfter.name} (${newStatus})`);

      // Build updates
      const updates: { status: string; won_at?: string; booked_at?: string } = { status: newStatus };

      // If moving to "Qualified", trigger Lead_Qualified offline conversion
      if (newStatus === 'qualified') {
        const leadResult = await getLeadById(leadId, projectId, bqCredentials);
        if (leadResult.success && leadResult.lead?.gclid) {
          console.log('📊 Qualified lead has gclid - Lead_Qualified conversion should fire');
          console.log('Lead:', {
            id: leadId,
            gclid: leadResult.lead.gclid,
            email_hash: leadResult.lead.email_hash,
            phone_hash: leadResult.lead.phone_hash,
          });
          // TODO: Implement Google Ads Conversion API call
          // Conversion action ID: 7350099303 (Lead_Qualified)
          console.log('🔜 Google Ads Lead_Qualified offline conversion pending implementation');
        }
      }

      // If moving to "Event Booked (Deposit)", set booked_at
      if (newStatus === 'booked') {
        updates.booked_at = new Date().toISOString();
      }

      // If moving to "Invoice Paid", trigger Purchase offline conversion (full revenue confirmed)
      if (newStatus === 'invoice_paid') {
        const leadResult = await getLeadById(leadId, projectId, bqCredentials);
        if (leadResult.success && leadResult.lead?.gclid) {
          console.log('📊 Invoice paid lead has gclid - Purchase conversion should fire');
          console.log('Lead:', {
            id: leadId,
            gclid: leadResult.lead.gclid,
            booking_value: leadResult.lead.booking_value,
            email_hash: leadResult.lead.email_hash,
            phone_hash: leadResult.lead.phone_hash,
          });
          // TODO: Implement Google Ads Conversion API call
          // Conversion action ID: 7350098097 (Purchase)
          console.log('🔜 Google Ads Purchase offline conversion pending implementation');
        }
      }

      // If moving to "Won", set won_at timestamp
      if (newStatus === 'won') {
        updates.won_at = new Date().toISOString();
      }

      // Update BigQuery
      const bqResult = await updateLead(leadId, updates, projectId, bqCredentials);
      if (bqResult.success) {
        console.log(`✅ BigQuery status updated: ${newStatus}`);
      } else {
        console.error('❌ BigQuery status update failed:', bqResult.error);
      }

      // Update Firestore
      if (fsCredentials) {
        const fsResult = await updateFirestoreLead(leadId, { status: newStatus }, projectId, fsCredentials);
        if (fsResult.success) {
          console.log(`✅ Firestore status updated: ${newStatus}`);
        } else {
          console.error('⚠️ Firestore status update failed:', fsResult.error);
        }
      }
    }

    // Handle: Comment added to card (append to notes)
    if (actionType === 'commentCard' && action.data.text) {
      const commentText = action.data.text;
      const author = action.memberCreator?.fullName || action.memberCreator?.username || 'Unknown';
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      console.log(`💬 Comment by ${author}: ${commentText.substring(0, 50)}...`);

      // Get existing notes to append
      const leadResult = await getLeadById(leadId, projectId, bqCredentials);
      const existingNotes = leadResult.success ? (leadResult.lead?.notes || '') : '';
      const newNote = `[${timestamp} ${author}] ${commentText}`;
      const updatedNotes = existingNotes ? `${existingNotes}\n${newNote}` : newNote;

      // Update BigQuery
      const bqResult = await updateLead(leadId, { notes: updatedNotes }, projectId, bqCredentials);
      if (bqResult.success) {
        console.log('✅ BigQuery notes updated');
      } else {
        console.error('❌ BigQuery notes update failed:', bqResult.error);
      }

      // Update Firestore
      if (fsCredentials) {
        const fsResult = await updateFirestoreLead(leadId, { notes: updatedNotes }, projectId, fsCredentials);
        if (fsResult.success) {
          console.log('✅ Firestore notes updated');
        } else {
          console.error('⚠️ Firestore notes update failed:', fsResult.error);
        }
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
