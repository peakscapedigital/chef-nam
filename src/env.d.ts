/// <reference types="astro/client" />

// Astro 6 / @astrojs/cloudflare v13 removed `Astro.locals.runtime.env`.
// Cloudflare bindings + secrets are now read from the `cloudflare:workers`
// virtual module, which workerd provides at runtime. This project reads
// string env vars / secrets (Google Sheets, Trello, Brevo, Resend), so `env`
// is typed as a string record.
declare module 'cloudflare:workers' {
  export const env: Record<string, string | undefined>;
}
