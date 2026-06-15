/**
 * Airtable helper for the Chef Nam lead pipeline (kanban + operational store).
 *
 * Parallel track to Trello/Firestore — Airtable's `Status` single-select drives
 * a native Kanban view, and the same record holds attribution fields so offline
 * conversions can run off Airtable later (Phase 2 webhook).
 *
 * REST API via Personal Access Token — docs: https://airtable.com/developers/web/api
 * Uses plain `fetch` (Workers-compatible, no SDK), mirroring brevo.ts / firestore.ts.
 *
 * Base + table IDs are hardcoded (like Trello list IDs in trello.ts); only the
 * PAT is read from env (AIRTABLE_API_KEY).
 */

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';

export const AIRTABLE_BASE_ID = 'appvD8Y1e72YhTGSH';
export const AIRTABLE_LEADS_TABLE = 'tblOs5tWImU5DhePF';
export const AIRTABLE_CONTACTS_TABLE = 'tblxcwoKo2nutzzEU';

// Pipeline-stage status values (must match the Leads.Status single-select
// choices). Same set as Trello LIST_STATUS_MAP, in display-name form.
export const AIRTABLE_STATUS = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  quoted: 'Quoted',
  tasting: 'Tasting',
  invoice_sent: 'Invoice Sent',
  booked: 'Booked',
  invoice_paid: 'Invoice Paid',
  won: 'Won',
  lost: 'Lost',
  no_response: 'No Response',
} as const;

interface AirtableResult {
  success: boolean;
  error?: string;
  recordId?: string;
}

// Raw form payload shape (same object passed to Trello/Firestore in submit-form).
interface LeadFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  preferredContact?: string;
  hasEvent?: string;
  eventType?: string;
  eventDate?: string;
  eventTime?: string;
  guestCount?: string;
  location?: string;
  serviceStyle?: string;
  budgetRange?: string;
  dietaryRequirements?: string[] | string;
  message?: string;
  eventDescription?: string;
  source?: string;
  // attribution (snake_case, server-authoritative from the ps_attr cookie)
  gclid?: string;
  ga_client_id?: string;
  fbclid?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  lead_source?: string;
  landing_page?: string;
  referrer?: string;
}

function authHeaders(apiKey: string) {
  return {
    Authorization: `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/** Map the raw form payload onto Airtable Leads field names. Omits empty values. */
function mapLeadFields(
  data: LeadFormData,
  leadId: string,
  extra?: { emailHash?: string; phoneHash?: string }
): Record<string, unknown> {
  const now = new Date().toISOString();
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
  const name = data.eventType ? `${fullName} - ${data.eventType}` : fullName;

  const dietary = Array.isArray(data.dietaryRequirements)
    ? data.dietaryRequirements.join(', ')
    : data.dietaryRequirements;

  const fields: Record<string, unknown> = {
    Name: name || data.email,
    'Lead ID': leadId,
    Status: AIRTABLE_STATUS.new,
    Email: data.email,
    Phone: data.phone,
    'Preferred Contact': data.preferredContact,
    'Event Type': data.eventType,
    'Event Date': data.eventDate,
    'Event Time': data.eventTime,
    'Guest Count': data.guestCount,
    Location: data.location,
    'Service Style': data.serviceStyle,
    'Budget Range': data.budgetRange,
    'Dietary Requirements': dietary,
    Message: data.message,
    'Event Description': data.eventDescription,
    'Form Source': data.source,
    'Lead Received': now,
    'Created At': now,
    'Updated At': now,
    GCLID: data.gclid,
    'GA Client ID': data.ga_client_id,
    FBCLID: data.fbclid,
    'UTM Source': data.utm_source,
    'UTM Medium': data.utm_medium,
    'UTM Campaign': data.utm_campaign,
    'UTM Term': data.utm_term,
    'UTM Content': data.utm_content,
    'Lead Source': data.lead_source,
    'Landing Page': data.landing_page,
    Referrer: data.referrer,
    'Email Hash': extra?.emailHash,
    'Phone Hash': extra?.phoneHash,
  };

  // Drop undefined/empty so Airtable doesn't store blank strings everywhere.
  for (const key of Object.keys(fields)) {
    const v = fields[key];
    if (v === undefined || v === null || v === '') delete fields[key];
  }
  return fields;
}

/**
 * Create a Leads record from a form submission.
 * Non-throwing: returns { success, error } like the Brevo/Firestore helpers so
 * the caller can log-and-continue without breaking the existing pipeline.
 */
export async function createAirtableLead(
  data: LeadFormData,
  leadId: string,
  apiKey: string,
  extra?: { emailHash?: string; phoneHash?: string }
): Promise<AirtableResult> {
  try {
    const response = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_LEADS_TABLE}`,
      {
        method: 'POST',
        headers: authHeaders(apiKey),
        body: JSON.stringify({
          fields: mapLeadFields(data, leadId, extra),
          typecast: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Airtable ${response.status}: ${errorText}` };
    }

    const record = (await response.json()) as { id: string };
    return { success: true, recordId: record.id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/** Find a Leads record's Airtable id by its Lead ID (UUID). Null if not found. */
export async function findAirtableLeadRecordId(
  leadId: string,
  apiKey: string
): Promise<string | null> {
  try {
    const formula = encodeURIComponent(`{Lead ID}='${leadId}'`);
    const response = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_LEADS_TABLE}?filterByFormula=${formula}&maxRecords=1`,
      { headers: authHeaders(apiKey) }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { records: Array<{ id: string }> };
    return data.records[0]?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Patch a Leads record (by Lead ID) with arbitrary Airtable fields.
 * Used by the admin UI and the Phase-2 Airtable webhook for status/value/notes
 * updates. Always stamps Updated At.
 */
export async function updateAirtableLead(
  leadId: string,
  fields: Record<string, unknown>,
  apiKey: string
): Promise<AirtableResult> {
  try {
    const recordId = await findAirtableLeadRecordId(leadId, apiKey);
    if (!recordId) {
      return { success: false, error: `No Airtable record for Lead ID ${leadId}` };
    }

    const response = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_LEADS_TABLE}/${recordId}`,
      {
        method: 'PATCH',
        headers: authHeaders(apiKey),
        body: JSON.stringify({
          fields: { ...fields, 'Updated At': new Date().toISOString() },
          typecast: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      return { success: false, error: `Airtable ${response.status}: ${errorText}` };
    }
    return { success: true, recordId };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
