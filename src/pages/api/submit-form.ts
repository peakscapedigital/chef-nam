import type { APIRoute } from 'astro';

// Supabase configuration
const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL || 'https://yrhimzyqasnftlcyehhj.supabase.co';
const SUPABASE_SERVICE_KEY = import.meta.env.SUPABASE_SERVICE_KEY; // Server-side only, bypasses RLS
const CHEF_NAM_TENANT_ID = 1; // Chef Nam's tenant ID

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
async function sendEmailNotification(data: any, isUpdate: boolean = false) {
  try {
    console.log('Starting email notification via worker...');

    // Auto-fix common email typos before sending
    const fixedEmail = fixCommonEmailTypos(data.email);

    const emailData = {
      ...data,
      email: fixedEmail,
      originalEmail: data.email !== fixedEmail ? data.email : undefined, // Track if we fixed it
      isUpdate: isUpdate
    };

    console.log('Sending to email worker:', {
      firstName: data.firstName,
      lastName: data.lastName,
      email: fixedEmail,
      emailWasFixed: data.email !== fixedEmail,
      isUpdate
    });

    const response = await fetch('https://chefnam-email-worker.dspjson.workers.dev', {
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

    // Return the fixed email so we can update the record if needed
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

export const POST: APIRoute = async ({ request }) => {
  try {
    console.log('Form submission API called');

    let data;
    try {
      data = await request.json();
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      const body = await request.text();
      console.log('Raw body as text:', body);

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

    // Auto-fix email if needed
    const fixedEmail = fixCommonEmailTypos(data.email);

    // Prepare lead data for Supabase leads table
    const leadData = {
      tenant_id: CHEF_NAM_TENANT_ID,
      first_name: data.firstName || '',
      last_name: data.lastName || '',
      email: fixedEmail || '',
      phone: data.phone || '',
      preferred_contact: data.preferredContact || null,
      message: data.message || null,
      lead_status: 'new',
      lead_source: data.lead_source || 'Direct',

      // Event-specific fields (Chef Nam catering)
      has_event: data.hasEvent === 'yes',
      event_type: data.eventType || null,
      event_date: data.eventDate || null,
      event_time: data.eventTime || null,
      guest_count: data.guestCount || null,
      location: data.location || null,
      service_style: data.serviceStyle || null,
      budget_range: data.budgetRange || null,
      dietary_requirements: data.dietaryRequirements || null,
      event_description: data.eventDescription || null,

      // Attribution tracking
      utm_source: data.utm_source || null,
      utm_medium: data.utm_medium || null,
      utm_campaign: data.utm_campaign || null,
      utm_term: data.utm_term || null,
      utm_content: data.utm_content || null,
      gclid: data.gclid || null,
      fbclid: data.fbclid || null,
      referrer: data.referrer || null,
      landing_page: data.landing_page || null,
      source_page: data.source_page || null,

      // GA4 tracking
      ga_client_id: data.ga_client_id || null,
      ga_session_id: data.ga_session_id || null,

      // Form metadata
      form_type: 'contact_form',
      touchpoint_type: 'form_submission',

      // Custom fields for any additional data
      custom_fields: data.custom_fields || null
    };

    console.log('Creating lead in Supabase...');

    // Insert lead into Supabase using service role key (server-side only, bypasses RLS)
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leads`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation' // Return the created record
      },
      body: JSON.stringify(leadData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase API error:', response.status, errorText);
      throw new Error(`Supabase error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const leadId = result[0]?.id;
    console.log('Lead created in Supabase:', leadId);

    // Process the lead to create contact and opportunity (if has_event)
    console.log('Processing lead to create contact and opportunity...');
    const processResponse = await fetch(`${SUPABASE_URL}/rest/v1/rpc/process_lead`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_lead_id: leadId })
    });

    if (!processResponse.ok) {
      const processError = await processResponse.text();
      console.error('Warning: Failed to process lead:', processError);
      // Don't throw - we still want to send the email even if processing fails
    } else {
      const processResult = await processResponse.json();
      console.log('Lead processed successfully:', {
        contact_id: processResult.contact_id,
        opportunity_id: processResult.opportunity_id
      });
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
