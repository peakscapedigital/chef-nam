// Chef Nam — Google Ads conversion action IDs (per-account config).
// Kept local on purpose: the @peakscape/site-kit/analytics module is
// client-agnostic and does not hold conversion-action IDs — each consumer
// passes its own. (Previously these lived in the now-removed lib/google-ads.ts.)
export const CONVERSION_ACTION_LEAD_QUALIFIED = '7350099303';
export const CONVERSION_ACTION_QUOTE = '7538155422';
export const CONVERSION_ACTION_PURCHASE = '7350098097';
