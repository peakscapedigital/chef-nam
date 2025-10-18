import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Send lead lifecycle events to GA4 using Measurement Protocol
 *
 * Required GA4 Setup:
 * 1. Get Measurement ID from GA4 Admin > Data Streams (format: G-XXXXXXXXXX)
 * 2. Create API Secret in GA4 Admin > Data Streams > Measurement Protocol API secrets
 * 3. Add both to environment variables:
 *    - GA4_MEASUREMENT_ID
 *    - GA4_API_SECRET
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.ga_client_id) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'GA4 client_id is required'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data.event_type) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'event_type is required (qualify_lead, working_lead, convert_lead)'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Get GA4 credentials from environment
    const measurementId = import.meta.env.GA4_MEASUREMENT_ID;
    const apiSecret = import.meta.env.GA4_API_SECRET;

    if (!measurementId || !apiSecret) {
      console.error('GA4 credentials not configured');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'GA4 credentials not configured. Add GA4_MEASUREMENT_ID and GA4_API_SECRET to environment.'
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Build the GA4 Measurement Protocol payload
    const payload = {
      client_id: data.ga_client_id,
      events: [{
        name: data.event_type, // qualify_lead, working_lead, convert_lead
        params: {
          // Lead value (for ROI tracking)
          value: data.value || 0,
          currency: data.currency || 'USD',

          // Event metadata
          event_category: 'lead_lifecycle',
          lead_status: data.event_type.replace('_lead', ''),

          // Optional: additional context
          ...(data.lead_source && { lead_source: data.lead_source }),
          ...(data.event_type_name && { event_type: data.event_type_name })
        }
      }]
    };

    // Send to GA4 Measurement Protocol
    const ga4Response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      }
    );

    // GA4 Measurement Protocol returns 204 on success with no body
    if (ga4Response.status === 204 || ga4Response.ok) {
      console.log(`Successfully sent ${data.event_type} event to GA4 for client ${data.ga_client_id}`);

      return new Response(
        JSON.stringify({
          success: true,
          message: `${data.event_type} event sent to GA4`,
          event_type: data.event_type,
          client_id: data.ga_client_id
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    } else {
      const errorText = await ga4Response.text();
      console.error('GA4 API error:', ga4Response.status, errorText);

      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to send event to GA4',
          error: errorText
        }),
        {
          status: ga4Response.status,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

  } catch (error) {
    console.error('Error sending lead event:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error sending lead event',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({
      message: 'This endpoint only accepts POST requests',
      usage: {
        method: 'POST',
        body: {
          ga_client_id: 'string (required) - GA4 client ID from cookie',
          event_type: 'string (required) - qualify_lead | working_lead | convert_lead',
          value: 'number (optional) - Lead or booking value',
          currency: 'string (optional) - Currency code (default: USD)',
          lead_source: 'string (optional) - Attribution source',
          event_type_name: 'string (optional) - Event type for context'
        }
      }
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    }
  );
};
