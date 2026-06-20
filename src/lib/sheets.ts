/**
 * Google Sheets adapter for the Chef Nam lead pipeline.
 *
 * The Sheet (Chef Nam Catering - Operations / Leads tab) is the migration target
 * that replaces Airtable + Firestore as the lead store. This adapter mirrors
 * airtable.ts's create/find/update shape, but is HEADER-NAME based (reads row 1
 * and maps by column name), so reordering columns in the Sheet never breaks it.
 *
 * Auth: service-account token via google-auth.ts (spreadsheets scope), SA key in
 * the SHEETS_CREDENTIALS worker secret (claude-automation, Editor on the Sheet).
 * Non-throwing helpers ({ success, error }) like brevo.ts / firestore.ts.
 */

import { getGoogleAccessToken } from './google-auth';

const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets';
const SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

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

/** 0-based column index -> A1 letters (handles past Z: 26 -> AA). */
function colLetter(idx: number): string {
  let n = idx + 1;
  let s = '';
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

async function getRows(token: string): Promise<string[][]> {
  const resp = await fetch(
    `${SHEETS_API}/${LEADS_SHEET_ID}/values/${encodeURIComponent(LEADS_TAB)}?majorDimension=ROWS`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!resp.ok) throw new Error(`Sheets read ${resp.status}: ${await resp.text()}`);
  const data = await resp.json() as { values?: string[][] };
  return data.values || [];
}

/** Map the raw form payload onto Sheet column names. Name has NO event suffix. */
function mapLeadFields(
  data: LeadFormData,
  leadId: string,
  extra?: { emailHash?: string; phoneHash?: string }
): Record<string, string> {
  const now = new Date().toISOString();
  const fullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
  const dietary = Array.isArray(data.dietaryRequirements)
    ? data.dietaryRequirements.join(', ')
    : data.dietaryRequirements;

  const fields: Record<string, string | undefined> = {
    Name: fullName || data.email,
    'Lead ID': leadId,
    Status: STATUS_DISPLAY.new,
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

  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined && v !== null && v !== '') out[k] = String(v);
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
  try {
    const token = await getGoogleAccessToken(base64Credentials, SCOPE);
    const rows = await getRows(token);
    const header = rows[0] || [];
    const idCol = header.indexOf('Lead ID');
    if (idCol === -1) return { success: false, error: 'Leads tab missing "Lead ID" header' };

    const existing = rows.findIndex((r, i) => i > 0 && r[idCol] === leadId);
    if (existing !== -1) return { success: true, rowNumber: existing + 1 };

    const mapped = mapLeadFields(data, leadId, extra);
    const row = header.map(h => mapped[h] ?? '');

    const resp = await fetch(
      `${SHEETS_API}/${LEADS_SHEET_ID}/values/${encodeURIComponent(LEADS_TAB)}!A1:append` +
        `?valueInputOption=RAW&insertDataOption=INSERT_ROWS`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [row] }),
      }
    );
    if (!resp.ok) return { success: false, error: `Sheets append ${resp.status}: ${await resp.text()}` };
    return { success: true };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Read a lead's fields by Lead ID. Returns a header-keyed object (e.g.
 * lead['GCLID'], lead['GA Client ID'], lead['Email'], lead['Notes']).
 */
export async function getSheetLead(
  leadId: string,
  base64Credentials: string
): Promise<{ success: boolean; lead?: Record<string, string>; rowNumber?: number; error?: string }> {
  try {
    const token = await getGoogleAccessToken(base64Credentials, SCOPE);
    const rows = await getRows(token);
    const header = rows[0] || [];
    const idCol = header.indexOf('Lead ID');
    if (idCol === -1) return { success: false, error: 'Leads tab missing "Lead ID" header' };

    const rowIdx = rows.findIndex((r, i) => i > 0 && r[idCol] === leadId);
    if (rowIdx === -1) return { success: false, error: `No Sheet row for Lead ID ${leadId}` };

    const lead: Record<string, string> = {};
    header.forEach((h, i) => { lead[h] = rows[rowIdx][i] ?? ''; });
    return { success: true, lead, rowNumber: rowIdx + 1 };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Patch a lead row (by Lead ID) with header-keyed values. Always stamps
 * "Updated At". Writes only the named columns (other cells untouched).
 */
export async function updateSheetLead(
  leadId: string,
  fields: Record<string, string | number | null>,
  base64Credentials: string
): Promise<SheetResult> {
  try {
    const token = await getGoogleAccessToken(base64Credentials, SCOPE);
    const rows = await getRows(token);
    const header = rows[0] || [];
    const idCol = header.indexOf('Lead ID');
    if (idCol === -1) return { success: false, error: 'Leads tab missing "Lead ID" header' };

    const rowIdx = rows.findIndex((r, i) => i > 0 && r[idCol] === leadId);
    if (rowIdx === -1) return { success: false, error: `No Sheet row for Lead ID ${leadId}` };
    const rowNumber = rowIdx + 1;

    const patch = { ...fields, 'Updated At': new Date().toISOString() };
    const data: Array<{ range: string; values: (string | number)[][] }> = [];
    for (const [h, v] of Object.entries(patch)) {
      const col = header.indexOf(h);
      if (col === -1) continue; // unknown column -> skip silently
      data.push({
        range: `${LEADS_TAB}!${colLetter(col)}${rowNumber}`,
        values: [[v === null ? '' : v]],
      });
    }
    if (data.length === 0) return { success: true, rowNumber };

    const resp = await fetch(`${SHEETS_API}/${LEADS_SHEET_ID}/values:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ valueInputOption: 'RAW', data }),
    });
    if (!resp.ok) return { success: false, error: `Sheets batchUpdate ${resp.status}: ${await resp.text()}` };
    return { success: true, rowNumber };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
