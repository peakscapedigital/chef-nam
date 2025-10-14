import type { APIRoute } from 'astro';
import { createClient } from '@sanity/client';

// Create client with API token for write operations
const writeClient = createClient({
  projectId: process.env.SANITY_PROJECT_ID || 'yojbqnd7',
  dataset: process.env.SANITY_DATASET || 'production',
  useCdn: false,
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN || 'skM6lGZRUGdMrX7gF2ouLCf1gNUJpv6IDiPOAjTJmjuqkzqcVp57cKfE74svy07jsZfMaEM1JX0d4WNXOvaBVH96k5UbcnlEg5TfOfOEmFMFAx2vQtbGCEKvyqzCFrPpkrs5SK4mEdlR57PWcsZTwheUK2snuB7SVE8USgo6x99h787Nq97O',
});

// Helper function to send email notification using Cloudflare Worker
async function sendEmailNotification(data: any, isUpdate: boolean = false) {
  try {
    console.log('Starting email notification via worker...');
    
    const emailData = {
      ...data,
      isUpdate: isUpdate
    };

    console.log('Sending to email worker:', { firstName: data.firstName, lastName: data.lastName, isUpdate });

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
      throw new Error(`Email worker error: ${response.status} - ${responseData}`);
    }

    console.log('Email notification sent successfully via worker');
  } catch (emailError) {
    console.error('Failed to send email notification via worker:', emailError);
    // Don't throw - we want form submission to succeed even if email fails
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
    
    // Create the document in Sanity
    let result;
    
    if (data.submissionId) {
      // Update existing submission
      console.log('Updating existing submission:', data.submissionId);
      
      const updateData = {
        preferredContact: data.preferredContact || null,
        hasEvent: data.hasEvent === 'yes',
        eventType: data.eventType || null,
        eventDate: data.eventDate || null,
        eventTime: data.eventTime || null,
        guestCount: data.guestCount || null,
        location: data.location || null,
        serviceStyle: data.serviceStyle || null,
        budgetRange: data.budgetRange || null,
        dietaryRequirements: data.dietaryRequirements || [],
        eventDescription: data.eventDescription || null,

        // Attribution data
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        utm_term: data.utm_term || null,
        utm_content: data.utm_content || null,
        gclid: data.gclid || null,
        fbclid: data.fbclid || null,
        lead_source: data.lead_source || 'Direct',
        referrer: data.referrer || null,
        landing_page: data.landing_page || null,

        status: 'detailed',
        updatedAt: new Date().toISOString()
      };
      
      // Only update message if a new one is provided
      if (data.message && data.message !== data.originalMessage) {
        updateData.message = data.message;
      }
      
      result = await writeClient.patch(data.submissionId).set(updateData).commit();
      console.log('Form submission updated:', result._id);
      
      // Send email notification for update (AWAIT IT!)
      await sendEmailNotification(data, true);
      
    } else {
      // Create new submission
      console.log('Creating new form submission...');
      
      const documentData = {
        _type: 'formSubmission',
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        phone: data.phone || '',
        preferredContact: data.preferredContact || null,
        hasEvent: data.hasEvent === 'yes',
        eventType: data.eventType || null,
        eventDate: data.eventDate || null,
        eventTime: data.eventTime || null,
        guestCount: data.guestCount || null,
        location: data.location || null,
        serviceStyle: data.serviceStyle || null,
        budgetRange: data.budgetRange || null,
        dietaryRequirements: data.dietaryRequirements || [],
        message: data.message || null,
        eventDescription: data.eventDescription || null,
        source: data.source || 'direct',

        // Attribution data
        utm_source: data.utm_source || null,
        utm_medium: data.utm_medium || null,
        utm_campaign: data.utm_campaign || null,
        utm_term: data.utm_term || null,
        utm_content: data.utm_content || null,
        gclid: data.gclid || null,
        fbclid: data.fbclid || null,
        lead_source: data.lead_source || 'Direct',
        referrer: data.referrer || null,
        landing_page: data.landing_page || null,

        status: 'new',
        submittedAt: new Date().toISOString()
      };
      
      result = await writeClient.create(documentData);
      console.log('Form submission created:', result._id);
      
      // Send email notification for new submission (AWAIT IT!)
      await sendEmailNotification(data, false);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Form submission received',
        id: result._id 
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