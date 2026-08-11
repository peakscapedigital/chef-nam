/**
 * Trello helper for webhook processing and card management
 * Used by the webhook handler and form submission flow
 *
 * Custom fields on Catering Leads board:
 *   - "Lead ID" (text)         — links card to the Sheet lead row (lead_id)
 *   - "Lead Received" (date)   — submission timestamp for response time tracking
 *   - "Quote Sent" (date)      — when quote was sent
 *   - "Quote Amount" (number)  — quoted dollar amount
 *   - "Order Amount" (number)  — final order dollar amount
 *   - "Order" (text)           — order details
 */

/**
 * Verify a Trello webhook signature (CN-008).
 *
 * Trello signs every webhook POST with:
 *   x-trello-webhook = base64( HMAC-SHA1( rawRequestBody + callbackURL, apiSecret ) )
 *
 * The callback URL must be the EXACT string registered with Trello, byte for byte —
 * a trailing slash or an http/https mismatch changes the digest and fails every request.
 * Registered value, read from the Trello API on 2026-08-10:
 *   https://chefnamcatering.com/api/webhooks/trello
 *
 * WebCrypto is native on Workers, so this needs no dependency. The comparison is
 * constant-time: a fast-exit compare leaks how much of the digest matched, which is
 * enough to forge one byte at a time.
 *
 * @param rawBody   the request body as received, NOT re-serialized from a parsed object
 * @param signature the `x-trello-webhook` header, or null when absent
 * @param callbackURL the exact registered callback URL
 * @param secret    the Trello API Secret (NOT the API token)
 */
export async function verifyTrelloWebhook(
  rawBody: string,
  signature: string | null,
  callbackURL: string,
  secret: string
): Promise<boolean> {
  if (!signature) return false;

  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(rawBody + callbackURL)
  );

  // base64 of the raw digest, matching Trello's encoding
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));

  if (expected.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

// Custom Field IDs (Catering Leads board)
export const CUSTOM_FIELD_LEAD_ID = '69b8d1b4dedc722fcd0b9bd1';
export const CUSTOM_FIELD_LEAD_RECEIVED = '69a080be13db331102cbd35c';
export const CUSTOM_FIELD_QUOTE_AMOUNT = '69b8dc01536673b6b8956f94';
export const CUSTOM_FIELD_ORDER_AMOUNT = '69b8dc0bdd6e9dca576e0ef9';

// Trello List ID → Lead Status mapping
export const LIST_STATUS_MAP: Record<string, string> = {
  '69894415201f9d44987bcea9': 'new',            // New Leads
  '69894415201f9d44987bceaa': 'contacted',       // Contacted
  '69894415201f9d44987bceab': 'qualified',       // Qualified (Customer Respond)
  '6989444747df6dc23d0a7d99': 'quoted',          // Quote
  '699b5feb418239051c569fa2': 'tasting',         // Tasting
  '699b601996a60433cfd9fd4a': 'invoice_sent',    // Invoice Sent
  '699b6007c0ade284f7326380': 'booked',          // Event Booked (Deposit)
  '699b61aed94075be6fbf4bae': 'invoice_paid',    // Invoice Paid
  '6989444b9d4ac311141a1129': 'won',             // Won (Event Success!)
  '6989444f8958f223d92978b2': 'lost',            // Lost
  '699358522131fbabfe83302a': 'no_response',     // No Response
};

/**
 * Fetch the Lead ID from a Trello card's custom fields
 */
export async function getLeadIdFromCard(
  cardId: string,
  apiKey: string,
  apiToken: string
): Promise<string | null> {
  try {
    const url = `https://api.trello.com/1/cards/${cardId}/customFieldItems?key=${apiKey}&token=${apiToken}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('Failed to get card custom fields:', response.status);
      return null;
    }

    const items = await response.json() as Array<{ idCustomField: string; value?: { text?: string } }>;
    const leadIdItem = items.find(item => item.idCustomField === CUSTOM_FIELD_LEAD_ID);
    return leadIdItem?.value?.text || null;
  } catch (error) {
    console.error('Error fetching lead ID from card:', error);
    return null;
  }
}
