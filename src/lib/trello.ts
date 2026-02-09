/**
 * Trello helper for webhook processing and card management
 * Used by the webhook handler and form submission flow
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

// Custom field IDs (populated after running scripts/setup-trello.js)
// TODO: Replace these after running the setup script
export const CUSTOM_FIELD_LEAD_ID = '';
export const CUSTOM_FIELD_BOOKING_VALUE = '';

/**
 * Fetch the Lead ID custom field value from a Trello card
 */
export async function getLeadIdFromCard(
  cardId: string,
  apiKey: string,
  apiToken: string
): Promise<string | null> {
  if (!CUSTOM_FIELD_LEAD_ID) {
    console.error('CUSTOM_FIELD_LEAD_ID not configured');
    return null;
  }

  try {
    const url = `https://api.trello.com/1/cards/${cardId}/customFieldItems?key=${apiKey}&token=${apiToken}`;
    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      console.error('Failed to get card custom fields:', response.status);
      return null;
    }

    const items = await response.json() as Array<{
      idCustomField: string;
      value?: { text?: string; number?: string };
    }>;

    const leadIdField = items.find(item => item.idCustomField === CUSTOM_FIELD_LEAD_ID);
    return leadIdField?.value?.text || null;
  } catch (error) {
    console.error('Error fetching lead ID from card:', error);
    return null;
  }
}

/**
 * Set a custom field value on a Trello card
 */
export async function setCardCustomField(
  cardId: string,
  fieldId: string,
  value: { text?: string; number?: string },
  apiKey: string,
  apiToken: string
): Promise<boolean> {
  try {
    const url = `https://api.trello.com/1/cards/${cardId}/customField/${fieldId}/item?key=${apiKey}&token=${apiToken}`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ value }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to set custom field ${fieldId}:`, response.status, errorText);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error setting custom field:', error);
    return false;
  }
}
