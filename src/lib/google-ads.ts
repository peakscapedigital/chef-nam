/**
 * Google Ads API client for offline conversion uploads
 *
 * Uses the REST API directly (no client library — incompatible with
 * Cloudflare Workers V8 isolate). Handles OAuth2 token refresh
 * and click conversion uploads.
 *
 * Required env vars:
 *   GOOGLE_ADS_DEVELOPER_TOKEN
 *   GOOGLE_ADS_CLIENT_ID
 *   GOOGLE_ADS_CLIENT_SECRET
 *   GOOGLE_ADS_REFRESH_TOKEN
 *   GOOGLE_ADS_CUSTOMER_ID
 */

const API_VERSION = 'v20';

// Cache access token in-memory (survives within a single request lifecycle)
let cachedToken: { token: string; expiry: number } | null = null;

interface GoogleAdsCredentials {
  developerToken: string;
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  customerId: string;
}

interface ConversionUploadResult {
  success: boolean;
  error?: string;
  partialFailureError?: string;
}

/**
 * Parse Google Ads credentials from env vars
 */
export function getGoogleAdsCredentials(env: Record<string, string>): GoogleAdsCredentials | null {
  const developerToken = env.GOOGLE_ADS_DEVELOPER_TOKEN;
  const clientId = env.GOOGLE_ADS_CLIENT_ID;
  const clientSecret = env.GOOGLE_ADS_CLIENT_SECRET;
  const refreshToken = env.GOOGLE_ADS_REFRESH_TOKEN;
  const customerId = env.GOOGLE_ADS_CUSTOMER_ID;

  if (!developerToken || !clientId || !clientSecret || !refreshToken || !customerId) {
    return null;
  }

  return { developerToken, clientId, clientSecret, refreshToken, customerId };
}

/**
 * Exchange refresh token for a fresh access token
 */
async function getAccessToken(credentials: GoogleAdsCredentials): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && cachedToken.expiry > Date.now() + 60_000) {
    return cachedToken.token;
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      refresh_token: credentials.refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed (${response.status}): ${error}`);
  }

  const data = await response.json() as { access_token: string; expires_in: number };

  cachedToken = {
    token: data.access_token,
    expiry: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.token;
}

/**
 * Format a Date as Google Ads conversion datetime string
 * Format: yyyy-mm-dd HH:mm:ss+|-HH:mm
 *
 * Cloudflare Workers run in UTC. We format in UTC and append +00:00.
 * Google Ads accepts any timezone — it just needs the offset to be accurate.
 */
function formatConversionDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');

  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ` +
    `${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}` +
    `+00:00`;
}

/**
 * Upload a single click conversion to Google Ads
 */
export async function uploadClickConversion(
  credentials: GoogleAdsCredentials,
  conversion: {
    gclid: string;
    conversionActionId: string;
    conversionValue: number;
    conversionDateTime?: Date;
  }
): Promise<ConversionUploadResult> {
  try {
    const accessToken = await getAccessToken(credentials);
    const customerId = credentials.customerId.replace(/-/g, '');
    const conversionTime = conversion.conversionDateTime || new Date();

    const url = `https://googleads.googleapis.com/${API_VERSION}/customers/${customerId}:uploadClickConversions`;

    const body = {
      conversions: [
        {
          gclid: conversion.gclid,
          conversionAction: `customers/${customerId}/conversionActions/${conversion.conversionActionId}`,
          conversionDateTime: formatConversionDateTime(conversionTime),
          conversionValue: conversion.conversionValue,
          currencyCode: 'USD',
          consent: {
            adPersonalization: 'GRANTED',
            adUserData: 'GRANTED',
          },
        },
      ],
      partialFailure: true,
    };

    console.log(`📤 Uploading conversion: gclid=${conversion.gclid.substring(0, 20)}..., action=${conversion.conversionActionId}, value=$${conversion.conversionValue}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': credentials.developerToken,
        'login-customer-id': customerId,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Google Ads API error (${response.status}):`, errorText);
      return { success: false, error: `API error ${response.status}: ${errorText}` };
    }

    const result = await response.json() as {
      partialFailureError?: { message: string };
      results?: Array<{ gclid?: string; conversionAction?: string; conversionDateTime?: string }>;
    };

    if (result.partialFailureError) {
      console.error('⚠️ Partial failure:', result.partialFailureError.message);
      return {
        success: false,
        partialFailureError: result.partialFailureError.message,
      };
    }

    console.log('✅ Conversion uploaded successfully');
    return { success: true };
  } catch (error) {
    console.error('❌ Conversion upload exception:', error);
    return { success: false, error: String(error) };
  }
}

// Conversion Action IDs (Chef Nam)
export const CONVERSION_ACTION_LEAD_QUALIFIED = '7350099303';
export const CONVERSION_ACTION_QUOTE = '7538155422';
export const CONVERSION_ACTION_PURCHASE = '7350098097';
