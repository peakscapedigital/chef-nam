import { Resend } from "resend";

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
        },
      });
    }

    // Only allow POST requests
    if (request.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    try {
      // Check origin if specified
      const origin = request.headers.get("Origin");
      const allowedOrigins = env.ALLOWED_ORIGINS?.split(",") || [];
      
      if (allowedOrigins.length > 0 && !allowedOrigins.includes(origin)) {
        return new Response("Forbidden", { status: 403 });
      }

      // Parse request body
      const data = await request.json();

      // Initialize Resend
      const resend = new Resend(env.RESEND_API_KEY);

      // Helper function to format contact method
      const formatContactMethod = (method) => {
        const methods = {
          'email': '📧 Email',
          'phone': '📞 Phone Call',
          'text': '💬 Text Message'
        };
        return methods[method] || 'Not specified';
      };

      // Prepare email content
      const eventDetails = data.hasEvent === 'yes' || data.hasEvent === true ? `
        <h3>Event Details:</h3>
        <ul>
          <li><strong>Event Type:</strong> ${data.eventType || 'Not specified'}</li>
          <li><strong>Date:</strong> ${data.eventDate || 'Not specified'}</li>
          <li><strong>Time:</strong> ${data.eventTime || 'Not specified'}</li>
          <li><strong>Guest Count:</strong> ${data.guestCount || 'Not specified'}</li>
          <li><strong>Location:</strong> ${data.location || 'Not specified'}</li>
          <li><strong>Service Style:</strong> ${data.serviceStyle || 'Not specified'}</li>
          <li><strong>Budget Range:</strong> ${data.budgetRange || 'Not specified'}</li>
          <li><strong>Dietary Requirements:</strong> ${Array.isArray(data.dietaryRequirements) ? data.dietaryRequirements.join(', ') : data.dietaryRequirements || 'None'}</li>
        </ul>
      ` : '<p><em>General inquiry - no specific event details</em></p>';

      // Lead source attribution section
      const hasAttribution = data.utm_source || data.gclid || data.referrer || data.lead_source || data.submitted_from_url;
      const attributionDetails = hasAttribution ? `
        <h3 style="color: #F39C12;">📊 Lead Source Information:</h3>
        <ul>
          <li><strong>Source:</strong> ${data.lead_source || 'Direct'}</li>
          ${data.utm_campaign ? `<li><strong>Campaign:</strong> ${data.utm_campaign}</li>` : ''}
          ${data.utm_medium ? `<li><strong>Medium:</strong> ${data.utm_medium}</li>` : ''}
          ${data.utm_term ? `<li><strong>Keyword:</strong> "${data.utm_term}"</li>` : ''}
          ${data.utm_content ? `<li><strong>Ad Content:</strong> ${data.utm_content}</li>` : ''}
          ${data.landing_page ? `<li><strong>Landing Page:</strong> ${data.landing_page}</li>` : ''}
          ${data.submitted_from_url ? `<li><strong>Form Submitted From:</strong> ${data.submitted_from_url}</li>` : ''}
          ${data.gclid ? `<li><strong>Google Click ID:</strong> ${data.gclid.substring(0, 20)}...</li>` : ''}
          ${data.referrer ? `<li><strong>Referrer:</strong> ${data.referrer}</li>` : ''}
        </ul>
      ` : '';

      const subject = data.isUpdate 
        ? `📝 Updated Catering Inquiry from ${data.firstName} ${data.lastName}`
        : `🍽️ New Catering Inquiry from ${data.firstName} ${data.lastName}`;

      const emailHtml = `
        <h2>${data.isUpdate ? 'Updated' : 'New'} Catering Inquiry</h2>

        <h3>Contact Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${data.firstName} ${data.lastName}</li>
          <li><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></li>
          <li><strong>Phone:</strong> <a href="tel:${data.phone}">${data.phone}</a></li>
          <li><strong>Preferred Contact:</strong> ${formatContactMethod(data.preferredContact)}</li>
        </ul>

        ${eventDetails}

        ${attributionDetails}

        ${data.message ? `
          <h3>Message:</h3>
          <p>${data.message}</p>
        ` : ''}

        ${data.eventDescription ? `
          <h3>Event Description:</h3>
          <p>${data.eventDescription}</p>
        ` : ''}

        <hr>
        <p><small>Submitted via Chef Nam Catering website</small></p>
      `;

      // Prepare customer confirmation email
      const customerEmailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2C3E50;">Thank you for your catering inquiry${data.firstName ? ', ' + data.firstName : ''}!</h2>

          <p>Hi ${data.firstName || 'there'},</p>

          <p>Thank you for reaching out to Chef Nam Catering! We've received your inquiry${data.eventType ? ' for your ' + data.eventType : ''} and are excited to help make your event special.</p>

          ${data.hasEvent === 'yes' || data.hasEvent === true ? `
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #F39C12; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2C3E50;">Your Event Details:</h3>
            <ul style="list-style: none; padding: 0;">
              ${data.eventType ? `<li><strong>Event:</strong> ${data.eventType}</li>` : ''}
              ${data.eventDate ? `<li><strong>Date:</strong> ${data.eventDate}</li>` : ''}
              ${data.guestCount ? `<li><strong>Guests:</strong> ${data.guestCount}</li>` : ''}
              ${data.preferredContact ? `<li><strong>Preferred contact:</strong> ${formatContactMethod(data.preferredContact)}</li>` : ''}
            </ul>
          </div>
          ` : ''}

          <p><strong>We'll get back to you within 24 hours to confirm details of your request.</strong></p>

          <p>In the meantime, feel free to explore our sample menus at <a href="https://chefnamcatering.com/menus" style="color: #F39C12;">chefnamcatering.com/menus</a>.</p>

          <div style="margin-top: 30px; padding-top: 20px; border-top: 2px solid #f0f0f0;">
            <p style="margin: 5px 0;"><strong>Warm regards,</strong><br>Chef Nam</p>
            <p style="margin: 15px 0 5px 0;">
              📞 <a href="tel:+17346239799" style="color: #2C3E50; text-decoration: none;">(734) 623-9799</a><br>
              📧 <a href="mailto:nam@chefnamcatering.com" style="color: #2C3E50; text-decoration: none;">nam@chefnamcatering.com</a><br>
              🌐 <a href="https://chefnamcatering.com" style="color: #F39C12; text-decoration: none;">chefnamcatering.com</a>
            </p>
            <p style="margin: 15px 0 5px 0;">
              <a href="https://www.facebook.com/chefnamcatering" style="color: #2C3E50; text-decoration: none; margin-right: 15px;">Facebook</a>
              <a href="https://www.instagram.com/chefnamcatering" style="color: #2C3E50; text-decoration: none;">Instagram</a>
            </p>
          </div>
        </div>
      `;

      // Send emails using Resend batch API
      const { data: emailData, error } = await resend.batch.send([
        {
          // Internal notification
          from: 'forms@chefnamcatering.com',
          to: ['nam@chefnamcatering.com', 'dspjson@gmail.com'],
          subject: subject,
          html: emailHtml,
        },
        {
          // Customer confirmation
          from: 'Chef Nam <nam@chefnamcatering.com>',
          to: data.email,
          bcc: ['nam@chefnamcatering.com'], // BCC to see confirmations in inbox
          subject: `Thank you for your catering inquiry${data.firstName ? ', ' + data.firstName : ''}!`,
          html: customerEmailHtml,
        }
      ]);

      if (error) {
        console.error('Resend error:', error);
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      }

      return new Response(JSON.stringify({ success: true, data: emailData }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }
  },
};