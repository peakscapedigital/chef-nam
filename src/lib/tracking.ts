/**
 * Per-site tracking adapter — maps Chef Nam's call sites onto the shared kit
 * standard (@peakscape/site-kit/tracking). The kit owns the dataLayer contract
 * (event names, snake_case keys, attribution + page_location auto-attached on
 * every event). This file only adapts Chef Nam's call sites; it adds no dataLayer
 * logic of its own. Mirrors Sugar House's lib/tracking.ts (the reference adapter).
 *
 * Scope note (2026-06-20): this pass routes every event through the kit and drops
 * the hand-rolled `dataLayer.push` + manual attribution spreads. It deliberately
 * PRESERVES each form's current Enhanced-Conversions field shape (contact sends
 * nested `user_data`; thank-you sends flat email/phone fields) so live EC is
 * unchanged. Normalizing EC to the kit's nested `user_data` everywhere is a
 * separate cross-client step (shared with SH). Contract:
 * peakscape-site-kit/src/tracking/CONTRACT.md
 */

import { trackEvent } from '@peakscape/site-kit/tracking';

/** GA4 phone_click. Attribution + page_location auto-attached by the kit. */
export function trackPhoneClick(params: {
  phone_number: string;
  link_text?: string;
  link_location?: string;
  event_label?: string;
}) {
  trackEvent('phone_click', {
    phone_number: params.phone_number,
    link_text: params.link_text,
    link_location: params.link_location,
    event_category: 'engagement',
    event_label: params.event_label,
  });
}

/** Venue-partner referral click. */
export function trackVenueReferral(params: {
  venue_name: string | null;
  venue_url: string | null;
  referral_source: string;
}) {
  trackEvent('venue_referral', {
    venue_name: params.venue_name,
    venue_url: params.venue_url,
    referral_source: params.referral_source,
    event_category: 'partnership',
    event_label: 'Venue Referral - ' + (params.venue_name ?? ''),
  });
}

/** Multistep form engagement start (fires once when the user begins). */
export function trackFormStart(params: { form_name: string; form_destination?: string }) {
  trackEvent('form_start', {
    form_name: params.form_name,
    form_destination: params.form_destination,
  });
}

/**
 * GA4 generate_lead. The kit auto-attaches attribution + page_location, so call
 * sites no longer spread UTM/gclid by hand. `userData` is passed only by the forms
 * that already send it (contact), preserving their current EC shape.
 */
export function trackGenerateLead(params: {
  form_name: string;
  form_type: string;
  form_destination?: string;
  event_label?: string;
  user_data?: Record<string, unknown>;
}) {
  trackEvent('generate_lead', {
    form_name: params.form_name,
    form_type: params.form_type,
    form_destination: params.form_destination,
    event_category: 'engagement',
    event_label: params.event_label,
    ...(params.user_data ? { user_data: params.user_data } : {}),
  });
}

/**
 * thank_you_loaded — lead conversion + Enhanced-Conversions data on the thank-you
 * page. PRESERVES the current FLAT EC fields so the live GTM EC variable keeps
 * resolving. The caller still decides whether to skip for test submissions.
 */
export function trackThankYouLoaded(params: {
  form_type: string;
  form_name?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}) {
  trackEvent('thank_you_loaded', {
    form_type: params.form_type,
    form_name: params.form_name,
    form_destination: '/thank-you',
    email: params.email,
    phone_number: params.phone,
    first_name: params.firstName,
    last_name: params.lastName,
  });
}
