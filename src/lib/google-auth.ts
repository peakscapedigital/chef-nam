/**
 * Google service-account auth for Cloudflare Workers (no Node SDK).
 *
 * Mints a short-lived OAuth access token from a service-account key by signing
 * a JWT with WebCrypto (RS256) and exchanging it at the token endpoint. This is
 * the same flow firestore.ts / bigquery.ts use inline; extracted here so the
 * Sheets adapter (and, later, those two) share one implementation.
 *
 * Accepts the credential as raw JSON or base64-encoded JSON, like firestore.ts.
 * Tokens are cached per-scope until ~1 min before expiry.
 */

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  project_id: string;
}

const tokenCache: Record<string, { token: string; expiry: number }> = {};

function decodeCredentials(credentials: string): ServiceAccountCredentials {
  const trimmed = credentials.trim();
  if (trimmed.startsWith('{')) return JSON.parse(trimmed);
  let cleaned = trimmed.replace(/\s/g, '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = cleaned.length % 4;
  if (padding) cleaned += '='.repeat(4 - padding);
  return JSON.parse(atob(cleaned));
}

function base64url(input: string | ArrayBuffer): string {
  let bin = '';
  if (typeof input === 'string') {
    bin = btoa(input);
  } else {
    bin = btoa(String.fromCharCode(...new Uint8Array(input)));
  }
  return bin.replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const contents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');
  const binary = Uint8Array.from(atob(contents), c => c.charCodeAt(0));
  return crypto.subtle.importKey(
    'pkcs8', binary, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']
  );
}

/**
 * Get a cached/fresh access token for the given OAuth scope.
 * `base64Credentials` is the SA key (raw JSON or base64), `scope` is a full
 * Google OAuth scope URL (e.g. https://www.googleapis.com/auth/spreadsheets).
 */
export async function getGoogleAccessToken(base64Credentials: string, scope: string): Promise<string> {
  const cached = tokenCache[scope];
  if (cached && cached.expiry > Date.now() + 60000) return cached.token;

  const creds = decodeCredentials(base64Credentials);
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const payload = base64url(JSON.stringify({
    iss: creds.client_email,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const key = await importPrivateKey(creds.private_key);
  const sig = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(`${header}.${payload}`)
  );
  const jwt = `${header}.${payload}.${base64url(sig)}`;

  const resp = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  });
  if (!resp.ok) throw new Error(`Google token exchange failed: ${await resp.text()}`);

  const data = await resp.json() as { access_token: string; expires_in: number };
  tokenCache[scope] = { token: data.access_token, expiry: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}
