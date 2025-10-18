import type { APIRoute } from 'astro';

export const prerender = false;

/**
 * Send offline conversions to Google Ads
 *
 * Setup Required:
 * 1. Create Google Cloud Project
 * 2. Enable Google Ads API
 * 3. Create OAuth credentials
 * 4. Get conversion action ID from Google Ads
 * 5. Add environment variables:
 *    - GOOGLE_ADS_CUSTOMER_ID (without hyphens)
 *    - GOOGLE_ADS_DEVELOPER_TOKEN
 *    - GOOGLE_ADS_REFRESH_TOKEN
 *    - GOOGLE_ADS_CLIENT_ID
 *    - GOOGLE_ADS_CLIENT_SECRET
 *    - GOOGLE_ADS_QUALIFIED_CONVERSION_ID
 *    - GOOGLE_ADS_BOOKING_CONVERSION_ID
 */

// Helper to hash email/phone for enhanced conversions
async function hashSHA256(data: string): Promise<string> {
  if (!data) return '';

  const normalized = data.trim().toLowerCase();
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));

  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to get OAuth access token
async function getAccessToken(env: any): Promise<string> {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token'
  });

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString()
  });

  if (!response.ok) {
    throw new Error(`OAuth token refresh failed: ${response.status}`);
  }

  const data = await response.json();
  return data.access_token;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.gclid) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'GCLID is required for Google Ads conversion tracking'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!data.conversion_type) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'conversion_type is required (qualified or converted)'
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check if Google Ads is configured
    const customerId = import.meta.env.GOOGLE_ADS_CUSTOMER_ID;
    const developerToken = import.meta.env.GOOGLE_ADS_DEVELOPER_TOKEN;
    const qualifiedConversionId = import.meta.env.GOOGLE_ADS_QUALIFIED_CONVERSION_ID;
    const bookingConversionId = import.meta.env.GOOGLE_ADS_BOOKING_CONVERSION_ID;

    if (!customerId || !developerToken) {
      console.error('Google Ads credentials not configured');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Google Ads integration not configured. Manual CSV upload required.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get OAuth access token
    const accessToken = await getAccessToken(import.meta.env);

    // Determine which conversion action to use
    const conversionAction = data.conversion_type === 'qualified'
      ? qualifiedConversionId
      : bookingConversionId;

    if (!conversionAction) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Conversion action ID not configured for ${data.conversion_type}`
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hash email and phone for enhanced conversions
    const hashedEmail = data.email ? await hashSHA256(data.email) : null;
    const hashedPhone = data.phone ? await hashSHA256(data.phone.replace(/\D/g, '')) : null;

    // Build the conversion payload
    const payload = {
      conversions: [{
        gclid: data.gclid,
        conversionAction: `customers/${customerId}/conversionActions/${conversionAction}`,
        conversionDateTime: data.conversion_time || new Date().toISOString(),
        conversionValue: data.value || 0,
        currencyCode: 'USD',
        // Enhanced conversions (helps match users across devices)
        userIdentifiers: [
          ...(hashedEmail ? [{ hashedEmail }] : []),
          ...(hashedPhone ? [{ hashedPhoneNumber: hashedPhone }] : [])
        ].filter(Boolean)
      }],
      partialFailure: false
    };

    console.log('Sending conversion to Google Ads:', {
      customerId,
      conversionType: data.conversion_type,
      gclid: data.gclid,
      value: data.value
    });

    // Send to Google Ads API
    const adsResponse = await fetch(
      `https://googleads.googleapis.com/v16/customers/${customerId}:uploadClickConversions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
          'login-customer-id': customerId
        },
        body: JSON.stringify(payload)
      }
    );

    const responseText = await adsResponse.text();
    console.log('Google Ads API response:', adsResponse.status, responseText);

    if (!adsResponse.ok) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Failed to send conversion to Google Ads',
          error: responseText
        }),
        { status: adsResponse.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `${data.conversion_type} conversion sent to Google Ads`,
        gclid: data.gclid,
        value: data.value
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending Google Ads conversion:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error sending conversion to Google Ads',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
