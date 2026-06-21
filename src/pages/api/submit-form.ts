import type { APIRoute } from 'astro';
// Astro 6 / @astrojs/cloudflare v13 removed Astro.locals.runtime.env;
// Cloudflare bindings + secrets are now read from the cloudflare:workers
// virtual module.
import { serverEnv } from '@peakscape/site-kit/cloudflare';
import {
  insertLead as insertLeadBigQuery,
  createLeadData,
  sha256Hash,
  findContactByEmailOrPhone,
  createContact,
  updateContactForNewLead
} from '../../lib/bigquery';
import {
  createFirestoreLead,
  createFirestoreLeadData
} from '../../lib/firestore';
import { CUSTOM_FIELD_LEAD_ID, CUSTOM_FIELD_LEAD_RECEIVED } from '../../lib/trello';
import { createSheetLead } from '../../lib/sheets';
import { upsertBrevoContact } from '../../lib/brevo';
import { sendLeadEmails } from '../../lib/email';
import { parseAttributionCookie } from '@peakscape/site-kit/attribution';
// Spam signatures are shared across all sites via the kit (was lib/spam.ts +
// a local hasSuspiciousMixedCase — both byte-identical to these, now de-forked).
import { isSolicitationSpam, hasSuspiciousMixedCase } from '@peakscape/site-kit/forms';

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

    // Generate UUIDs for lead and potentially new contact
    const leadId = crypto.randomUUID();

    // Access Cloudflare env vars + secrets (Astro 6: from cloudflare:workers)
    const env = serverEnv();
    const projectId = env.BIGQUERY_PROJECT_ID;
    const credentials = env.BIGQUERY_CREDENTIALS;

    // Track contact info
    let contactId: string | undefined;
    let isReturningCustomer = false;

    // ========================================
    // BIGQUERY-FIRST: Source of Truth
    // ========================================
    if (!projectId || !credentials) {
      console.error('❌ BigQuery credentials not configured - cannot process lead');
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Server configuration error. Please try again later.'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Run the full lead pipeline in the BACKGROUND so the visitor gets the
    // confirmation immediately (was ~7s of serial third-party calls). Same
    // success semantics — this endpoint already returns success regardless of
    // downstream outcome; Cloudflare's waitUntil guarantees the work completes
    // after the response. Locally (no cfContext) we await so it still runs.
    const runPipeline = async () => {
    try {
      // ========================================
      // 1. CHECK FOR EXISTING CONTACT
      // ========================================
      console.log('🔍 Checking for existing contact by email/phone...');
      const contactResult = await findContactByEmailOrPhone(
        data.email,
        data.phone,
        projectId,
        credentials
      );

      if (!contactResult.success) {
        console.error('❌ Contact lookup failed:', contactResult.error);
        // Continue with new contact creation
      }

      if (contactResult.contact) {
        // ========================================
        // 2a. EXISTING CONTACT - Update it
        // ========================================
        contactId = contactResult.contact.contact_id;
        isReturningCustomer = true;
        console.log('🔄 RETURNING CUSTOMER found:', {
          contactId,
          email: contactResult.contact.email,
          phone: contactResult.contact.phone,
          totalLeads: contactResult.contact.total_leads
        });

        // Update contact with new lead info (increment count, add alternates)
        const updateResult = await updateContactForNewLead(
          contactId,
          data.email,
          data.phone,
          contactResult.contact,
          projectId,
          credentials
        );

        if (!updateResult.success) {
          console.error('⚠️ Contact update failed:', updateResult.error);
          // Continue anyway - lead insert is more important
        }
      } else {
        // ========================================
        // 2b. NEW CONTACT - Create it
        // ========================================
        contactId = crypto.randomUUID();
        console.log('👤 Creating new contact:', contactId);

        const createResult = await createContact({
          contact_id: contactId,
          email: data.email,
          phone: data.phone,
          first_name: data.firstName,
          last_name: data.lastName,
          preferred_contact: data.preferredContact,
          first_utm_source: data.utm_source,
          first_utm_medium: data.utm_medium,
          first_utm_campaign: data.utm_campaign,
          first_lead_source: data.lead_source,
          first_landing_page: data.landing_page,
          first_referrer: data.referrer,
        }, projectId, credentials);

        if (!createResult.success) {
          console.error('⚠️ Contact creation failed:', createResult.error);
          // Continue anyway - lead insert is more important
        }
      }

      // ========================================
      // 3. INSERT LEAD TO BIGQUERY
      // ========================================
      // Hash email and phone for enhanced conversions
      const emailHash = data.email ? await sha256Hash(data.email) : undefined;
      const phoneHash = data.phone ? await sha256Hash(data.phone) : undefined;

      // ========================================
      // LEAD STORE: GOOGLE SHEET (the hub)
      // ========================================
      // The Sheet is the system of record going forward; the Trello webhook reads
      // GCLID / writes status from it. Written independently of BigQuery so it does
      // not depend on the legacy store. BigQuery + Firestore stay as a temporary
      // safety net until the Sheet hub is verified on real leads, then get removed.
      const sheetsCredentials = env.SHEETS_CREDENTIALS;
      if (sheetsCredentials) {
        try {
          const sheetResult = await createSheetLead(data, leadId, sheetsCredentials, { emailHash, phoneHash });
          if (sheetResult.success) {
            console.log('✅ Lead written to Sheet:', leadId);
          } else {
            console.error('⚠️ Sheet lead write failed:', sheetResult.error);
          }
        } catch (sheetError) {
          console.error('⚠️ Sheet exception:', sheetError);
        }
      } else {
        console.log('ℹ️ SHEETS_CREDENTIALS not configured, skipping Sheet write');
      }

      const leadData = createLeadData({
        ...data,
        email_hash: emailHash,
        phone_hash: phoneHash,
        contact_id: contactId, // UUID from BigQuery contact
      }, leadId);

      const insertResult = await insertLeadBigQuery(leadData, projectId, credentials);

      if (insertResult.success) {
        console.log('✅ Lead inserted to BigQuery:', {
          leadId,
          contactId,
          isReturning: isReturningCustomer
        });

        // ========================================
        // 4. INSERT TO FIRESTORE (CRM Lite)
        // ========================================
        // Firestore stores minimal fields for mobile CRM operations
        // BigQuery remains source of truth for analytics/attribution
        const firestoreCredentials = env.FIREBASE_CREDENTIALS;

        if (firestoreCredentials) {
          try {
            const firestoreLeadData = createFirestoreLeadData(data, leadId);
            const firestoreResult = await createFirestoreLead(
              firestoreLeadData,
              projectId, // Same GCP project
              firestoreCredentials
            );

            if (firestoreResult.success) {
              console.log('✅ Lead inserted to Firestore (CRM):', leadId);
            } else {
              console.error('⚠️ Firestore insert failed:', firestoreResult.error);
              // Non-blocking: BigQuery is source of truth, Firestore is for CRM convenience
            }
          } catch (firestoreError) {
            console.error('⚠️ Firestore exception:', firestoreError);
            // Non-blocking: continue without Firestore
          }
        } else {
          console.log('ℹ️ FIREBASE_CREDENTIALS not configured, skipping Firestore write');
        }

        // ========================================
        // 5. CREATE TRELLO CARD (Lead Pipeline)
        // ========================================
        await sendToTrello(data, env, leadId);

        // ========================================
        // 6. ADD CONTACT TO BREVO (Email Marketing)
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

            if (brevoResult.success) {
              console.log(`✅ Brevo contact ${brevoResult.created ? 'created' : 'updated'}:`, data.email);
            } else {
              console.error('⚠️ Brevo contact sync failed:', brevoResult.error);
            }
          } catch (brevoError) {
            console.error('⚠️ Brevo exception:', brevoError);
          }
        } else {
          console.log('ℹ️ BREVO_API_KEY not configured, skipping Brevo sync');
        }

      } else {
        console.error('❌ BigQuery lead insert failed:', insertResult.error);
        // Still return success to user - we'll have logs to debug
      }
    } catch (bigQueryError) {
      console.error('❌ BigQuery exception:', bigQueryError);
      // Still return success to user - email notification will still work
    }

    // Send email notification
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
