// Chef Nam Brevo adapter — the per-client config (list IDs + attribute schema)
// over the kit's syncContactToBrevo (@peakscape/site-kit/brevo). The HTTP
// upsert / list-membership logic lives once in the kit; this holds only what's
// Nam-specific. FIRSTNAME / LASTNAME / SMS are handled by the kit.
import { syncContactToBrevo, type BrevoSyncResult } from '@peakscape/site-kit/brevo';

export const NEW_LEADS_LIST_ID = 7;
export const CUSTOMERS_LIST_ID = 8;

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

/** Upsert a form lead into Brevo and add it to the New Leads list. */
export function upsertBrevoContact(
  data: BrevoContactData,
  apiKey: string
): Promise<BrevoSyncResult> {
  const attributes: Record<string, string> = {};
  if (data.eventType) attributes.EVENT_TYPE = data.eventType;
  if (data.eventDate) attributes.EVENT_DATE = data.eventDate;
  if (data.guestCount) attributes.GUEST_COUNT = data.guestCount;
  if (data.leadSource) attributes.LEAD_SOURCE = data.leadSource;
  if (data.leadId) attributes.LEAD_ID = data.leadId;
  if (data.submittedAt) attributes.SUBMITTED_AT = data.submittedAt;

  return syncContactToBrevo({
    apiKey,
    email: data.email,
    firstName: data.firstName,
    lastName: data.lastName,
    listIds: [NEW_LEADS_LIST_ID],
    attributes,
  });
}

/**
 * Update a contact's STATUS attribute and optionally move them between
 * lifecycle lists (Trello webhook, on a pipeline-stage change).
 */
export function updateBrevoContactStatus(
  email: string,
  status: string,
  apiKey: string,
  options?: { addToList?: number; removeFromList?: number }
): Promise<BrevoSyncResult> {
  return syncContactToBrevo({
    apiKey,
    email,
    listIds: options?.addToList ? [options.addToList] : [],
    unlinkListIds: options?.removeFromList ? [options.removeFromList] : undefined,
    attributes: { STATUS: status },
  });
}
