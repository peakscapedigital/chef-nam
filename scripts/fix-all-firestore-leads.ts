/**
 * Fix ALL Firestore leads - delete and recreate from BigQuery source of truth
 *
 * Run with:
 *   BIGQUERY_PROJECT_ID=chef-nam-analytics \
 *   BIGQUERY_CREDENTIALS=$(cat ~/Downloads/chef-nam-analytics-59584e2e7603.json) \
 *   FIREBASE_CREDENTIALS=$(cat ~/Downloads/chef-nam-analytics-firebase-adminsdk-fbsvc-44254e4f5d.json) \
 *   npx tsx scripts/fix-all-firestore-leads.ts
 */

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id: string;
}

interface BigQueryLead {
  lead_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_contact: string | null;
  event_date: string | null;
  event_time: string | null;
  event_type: string | null;
  guest_count: string | null;
  location: string | null;
  service_style: string | null;
  budget_range: string | null;
  dietary_requirements: string | null;
  message: string | null;
  event_description: string | null;
  status: string;
  notes: string | null;
  booking_value: number | null;
  submitted_at: string;
}

function decodeCredentials(credentials: string): ServiceAccountCredentials {
  const trimmed = credentials.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);
  let cleaned = trimmed.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = cleaned.length % 4;
  if (padding) cleaned += '='.repeat(4 - padding);
  return JSON.parse(atob(cleaned));
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s/g, '');
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  return crypto.subtle.importKey('pkcs8', binaryKey, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
}

async function createJWT(credentials: ServiceAccountCredentials, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = { iss: credentials.client_email, scope, aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 };
  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signInput = encodedHeader + '.' + encodedPayload;
  const key = await importPrivateKey(credentials.private_key);
  const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signInput));
  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return signInput + '.' + encodedSignature;
}

async function getAccessToken(credentials: ServiceAccountCredentials, scope: string): Promise<string> {
  const jwt = await createJWT(credentials, scope);
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt })
  });
  if (!response.ok) throw new Error('Token error: ' + await response.text());
  return ((await response.json()) as { access_token: string }).access_token;
}

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'number') return Number.isInteger(value) ? { integerValue: value.toString() } : { doubleValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(toFirestoreValue) } };
  return { stringValue: String(value) };
}

async function main() {
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  const bqCredsRaw = process.env.BIGQUERY_CREDENTIALS;
  const fbCredsRaw = process.env.FIREBASE_CREDENTIALS;
  if (!projectId || !bqCredsRaw || !fbCredsRaw) {
    console.error('Set BIGQUERY_PROJECT_ID, BIGQUERY_CREDENTIALS, FIREBASE_CREDENTIALS');
    process.exit(1);
  }

  const bqCreds = decodeCredentials(bqCredsRaw);
  const fbCreds = decodeCredentials(fbCredsRaw);
  const bqToken = await getAccessToken(bqCreds, 'https://www.googleapis.com/auth/bigquery');
  const fbToken = await getAccessToken(fbCreds, 'https://www.googleapis.com/auth/datastore');

  // 1. Get all leads from BigQuery
  console.log('Fetching all leads from BigQuery...');
  const query = "SELECT lead_id, first_name, last_name, email, phone, preferred_contact, event_date, event_time, event_type, guest_count, location, service_style, budget_range, TO_JSON_STRING(dietary_requirements) as dietary_requirements, message, event_description, status, notes, booking_value, FORMAT_TIMESTAMP('%Y-%m-%dT%H:%M:%SZ', submitted_at) as submitted_at FROM `" + projectId + ".leads.website_leads` WHERE is_spam = FALSE AND is_test = FALSE";

  const bqResponse = await fetch('https://bigquery.googleapis.com/bigquery/v2/projects/' + projectId + '/queries', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + bqToken, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, useLegacySql: false })
  });

  const bqResult = await bqResponse.json() as { schema: { fields: Array<{ name: string }> }; rows?: Array<{ f: Array<{ v: unknown }> }> };
  const fields = bqResult.schema?.fields || [];
  const rows = bqResult.rows || [];

  const leads: BigQueryLead[] = rows.map(row => {
    const lead: Record<string, unknown> = {};
    row.f.forEach((cell, i) => { lead[fields[i].name] = cell.v; });
    return lead as BigQueryLead;
  });

  console.log('Found ' + leads.length + ' leads in BigQuery\n');

  // 2. Delete all existing Firestore leads
  console.log('Deleting all existing Firestore leads...');
  const listUrl = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/leads?pageSize=500';
  const listResponse = await fetch(listUrl, { headers: { 'Authorization': 'Bearer ' + fbToken } });
  const listResult = await listResponse.json() as { documents?: Array<{ name: string }> };

  for (const doc of listResult.documents || []) {
    const docName = doc.name;
    await fetch('https://firestore.googleapis.com/v1/' + docName, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + fbToken }
    });
  }
  console.log('Deleted ' + (listResult.documents || []).length + ' existing documents\n');

  // 3. Create fresh Firestore documents from BigQuery
  console.log('Creating fresh Firestore documents...');
  let success = 0;
  let errors = 0;

  for (const lead of leads) {
    let dietary: string[] | null = null;
    if (lead.dietary_requirements) {
      try { dietary = JSON.parse(lead.dietary_requirements); } catch { dietary = null; }
    }

    const doc = {
      lead_id: lead.lead_id,
      name: ((lead.first_name || '') + ' ' + (lead.last_name || '')).trim(),
      email: lead.email || '',
      phone: lead.phone || '',
      preferred_contact: lead.preferred_contact,
      event_date: lead.event_date,
      event_time: lead.event_time,
      event_type: lead.event_type,
      guest_count: lead.guest_count,
      location: lead.location,
      service_style: lead.service_style,
      budget_range: lead.budget_range,
      dietary_requirements: dietary,
      message: lead.message,
      event_description: lead.event_description,
      status: lead.status || 'new',
      notes: lead.notes || '',
      booking_value: lead.booking_value ? Number(lead.booking_value) : null,
      created_at: lead.submitted_at,
      updated_at: new Date().toISOString()
    };

    const firestoreFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(doc)) {
      firestoreFields[key] = toFirestoreValue(value);
    }

    const createUrl = 'https://firestore.googleapis.com/v1/projects/' + projectId + '/databases/(default)/documents/leads?documentId=' + lead.lead_id;
    const response = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Authorization': 'Bearer ' + fbToken, 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields: firestoreFields })
    });

    if (response.ok) {
      console.log('✅ ' + (doc.name || lead.lead_id));
      success++;
    } else {
      console.log('❌ ' + lead.lead_id + ': ' + await response.text());
      errors++;
    }

    await new Promise(r => setTimeout(r, 50));
  }

  console.log('\n========================================');
  console.log('✅ Created: ' + success);
  console.log('❌ Errors: ' + errors);
  console.log('========================================');
}

main().catch(console.error);
