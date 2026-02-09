import type { APIRoute } from 'astro';
import { updateLead, getLeadById } from '../../../../../lib/bigquery';
import { updateFirestoreLead } from '../../../../../lib/firestore';

export const prerender = false;

/**
 * POST /api/admin/leads/[id]/status
 * Update lead status and optionally booking value
 *
 * Body:
 * - status: new | contacted | qualified | won | lost
 * - booking_value: number (required when status = won)
 */
export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Access Cloudflare env vars through runtime context
    const runtime = (locals as { runtime?: { env?: Record<string, string> } }).runtime;
    const projectId = runtime?.env?.BIGQUERY_PROJECT_ID;
    const credentials = runtime?.env?.BIGQUERY_CREDENTIALS;

    if (!projectId || !credentials) {
      return new Response(
        JSON.stringify({ success: false, error: 'BigQuery not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const leadId = params.id;
    if (!leadId) {
      return new Response(
        JSON.stringify({ success: false, error: 'Lead ID required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as {
      status?: string;
      booking_value?: number;
    };

    const { status, booking_value } = body;

    if (!status) {
      return new Response(
        JSON.stringify({ success: false, error: 'Status required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate status
    const validStatuses = ['new', 'contacted', 'qualified', 'quoted', 'won', 'lost'];
    if (!validStatuses.includes(status)) {
      return new Response(
        JSON.stringify({ success: false, error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build update object
    const updates: {
      status: string;
      booking_value?: number;
      won_at?: string;
    } = { status };

    // If marking as won, require booking_value and set won_at
    if (status === 'won') {
      if (!booking_value || booking_value <= 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Booking value required when marking as won' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }
      updates.booking_value = booking_value;
      updates.won_at = new Date().toISOString();

      // Get lead data for offline conversion
      const leadResult = await getLeadById(leadId, projectId, credentials);

      if (leadResult.success && leadResult.lead) {
        const lead = leadResult.lead;

        // Send offline conversion to Google Ads if lead has gclid
        if (lead.gclid) {
          console.log('📊 Lead marked as won with gclid - sending offline conversion');
          console.log('Lead:', {
            id: leadId,
            gclid: lead.gclid,
            value: booking_value,
            email_hash: lead.email_hash,
            phone_hash: lead.phone_hash
          });

          // TODO: Implement Google Ads Conversion API call
          // This will be added in the google-ads-conversion.ts helper
          // For now, just log that we would send the conversion
          console.log('🔜 Google Ads offline conversion pending implementation');
        }
      }
    }

    // Update the lead in BigQuery
    const result = await updateLead(leadId, updates, projectId, credentials);

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Lead ${leadId} status updated to: ${status}`);

    // Sync to Firestore (non-blocking)
    const fsCredentials = runtime?.env?.FIREBASE_CREDENTIALS;
    if (fsCredentials) {
      const fsUpdates: { status: string; booking_value?: number } = { status };
      if (booking_value !== undefined) fsUpdates.booking_value = booking_value;
      updateFirestoreLead(leadId, fsUpdates, projectId, fsCredentials)
        .then(r => {
          if (r.success) console.log(`✅ Firestore status synced: ${status}`);
          else console.error('⚠️ Firestore status sync failed:', r.error);
        })
        .catch(e => console.error('⚠️ Firestore status sync error:', e));
    }

    return new Response(
      JSON.stringify({ success: true, leadId, status, booking_value }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating lead status:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
