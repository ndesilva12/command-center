const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

async function main() {
  console.log('=== FINAL QUALITY CHECK ===\n');

  // 1. Verify Net Adj Rtg updates on Portal Big Board
  console.log('1. Portal Big Board - Net Adj Rtg updates:');
  const portalResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Portal Big Board!A1:AJ10'
  });
  const portalRows = portalResp.data.values || [];
  const header = portalRows[0];
  const netAdjIdx = header.indexOf('Net Adj.Rtg');
  const playerIdx = header.indexOf('Player');
  console.log('  Net Adj Rtg column index:', netAdjIdx, '(expected 25)');
  
  // Find updated players
  const targetPlayers = ['AJ Dybantsa', 'Cameron Boozer', 'Caleb Wilson', 'Yaxel Lendeborg', 'Milos Uzan', 'Walter Clayton Jr.'];
  // Need to read more rows
  const fullPortal = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Portal Big Board!A1:AJ160'
  });
  const fullRows = fullPortal.data.values || [];
  targetPlayers.forEach(name => {
    const row = fullRows.find(r => r[playerIdx] === name);
    if (row) {
      const netAdj = row[netAdjIdx];
      const old = { 'AJ Dybantsa': 'est. +5.6', 'Cameron Boozer': 'est. +4.9', 'Caleb Wilson': 'est. +4.1', 'Yaxel Lendeborg': 'est. +6.1', 'Milos Uzan': 'est. +6.2', 'Walter Clayton Jr.': 'est. +5.8' };
      const expected = { 'AJ Dybantsa': '+4', 'Cameron Boozer': '+5.7', 'Caleb Wilson': '+4.7', 'Yaxel Lendeborg': '+5', 'Milos Uzan': '+4.4', 'Walter Clayton Jr.': '+0.5' };
      const ok = netAdj === expected[name];
      console.log(`  ${ok ? '✓' : '✗'} ${name}: ${netAdj} (expected ${expected[name]}, was ${old[name]})`);
    } else {
      console.log(`  ? ${name}: NOT FOUND in board`);
    }
  });

  // 2. Verify Conference Breakdown
  console.log('\n2. Conference Breakdown - New columns:');
  const cbResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Conference Breakdown!A1:N5'
  });
  const cbRows = cbResp.data.values || [];
  console.log('  Header:', JSON.stringify(cbRows[0]));
  console.log('  Sample row (Big 12):', JSON.stringify(cbRows.find(r => r[0] === 'Big 12') || cbRows[1]));

  // 3. Verify HS Recruiting Tab
  console.log('\n3. HS Recruiting Tab - Updated structure:');
  const hsResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'HS Recruiting (Top 50)!A1:O5'
  });
  const hsRows = hsResp.data.values || [];
  console.log('  Header:', JSON.stringify(hsRows[0]));
  console.log('  Row 2 (first player):', JSON.stringify(hsRows[1]));
  
  // Count total HS rows
  const hsAll = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'HS Recruiting (Top 50)!A1:O50'
  });
  console.log('  Total rows in HS tab:', (hsAll.data.values || []).length);
  
  // Check for IN DB entries
  const hsAllRows = hsAll.data.values || [];
  const inDBRows = hsAllRows.filter(r => (r[14]||'').includes('IN DB'));
  console.log('  IN DB rows:', inDBRows.length);
  inDBRows.forEach(r => console.log(`    - ${r[1]} (${r[8]})`));

  console.log('\n=== QC COMPLETE ===');
}

main().catch(err => { console.error('Error:', err.message); if (err.response) console.error(JSON.stringify(err.response.data)); });
