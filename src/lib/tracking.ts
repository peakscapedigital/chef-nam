/**
 * Per-site tracking adapter — maps Chef Nam's call sites onto the shared kit
 * standard (@peakscape/site-kit/tracking). The kit owns the dataLayer contract
 * (event names, snake_case keys, attribution + page_location auto-attached on
 * every event). This file only adapts Chef Nam's call sites; it adds no dataLayer
 * logic of its own. Mirrors Sugar House's lib/tracking.ts (the reference adapter).
 *
 * Scope note (2026-08-14): Enhanced-Conversions PII is now nested `user_data` on
 * BOTH lead paths. The 2026-06-20 pass deliberately left thank-you sending FLAT
 * email/phone fields so live EC kept resolving; that flat shape was the last
 * kit-named event bypassing its typed helper. It is gone. `user_data` is built by
 * the local `userData()` adapter below, never restated at a call site. Contract:
 * peakscape-site-kit/src/tracking/CONTRACT.md
 */

import {
  trackEvent,
  trackPhoneClick as kitPhoneClick,
  trackGenerateLead as kitGenerateLead,
  trackThankYouLoaded as kitThankYou,
  type UserData,
} from '@peakscape/site-kit/tracking';

/**
 * Build kit Enhanced-Conversions UserData from Chef Nam's flat PII, or undefined
 * if the page had none — so EC is never sent a hollow object. Mirrors Sugar
 * House's builder (lib/tracking.ts) minus `zip`, which Chef Nam does not collect.
 */
function userData(
  email?: string,
  phone?: string,
  firstName?: string,
  lastName?: string,
): UserData | undefined {
  if (!email && !phone && !firstName && !lastName) return undefined;
  const ud: UserData = {};
  if (email) ud.email_address = email;
  if (phone) ud.phone_number = phone;
  if (firstName || lastName) {
    ud.address = {};
    if (firstName) ud.address.first_name = firstName;
    if (lastName) ud.address.last_name = lastName;
  }
  return ud;
}

/**
 * GA4 phone_click — the kit's typed helper owns the payload shape.
 *
 * Was a raw `trackEvent('phone_click', …)` that restated the shape locally. That
 * met the migration bar (no hand-rolled dataLayer.push) and still made phone_click
 * mean something different here than on the sites using the helper. `event_label`
 * and `event_category` are dropped: they are Universal Analytics dimensions, GA4
 * has no such concept, and the live Phone Click tag reads only phone_number and
 * link_location (verified against the container 2026-08-12).
 *
 * `event_label` stays in this signature so call sites keep type-checking; it is
 * accepted and intentionally not forwarded. Remove it from the call sites, then
 * from here.
 */
export function trackPhoneClick(params: {
  phone_number: string;
  link_text?: string;
  link_location?: string;
  /** @deprecated UA relic, not forwarded. Drop from call sites. */
  event_label?: string;
}) {
  kitPhoneClick({
    phone_number: params.phone_number,
    link_text: params.link_text,
    link_location: params.link_location,
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
  /** @deprecated UA relic, not forwarded. Drop from call sites. */
  event_label?: string;
  user_data?: Record<string, unknown>;
}) {
  kitGenerateLead({
    form_name: params.form_name,
    form_type: params.form_type,
    form_destination: params.form_destination,
    ...(params.user_data ? { user_data: params.user_data as never } : {}),
  });
}

/**
 * thank_you_loaded — the kit's typed helper owns the payload shape. This event is
 * load-bearing for Ads: trigger 47 fires BOTH the conversion tag (29, awct) and
 * the Enhanced-Conversions tag (35, awud). The caller still decides whether to
 * skip for test submissions.
 *
 * Was a raw `trackEvent('thank_you_loaded', …)` pushing PII FLAT (`email`,
 * `phone_number`, `first_name`, `last_name`) while the kit helper takes it nested
 * under `user_data`. The call-site signature stays flat so thank-you.astro is
 * unchanged; the flat -> nested map happens here, in the adapter.
 *
 * `form_destination: '/thank-you'` is dropped, not carried into the kit. Verified
 * against the live container 2026-08-14: `{{dlv - form_destination}}` has exactly
 * one reader, tag 11 `Form Submit - GA4`, and tag 11 fires on trigger 51
 * (`CE - generate_lead`), never on 47. Nothing on 47 reads it — tag 29 reads no
 * dataLayer variable at all and tag 35 reads only `{{EC - User Provided Data}}`.
 * So the kit did NOT need widening here; `trackGenerateLead` already carries the
 * field for the tag that actually reads it.
 */
export function trackThankYouLoaded(params: {
  form_type: string;
  form_name?: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
}) {
  kitThankYou({
    form_type: params.form_type,
    form_name: params.form_name,
    user_data: userData(params.email, params.phone, params.firstName, params.lastName),
  });
}
