/**
 * Firestore helper for Cloudflare Workers
 * Uses REST API with JWT authentication (no Node.js SDK)
 * Mirrors bigquery.ts pattern for consistency
 */

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id: string;
}

interface FirestoreLeadDocument {
  lead_id: string;
  name: string;
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
  dietary_requirements: string[] | null;
  message: string | null;
  event_description: string | null;
  status: string;
  notes: string;
  booking_value: number | null;
  created_at: string;
  updated_at: string;
}

// Cache for access tokens (reuse until expiry)
let cachedFirestoreToken: { token: string; expiry: number } | null = null;

/**
 * Parse credentials - accepts either raw JSON or base64-encoded JSON
 */
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
    const preview = trimmed.substring(0, 50);
    throw new Error(`Failed to parse Firestore credentials. First 50 chars: "${preview}...". Error: ${e}`);
  }
}

/**
 * Convert PEM private key to CryptoKey for signing
 */
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

/**
 * Create a signed JWT for Firestore API authentication
 */
async function createFirestoreJWT(credentials: ServiceAccountCredentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const expiry = now + 3600;

  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const payload = {
    iss: credentials.client_email,
    scope: 'https://www.googleapis.com/auth/datastore',
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
async function getFirestoreAccessToken(credentials: ServiceAccountCredentials): Promise<string> {
  if (cachedFirestoreToken && cachedFirestoreToken.expiry > Date.now() + 60000) {
    return cachedFirestoreToken.token;
  }

  const jwt = await createFirestoreJWT(credentials);

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
    throw new Error(`Failed to get Firestore access token: ${error}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };

  cachedFirestoreToken = {
    token: data.access_token,
    expiry: Date.now() + (data.expires_in * 1000)
  };

  return data.access_token;
}

/**
 * Convert JS value to Firestore Value format
 */
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
  if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(toFirestoreValue)
      }
    };
  }
  if (typeof value === 'object') {
    const fields: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = toFirestoreValue(v);
    }
    return { mapValue: { fields } };
  }
  return { stringValue: String(value) };
}

/**
 * Convert Firestore document to plain JS object
 */
function fromFirestoreDocument(doc: Record<string, unknown>): Record<string, unknown> {
  const fields = doc.fields as Record<string, Record<string, unknown>> | undefined;
  if (!fields) return {};

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = fromFirestoreValue(value);
  }
  return result;
}

/**
 * Convert Firestore Value to JS value
 */
function fromFirestoreValue(value: Record<string, unknown>): unknown {
  if ('nullValue' in value) return null;
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return parseInt(value.integerValue as string, 10);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('arrayValue' in value) {
    const arr = value.arrayValue as { values?: Record<string, unknown>[] };
    return (arr.values || []).map(fromFirestoreValue);
  }
  if ('mapValue' in value) {
    const map = value.mapValue as { fields?: Record<string, Record<string, unknown>> };
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(map.fields || {})) {
      result[k] = fromFirestoreValue(v);
    }
    return result;
  }
  return null;
}

/**
 * Create a lead document in Firestore for CRM operations
 */
export async function createFirestoreLead(
  leadData: {
    lead_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    preferred_contact?: string;
    event_date?: string;
    event_time?: string;
    event_type?: string;
    guest_count?: string;
    location?: string;
    service_style?: string;
    budget_range?: string;
    dietary_requirements?: string[];
    message?: string;
    event_description?: string;
  },
  projectId: string,
  base64Credentials: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const credentials = decodeCredentials(base64Credentials);
    const accessToken = await getFirestoreAccessToken(credentials);

    const now = new Date().toISOString();

    const document: FirestoreLeadDocument = {
      lead_id: leadData.lead_id,
      name: `${leadData.first_name || ''} ${leadData.last_name || ''}`.trim(),
      email: leadData.email || '',
      phone: leadData.phone || '',
      preferred_contact: leadData.preferred_contact || null,
      event_date: leadData.event_date || null,
      event_time: leadData.event_time || null,
      event_type: leadData.event_type || null,
      guest_count: leadData.guest_count || null,
      location: leadData.location || null,
      service_style: leadData.service_style || null,
      budget_range: leadData.budget_range || null,
      dietary_requirements: leadData.dietary_requirements || null,
      message: leadData.message || null,
      event_description: leadData.event_description || null,
      status: 'new',
      notes: '',
      booking_value: null,
      created_at: now,
      updated_at: now
    };

    // Convert to Firestore format
    const firestoreFields: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(document)) {
      firestoreFields[key] = toFirestoreValue(value);
    }

    // Use lead_id as document ID for easy joins
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/leads?documentId=${leadData.lead_id}`;

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
      console.error('Firestore create error:', error);
      return { success: false, error };
    }

    console.log('✅ Lead created in Firestore:', leadData.lead_id);
    return { success: true };
  } catch (error) {
    console.error('Firestore create exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Update a lead document in Firestore (status, notes, booking_value)
 */
export async function updateFirestoreLead(
  leadId: string,
  updates: {
    status?: string;
    notes?: string;
    booking_value?: number | null;
  },
  projectId: string,
  base64Credentials: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const credentials = decodeCredentials(base64Credentials);
    const accessToken = await getFirestoreAccessToken(credentials);

    // Build update mask and fields
    const updateMask: string[] = ['updated_at'];
    const fields: Record<string, unknown> = {
      updated_at: toFirestoreValue(new Date().toISOString())
    };

    if (updates.status !== undefined) {
      updateMask.push('status');
      fields.status = toFirestoreValue(updates.status);
    }

    if (updates.notes !== undefined) {
      updateMask.push('notes');
      fields.notes = toFirestoreValue(updates.notes);
    }

    if (updates.booking_value !== undefined) {
      updateMask.push('booking_value');
      fields.booking_value = toFirestoreValue(updates.booking_value);
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/leads/${leadId}?updateMask.fieldPaths=${updateMask.join('&updateMask.fieldPaths=')}`;

    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Firestore update error:', error);
      return { success: false, error };
    }

    console.log('✅ Lead updated in Firestore:', leadId);
    return { success: true };
  } catch (error) {
    console.error('Firestore update exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get a lead document from Firestore
 */
export async function getFirestoreLead(
  leadId: string,
  projectId: string,
  base64Credentials: string
): Promise<{ success: boolean; lead?: FirestoreLeadDocument; error?: string }> {
  try {
    const credentials = decodeCredentials(base64Credentials);
    const accessToken = await getFirestoreAccessToken(credentials);

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/leads/${leadId}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        return { success: false, error: 'Lead not found' };
      }
      const error = await response.text();
      return { success: false, error };
    }

    const doc = await response.json() as Record<string, unknown>;
    const lead = fromFirestoreDocument(doc) as FirestoreLeadDocument;

    return { success: true, lead };
  } catch (error) {
    console.error('Firestore get exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * List all leads from Firestore (for debugging/verification)
 */
export async function listFirestoreLeads(
  projectId: string,
  base64Credentials: string,
  pageSize: number = 100
): Promise<{ success: boolean; leads?: FirestoreLeadDocument[]; error?: string }> {
  try {
    const credentials = decodeCredentials(base64Credentials);
    const accessToken = await getFirestoreAccessToken(credentials);

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/leads?pageSize=${pageSize}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const error = await response.text();
      return { success: false, error };
    }

    const result = await response.json() as { documents?: Record<string, unknown>[] };
    const leads = (result.documents || []).map(doc => fromFirestoreDocument(doc) as FirestoreLeadDocument);

    return { success: true, leads };
  } catch (error) {
    console.error('Firestore list exception:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Helper to create Firestore lead data from form submission
 * Use this in submit-form.ts alongside createLeadData for BigQuery
 */
export function createFirestoreLeadData(formData: Record<string, unknown>, leadId: string): {
  lead_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  preferred_contact?: string;
  event_date?: string;
  event_time?: string;
  event_type?: string;
  guest_count?: string;
  location?: string;
  service_style?: string;
  budget_range?: string;
  dietary_requirements?: string[];
  message?: string;
  event_description?: string;
} {
  return {
    lead_id: leadId,
    first_name: formData.firstName as string || '',
    last_name: formData.lastName as string || '',
    email: formData.email as string || '',
    phone: formData.phone as string || '',
    preferred_contact: formData.preferredContact as string || undefined,
    event_date: formData.eventDate as string || undefined,
    event_time: formData.eventTime as string || undefined,
    event_type: formData.eventType as string || undefined,
    guest_count: formData.guestCount as string || undefined,
    location: formData.location as string || undefined,
    service_style: formData.serviceStyle as string || undefined,
    budget_range: formData.budgetRange as string || undefined,
    dietary_requirements: formData.dietaryRequirements as string[] || undefined,
    message: formData.message as string || undefined,
    event_description: formData.eventDescription as string || undefined
  };
}
