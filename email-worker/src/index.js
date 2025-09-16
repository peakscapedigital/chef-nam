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
        </ul>
        
        ${eventDetails}
        
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

      // Send email using Resend
      const { data: emailData, error } = await resend.emails.send({
        from: 'forms@chefnamcatering.com',
        to: ['nam@chefnamcatering.com', 'dspjson@gmail.com'],
        subject: subject,
        html: emailHtml,
      });

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