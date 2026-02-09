/**
 * One-time setup script for Trello webhook integration.
 *
 * Creates:
 * 1. "Lead ID" custom field (text) on the Catering Leads board
 * 2. "Booking Value" custom field (number) on the Catering Leads board
 * 3. Registers webhook pointing at the production endpoint
 *
 * Run: node scripts/setup-trello.js
 *
 * Requires env vars: TRELLO_API_KEY, TRELLO_API_TOKEN
 */

const BOARD_ID = '69894415201f9d44987bce9f'; // Catering Leads board
const WEBHOOK_CALLBACK_URL = 'https://chefnamcatering.com/api/webhooks/trello';

async function main() {
  const apiKey = process.env.TRELLO_API_KEY;
  const apiToken = process.env.TRELLO_API_TOKEN;

  if (!apiKey || !apiToken) {
    console.error('Set TRELLO_API_KEY and TRELLO_API_TOKEN environment variables');
    process.exit(1);
  }

  const auth = `key=${apiKey}&token=${apiToken}`;

  // 1. Create "Lead ID" custom field (text)
  console.log('Creating "Lead ID" custom field...');
  const leadIdRes = await fetch(
    `https://api.trello.com/1/customFields?${auth}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        idModel: BOARD_ID,
        modelType: 'board',
        name: 'Lead ID',
        type: 'text',
        pos: 'top',
        display_cardFront: false,
      }),
    }
  );

  if (!leadIdRes.ok) {
    const err = await leadIdRes.text();
    console.error('Failed to create Lead ID field:', leadIdRes.status, err);
  } else {
    const leadIdField = await leadIdRes.json();
    console.log(`✅ Lead ID field created: ${leadIdField.id}`);
    console.log(`   → Set CUSTOM_FIELD_LEAD_ID = '${leadIdField.id}' in src/lib/trello.ts`);
  }

  // 2. Create "Booking Value" custom field (number)
  console.log('\nCreating "Booking Value" custom field...');
  const bvRes = await fetch(
    `https://api.trello.com/1/customFields?${auth}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        idModel: BOARD_ID,
        modelType: 'board',
        name: 'Booking Value',
        type: 'number',
        pos: 'bottom',
        display_cardFront: true,
      }),
    }
  );

  if (!bvRes.ok) {
    const err = await bvRes.text();
    console.error('Failed to create Booking Value field:', bvRes.status, err);
  } else {
    const bvField = await bvRes.json();
    console.log(`✅ Booking Value field created: ${bvField.id}`);
    console.log(`   → Set CUSTOM_FIELD_BOOKING_VALUE = '${bvField.id}' in src/lib/trello.ts`);
  }

  // 3. Register webhook
  console.log('\nRegistering Trello webhook...');
  const whRes = await fetch(
    `https://api.trello.com/1/webhooks?${auth}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        callbackURL: WEBHOOK_CALLBACK_URL,
        idModel: BOARD_ID,
        description: 'Catering Leads CRM sync',
        active: true,
      }),
    }
  );

  if (!whRes.ok) {
    const err = await whRes.text();
    console.error('Failed to register webhook:', whRes.status, err);
    console.error('Make sure the HEAD endpoint is deployed and returns 200 first.');
  } else {
    const webhook = await whRes.json();
    console.log(`✅ Webhook registered: ${webhook.id}`);
    console.log(`   Callback: ${WEBHOOK_CALLBACK_URL}`);
    console.log(`   Model: ${BOARD_ID}`);
  }

  console.log('\n--- Summary ---');
  console.log('After getting the field IDs above, update src/lib/trello.ts:');
  console.log("  export const CUSTOM_FIELD_LEAD_ID = '<lead-id-field-id>';");
  console.log("  export const CUSTOM_FIELD_BOOKING_VALUE = '<booking-value-field-id>';");
  console.log('\nThen redeploy and run the backfill to set Lead ID on existing cards.');
}

main().catch(console.error);
