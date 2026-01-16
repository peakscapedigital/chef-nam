import type { APIRoute } from 'astro';
import { updateLead } from '../../../../../lib/bigquery';

export const prerender = false;

/**
 * POST /api/admin/leads/[id]/value
 * Update lead booking value without changing status
 *
 * Body:
 * - booking_value: number
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

    const body = await request.json() as { booking_value?: number };
    const { booking_value } = body;

    if (booking_value === undefined) {
      return new Response(
        JSON.stringify({ success: false, error: 'booking_value field required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Update the lead booking value
    const result = await updateLead(leadId, { booking_value }, projectId, credentials);

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Lead ${leadId} booking value updated to: $${booking_value}`);

    return new Response(
      JSON.stringify({ success: true, leadId, booking_value }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error updating lead value:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
