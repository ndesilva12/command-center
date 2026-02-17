/**
 * Fix non-numeric Cinderella scores (emoji/text) in D1 Scouting View
 * Replace with calculated numeric values
 */

const {google} = require('./node_modules/googleapis');
const fs = require('fs');

const token = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
auth.setCredentials(token);
const sheets = google.sheets({version: 'v4', auth});
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

function calcCinderellaScore(headers, row) {
  const get = (col) => {
    const idx = headers.indexOf(col);
    return idx >= 0 ? (row[idx] || '') : '';
  };
  const getNum = (col, def=0) => parseFloat(get(col)) || def;
  
  const confTier = get('Conf Tier') || '';
  const pos = get('Position') || '';
  const classYear = get('Year') || '';
  const height = getNum('Ht(in)', 72);
  const ppg = getNum('PPG');
  const rpg = getNum('RPG');
  const apg = getNum('APG');
  const stl = getNum('STL');
  const efgPct = getNum('eFG%');
  const ftPct = getNum('FT%');
  const astTo = getNum('AST:TO');
  const scoutScore = getNum('Scout Score', 55);
  
  const teamRecord = get('Team Record');
  let winPct = 0.5;
  if (teamRecord && teamRecord.includes('-')) {
    const parts = teamRecord.split('-');
    const w = parseInt(parts[0]) || 0;
    const l = parseInt(parts[1]) || 0;
    const total = w + l;
    winPct = total > 0 ? w / total : 0.5;
  }
  
  let score = 50;
  
  // Production
  let ppgScore = 0;
  if (confTier === 'P6') {
    ppgScore = ppg >= 20 ? 25 : ppg >= 16 ? 20 : ppg >= 12 ? 15 : 10;
  } else if (confTier === 'High-Major') {
    ppgScore = ppg >= 18 ? 28 : ppg >= 14 ? 22 : ppg >= 10 ? 16 : 10;
  } else if (confTier === 'Mid-Major') {
    ppgScore = ppg >= 16 ? 30 : ppg >= 13 ? 25 : ppg >= 10 ? 18 : 10;
  } else {
    ppgScore = ppg >= 20 ? 20 : ppg >= 15 ? 15 : ppg >= 10 ? 10 : 5;
  }
  score += ppgScore;
  
  // Efficiency
  let effScore = 0;
  if (efgPct >= 60) effScore += 8;
  else if (efgPct >= 55) effScore += 6;
  else if (efgPct >= 50) effScore += 4;
  else if (efgPct >= 45) effScore += 2;
  if (ftPct >= 80) effScore += 4;
  else if (ftPct >= 75) effScore += 2;
  if (astTo >= 2.5) effScore += 3;
  else if (astTo >= 1.5) effScore += 1;
  score += effScore;
  
  // Versatility
  let versScore = 0;
  if (rpg >= 8) versScore += 4;
  else if (rpg >= 5) versScore += 2;
  if (apg >= 5) versScore += 4;
  else if (apg >= 3) versScore += 2;
  if (stl >= 1.5) versScore += 2;
  score += versScore;
  
  // Portal Accessibility
  let portalScore = 0;
  if (winPct < 0.40) portalScore += 15;
  else if (winPct < 0.50) portalScore += 10;
  else if (winPct < 0.60) portalScore += 5;
  if (classYear === 'Sophomore' || classYear === 'Junior') portalScore += 5;
  else if (classYear === 'Freshman') portalScore += 3;
  score += portalScore;
  
  // Conference Tier Modifier
  if (confTier === 'P6' && winPct >= 0.60) score -= 15;
  else if (confTier === 'P6' && winPct < 0.50) score -= 5;
  else if (confTier === 'High-Major') score += 5;
  else if (confTier === 'Mid-Major') score += 10;
  else if (confTier === 'Low-Major') score += 5;
  
  // Size Premium
  if (pos === 'G' && height >= 76) score += 5;
  else if (pos === 'F' && height >= 80) score += 3;
  
  // Scout Score
  score += (scoutScore - 60) * 0.3;
  
  return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
}

async function run() {
  console.log('Reading D1 Scouting View...');
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'D1 Scouting View!A1:AN2932'
  });
  const rows = r.data.values || [];
  const headers = rows[0];
  const cinIdx = headers.indexOf('Cinderella');
  
  // Find rows with non-numeric Cinderella scores
  const fixNeeded = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const cin = row[cinIdx] || '';
    
    if (cin && isNaN(parseFloat(cin))) {
      // Non-numeric score - needs fixing
      const calcScore = calcCinderellaScore(headers, row);
      fixNeeded.push({
        rowIdx: i + 1,
        player: row[0],
        team: row[1],
        oldScore: cin,
        newScore: calcScore
      });
    }
  }
  
  console.log(`Found ${fixNeeded.length} rows with non-numeric Cinderella scores`);
  fixNeeded.slice(0, 10).forEach(f => {
    console.log(`  Row ${f.rowIdx}: ${f.player} (${f.team}): '${f.oldScore}' → ${f.newScore}`);
  });
  
  if (fixNeeded.length === 0) {
    console.log('No emoji/text scores found!');
    return;
  }
  
  // Apply fixes in batch
  const batchData = fixNeeded.map(f => ({
    range: `D1 Scouting View!M${f.rowIdx}`,
    values: [[f.newScore]]
  }));
  
  // Process in chunks of 500
  const CHUNK_SIZE = 500;
  for (let i = 0; i < batchData.length; i += CHUNK_SIZE) {
    const chunk = batchData.slice(i, i + CHUNK_SIZE);
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: chunk
      }
    });
    console.log(`Fixed batch ${Math.floor(i/CHUNK_SIZE)+1}: ${chunk.length} rows`);
  }
  
  console.log(`\n✓ Fixed ${fixNeeded.length} emoji/text Cinderella scores`);
  
  // Now update Portal Big Board Cin. Score for the players that had 0 (emoji problem)
  // Rebuild the lookup and update Portal Big Board
  const cinLookup = {};
  rows.slice(1).forEach(row => {
    const name = (row[0] || '').toLowerCase().trim();
    if (name) {
      cinLookup[name] = parseFloat(row[cinIdx]) || 0;
    }
  });
  
  // Also update fixed scores in lookup
  fixNeeded.forEach(f => {
    cinLookup[(f.player || '').toLowerCase().trim()] = f.newScore;
  });
  
  // Update Portal Big Board - fix rows with Cin 0
  const pb = await sheets.spreadsheets.values.get({spreadsheetId: SHEET_ID, range: 'Portal Big Board!A1:Z130'});
  const pbRows = pb.data.values || [];
  
  const pbUpdates = [];
  for (let i = 1; i < pbRows.length; i++) {
    const row = pbRows[i];
    const playerName = (row[1] || '').toLowerCase().trim();
    const tier = row[0] || '';
    const existingCin = parseFloat(row[24]) || 0;
    
    if (!playerName || tier.includes('TARGETS') || tier.includes('WATCHLIST') || tier.includes('HOOPSHQ')) continue;
    
    if (existingCin === 0) {
      // Try to find in lookup
      let cinScore = cinLookup[playerName];
      
      if (!cinScore) {
        // Partial match
        const nameParts = playerName.split(' ');
        const lastName = nameParts[nameParts.length - 1];
        const match = Object.keys(cinLookup).find(k => k.includes(lastName) && k.charAt(0) === playerName.charAt(0));
        if (match) cinScore = cinLookup[match];
      }
      
      if (cinScore && cinScore > 0) {
        pbUpdates.push({ rowIdx: i + 1, cin: cinScore.toFixed(1) });
      }
    }
  }
  
  if (pbUpdates.length > 0) {
    console.log(`\nUpdating ${pbUpdates.length} Portal Big Board Cin. scores that were 0...`);
    const pbBatch = pbUpdates.map(u => ({
      range: `Portal Big Board!Y${u.rowIdx}`,
      values: [[u.cin]]
    }));
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { valueInputOption: 'RAW', data: pbBatch }
    });
    pbUpdates.forEach(u => {
      const row = pbRows[u.rowIdx - 1];
      console.log(`  Updated: ${row[1]} → Cin: ${u.cin}`);
    });
  }
  
  console.log('\n✓ All fixes complete');
}

run().catch(e => {
  console.error('ERROR:', e.message);
  console.error(e.stack);
});
