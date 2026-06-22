// Chef Nam — Google Ads conversion action IDs (per-account config).
// Kept local on purpose: the @peakscape/site-kit/analytics module is
// client-agnostic and does not hold conversion-action IDs — each consumer
// passes its own. (Previously these lived in the now-removed lib/google-ads.ts.)
// qualify_lead (quote sent) fires CONVERSION_ACTION_LEAD_QUALIFIED; convert
// (order) fires CONVERSION_ACTION_PURCHASE. working_lead (Customer Respond) is
// GA4-only. See the canonical funnel in the kit (STAGE_TO_LEAD_EVENT).
export const CONVERSION_ACTION_LEAD_QUALIFIED = '7350099303';
export const CONVERSION_ACTION_PURCHASE = '7350098097';
// Retired 2026-06-21 (SH-014): the separate "Quote" Ads action is superseded —
// the quote now fires qualify_lead → CONVERSION_ACTION_LEAD_QUALIFIED. Kept for
// reference; can be archived in the Ads UI.
export const CONVERSION_ACTION_QUOTE = '7538155422';
