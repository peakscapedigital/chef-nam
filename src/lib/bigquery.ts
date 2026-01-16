/**
 * BigQuery helper for Cloudflare Workers
 * Uses REST API with JWT authentication (no Node.js SDK)
 */

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id: string;
}

interface LeadData {
  lead_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  email_hash?: string;
  phone?: string;
  phone_hash?: string;
  preferred_contact?: string;
  has_event?: boolean;
  event_type?: string;
  event_date?: string;
  event_time?: string;
  guest_count?: string;
  location?: string;
  service_style?: string;
  budget_range?: string;
  dietary_requirements?: string[];
  message?: string;
  event_description?: string;
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
  submitted_from_url?: string;
  status?: string;
  notes?: string;
  booking_value?: number;
  submitted_at: string;
  status_updated_at?: string;
  notes_updated_at?: string;
  won_at?: string;
  form_source?: string;
  is_spam?: boolean;
}

interface LeadUpdate {
  status?: string;
  notes?: string;
  booking_value?: number;
  status_updated_at?: string;
  notes_updated_at?: string;
  won_at?: string;
}

// Cache for access tokens (reuse until expiry)
let cachedToken: { token: string; expiry: number } | null = null;

/**
 * Parse credentials - accepts either raw JSON or base64-encoded JSON
 */
function decodeCredentials(credentials: string): ServiceAccountCredentials {
  const trimmed = credentials.trim();

  // If it starts with '{', it's raw JSON
  if (trimmed.startsWith('{')) {
    return JSON.parse(trimmed);
  }

  // Otherwise, try to decode as base64
  try {
    // Clean up the base64 string
    let cleaned = trimmed
      .replace(/\s/g, '')      // Remove all whitespace
      .replace(/-/g, '+')      // URL-safe to standard
      .replace(/_/g, '/');     // URL-safe to standard

    // Add padding if needed
    const padding = cleaned.length % 4;
    if (padding) {
      cleaned += '='.repeat(4 - padding);
    }

    const decoded = atob(cleaned);
    return JSON.parse(decoded);
  } catch (e) {
    // If base64 decoding fails, provide helpful error
    const preview = trimmed.substring(0, 50);
    throw new Error(`Failed to parse credentials. First 50 chars: "${preview}...". Error: ${e}`);
  }
}

/**
 * Convert PEM private key to CryptoKey for signing
 */
async function importPrivateKey(pem: string): Promise<CryptoKey> {
  // Remove PEM headers and decode base64
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

/**
 * Create a signed JWT for Google API authentication
 */
async function createJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600; // 1 hour

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/bigquery',
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

/**
 * Exchange JWT for access token
 */
async function getAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  // Check cache
  if (cachedToken && cachedToken.expiry > Date.now() + 60000) {
    return cachedToken.token;
  }

  const jwt = await createJWT(credentials);

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

  const data = await response.json() as { access_token: string; expires_in: number };

  // Cache token
  cachedToken = {
    token: data.access_token,
    expiry: Date.now() + (data.expires_in * 1000)
  };

  return data.access_token;
}

/**
 * SHA256 hash for enhanced conversions
 */
export async function sha256Hash(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  const encoded = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Insert a lead into BigQuery using streaming insert
 */
export async function insertLead(
  leadData: LeadData,
  projectId: string,
  base64Credentials: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const credentials = decodeCredentials(base64Credentials);
    const accessToken = await getAccessToken(credentials);

    const datasetId = 'leads';
    const tableId = 'website_leads';

    // Format the row for BigQuery
    const row: Record<string, unknown> = { ...leadData };

    // Convert event_date string to DATE format if present
    if (row.event_date && typeof row.event_date === 'string') {
      // Ensure it's in YYYY-MM-DD format
      row.event_date = row.event_date.split('T')[0];
    }

    const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${datasetId}/tables/${tableId}/insertAll`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        rows: [{ insertId: leadData.lead_id, json: row }]
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('BigQuery insert error:', error);
      return { success: false, error };
    }

    const result = await response.json() as { insertErrors?: Array<{ errors: Array<{ message: string }> }> };

    if (result.insertErrors && result.insertErrors.length > 0) {
      const errorMsg = result.insertErrors[0].errors[0].message;
      console.error('BigQuery insert errors:', result.insertErrors);
      return { success: false, error: errorMsg };
    }

    return { success: true };
  } catch (error) {
    console.error('BigQuery insert exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Query leads from BigQuery
 */
export async function queryLeads(
  projectId: string,
  base64Credentials: string,
  options: {
    status?: string;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: 'ASC' | 'DESC';
  } = {}
): Promise<{ success: boolean; leads?: LeadData[]; error?: string; totalCount?: number }> {
  try {
    const credentials = decodeCredentials(base64Credentials);
    const accessToken = await getAccessToken(credentials);

    const { status, limit = 50, offset = 0, orderBy = 'submitted_at', orderDir = 'DESC' } = options;

    // Build query
    let query = `SELECT * FROM \`${projectId}.leads.website_leads\``;
    const conditions: string[] = [];

    if (status && status !== 'all') {
      conditions.push(`status = '${status}'`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY ${orderBy} ${orderDir}`;
    query += ` LIMIT ${limit} OFFSET ${offset}`;

    // Also get total count
    let countQuery = `SELECT COUNT(*) as total FROM \`${projectId}.leads.website_leads\``;
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }

    const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/queries`;

    // Run both queries
    const [dataResponse, countResponse] = await Promise.all([
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query, useLegacySql: false })
      }),
      fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: countQuery, useLegacySql: false })
      })
    ]);

    if (!dataResponse.ok) {
      const error = await dataResponse.text();
      return { success: false, error };
    }

    const dataResult = await dataResponse.json() as {
      schema: { fields: Array<{ name: string }> };
      rows?: Array<{ f: Array<{ v: unknown }> }>;
    };

    const countResult = await countResponse.json() as {
      rows?: Array<{ f: Array<{ v: string }> }>;
    };

    // Parse results
    const fields = dataResult.schema?.fields || [];
    const rows = dataResult.rows || [];

    const leads: LeadData[] = rows.map(row => {
      const lead: Record<string, unknown> = {};
      row.f.forEach((cell, i) => {
        const fieldName = fields[i].name;
        lead[fieldName] = cell.v;
      });
      return lead as LeadData;
    });

    const totalCount = countResult.rows?.[0]?.f?.[0]?.v
      ? parseInt(countResult.rows[0].f[0].v, 10)
      : 0;

    return { success: true, leads, totalCount };
  } catch (error) {
    console.error('BigQuery query exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(
  leadId: string,
  projectId: string,
  base64Credentials: string
): Promise<{ success: boolean; lead?: LeadData; error?: string }> {
  try {
    const credentials = decodeCredentials(base64Credentials);
    const accessToken = await getAccessToken(credentials);

    const query = `SELECT * FROM \`${projectId}.leads.website_leads\` WHERE lead_id = '${leadId}' LIMIT 1`;

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
      return { success: false, error };
    }

    const result = await response.json() as {
      schema: { fields: Array<{ name: string }> };
      rows?: Array<{ f: Array<{ v: unknown }> }>;
    };

    if (!result.rows || result.rows.length === 0) {
      return { success: false, error: 'Lead not found' };
    }

    const fields = result.schema.fields;
    const row = result.rows[0];
    const lead: Record<string, unknown> = {};

    row.f.forEach((cell, i) => {
      lead[fields[i].name] = cell.v;
    });

    return { success: true, lead: lead as LeadData };
  } catch (error) {
    console.error('BigQuery get lead exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Update a lead in BigQuery using DML
 */
export async function updateLead(
  leadId: string,
  updates: LeadUpdate,
  projectId: string,
  base64Credentials: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const credentials = decodeCredentials(base64Credentials);
    const accessToken = await getAccessToken(credentials);

    // Build SET clause
    const setClauses: string[] = [];

    if (updates.status !== undefined) {
      setClauses.push(`status = '${updates.status}'`);
      setClauses.push(`status_updated_at = CURRENT_TIMESTAMP()`);
    }

    if (updates.notes !== undefined) {
      // Escape single quotes in notes
      const escapedNotes = updates.notes.replace(/'/g, "\\'");
      setClauses.push(`notes = '${escapedNotes}'`);
      setClauses.push(`notes_updated_at = CURRENT_TIMESTAMP()`);
    }

    if (updates.booking_value !== undefined) {
      setClauses.push(`booking_value = ${updates.booking_value}`);
    }

    if (updates.won_at !== undefined) {
      setClauses.push(`won_at = TIMESTAMP('${updates.won_at}')`);
    }

    if (setClauses.length === 0) {
      return { success: true }; // Nothing to update
    }

    const query = `UPDATE \`${projectId}.leads.website_leads\` SET ${setClauses.join(', ')} WHERE lead_id = '${leadId}'`;

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
      console.error('BigQuery update error:', error);
      return { success: false, error };
    }

    return { success: true };
  } catch (error) {
    console.error('BigQuery update exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Helper to create lead data object from form submission
 */
export function createLeadData(formData: Record<string, unknown>, leadId: string): LeadData {
  return {
    lead_id: leadId,
    first_name: formData.firstName as string || undefined,
    last_name: formData.lastName as string || undefined,
    email: formData.email as string || undefined,
    email_hash: formData.email_hash as string || undefined,
    phone: formData.phone as string || undefined,
    phone_hash: formData.phone_hash as string || undefined,
    preferred_contact: formData.preferredContact as string || undefined,
    has_event: formData.hasEvent === 'yes',
    event_type: formData.eventType as string || undefined,
    event_date: formData.eventDate as string || undefined,
    event_time: formData.eventTime as string || undefined,
    guest_count: formData.guestCount as string || undefined,
    location: formData.location as string || undefined,
    service_style: formData.serviceStyle as string || undefined,
    budget_range: formData.budgetRange as string || undefined,
    dietary_requirements: formData.dietaryRequirements as string[] || undefined,
    message: formData.message as string || undefined,
    event_description: formData.eventDescription as string || undefined,
    gclid: formData.gclid as string || undefined,
    ga_client_id: formData.ga_client_id as string || undefined,
    fbclid: formData.fbclid as string || undefined,
    utm_source: formData.utm_source as string || undefined,
    utm_medium: formData.utm_medium as string || undefined,
    utm_campaign: formData.utm_campaign as string || undefined,
    utm_term: formData.utm_term as string || undefined,
    utm_content: formData.utm_content as string || undefined,
    lead_source: formData.lead_source as string || undefined,
    landing_page: formData.landing_page as string || undefined,
    referrer: formData.referrer as string || undefined,
    submitted_from_url: formData.submitted_from_url as string || undefined,
    status: 'new',
    submitted_at: new Date().toISOString(),
    form_source: formData.source as string || 'unknown',
    is_spam: false
  };
}
