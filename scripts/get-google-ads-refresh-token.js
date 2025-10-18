/**
 * Script to generate Google Ads API OAuth Refresh Token
 *
 * Run once to get your refresh token, then add to Cloudflare secrets
 */

const readline = require('readline');
const { google } = require('googleapis');

// IMPORTANT: Replace these with your values from google-ads-credentials.json
const CLIENT_ID = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
const CLIENT_SECRET = 'YOUR_CLIENT_SECRET';

// Google Ads API scope
const SCOPES = ['https://www.googleapis.com/auth/adwords'];

// Create OAuth2 client
const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob' // For desktop apps
);

// Generate auth URL
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: SCOPES,
  prompt: 'consent' // Force to get refresh token
});

console.log('\n===========================================');
console.log('Google Ads API - Get Refresh Token');
console.log('===========================================\n');

console.log('STEP 1: Open this URL in your browser:\n');
console.log(authUrl);
console.log('\n');

console.log('STEP 2: Authorize the application');
console.log('STEP 3: Copy the authorization code\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('Paste the authorization code here: ', async (code) => {
  try {
    // Exchange code for tokens
    const { tokens } = await oauth2Client.getToken(code);

    console.log('\n✅ Success! Here are your tokens:\n');
    console.log('===========================================');
    console.log('REFRESH TOKEN (save this):');
    console.log(tokens.refresh_token);
    console.log('===========================================\n');

    console.log('Add this to Cloudflare Pages:');
    console.log(`npx wrangler pages secret put GOOGLE_ADS_REFRESH_TOKEN`);
    console.log(`# Then paste: ${tokens.refresh_token}\n`);

    console.log('✅ You can now delete this script for security.');

  } catch (error) {
    console.error('\n❌ Error getting tokens:', error.message);
  }

  rl.close();
});
