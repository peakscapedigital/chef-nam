// Lead notification + customer confirmation emails, sent directly from the
// site Worker via the Resend REST batch API. This replaces the standalone
// chefnam-email-worker (SYS-008): a Worker can't fetch another Worker on the
// same account by public URL (CF error 1042), which forced a service binding;
// folding the send in here removes that worker entirely (worker-standard rule 8).
//
// Uses the REST endpoint (not the `resend` SDK) to avoid a dependency.
// RESEND_API_KEY is a runtime secret read from cloudflare:workers (Approach C).
import { serverEnv } from '@peakscape/site-kit/cloudflare';
import { escapeHtml } from '@peakscape/site-kit/html';

export interface LeadEmailData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  preferredContact?: string;
  hasEvent?: string | boolean;
  eventType?: string;
  eventDate?: string;
  eventTime?: string;
  guestCount?: string | number;
  location?: string;
  serviceStyle?: string;
  budgetRange?: string;
  dietaryRequirements?: string[] | string;
  message?: string;
  eventDescription?: string;
  isUpdate?: boolean;
  lead_source?: string;
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_term?: string;
  utm_content?: string;
  landing_page?: string;
  submitted_from_url?: string;
  gclid?: string;
  referrer?: string;
}

interface ResendEmail {
  from: string;
  to: string | string[];
  subject: string;
  html: string;
  bcc?: string[];
}

function formatContactMethod(method?: string): string {
  const methods: Record<string, string> = {
    email: '📧 Email',
    phone: '📞 Phone Call',
    text: '💬 Text Message',
  };
  return (method && methods[method]) || 'Not specified';
}

function buildNotificationHtml(data: LeadEmailData): string {
  const eventDetails =
    data.hasEvent === 'yes' || data.hasEvent === true
      ? `
        <h3>Event Details:</h3>
        <ul>
          <li><strong>Event Type:</strong> ${escapeHtml(data.eventType) || 'Not specified'}</li>
          <li><strong>Date:</strong> ${escapeHtml(data.eventDate) || 'Not specified'}</li>
          <li><strong>Time:</strong> ${escapeHtml(data.eventTime) || 'Not specified'}</li>
          <li><strong>Guest Count:</strong> ${escapeHtml(data.guestCount) || 'Not specified'}</li>
          <li><strong>Location:</strong> ${escapeHtml(data.location) || 'Not specified'}</li>
          <li><strong>Service Style:</strong> ${escapeHtml(data.serviceStyle) || 'Not specified'}</li>
          <li><strong>Budget Range:</strong> ${escapeHtml(data.budgetRange) || 'Not specified'}</li>
          <li><strong>Dietary Requirements:</strong> ${escapeHtml(Array.isArray(data.dietaryRequirements) ? data.dietaryRequirements.join(', ') : data.dietaryRequirements) || 'None'}</li>
        </ul>
      `
      : '<p><em>General inquiry - no specific event details</em></p>';

  const hasAttribution =
    data.utm_source || data.gclid || data.referrer || data.lead_source || data.submitted_from_url;
  const attributionDetails = hasAttribution
    ? `
        <h3 style="color: #F39C12;">📊 Lead Source Information:</h3>
        <ul>
          <li><strong>Source:</strong> ${escapeHtml(data.lead_source) || 'Direct'}</li>
          ${data.utm_campaign ? `<li><strong>Campaign:</strong> ${escapeHtml(data.utm_campaign)}</li>` : ''}
          ${data.utm_medium ? `<li><strong>Medium:</strong> ${escapeHtml(data.utm_medium)}</li>` : ''}
          ${data.utm_term ? `<li><strong>Keyword:</strong> "${escapeHtml(data.utm_term)}"</li>` : ''}
          ${data.utm_content ? `<li><strong>Ad Content:</strong> ${escapeHtml(data.utm_content)}</li>` : ''}
          ${data.landing_page ? `<li><strong>Landing Page:</strong> ${escapeHtml(data.landing_page)}</li>` : ''}
          ${data.submitted_from_url ? `<li><strong>Form Submitted From:</strong> ${escapeHtml(data.submitted_from_url)}</li>` : ''}
          ${data.gclid ? `<li><strong>Google Click ID:</strong> ${escapeHtml(data.gclid.substring(0, 20))}...</li>` : ''}
          ${data.referrer ? `<li><strong>Referrer:</strong> ${escapeHtml(data.referrer)}</li>` : ''}
        </ul>
      `
    : '';

  return `
        <h2>${data.isUpdate ? 'Updated' : 'New'} Catering Inquiry</h2>

        <h3>Contact Information:</h3>
        <ul>
          <li><strong>Name:</strong> ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}</li>
          <li><strong>Email:</strong> <a href="mailto:${escapeHtml(data.email)}">${escapeHtml(data.email)}</a></li>
          <li><strong>Phone:</strong> <a href="tel:${escapeHtml(data.phone)}">${escapeHtml(data.phone)}</a></li>
          <li><strong>Preferred Contact:</strong> ${formatContactMethod(data.preferredContact)}</li>
        </ul>

        ${eventDetails}

        ${attributionDetails}

        ${data.message ? `
          <h3>Message:</h3>
          <p>${escapeHtml(data.message)}</p>
        ` : ''}

        ${data.eventDescription ? `
          <h3>Event Description:</h3>
          <p>${escapeHtml(data.eventDescription)}</p>
        ` : ''}

        <hr>
        <p><small>Submitted via Chef Nam Catering website</small></p>
      `;
}

function buildConfirmationHtml(data: LeadEmailData): string {
  return `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2C3E50;">Thank you for your catering inquiry${data.firstName ? ', ' + escapeHtml(data.firstName) : ''}!</h2>

          <p>Hi ${escapeHtml(data.firstName) || 'there'},</p>

          <p>Thank you for reaching out to Chef Nam Catering! We've received your inquiry${data.eventType ? ' for your ' + escapeHtml(data.eventType) : ''} and are excited to help make your event special.</p>

          ${data.hasEvent === 'yes' || data.hasEvent === true ? `
          <div style="background-color: #f9f9f9; padding: 15px; border-left: 4px solid #F39C12; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #2C3E50;">Your Event Details:</h3>
            <ul style="list-style: none; padding: 0;">
              ${data.eventType ? `<li><strong>Event:</strong> ${escapeHtml(data.eventType)}</li>` : ''}
              ${data.eventDate ? `<li><strong>Date:</strong> ${escapeHtml(data.eventDate)}</li>` : ''}
              ${data.guestCount ? `<li><strong>Guests:</strong> ${escapeHtml(data.guestCount)}</li>` : ''}
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
}

/**
 * Send the internal lead notification + customer confirmation via Resend's
 * batch API. Mirrors the recipients/senders of the former chefnam-email-worker.
 */
export async function sendLeadEmails(
  data: LeadEmailData
): Promise<{ success: boolean; error?: string }> {
  const apiKey = serverEnv().RESEND_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const subject = data.isUpdate
    ? `📝 Updated Catering Inquiry from ${data.firstName} ${data.lastName}`
    : `🍽️ New Catering Inquiry from ${data.firstName} ${data.lastName}`;

  const batch: ResendEmail[] = [
    {
      // Internal notification
      from: 'forms@chefnamcatering.com',
      to: ['nam@chefnamcatering.com', 'dspjson@gmail.com'],
      subject,
      html: buildNotificationHtml(data),
    },
    {
      // Customer confirmation
      from: 'Chef Nam <nam@chefnamcatering.com>',
      to: data.email ?? '',
      bcc: ['nam@chefnamcatering.com'],
      subject: `Thank you for your catering inquiry${data.firstName ? ', ' + data.firstName : ''}!`,
      html: buildConfirmationHtml(data),
    },
  ];

  const response = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(batch),
  });

  if (!response.ok) {
    const detail = await response.text();
    return { success: false, error: `Resend ${response.status}: ${detail}` };
  }

  return { success: true };
}
