/**
 * One-time setup script for Trello webhook integration.
 *
 * - Registers webhook pointing at the production endpoint
 * - Backfills existing cards with lead_id tag in description
 *
 * Run: TRELLO_API_KEY=xxx TRELLO_API_TOKEN=xxx node scripts/setup-trello.js
 *
 * Lead ID is stored as a custom text field on each card.
 */

const BOARD_ID = '69894415201f9d44987bce85'; // Catering Leads board
const WEBHOOK_CALLBACK_URL = 'https://chefnamcatering.com/api/webhooks/trello';

async function main() {
  const apiKey = process.env.TRELLO_API_KEY;
  const apiToken = process.env.TRELLO_API_TOKEN;

  if (!apiKey || !apiToken) {
    console.error('Set TRELLO_API_KEY and TRELLO_API_TOKEN environment variables');
    process.exit(1);
  }

  const auth = `key=${apiKey}&token=${apiToken}`;

  // 1. Register webhook
  console.log('Registering Trello webhook...');
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
  } else {
    const webhook = await whRes.json();
    console.log(`✅ Webhook registered: ${webhook.id}`);
    console.log(`   Callback: ${WEBHOOK_CALLBACK_URL}`);
  }

  // 2. List existing cards on the board to help with backfill
  console.log('\nFetching existing cards for backfill...');
  const cardsRes = await fetch(
    `https://api.trello.com/1/boards/${BOARD_ID}/cards?${auth}&fields=id,name,desc,idList`,
    { headers: { Accept: 'application/json' } }
  );

  if (!cardsRes.ok) {
    console.error('Failed to fetch cards:', cardsRes.status);
    return;
  }

  const cards = await cardsRes.json();
  console.log(`Found ${cards.length} cards on the board:\n`);

  for (const card of cards) {
    const hasLeadId = card.desc?.includes('<!-- lead_id:');
    console.log(`  ${card.name}`);
    console.log(`    Card ID: ${card.id}`);
    console.log(`    Has Lead ID: ${hasLeadId ? 'YES' : 'NO - needs backfill'}`);
    console.log('');
  }

  console.log('To backfill a card, run:');
  console.log('  node scripts/backfill-trello-cards.js');
}

main().catch(console.error);
