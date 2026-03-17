/**
 * Fetch custom field IDs from the Catering Leads Trello board.
 * Run: TRELLO_API_KEY=xxx TRELLO_API_TOKEN=xxx node scripts/get-trello-custom-fields.js
 *
 * The "Lead Received" field ID needs to be added as TRELLO_LEAD_RECEIVED_FIELD_ID
 * in the Cloudflare Pages environment variables.
 */

const BOARD_ID = '69894415201f9d44987bce85';

async function main() {
  const apiKey = process.env.TRELLO_API_KEY;
  const apiToken = process.env.TRELLO_API_TOKEN;

  if (!apiKey || !apiToken) {
    console.error('Set TRELLO_API_KEY and TRELLO_API_TOKEN environment variables');
    process.exit(1);
  }

  const response = await fetch(
    `https://api.trello.com/1/boards/${BOARD_ID}/customFields?key=${apiKey}&token=${apiToken}`,
    { headers: { Accept: 'application/json' } }
  );

  if (!response.ok) {
    console.error('Failed to fetch custom fields:', response.status, await response.text());
    process.exit(1);
  }

  const fields = await response.json();

  if (fields.length === 0) {
    console.log('No custom fields found on the board.');
    return;
  }

  console.log('Custom fields on Catering Leads board:\n');
  for (const field of fields) {
    console.log(`  Name: ${field.name}`);
    console.log(`  ID:   ${field.id}`);
    console.log(`  Type: ${field.type}`);
    console.log('');
  }

  console.log('Add the "Lead Received" field ID to Cloudflare Pages env vars as:');
  console.log('  TRELLO_LEAD_RECEIVED_FIELD_ID=<field ID from above>');
}

main().catch(console.error);
