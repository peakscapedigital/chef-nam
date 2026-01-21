/**
 * Backfill script: Migrate existing BigQuery leads to Firestore
 *
 * Run with:
 *   npx tsx scripts/backfill-firestore.ts
 *
 * Required environment variables:
 *   BIGQUERY_PROJECT_ID=chef-nam-analytics
 *   BIGQUERY_CREDENTIALS=<base64 or raw JSON>
 *   FIREBASE_CREDENTIALS=<base64 or raw JSON>
 *
 * Or pass credentials as arguments:
 *   npx tsx scripts/backfill-firestore.ts --dry-run
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
  event_date: string | null;
  guest_count: string | null;
  status: string;
  notes: string | null;
  booking_value: number | null;
  submitted_at: string;
}

// ============================================
// Credential Handling
// ============================================

function decodeCredentials(credentials: string): ServiceAccountCredentials {
  const trimmed = credentials.trim();

  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  try {
    let cleaned = trimmed
      .replace(/\s/g, '')
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const padding = cleaned.length % 4;
    if (padding) {
      cleaned += '='.repeat(4 - padding);
    }

    const decoded = atob(cleaned);
    return JSON.parse(decoded);
  } catch (e) {
    throw new Error(`Failed to parse credentials: ${e}`);
  }
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

  return crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );
}

async function createJWT(credentials: ServiceAccountCredentials, scope: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: credentials.client_email,
    scope: scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: expiry
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  const signInput = `${encodedHeader}.${encodedPayload}`;
  const key = await importPrivateKey(credentials.private_key);

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signInput)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${signInput}.${encodedSignature}`;
}

async function getAccessToken(credentials: ServiceAccountCredentials, scope: string): Promise<string> {
  const jwt = await createJWT(credentials, scope);

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to get access token: ${error}`);
  }

  const data = await response.json() as { access_token: string };
  return data.access_token;
}

// ============================================
// BigQuery Functions
// ============================================

async function fetchLeadsFromBigQuery(
  projectId: string,
  credentials: ServiceAccountCredentials
): Promise<BigQueryLead[]> {
  const accessToken = await getAccessToken(credentials, 'https://www.googleapis.com/auth/bigquery');

  const query = `
    SELECT
      lead_id,
      first_name,
      last_name,
      email,
      phone,
      CAST(event_date AS STRING) as event_date,
      guest_count,
      status,
      notes,
      booking_value,
      CAST(submitted_at AS STRING) as submitted_at
    FROM \`${projectId}.leads.website_leads\`
    WHERE is_spam = FALSE AND is_test = FALSE
    ORDER BY submitted_at DESC
  `;

  const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query, useLegacySql: false })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`BigQuery query failed: ${error}`);
  }

  const result = await response.json() as {
    schema: { fields: Array<{ name: string }> };
    rows?: Array<{ f: Array<{ v: unknown }> }>;
  };

  const fields = result.schema?.fields || [];
  const rows = result.rows || [];

  return rows.map(row => {
    const lead: Record<string, unknown> = {};
    row.f.forEach((cell, i) => {
      lead[fields[i].name] = cell.v;
    });
    return lead as BigQueryLead;
  });
}

// ============================================
// Firestore Functions
// ============================================

function toFirestoreValue(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) {
    return { nullValue: null };
  }
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    }
    return { doubleValue: value };
  }
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  return { stringValue: String(value) };
}

async function createFirestoreDocument(
  projectId: string,
  credentials: ServiceAccountCredentials,
  lead: BigQueryLead
): Promise<{ success: boolean; error?: string }> {
  const accessToken = await getAccessToken(credentials, 'https://www.googleapis.com/auth/datastore');

  const document = {
    lead_id: lead.lead_id,
    name: `${lead.first_name || ''} ${lead.last_name || ''}`.trim(),
    email: lead.email || '',
    phone: lead.phone || '',
    event_date: lead.event_date,
    guest_count: lead.guest_count,
    status: lead.status || 'new',
    notes: lead.notes || '',
    booking_value: lead.booking_value,
    created_at: lead.submitted_at || new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const firestoreFields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(document)) {
    firestoreFields[key] = toFirestoreValue(value);
  }

  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/leads?documentId=${lead.lead_id}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ fields: firestoreFields })
  });

  if (!response.ok) {
    const error = await response.text();
    // Check if document already exists
    if (response.status === 409 || error.includes('ALREADY_EXISTS')) {
      return { success: true, error: 'Already exists (skipped)' };
    }
    return { success: false, error };
  }

  return { success: true };
}

// ============================================
// Main Backfill Logic
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('========================================');
  console.log('BigQuery → Firestore Backfill Script');
  console.log('========================================');
  console.log(`Mode: ${dryRun ? 'DRY RUN (no writes)' : 'LIVE'}`);
  console.log('');

  // Load credentials from environment
  const projectId = process.env.BIGQUERY_PROJECT_ID;
  const bigqueryCredsRaw = process.env.BIGQUERY_CREDENTIALS;
  const firebaseCredsRaw = process.env.FIREBASE_CREDENTIALS;

  if (!projectId) {
    console.error('❌ BIGQUERY_PROJECT_ID not set');
    process.exit(1);
  }

  if (!bigqueryCredsRaw) {
    console.error('❌ BIGQUERY_CREDENTIALS not set');
    process.exit(1);
  }

  if (!firebaseCredsRaw && !dryRun) {
    console.error('❌ FIREBASE_CREDENTIALS not set (required for live run)');
    process.exit(1);
  }

  console.log(`Project ID: ${projectId}`);
  console.log('');

  // Parse credentials
  const bigqueryCreds = decodeCredentials(bigqueryCredsRaw);
  console.log(`BigQuery service account: ${bigqueryCreds.client_email}`);

  let firebaseCreds: ServiceAccountCredentials | null = null;
  if (firebaseCredsRaw) {
    firebaseCreds = decodeCredentials(firebaseCredsRaw);
    console.log(`Firebase service account: ${firebaseCreds.client_email}`);
  }

  console.log('');

  // Fetch leads from BigQuery
  console.log('📊 Fetching leads from BigQuery...');
  const leads = await fetchLeadsFromBigQuery(projectId, bigqueryCreds);
  console.log(`   Found ${leads.length} leads (excluding spam/test)`);
  console.log('');

  if (leads.length === 0) {
    console.log('No leads to migrate. Done!');
    return;
  }

  // Show preview
  console.log('Preview of leads to migrate:');
  console.log('─'.repeat(80));
  leads.slice(0, 5).forEach((lead, i) => {
    console.log(`${i + 1}. ${lead.lead_id.substring(0, 8)}... | ${lead.first_name} ${lead.last_name} | ${lead.email} | ${lead.status}`);
  });
  if (leads.length > 5) {
    console.log(`   ... and ${leads.length - 5} more`);
  }
  console.log('─'.repeat(80));
  console.log('');

  if (dryRun) {
    console.log('🔍 DRY RUN - No documents will be created');
    console.log('   Run without --dry-run to perform actual migration');
    return;
  }

  if (!firebaseCreds) {
    console.error('❌ Firebase credentials required for live run');
    process.exit(1);
  }

  // Migrate leads to Firestore
  console.log('🔥 Migrating leads to Firestore...');
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const lead of leads) {
    const result = await createFirestoreDocument(projectId, firebaseCreds, lead);

    if (result.success) {
      if (result.error?.includes('Already exists')) {
        skipCount++;
        console.log(`   ⏭️  ${lead.lead_id.substring(0, 8)}... (already exists)`);
      } else {
        successCount++;
        console.log(`   ✅ ${lead.lead_id.substring(0, 8)}... | ${lead.first_name} ${lead.last_name}`);
      }
    } else {
      errorCount++;
      console.log(`   ❌ ${lead.lead_id.substring(0, 8)}... | Error: ${result.error}`);
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('');
  console.log('========================================');
  console.log('Migration Complete');
  console.log('========================================');
  console.log(`✅ Created: ${successCount}`);
  console.log(`⏭️  Skipped: ${skipCount}`);
  console.log(`❌ Errors:  ${errorCount}`);
  console.log(`📊 Total:   ${leads.length}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
