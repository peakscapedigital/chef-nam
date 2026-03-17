// Brevo API client for contact management
// Uses REST API v3 — docs: https://developers.brevo.com/reference

const BREVO_API_URL = 'https://api.brevo.com/v3';
const NEW_LEADS_LIST_ID = 7;

interface BrevoContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  eventType?: string;
  eventDate?: string;
  guestCount?: string;
  leadSource?: string;
  leadId?: string;
  submittedAt?: string;
}

interface BrevoResult {
  success: boolean;
  error?: string;
  created?: boolean; // true = new contact, false = updated existing
}

/**
 * Creates or updates a contact in Brevo and adds them to the New Leads list.
 * If the contact already exists (by email), updates their attributes instead.
 */
export async function upsertBrevoContact(
  data: BrevoContactData,
  apiKey: string
): Promise<BrevoResult> {
  const attributes: Record<string, string> = {};
  if (data.firstName) attributes.FIRSTNAME = data.firstName;
  if (data.lastName) attributes.LASTNAME = data.lastName;
  if (data.eventType) attributes.EVENT_TYPE = data.eventType;
  if (data.eventDate) attributes.EVENT_DATE = data.eventDate;
  if (data.guestCount) attributes.GUEST_COUNT = data.guestCount;
  if (data.leadSource) attributes.LEAD_SOURCE = data.leadSource;
  if (data.leadId) attributes.LEAD_ID = data.leadId;
  if (data.submittedAt) attributes.SUBMITTED_AT = data.submittedAt;

  const body = {
    email: data.email,
    attributes,
    listIds: [NEW_LEADS_LIST_ID],
    updateEnabled: true, // If contact exists, update attributes instead of failing
  };

  const response = await fetch(`${BREVO_API_URL}/contacts`, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (response.status === 201) {
    return { success: true, created: true };
  }

  if (response.status === 204) {
    // Contact existed and was updated
    return { success: true, created: false };
  }

  const errorText = await response.text();
  return {
    success: false,
    error: `Brevo API ${response.status}: ${errorText}`,
  };
}
