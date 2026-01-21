import type { APIRoute } from 'astro';
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

// Spam detection: Check for suspicious mixed case pattern
function hasSuspiciousMixedCase(text: string): boolean {
  if (!text || text.length < 5) return false;

  // Count transitions between lowercase and uppercase (e.g., "aB" or "Ba")
  const transitions = text.match(/[a-z][A-Z]|[A-Z][a-z]/g);
  if (!transitions) return false;

  // If more than 30% of characters are case transitions, likely spam
  // Example: "IBImNNRqxTBytPGqxYt" has excessive transitions
  return transitions.length > text.length * 0.3;
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

    const response = await fetch('https://chefnam-email-worker.jason-090.workers.dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    console.log('Email worker response status:', response.status);
    const responseData = await response.text();
    console.log('Email worker response:', responseData);

    if (!response.ok) {
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
      console.error('Error:', response.status, responseData);
      console.error('❌❌❌ MANUAL FOLLOW-UP REQUIRED ❌❌❌');

      throw new Error(`Email worker error: ${response.status} - ${responseData}`);
    }

    console.log('✅ Email notification sent successfully via worker');
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

    // Access Cloudflare env vars through runtime context
    const runtime = (locals as { runtime?: { env?: Record<string, string> } }).runtime;
    const projectId = runtime?.env?.BIGQUERY_PROJECT_ID;
    const credentials = runtime?.env?.BIGQUERY_CREDENTIALS;

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
        const firestoreCredentials = runtime?.env?.FIREBASE_CREDENTIALS;

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
