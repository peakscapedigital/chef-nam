/**
 * Solicitation / marketing-spam detection shared by the live form
 * (submit-form.ts) and the BigQuery→Airtable backfill (scripts/backfill-airtable.ts),
 * so the patterns can't drift between intake and cleanup.
 *
 * These submissions pass the honeypot + mixed-case checks (real-looking names),
 * so they need content/sender matching. Known signatures as of 2026-06-15:
 *   - cachehelper.com sender domain (repeat "Ashley Brown" spam)
 *   - *webdigital* in the email local-part (Jacob/Juliet "webdigital@gmail.com")
 *   - templated openers: "Re: SEO Report", "Re: Drop Traffic",
 *     "I visited/checked/came across your website/site"
 *
 * Patterns are intentionally tight (specific domains + templated phrases) to
 * avoid false-positives on genuine catering inquiries. Add new signatures here
 * only — both call sites pick them up automatically.
 */
export function isSolicitationSpam(email?: string | null, text?: string | null): boolean {
  const e = (email || '').toLowerCase();
  if (e.endsWith('@cachehelper.com') || e.includes('webdigital')) return true;
  const t = (text || '').toLowerCase();
  return /re:\s*(seo report|drop traffic)|i (visited|checked|came across) your (website|site)/.test(t);
}
