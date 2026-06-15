/**
 * One-time backfill: BigQuery `leads.website_leads` → Airtable `Leads`.
 *
 * Idempotent — skips any Lead ID already present in Airtable, so it is safe to
 * re-run. Preserves each lead's real status + submitted_at (unlike the live
 * form path, which always starts a lead at "New").
 *
 * Run from clients/chefnam/site:
 *   BIGQUERY_PROJECT_ID=chef-nam-analytics \
 *   BIGQUERY_CREDENTIALS="$(cat /path/to/bigquery-sa.json)" \
 *   AIRTABLE_API_KEY=pat... \
 *   npx tsx scripts/backfill-airtable.ts
 */
import { queryLeads } from '../src/lib/bigquery';
import {
  AIRTABLE_BASE_ID,
  AIRTABLE_LEADS_TABLE,
  AIRTABLE_STATUS,
} from '../src/lib/airtable';

const AIRTABLE_API_URL = 'https://api.airtable.com/v0';
const PAGE = 100; // BigQuery page size
const BATCH = 10; // Airtable create cap per request

const projectId = process.env.BIGQUERY_PROJECT_ID;
const bqCredentials = process.env.BIGQUERY_CREDENTIALS;
const airtableKey = process.env.AIRTABLE_API_KEY;

if (!projectId || !bqCredentials || !airtableKey) {
  console.error(
    'Set BIGQUERY_PROJECT_ID, BIGQUERY_CREDENTIALS, and AIRTABLE_API_KEY'
  );
  process.exit(1);
}

const authHeaders = {
  Authorization: `Bearer ${airtableKey}`,
  'Content-Type': 'application/json',
};

/** BigQuery REST returns arrays as [{v}], timestamps as epoch-second strings. */
function coerceArray(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (Array.isArray(v)) {
    const parts = v.map((x) => (x && typeof x === 'object' && 'v' in x ? (x as { v: unknown }).v : x));
    return parts.filter(Boolean).join(', ') || undefined;
  }
  return String(v);
}

function coerceTimestamp(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  // BigQuery TIMESTAMP comes back as float seconds since epoch (string).
  const n = Number(v);
  if (!Number.isNaN(n) && String(v).indexOf('-') === -1) {
    return new Date(n * 1000).toISOString();
  }
  return String(v); // already ISO
}

function status(v: unknown): string {
  const key = String(v || 'new') as keyof typeof AIRTABLE_STATUS;
  return AIRTABLE_STATUS[key] || 'New';
}

function num(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function str(v: unknown): string | undefined {
  if (v == null || v === '') return undefined;
  return String(v);
}

/** Map a BigQuery lead row onto Airtable Leads field names. */
function mapBqLead(l: Record<string, unknown>): Record<string, unknown> {
  const fullName = `${l.first_name || ''} ${l.last_name || ''}`.trim();
  const fields: Record<string, unknown> = {
    Name: l.event_type ? `${fullName} - ${l.event_type}` : fullName || str(l.email),
    'Lead ID': str(l.lead_id),
    Status: status(l.status),
    Email: str(l.email),
    Phone: str(l.phone),
    'Preferred Contact': str(l.preferred_contact),
    'Event Type': str(l.event_type),
    'Event Date': str(l.event_date),
    'Event Time': str(l.event_time),
    'Guest Count': str(l.guest_count),
    Location: str(l.location),
    'Service Style': str(l.service_style),
    'Budget Range': str(l.budget_range),
    'Dietary Requirements': coerceArray(l.dietary_requirements),
    Message: str(l.message),
    'Event Description': str(l.event_description),
    Notes: str(l.notes),
    'Booking Value': num(l.booking_value),
    'Order Amount': num(l.order_amount),
    'Quote Amount': num(l.quote_amount),
    'Lead Received': coerceTimestamp(l.submitted_at),
    'Created At': coerceTimestamp(l.submitted_at),
    'Won At': coerceTimestamp(l.won_at),
    GCLID: str(l.gclid),
    'GA Client ID': str(l.ga_client_id),
    FBCLID: str(l.fbclid),
    'UTM Source': str(l.utm_source),
    'UTM Medium': str(l.utm_medium),
    'UTM Campaign': str(l.utm_campaign),
    'UTM Term': str(l.utm_term),
    'UTM Content': str(l.utm_content),
    'Lead Source': str(l.lead_source),
    'Landing Page': str(l.landing_page),
    Referrer: str(l.referrer),
    'Email Hash': str(l.email_hash),
    'Phone Hash': str(l.phone_hash),
    'Form Source': str(l.form_source),
  };
  for (const k of Object.keys(fields)) {
    if (fields[k] === undefined) delete fields[k];
  }
  return fields;
}

/** Fetch every existing Lead ID already in Airtable (for idempotency). */
async function existingLeadIds(): Promise<Set<string>> {
  const ids = new Set<string>();
  let offset: string | undefined;
  do {
    const params = new URLSearchParams({ pageSize: '100', 'fields[]': 'Lead ID' });
    if (offset) params.set('offset', offset);
    const res = await fetch(
      `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_LEADS_TABLE}?${params}`,
      { headers: authHeaders }
    );
    if (!res.ok) throw new Error(`Airtable list ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as {
      records: Array<{ fields: { 'Lead ID'?: string } }>;
      offset?: string;
    };
    for (const r of data.records) if (r.fields['Lead ID']) ids.add(r.fields['Lead ID']);
    offset = data.offset;
  } while (offset);
  return ids;
}

async function createBatch(records: Array<{ fields: Record<string, unknown> }>) {
  const res = await fetch(
    `${AIRTABLE_API_URL}/${AIRTABLE_BASE_ID}/${AIRTABLE_LEADS_TABLE}`,
    {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ records, typecast: true }),
    }
  );
  if (!res.ok) throw new Error(`Airtable create ${res.status}: ${await res.text()}`);
}

async function main() {
  console.log('Fetching existing Airtable Lead IDs...');
  const seen = await existingLeadIds();
  console.log(`  ${seen.size} already in Airtable`);

  const toCreate: Array<{ fields: Record<string, unknown> }> = [];
  let offset = 0;

  // Page through all BigQuery leads (includeTest:false matches the admin view).
  for (;;) {
    const result = await queryLeads(projectId!, bqCredentials!, {
      status: 'all',
      limit: PAGE,
      offset,
      orderBy: 'submitted_at',
      orderDir: 'ASC',
      includeTest: false,
    });
    if (!result.success) throw new Error(`BigQuery: ${result.error}`);
    const leads = result.leads || [];
    if (leads.length === 0) break;

    for (const lead of leads as unknown as Record<string, unknown>[]) {
      const id = String(lead.lead_id || '');
      if (!id || seen.has(id)) continue;
      seen.add(id);
      toCreate.push({ fields: mapBqLead(lead) });
    }
    offset += PAGE;
    if (leads.length < PAGE) break;
  }

  console.log(`Creating ${toCreate.length} new Airtable records...`);
  for (let i = 0; i < toCreate.length; i += BATCH) {
    const batch = toCreate.slice(i, i + BATCH);
    await createBatch(batch);
    console.log(`  ${Math.min(i + BATCH, toCreate.length)}/${toCreate.length}`);
  }
  console.log('✅ Backfill complete.');
}

main().catch((e) => {
  console.error('❌ Backfill failed:', e);
  process.exit(1);
});
