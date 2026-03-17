/**
 * GA4 Measurement Protocol client for offline lead lifecycle events
 *
 * Sends server-side events to GA4 when leads progress through the pipeline.
 * Requires the original user's ga_client_id (captured from _ga cookie at form submission).
 *
 * Required env vars:
 *   GA4_MEASUREMENT_ID
 *   GA4_API_SECRET
 */

const MP_ENDPOINT = 'https://www.google-analytics.com/mp/collect';

interface GA4Credentials {
  measurementId: string;
  apiSecret: string;
}

interface GA4EventResult {
  success: boolean;
  error?: string;
}

/**
 * Parse GA4 credentials from env vars
 */
export function getGA4Credentials(env: Record<string, string>): GA4Credentials | null {
  const measurementId = env.GA4_MEASUREMENT_ID;
  const apiSecret = env.GA4_API_SECRET;

  if (!measurementId || !apiSecret) {
    return null;
  }

  return { measurementId, apiSecret };
}

/**
 * Send a lead lifecycle event to GA4 via Measurement Protocol
 *
 * GA4 recommended lead events:
 *   generate_lead        - Initial lead capture (sent client-side via GTM)
 *   qualify_lead          - Lead responded, real conversation
 *   working_lead          - Actively working the deal (quote sent)
 *   close_convert_lead    - Lead became a customer
 *   disqualify_lead       - Lead doesn't meet criteria
 *   close_unconvert_lead  - Lead went through pipeline but didn't close
 */
export async function sendGA4Event(
  credentials: GA4Credentials,
  clientId: string,
  eventName: string,
  params?: {
    value?: number;
    currency?: string;
    lead_source?: string;
    lead_status?: string;
    disqualified_lead_reason?: string;
    unconvert_lead_reason?: string;
  }
): Promise<GA4EventResult> {
  try {
    const url = `${MP_ENDPOINT}?measurement_id=${credentials.measurementId}&api_secret=${credentials.apiSecret}`;

    const eventParams: Record<string, unknown> = {
      event_category: 'lead_lifecycle',
    };

    if (params?.value !== undefined) {
      eventParams.value = params.value;
      eventParams.currency = params.currency || 'USD';
    }
    if (params?.lead_source) eventParams.lead_source = params.lead_source;
    if (params?.lead_status) eventParams.lead_status = params.lead_status;
    if (params?.disqualified_lead_reason) eventParams.disqualified_lead_reason = params.disqualified_lead_reason;
    if (params?.unconvert_lead_reason) eventParams.unconvert_lead_reason = params.unconvert_lead_reason;

    const payload = {
      client_id: clientId,
      events: [{
        name: eventName,
        params: eventParams,
      }],
    };

    console.log(`📊 GA4: Sending ${eventName} for client ${clientId.substring(0, 10)}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    // Measurement Protocol returns 204 on success with no body
    if (response.status === 204 || response.ok) {
      console.log(`✅ GA4: ${eventName} sent`);
      return { success: true };
    }

    const errorText = await response.text();
    console.error(`❌ GA4 error (${response.status}):`, errorText);
    return { success: false, error: `GA4 error ${response.status}: ${errorText}` };
  } catch (error) {
    console.error('❌ GA4 exception:', error);
    return { success: false, error: String(error) };
  }
}
