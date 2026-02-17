/**
 * Add "D1 Cin. Score" column (Y) to Portal Big Board
 * Cross-reference each player's Cinderella Score from D1 Scouting View
 */

const {google} = require('./node_modules/googleapis');
const fs = require('fs');

const token = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
auth.setCredentials(token);
const sheets = google.sheets({version: 'v4', auth});
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

async function run() {
  // Read D1 Scouting View - build name -> Cinderella score lookup
  console.log('Building D1 Scouting View lookup...');
  const d1Resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'D1 Scouting View!A1:AN2932'
  });
  const d1Rows = d1Resp.data.values || [];
  const d1Headers = d1Rows[0];
  const cinIdx = d1Headers.indexOf('Cinderella');
  const ppgIdx = d1Headers.indexOf('PPG');
  const scoutIdx = d1Headers.indexOf('Scout Score');
  
  // Build lookup: player name (lowercase) -> { cinderella, scoutScore }
  const cinLookup = {};
  d1Rows.slice(1).forEach(row => {
    const name = (row[0] || '').toLowerCase().trim();
    if (name && row[cinIdx]) {
      cinLookup[name] = {
        cinderella: parseFloat(row[cinIdx]) || 0,
        scoutScore: parseFloat(row[scoutIdx]) || 0
      };
    }
  });
  
  console.log('D1 lookup built:', Object.keys(cinLookup).length, 'players');
  
  // Read Portal Big Board
  const pbResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:X130'
  });
  const pbRows = pbResp.data.values || [];
  console.log('Portal Big Board rows:', pbRows.length);
  
  // Add "Cinderella Score" header at Y1
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!Y1',
    valueInputOption: 'RAW',
    requestBody: { values: [['Cin. Score']] }
  });
  
  // Fill in Cinderella scores for each player
  const cinValues = [];
  for (let i = 1; i < pbRows.length; i++) {
    const row = pbRows[i];
    const playerName = (row[1] || '').toLowerCase().trim();
    const tier = row[0] || '';
    
    if (!playerName || tier.includes('NEW TARGETS') || tier.includes('WATCHLIST')) {
      cinValues.push(['']);
      continue;
    }
    
    // Try exact match first
    let cinData = cinLookup[playerName];
    
    // Try partial match if not found
    if (!cinData) {
      const partialMatch = Object.keys(cinLookup).find(k => k.includes(playerName.split(' ')[0]) && k.includes(playerName.split(' ').pop()));
      if (partialMatch) cinData = cinLookup[partialMatch];
    }
    
    if (cinData) {
      cinValues.push([cinData.cinderella.toFixed(1)]);
    } else {
      cinValues.push(['']);
    }
  }
  
  // Update all Cinderella scores at once
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Portal Big Board!Y2:Y${pbRows.length}`,
    valueInputOption: 'RAW',
    requestBody: { values: cinValues }
  });
  
  // Report results
  const found = cinValues.filter(v => v[0] !== '').length;
  console.log(`\n✓ Added Cinderella scores for ${found}/${cinValues.length} Portal Big Board players`);
  
  // Show top players by Cinderella score
  const ranked = pbRows.slice(1)
    .map((row, i) => ({
      tier: row[0],
      name: row[1],
      grade: row[15],
      cinScore: cinValues[i][0],
      record: row[21]
    }))
    .filter(p => p.cinScore && p.name && !p.tier.includes('TARGETS') && !p.tier.includes('WATCHLIST'))
    .sort((a, b) => parseFloat(b.cinScore) - parseFloat(a.cinScore));
  
  console.log('\nTop 15 Portal Big Board players by Cinderella Score:');
  ranked.slice(0, 15).forEach((p, i) => {
    console.log(`  ${i+1}. ${p.cinScore} | ${p.name} (${p.tier}) | Grade: ${p.grade} | Record: ${p.record}`);
  });
}

run().catch(e => {
  console.error('ERROR:', e.message);
});
