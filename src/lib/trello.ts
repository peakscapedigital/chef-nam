/**
 * Trello helper for webhook processing and card management
 * Used by the webhook handler and form submission flow
 *
 * Custom fields on Catering Leads board:
 *   - "Lead ID" (text)       — links card to BigQuery/Firestore lead
 *   - "Lead Received" (date) — submission timestamp for response time tracking
 *   - "Quote Sent" (date)    — when quote was sent
 *   - "Order" (text)         — order details
 */

// Custom Field IDs (Catering Leads board)
export const CUSTOM_FIELD_LEAD_ID = '69b8d1b4dedc722fcd0b9bd1';
export const CUSTOM_FIELD_LEAD_RECEIVED = '69a080be13db331102cbd35c';

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
