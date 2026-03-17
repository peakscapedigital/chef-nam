import type { APIRoute } from 'astro';
import { getFirestoreLead, updateFirestoreLead } from '../../../lib/firestore';
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
 * Receives Trello webhook events and syncs changes to Firestore.
 *
 * Firestore is the real-time operational layer. BigQuery gets updated
 * via the Firebase "Stream to BigQuery" extension (changelog) and a
 * scheduled reconciliation job.
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
    const fsCredentials = runtime?.env?.FIREBASE_CREDENTIALS;
    const trelloApiKey = runtime?.env?.TRELLO_API_KEY;
    const trelloApiToken = runtime?.env?.TRELLO_API_TOKEN;

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

      // Log offline conversion candidates (gclid check happens at reconciliation/export time)
      if (newStatus === 'qualified') {
        console.log(`📊 Lead ${leadId} qualified — eligible for Lead_Qualified offline conversion if gclid exists`);
      }
      if (newStatus === 'invoice_paid') {
        console.log(`📊 Lead ${leadId} invoice paid — eligible for Purchase offline conversion if gclid exists`);
      }

      const fsResult = await updateFirestoreLead(leadId, updates, projectId, fsCredentials);
      if (fsResult.success) {
        console.log(`✅ Firestore updated: ${newStatus}`);
      } else {
        console.error('❌ Firestore update failed:', fsResult.error);
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
