// Chef Nam — Google Ads conversion action IDs (per-account config).
// Kept local on purpose: the @peakscape/site-kit/analytics module is
// client-agnostic and does not hold conversion-action IDs — each consumer
// passes its own. (Previously these lived in the now-removed lib/google-ads.ts.)
// qualify_lead (quote sent) fires CONVERSION_ACTION_LEAD_QUALIFIED; convert
// (order) fires CONVERSION_ACTION_PURCHASE. working_lead (Customer Respond) is
// GA4-only. See the canonical funnel in the kit (STAGE_TO_LEAD_EVENT).
export const CONVERSION_ACTION_LEAD_QUALIFIED = '7350099303';
export const CONVERSION_ACTION_PURCHASE = '7350098097';
// Catering Lead (import/UPLOAD_CLICKS, created 2026-07-31, secondary/primaryForGoal=false).
// Server-side backup fired on EVERY form submit from submit-form.ts using the captured
// gclid — deterministic, independent of the browser Submit Form tag (which the June-20
// consent gate silently muzzled). Secondary so it records in all_conversions without
// double-counting the primary Submit Form tag. Promote to primary to retire the browser tag.
export const CONVERSION_ACTION_CATERING_LEAD = '7704770616';
// Retired 2026-06-21 (SH-014): the separate "Quote" Ads action is superseded —
// the quote now fires qualify_lead → CONVERSION_ACTION_LEAD_QUALIFIED. Kept for
// reference; can be archived in the Ads UI.
export const CONVERSION_ACTION_QUOTE = '7538155422';
