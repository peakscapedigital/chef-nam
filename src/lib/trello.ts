/**
 * Trello helper for webhook processing and card management
 * Used by the webhook handler and form submission flow
 *
 * Lead ID is stored in the card description as a hidden tag:
 *   <!-- lead_id:UUID -->
 * This avoids needing Trello Premium for custom fields.
 */

// Trello List ID → Lead Status mapping
export const LIST_STATUS_MAP: Record<string, string> = {
  '69894415201f9d44987bcea9': 'new',        // New Leads
  '69894415201f9d44987bceaa': 'contacted',   // Contacted
  '69894415201f9d44987bceab': 'qualified',   // Qualified
  '6989444747df6dc23d0a7d99': 'quoted',      // Quote
  '6989444b9d4ac311141a1129': 'won',         // Won
  '6989444f8958f223d92978b2': 'lost',        // Lost
};

// Pattern to extract lead_id from card description
const LEAD_ID_PATTERN = /<!-- lead_id:([0-9a-f-]{36}) -->/;

/**
 * Extract Lead ID from a card description string
 */
export function parseLeadIdFromDesc(desc: string): string | null {
  const match = desc.match(LEAD_ID_PATTERN);
  return match ? match[1] : null;
}

/**
 * Fetch the Lead ID from a Trello card's description
 */
export async function getLeadIdFromCard(
  cardId: string,
  apiKey: string,
  apiToken: string
): Promise<string | null> {
  try {
    const url = `https://api.trello.com/1/cards/${cardId}?key=${apiKey}&token=${apiToken}&fields=desc`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('Failed to get card:', response.status);
      return null;
    }

    const card = await response.json() as { desc: string };
    return parseLeadIdFromDesc(card.desc);
  } catch (error) {
    console.error('Error fetching lead ID from card:', error);
    return null;
  }
}
