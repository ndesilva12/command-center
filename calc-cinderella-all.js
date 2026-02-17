/**
 * Calculate Cinderella Scores for ALL remaining D1 Scouting View players
 * Rows 201-2932 currently have no Cinderella score
 */

const {google} = require('./node_modules/googleapis');
const fs = require('fs');

const token = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
auth.setCredentials(token);
const sheets = google.sheets({version: 'v4', auth});
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

// Cinderella Score Formula (from cinderella_score.js)
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
  
  // Parse team record
  const teamRecord = get('Team Record');
  let winPct = 0.5;
  if (teamRecord && teamRecord.includes('-')) {
    const parts = teamRecord.split('-');
    const w = parseInt(parts[0]) || 0;
    const l = parseInt(parts[1]) || 0;
    const total = w + l;
    winPct = total > 0 ? w / total : 0.5;
  }
  
  let score = 50; // Base
  
  // 1. PRODUCTION (0-30 pts)
  let ppgScore = 0;
  if (confTier === 'P6') {
    ppgScore = ppg >= 20 ? 25 : ppg >= 16 ? 20 : ppg >= 12 ? 15 : 10;
  } else if (confTier === 'High-Major') {
    ppgScore = ppg >= 18 ? 28 : ppg >= 14 ? 22 : ppg >= 10 ? 16 : 10;
  } else if (confTier === 'Mid-Major') {
    ppgScore = ppg >= 16 ? 30 : ppg >= 13 ? 25 : ppg >= 10 ? 18 : 10;
  } else { // Low-Major or other
    ppgScore = ppg >= 20 ? 20 : ppg >= 15 ? 15 : ppg >= 10 ? 10 : 5;
  }
  score += ppgScore;
  
  // 2. EFFICIENCY (0-15 pts)
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
  
  // 3. VERSATILITY (0-10 pts)
  let versScore = 0;
  if (rpg >= 8) versScore += 4;
  else if (rpg >= 5) versScore += 2;
  if (apg >= 5) versScore += 4;
  else if (apg >= 3) versScore += 2;
  if (stl >= 1.5) versScore += 2;
  score += versScore;
  
  // 4. PORTAL ACCESSIBILITY (0-20 pts)
  let portalScore = 0;
  if (winPct < 0.40) portalScore += 15;
  else if (winPct < 0.50) portalScore += 10;
  else if (winPct < 0.60) portalScore += 5;
  if (classYear === 'Sophomore' || classYear === 'Junior') portalScore += 5;
  else if (classYear === 'Freshman') portalScore += 3;
  score += portalScore;
  
  // 5. CONFERENCE TIER MODIFIER
  if (confTier === 'P6' && winPct >= 0.60) score -= 15;
  else if (confTier === 'P6' && winPct < 0.50) score -= 5;
  else if (confTier === 'High-Major') score += 5;
  else if (confTier === 'Mid-Major') score += 10;
  else if (confTier === 'Low-Major') score += 5;
  
  // 6. SIZE PREMIUM
  if (pos === 'G' && height >= 76) score += 5;
  else if (pos === 'F' && height >= 80) score += 3;
  
  // 7. SCOUT SCORE INTEGRATION
  score += (scoutScore - 60) * 0.3;
  
  return Math.min(100, Math.max(0, Math.round(score * 100) / 100));
}

async function run() {
  console.log('Reading D1 Scouting View...');
  
  // Read ALL D1 Scouting View rows  
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'D1 Scouting View!A1:AN2932'
  });
  const rows = r.data.values || [];
  const headers = rows[0];
  const cinIdx = headers.indexOf('Cinderella');
  
  console.log(`Total rows: ${rows.length}, Cinderella col: ${cinIdx}`);
  
  // Find rows that need scores (missing Cinderella)
  const updates = [];
  let skipped = 0;
  let calculated = 0;
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const existingCin = row[cinIdx];
    
    if (existingCin && existingCin !== '') {
      skipped++;
      continue; // Already has score
    }
    
    const score = calcCinderellaScore(headers, row);
    updates.push({ rowIdx: i + 1, score }); // 1-indexed sheet row
    calculated++;
  }
  
  console.log(`Skipped (already scored): ${skipped}`);
  console.log(`Need to calculate: ${calculated}`);
  
  if (updates.length === 0) {
    console.log('All rows already have Cinderella scores!');
    return;
  }
  
  // Batch update - do in chunks of 1000
  const BATCH_SIZE = 1000;
  let batchNum = 0;
  
  for (let i = 0; i < updates.length; i += BATCH_SIZE) {
    const batch = updates.slice(i, i + BATCH_SIZE);
    batchNum++;
    
    // Build the values array with row-by-row updates
    // We need to use batchUpdate for non-contiguous rows
    // Instead, let's build contiguous range from the row indices
    // Actually, let's prepare the full column M values from row 2 to last row
    console.log(`Processing batch ${batchNum}: rows ${batch[0].rowIdx} to ${batch[batch.length-1].rowIdx}...`);
    
    // Create request data for batchUpdate
    const data = batch.map(u => ({
      range: `D1 Scouting View!M${u.rowIdx}`,
      values: [[u.score]]
    }));
    
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: data
      }
    });
    
    console.log(`  Batch ${batchNum} done - ${batch.length} rows updated`);
    
    // Small delay between batches
    if (i + BATCH_SIZE < updates.length) {
      await new Promise(r => setTimeout(r, 500));
    }
  }
  
  console.log(`\n✓ Cinderella scores calculated for ${calculated} players`);
  
  // Show top 10 newly scored players
  const newScores = updates.slice(0, 10).map(u => ({
    row: u.rowIdx,
    score: u.score,
    player: rows[u.rowIdx - 1][0],
    team: rows[u.rowIdx - 1][1],
    conf: rows[u.rowIdx - 1][3]
  }));
  
  console.log('\nTop newly scored players:');
  const topNew = updates.sort((a,b) => b.score - a.score).slice(0, 15);
  topNew.forEach(u => {
    const row = rows[u.rowIdx - 1];
    console.log(`  ${u.score} | ${row[0]} | ${row[1]} (${row[3]}) | PPG: ${row[headers.indexOf('PPG')]}`);
  });
  
  // Save progress
  const progress = {
    timestamp: new Date().toISOString(),
    totalCalculated: calculated,
    totalSkipped: skipped,
    topNewScores: topNew.slice(0, 5).map(u => ({
      score: u.score,
      player: rows[u.rowIdx - 1][0]
    }))
  };
  
  const existingProgress = JSON.parse(fs.readFileSync(`/tmp/enrichment-progress-20260217.json`) || '{}');
  existingProgress.cinderellaCalc = progress;
  fs.writeFileSync('/tmp/enrichment-progress-20260217.json', JSON.stringify(existingProgress, null, 2));
  
  console.log('\n✓ Progress saved');
}

run().catch(e => {
  console.error('ERROR:', e.message);
  console.error(e.stack);
});
