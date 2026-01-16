import type { APIRoute } from 'astro';
import { queryLeads } from '../../../../lib/bigquery';

export const prerender = false;

/**
 * GET /api/admin/leads
 * Fetch leads with optional filtering and pagination
 *
 * Query params:
 * - status: filter by status (new, contacted, qualified, won, lost, all)
 * - limit: number of results (default 50)
 * - offset: pagination offset (default 0)
 * - orderBy: field to order by (default submitted_at)
 * - orderDir: ASC or DESC (default DESC)
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const projectId = import.meta.env.BIGQUERY_PROJECT_ID;
    const credentials = import.meta.env.BIGQUERY_CREDENTIALS;

    if (!projectId || !credentials) {
      return new Response(
        JSON.stringify({ success: false, error: 'BigQuery not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse query params
    const status = url.searchParams.get('status') || 'all';
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const orderBy = url.searchParams.get('orderBy') || 'submitted_at';
    const orderDir = (url.searchParams.get('orderDir') || 'DESC').toUpperCase() as 'ASC' | 'DESC';

    const result = await queryLeads(projectId, credentials, {
      status,
      limit,
      offset,
      orderBy,
      orderDir
    });

    if (!result.success) {
      return new Response(
        JSON.stringify({ success: false, error: result.error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        leads: result.leads,
        totalCount: result.totalCount,
        limit,
        offset
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching leads:', error);
    return new Response(
      JSON.stringify({ success: false, error: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
