// Convert the build-time .env into a JSON map for `wrangler secret bulk`.
// JSON format preserves complex values — e.g. the GCP service-account JSON
// in BIGQUERY_CREDENTIALS / FIREBASE_CREDENTIALS, whose escaped newlines the
// .env parser mangles (breaking JSON.parse at runtime). Values are taken
// verbatim (everything after the first '='); no escape interpretation.
import { readFileSync, writeFileSync } from 'node:fs';
const out = {};
for (const line of readFileSync('.env', 'utf8').split('\n')) {
  const t = line.trimStart();
  if (!t || t.startsWith('#') || !line.includes('=')) continue;
  const i = line.indexOf('=');
  out[line.slice(0, i).trim()] = line.slice(i + 1);
}
writeFileSync('secrets.json', JSON.stringify(out));
console.log(`secrets-to-json: ${Object.keys(out).length} keys`);
