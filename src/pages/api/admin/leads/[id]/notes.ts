import type { APIRoute } from 'astro';
import { serverEnv } from '@peakscape/site-kit/cloudflare';
import { updateLead } from '../../../../../lib/bigquery';
import { updateFirestoreLead } from '../../../../../lib/firestore';

export const prerender = false;

/**
 * POST /api/admin/leads/[id]/notes
 * Update lead notes
 *
 * Body:
 * - notes: string
 */
export const POST: APIRoute = async ({ params, request }) => {
  try {
    // Access Cloudflare env vars + secrets (Astro 6: from cloudflare:workers)
    const env = serverEnv();
    const projectId = env.BIGQUERY_PROJECT_ID;
    const credentials = env.BIGQUERY_CREDENTIALS;

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

    const body = await request.json() as { notes?: string };
    const { notes } = body;

    if (notes === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'Notes field required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the lead notes
    const result = await updateLead(leadId, { notes }, projectId, credentials);

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Lead ${leadId} notes updated`);

    // Sync to Firestore (non-blocking)
    const fsCredentials = env.FIREBASE_CREDENTIALS;
    if (fsCredentials) {
      updateFirestoreLead(leadId, { notes }, projectId, fsCredentials)
        .then(r => {
          if (r.success) console.log(`✅ Firestore notes synced`);
          else console.error('⚠️ Firestore notes sync failed:', r.error);
        })
        .catch(e => console.error('⚠️ Firestore notes sync error:', e));
    }

    return new Response(
      JSON.stringify({ success: true, leadId }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating lead notes:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
