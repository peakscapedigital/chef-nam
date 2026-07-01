import type { APIRoute } from 'astro';
// Astro 6 / @astrojs/cloudflare v13 removed Astro.locals.runtime.env;
// Cloudflare bindings + secrets are now read from the cloudflare:workers
// virtual module.
import { serverEnv } from '@peakscape/site-kit/cloudflare';
import { notifyOps } from '@peakscape/site-kit/ops';
import { CUSTOM_FIELD_LEAD_ID, CUSTOM_FIELD_LEAD_RECEIVED } from '../../lib/trello';
import { createSheetLead } from '../../lib/sheets';
import { upsertBrevoContact } from '../../lib/brevo';
import { sendLeadEmails } from '../../lib/email';
import { parseAttributionCookie } from '@peakscape/site-kit/attribution';
// Spam signatures are shared across all sites via the kit (was lib/spam.ts +
// a local hasSuspiciousMixedCase — both byte-identical to these, now de-forked).
import { isSolicitationSpam, hasSuspiciousMixedCase } from '@peakscape/site-kit/forms';

// SHA-256 hash for Google Enhanced Conversions (email/phone). WebCrypto only.
// (Relocated here from the retired lib/bigquery.ts — CN-006.)
async function sha256Hash(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  const encoded = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(hashBuffer)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Check if submission is likely spam
function isLikelySpam(data: any): { isSpam: boolean; reason?: string } {
  // Honeypot check - if filled, it's spam
  if (data.website && data.website.trim() !== '') {
    return { isSpam: true, reason: 'Honeypot field filled' };
  }

  // Check first name for suspicious mixed case
  if (hasSuspiciousMixedCase(data.firstName)) {
    return { isSpam: true, reason: `Suspicious mixed case in first name: ${data.firstName}` };
  }

  // Check last name for suspicious mixed case
  if (hasSuspiciousMixedCase(data.lastName)) {
    return { isSpam: true, reason: `Suspicious mixed case in last name: ${data.lastName}` };
  }

  // Check message for suspicious mixed case
  if (data.message && hasSuspiciousMixedCase(data.message)) {
    return { isSpam: true, reason: 'Suspicious mixed case in message' };
  }

  // Solicitation / marketing spam that passes honeypot + mixed-case. Signatures
  // shared with the backfill via @peakscape/site-kit/forms so they can't drift.
  if (isSolicitationSpam(data.email, `${data.message || ''} ${data.eventDescription || ''}`)) {
    return { isSpam: true, reason: `Solicitation spam: ${data.email}` };
  }

  return { isSpam: false };
}

// Helper function to auto-fix common email typos
function fixCommonEmailTypos(email: string): string {
  if (!email) return email;

  const trimmed = email.trim().toLowerCase();

  // Common domain fixes for missing TLDs
  const commonDomains = [
    { pattern: /@gmail$/i, fix: '@gmail.com' },
    { pattern: /@yahoo$/i, fix: '@yahoo.com' },
    { pattern: /@hotmail$/i, fix: '@hotmail.com' },
    { pattern: /@outlook$/i, fix: '@outlook.com' },
    { pattern: /@icloud$/i, fix: '@icloud.com' },
    { pattern: /@aol$/i, fix: '@aol.com' },
    { pattern: /@me$/i, fix: '@me.com' }
  ];

  for (const domain of commonDomains) {
    if (domain.pattern.test(trimmed)) {
      console.log(`Auto-fixed email typo: ${email} → ${trimmed.replace(domain.pattern, domain.fix)}`);
      return trimmed.replace(domain.pattern, domain.fix);
    }
  }

  return trimmed;
}

// Helper function to create a Trello card for new leads
async function sendToTrello(data: any, env: Record<string, string | undefined> | undefined, leadId?: string) {
  const apiKey = env?.TRELLO_API_KEY;
  const apiToken = env?.TRELLO_API_TOKEN;

  if (!apiKey || !apiToken) {
    console.log('ℹ️ Trello credentials not configured, skipping Trello card creation');
    return null;
  }

  try {
    const name = data.eventType
      ? `${data.firstName} ${data.lastName} - ${data.eventType}`
      : `${data.firstName} ${data.lastName}`;

    const descParts: string[] = [];

    // Contact info
    descParts.push('## Contact');
    descParts.push(`- **Email:** ${data.email}`);
    if (data.phone) descParts.push(`- **Phone:** ${data.phone}`);
    if (data.preferredContact) descParts.push(`- **Preferred:** ${data.preferredContact}`);

    // Event details
    if (data.hasEvent === 'yes') {
      descParts.push('');
      descParts.push('## Event Details');
      if (data.eventType) descParts.push(`- **Type:** ${data.eventType}`);
      if (data.eventDate) descParts.push(`- **Date:** ${data.eventDate}`);
      if (data.eventTime) descParts.push(`- **Time:** ${data.eventTime}`);
      if (data.guestCount) descParts.push(`- **Guests:** ${data.guestCount}`);
      if (data.location) descParts.push(`- **Location:** ${data.location}`);
      if (data.serviceStyle) descParts.push(`- **Service Style:** ${data.serviceStyle}`);
      if (data.budgetRange) descParts.push(`- **Budget:** ${data.budgetRange}`);
      if (data.dietaryRequirements?.length) {
        descParts.push(`- **Dietary:** ${data.dietaryRequirements.join(', ')}`);
      }
    }

    // Message
    if (data.message) {
      descParts.push('');
      descParts.push('## Message');
      descParts.push(data.message);
    }

    if (data.eventDescription) {
      descParts.push('');
      descParts.push('## Event Description');
      descParts.push(data.eventDescription);
    }

    // Source attribution
    if (data.utm_source || data.lead_source || data.referrer) {
      descParts.push('');
      descParts.push('## Source');
      if (data.lead_source) descParts.push(`- **Lead Source:** ${data.lead_source}`);
      if (data.utm_source) descParts.push(`- **UTM Source:** ${data.utm_source}`);
      if (data.utm_medium) descParts.push(`- **UTM Medium:** ${data.utm_medium}`);
      if (data.utm_campaign) descParts.push(`- **UTM Campaign:** ${data.utm_campaign}`);
      if (data.referrer) descParts.push(`- **Referrer:** ${data.referrer}`);
    }

    const params = new URLSearchParams({
      key: apiKey,
      token: apiToken,
      idList: '69894415201f9d44987bcea9',
      idMembers: '690e4a96d715f6d5533463a7',
      name,
      desc: descParts.join('\n'),
      pos: 'top',
    });

    const response = await fetch(`https://api.trello.com/1/cards?${params.toString()}`, {
      method: 'POST',
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('⚠️ Trello card creation failed:', response.status, errorText);
      return null;
    }

    const card = await response.json() as { id: string; shortUrl: string };
    console.log('✅ Trello card created:', card.id, card.shortUrl);

    // Set custom fields: Lead ID and Lead Received
    const customFields = [
      { id: CUSTOM_FIELD_LEAD_ID, value: { text: leadId || '' } },
      { id: CUSTOM_FIELD_LEAD_RECEIVED, value: { date: new Date().toISOString() } },
    ];

    for (const field of customFields) {
      try {
        const fieldResponse = await fetch(
          `https://api.trello.com/1/cards/${card.id}/customField/${field.id}/item?key=${apiKey}&token=${apiToken}`,
          {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ value: field.value }),
          }
        );
        if (!fieldResponse.ok) {
          console.error(`⚠️ Failed to set custom field ${field.id}:`, fieldResponse.status);
        }
      } catch (fieldError) {
        console.error(`⚠️ Custom field ${field.id} exception:`, fieldError);
      }
    }
    console.log('✅ Custom fields set on card (Lead ID + Lead Received)');

    return card;
  } catch (trelloError) {
    console.error('⚠️ Trello exception:', trelloError);
    return null;
  }
}

// Helper function to send email notification using Cloudflare Worker
async function sendEmailNotification(data: any, isSpam: boolean = false) {
  // Skip email notification for spam submissions
  if (isSpam) {
    console.log('Skipping email notification for spam submission');
    return null;
  }

  try {
    console.log('Starting email notification via worker...');

    // Auto-fix common email typos before sending
    const fixedEmail = fixCommonEmailTypos(data.email);

    const emailData = {
      ...data,
      email: fixedEmail,
      originalEmail: data.email !== fixedEmail ? data.email : undefined
    };

    console.log('Sending to email worker:', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: fixedEmail,
      emailWasFixed: data.email !== fixedEmail
    });

    // Send directly via Resend (src/lib/email.ts) — no separate email worker
    // (SYS-008). Returns { success, error } rather than throwing on Resend errors.
    const result = await sendLeadEmails(emailData);

    if (!result.success) {
      // Email failed - log prominently with user details so you can manually reach out
      console.error('❌❌❌ EMAIL NOTIFICATION FAILED ❌❌❌');
      console.error('Lead Details:', {
        name: `${data.firstName} ${data.lastName}`,
        email: data.email,
        fixedEmail: fixedEmail,
        phone: data.phone,
        eventType: data.eventType,
        guestCount: data.guestCount,
        preferredContact: data.preferredContact
      });
      console.error('Error:', result.error);
      console.error('❌❌❌ MANUAL FOLLOW-UP REQUIRED ❌❌❌');

      throw new Error(`Email send failed: ${result.error}`);
    }

    console.log('✅ Email notification sent successfully');
    return fixedEmail;
  } catch (emailError) {
    console.error('❌❌❌ CRITICAL: Email notification failed ❌❌❌');
    console.error('Failed to send email notification via worker:', emailError);
    console.error('Lead contact info:', {
      name: `${data.firstName} ${data.lastName}`,
      email: data.email,
      phone: data.phone
    });
    // Don't throw - we want form submission to succeed even if email fails
    // But log it VERY prominently so it shows up in Cloudflare logs
    return null;
  }
}

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    console.log('Form submission API called');

    let data;
    try {
      data = await request.json();
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Invalid JSON data'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (!data || Object.keys(data).length === 0) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'No data provided'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Server-authoritative attribution (SYS-007 first-party-cookie migration):
    // read the `ps_attr` cookie set by the site-kit capture script and override
    // any client-sent attribution fields, so we trust the cookie, not the body.
    const attribution = parseAttributionCookie(request.headers.get('cookie'));
    data = { ...data, ...attribution };

    // Check for spam
    const spamCheck = isLikelySpam(data);
    const isSpam = spamCheck.isSpam;

    if (isSpam) {
      console.log('🚫 Spam submission detected:', spamCheck.reason);
      console.log('Spam data:', {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        message: data.message?.substring(0, 50)
      });

      // Return success to spam bots (they don't need to know we caught them)
      // but don't send any email
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Form submission received'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Log the submission details
    console.log('📧 Processing legitimate form submission:', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      phone: data.phone,
      hasEvent: data.hasEvent,
      eventType: data.eventType,
      guestCount: data.guestCount
    });

    const leadId = crypto.randomUUID();

    // Access Cloudflare env vars + secrets (Astro 6: from cloudflare:workers)
    const env = serverEnv();

    // Run the full lead pipeline in the BACKGROUND so the visitor gets the
    // confirmation immediately (was ~7s of serial third-party calls). Cloudflare's
    // waitUntil guarantees the work completes after the response. Locally (no
    // cfContext) we await so it still runs.
    const runPipeline = async () => {
      try {
        // Hash email and phone for Google Enhanced Conversions.
        const emailHash = data.email ? await sha256Hash(data.email) : undefined;
        const phoneHash = data.phone ? await sha256Hash(data.phone) : undefined;

        // ========================================
        // 1. LEAD STORE: GOOGLE SHEET (system of record)
        // ========================================
        // The Sheet is the single store of record. The Trello webhook reads GCLID
        // and writes status back from it. (BigQuery + Firestore + the /admin
        // dashboard were retired 2026-06-30 — CN-006. Sheet-only: no contact-dedup
        // / returning-customer layer; each lead gets a fresh UUID.)
        const sheetsCredentials = env.SHEETS_CREDENTIALS;
        if (!sheetsCredentials) {
          console.error('❌ SHEETS_CREDENTIALS not configured — lead not stored to Sheet');
          await notifyOps(env, {
            subject: '[Chef Nam] form-submit DOWN — Sheets creds missing',
            site: 'chefnamcatering.com',
            context: { leadId },
          });
        } else {
          try {
            const sheetResult = await createSheetLead(data, leadId, sheetsCredentials, { emailHash, phoneHash });
            if (sheetResult.success) {
              console.log('✅ Lead written to Sheet:', leadId);
            } else {
              console.error('⚠️ Sheet lead write failed:', sheetResult.error);
              await notifyOps(env, {
                subject: '[Chef Nam] Sheet lead write FAILED (store of record)',
                site: 'chefnamcatering.com',
                context: { leadId },
                error: sheetResult.error,
              });
            }
          } catch (sheetError) {
            console.error('⚠️ Sheet exception:', sheetError);
            await notifyOps(env, {
              subject: '[Chef Nam] lead pipeline EXCEPTION (Sheet)',
              site: 'chefnamcatering.com',
              context: { leadId },
              error: sheetError,
            });
          }
        }

        // ========================================
        // 2. CREATE TRELLO CARD (Lead Pipeline)
        // ========================================
        await sendToTrello(data, env, leadId);

        // ========================================
        // 3. ADD CONTACT TO BREVO (Email Marketing)
        // ========================================
        const brevoApiKey = env.BREVO_API_KEY;
        if (brevoApiKey) {
          try {
            const brevoResult = await upsertBrevoContact({
              email: data.email,
              firstName: data.firstName,
              lastName: data.lastName,
              eventType: data.eventType,
              eventDate: data.eventDate,
              guestCount: data.guestCount,
              leadSource: data.lead_source || data.utm_source,
              leadId,
              submittedAt: new Date().toISOString(),
            }, brevoApiKey);

            if (brevoResult.ok) {
              console.log(`✅ Brevo contact ${brevoResult.alreadyExists ? 'updated' : 'synced'}:`, data.email);
            } else {
              console.error('⚠️ Brevo contact sync failed:', brevoResult.error);
            }
          } catch (brevoError) {
            console.error('⚠️ Brevo exception:', brevoError);
          }
        } else {
          console.log('ℹ️ BREVO_API_KEY not configured, skipping Brevo sync');
        }
      } catch (pipelineError) {
        console.error('❌ Lead pipeline exception:', pipelineError);
        await notifyOps(env, {
          subject: '[Chef Nam] lead pipeline EXCEPTION',
          site: 'chefnamcatering.com',
          context: { leadId },
          error: pipelineError,
        });
      }

      // Send email notification (the guaranteed safety net — always fires).
      await sendEmailNotification(data, false);
    };

    const cfCtx = (locals as { cfContext?: { waitUntil?: (p: Promise<unknown>) => void } }).cfContext;
    const pipeline = runPipeline();
    if (cfCtx?.waitUntil) cfCtx.waitUntil(pipeline);
    else await pipeline;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Form submission received',
        id: leadId
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error submitting form:', error);

    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error submitting form. Please try again.'
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};

export const GET: APIRoute = () => {
  return new Response(
    JSON.stringify({ message: 'This endpoint only accepts POST requests' }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
};
