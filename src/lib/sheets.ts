/**
 * Google Sheets adapter for the Chef Nam lead pipeline.
 *
 * The Sheet (Chef Nam Catering - Operations / Leads tab) is the lead store of record
 * (replaced Airtable + Firestore). Thin wrapper over the shared kit `SheetsTable`
 * — the SAME header-name-based writer Trombone + SH use (reads row 1, maps by column
 * name, so reordering columns never breaks it). create/get/update keyed on Lead ID.
 *
 * Auth + table logic both live in @peakscape/site-kit/sheets (SA token from the
 * SHEETS_CREDENTIALS worker secret — claude-automation, Editor on the Sheet).
 * Non-throwing helpers ({ success, error }).
 */

import { SheetsTable, sheetDate, type CellValue } from '@peakscape/site-kit/sheets';
import { normalizePhone } from '@peakscape/site-kit/commerce';

export const LEADS_SHEET_ID = '1n8220JD6Nc0xbCUh6SQnWe3lYl7ioYVeITE2zV8lhcw';
export const LEADS_TAB = 'Leads';

/** lowercase pipeline status -> Sheet "Status" display value (matches the
 *  Leads single-select values backfilled from Airtable). */
export const STATUS_DISPLAY: Record<string, string> = {
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
};

/** lowercase pipeline status -> Sheet "<Stage> At" timestamp column. */
export const STATUS_TIMESTAMP_COLUMN: Record<string, string> = {
  contacted: 'Contacted At',
  qualified: 'Qualified At',
  quoted: 'Quoted At',
  tasting: 'Tasting At',
  invoice_sent: 'Invoice Sent At',
  booked: 'Booked At',
  invoice_paid: 'Invoice Paid At',
  won: 'Won At',
};

interface LeadFormData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  preferredContact?: string;
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

interface SheetResult {
  success: boolean;
  error?: string;
  rowNumber?: number;
}

/** Columns that must land as real Sheets dates (groupable in pivots), not text.
 *  `Lead Received` / `Updated At` / the `<Stage> At` columns stay ISO timestamps —
 *  they carry sub-day precision for Google offline-conversion uploads + Trello
 *  response-time tracking + the reporting adapter, which a date-only value would lose. */
const DATE_COLUMNS = ['Lead Date', 'Event Date'];

function leadsTable(credentials: string): SheetsTable {
  return new SheetsTable(credentials, LEADS_SHEET_ID, LEADS_TAB);
}

/** Map the raw form payload onto Sheet column names. Name has NO event suffix. */
function mapLeadFields(
  data: LeadFormData,
  leadId: string,
  extra?: { emailHash?: string; phoneHash?: string }
): Record<string, CellValue> {
  const now = new Date().toISOString();
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
  const dietary = Array.isArray(data.dietaryRequirements)
    ? data.dietaryRequirements.join(', ')
    : data.dietaryRequirements;

  const fields: Record<string, CellValue | undefined> = {
    Name: fullName || data.email,
    'Lead ID': leadId,
    Status: STATUS_DISPLAY.new,
    Email: data.email,
    Phone: normalizePhone(data.phone),
    'Preferred Contact': data.preferredContact,
    'Event Type': data.eventType,
    'Event Date': sheetDate(data.eventDate), // real date (groupable)
    'Event Time': data.eventTime,
    'Guest Count': data.guestCount,
    Location: data.location,
    'Service Style': data.serviceStyle,
    'Budget Range': data.budgetRange,
    'Dietary Requirements': dietary,
    Message: data.message,
    'Event Description': data.eventDescription,
    'Form Source': data.source,
    'Lead Received': now, // ISO timestamp — precise (OCI / Trello / reporting)
    'Lead Date': sheetDate(now), // date-only, groupable in pivots
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

  const out: Record<string, CellValue> = {};
  for (const [k, v] of Object.entries(fields)) {
    // drop empties; keep SheetDate markers + non-empty primitives verbatim
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

/**
 * Append a Leads row from a form submission. Idempotent on Lead ID: if a row with
 * that Lead ID already exists, it is left untouched (returns success).
 */
export async function createSheetLead(
  data: LeadFormData,
  leadId: string,
  base64Credentials: string,
  extra?: { emailHash?: string; phoneHash?: string }
): Promise<SheetResult> {
  const res = await leadsTable(base64Credentials).upsertByKey('Lead ID', mapLeadFields(data, leadId, extra));
  return { success: res.success, error: res.error, rowNumber: res.rowNumber };
}

/**
 * Read a lead's fields by Lead ID. Returns a header-keyed object (e.g.
 * lead['GCLID'], lead['GA Client ID'], lead['Email'], lead['Notes']).
 */
export async function getSheetLead(
  leadId: string,
  base64Credentials: string
): Promise<{ success: boolean; lead?: Record<string, string>; rowNumber?: number; error?: string }> {
  const res = await leadsTable(base64Credentials).getByKey('Lead ID', leadId);
  return { success: res.success, lead: res.fields, rowNumber: res.rowNumber, error: res.error };
}

/**
 * Patch a lead row (by Lead ID) with header-keyed values. Always stamps
 * "Updated At". Writes only the named columns (other cells untouched). Date columns
 * are promoted to real Sheets dates; everything else stays literal.
 */
export async function updateSheetLead(
  leadId: string,
  fields: Record<string, string | number | null>,
  base64Credentials: string
): Promise<SheetResult> {
  const patch: Record<string, CellValue> = { ...fields, 'Updated At': new Date().toISOString() };
  for (const c of DATE_COLUMNS) {
    if (c in patch && typeof patch[c] === 'string') patch[c] = sheetDate(patch[c] as string);
  }
  const res = await leadsTable(base64Credentials).updateByKey('Lead ID', leadId, patch);
  return { success: res.success, error: res.error, rowNumber: res.rowNumber };
}
