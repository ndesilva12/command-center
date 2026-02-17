const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(creds.client_id, creds.client_secret);
auth.setCredentials({ access_token: creds.access_token, refresh_token: creds.refresh_token });
const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

// Load data files
const rows = JSON.parse(fs.readFileSync('/tmp/portal-big-board-raw.json'));
const headers = rows[0];
const transferIndex = JSON.parse(fs.readFileSync('/tmp/transfer-index.json'));
const season2026 = JSON.parse(fs.readFileSync('/tmp/season-2026-stats.json'));

// Column indices
const COL = {};
headers.forEach((h, i) => { COL[h] = i; });
// Named shortcuts
const C_PLAYER = COL['Player'];
const C_GRADE = COL['Grade (20-80)'];
const C_EFG = COL['eFG%'];
const C_FTRATE = COL['FT Rate'];
const C_ASTO = COL['AST:TO'];
const C_TEAM_RECORD = COL['Team Record'];
const C_NET_ADJ = COL['Net Adj.Rtg'];
const C_CIN = COL['Cin. Score'];
const C_CIN_V2 = COL['Cin Score v2'];
const C_LAST_ENRICHED = COL['Last enriched: v15 | 2026-02-17 | Advanced stats fill | Rankings audit | Big Men tab populated'];

// New columns will be appended after AJ (35)
// AK = 36: Est. Flag
// AL = 37: Career Arc  
// AM = 38: Transfer Count
const C_EST_FLAG = 36;    // AK
const C_CAREER_ARC = 37; // AL
const C_TRANSFER_CNT = 38; // AM

console.log('Column map:', JSON.stringify(COL, null, 2));

// ============================================================
// BUILD CAREER ARC LOOKUP FROM transfer-index.json
// ============================================================
const careerArcs = transferIndex.careerArcs;
const arcByName = {};
Object.values(careerArcs).forEach(arc => {
  if (arc && arc.name) {
    const key = arc.name.toLowerCase().trim();
    arcByName[key] = arc;
  }
});
console.log(`Career arcs indexed: ${Object.keys(arcByName).length}`);

// ============================================================
// BUILD SEASON 2026 STATS LOOKUP BY NAME
// ============================================================
const players2026 = season2026.players;
const statsByName = {};
Object.values(players2026).forEach(p => {
  if (p && p.name) {
    const key = p.name.toLowerCase().trim();
    if (!statsByName[key]) statsByName[key] = p;
  }
});
console.log(`2026 stats indexed: ${Object.keys(statsByName).length}`);

// ============================================================
// HELPER: Parse Net Adj Rtg to number
// ============================================================
function parseNetAdj(val) {
  if (!val) return null;
  const str = String(val).replace(/est\./i, '').replace(/\(unverified\)/i, '').replace(/[+]/g, '').trim();
  const n = parseFloat(str);
  return isNaN(n) ? null : n;
}

// ============================================================
// HELPER: Is this net adj estimated?
// ============================================================
function isEstimated(val) {
  if (!val) return false;
  return String(val).toLowerCase().includes('est.');
}

// ============================================================
// HELPER: Column index to letter
// ============================================================
function colLetter(idx) {
  if (idx < 26) return String.fromCharCode(65 + idx);
  return 'A' + String.fromCharCode(65 + idx - 26);
}

// ============================================================
// HELPER: fuzzy name match
// ============================================================
function normalizeName(name) {
  return name.toLowerCase()
    .replace(/jr\.?$/, '').replace(/sr\.?$/, '').replace(/ii+$/, '')
    .replace(/[^a-z\s]/g, '').replace(/\s+/g, ' ').trim();
}

function findByName(lookup, name) {
  const key = name.toLowerCase().trim();
  if (lookup[key]) return lookup[key];
  const norm = normalizeName(name);
  if (lookup[norm]) return lookup[norm];
  // Try partial match (last name + first initial)
  for (const k of Object.keys(lookup)) {
    if (normalizeName(k) === norm) return lookup[k];
  }
  return null;
}

// ============================================================
// PROCESS ALL PLAYERS
// ============================================================
const results = {
  cinScoreV2: [],
  estFlags: [],
  careerArcs: [],
  transferCounts: [],
  statsFilled: [],
  missingStats: { efg: [], ftrate: [], asto: [] },
};

const auditMissing = {
  teamRecord: [],
  netAdjRtg: [],
  grade: [],
  efg: [],
  ftrate: [],
  asto: [],
  cinV2: [],
  estimated: [],
};

let statsFilledCount = 0;
let totalPlayers = 0;

// We'll collect all updates for batch write
// Format: { range: 'Portal Big Board!XY', value: ... }
const updates = [];

for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  if (!row[C_PLAYER] || !row[C_PLAYER].trim()) continue;
  totalPlayers++;
  
  const playerName = row[C_PLAYER];
  const rowNum = i + 1; // 1-indexed for sheets
  
  // ---- TASK 1: Cin Score v2 ----
  const cinScoreRaw = parseFloat(row[C_CIN]);
  const netAdjRaw = row[C_NET_ADJ] || '';
  const netAdj = parseNetAdj(netAdjRaw);
  const grade = parseFloat(row[C_GRADE]);
  
  let cinV2 = isNaN(cinScoreRaw) ? null : cinScoreRaw;
  let adjustments = [];
  
  if (cinV2 !== null) {
    if (netAdj !== null) {
      if (netAdj < -3) {
        cinV2 -= 15;
        adjustments.push('netAdj<-3: -15');
      } else if (netAdj < 0) {
        cinV2 -= 7;
        adjustments.push('netAdj -3 to 0: -7');
      }
    }
    if (!isNaN(grade) && grade < 52) {
      cinV2 -= 10;
      adjustments.push('grade<52: -10');
    }
    // Cap and floor
    cinV2 = Math.min(100, Math.max(0, cinV2));
    cinV2 = Math.round(cinV2 * 10) / 10; // round to 1 decimal
  }
  
  results.cinScoreV2.push({
    player: playerName, row: rowNum,
    cinScore: cinScoreRaw, netAdj, grade,
    cinV2, adjustments
  });
  
  if (cinV2 !== null) {
    updates.push({ row: rowNum, col: C_CIN_V2, value: cinV2 });
  }
  
  // ---- TASK 2: Est. Flag ----
  const estFlag = isEstimated(netAdjRaw) ? '⚠️ est.' : '';
  results.estFlags.push({ player: playerName, row: rowNum, estFlag });
  updates.push({ row: rowNum, col: C_EST_FLAG, value: estFlag });
  
  if (estFlag) auditMissing.estimated.push(playerName);
  
  // ---- TASK 3: Career Arc ----
  let careerArc = '';
  let transferCount = '';
  
  const arcData = findByName(arcByName, playerName);
  if (arcData) {
    // PPG trajectory
    const seasons = arcData.seasons || [];
    if (seasons.length >= 2) {
      const prevSeason = seasons[seasons.length - 2];
      const currSeason = seasons[seasons.length - 1];
      const prevPts = prevSeason.pts;
      const currPts = currSeason.pts;
      if (prevPts !== undefined && currPts !== undefined) {
        const arrow = currPts > prevPts ? '↑' : currPts < prevPts ? '↓' : '→';
        careerArc = `${prevPts.toFixed(1)}→${currPts.toFixed(1)} (${arrow})`;
      }
    } else if (seasons.length === 1) {
      careerArc = `${seasons[0].pts.toFixed(1)} PPG (Freshman)`;
    }
    
    // Transfer count: count distinct teams
    const distinctTeams = new Set(seasons.map(s => s.teamShort));
    const numTransfers = distinctTeams.size - 1;
    transferCount = numTransfers <= 0 ? '0' : numTransfers >= 3 ? '3+' : String(numTransfers);
  } else {
    // Check class to infer freshman
    const cls = (row[COL['Class']] || '').toLowerCase();
    if (cls.includes('freshman') || cls === 'fr') {
      careerArc = 'Freshman';
      transferCount = '0';
    }
  }
  
  results.careerArcs.push({ player: playerName, row: rowNum, careerArc, transferCount, found: !!arcData });
  updates.push({ row: rowNum, col: C_CAREER_ARC, value: careerArc });
  updates.push({ row: rowNum, col: C_TRANSFER_CNT, value: transferCount });
  
  // ---- TASK 4: Missing Stats Sweep ----
  let efg = row[C_EFG] || '';
  let ftRate = row[C_FTRATE] || '';
  let astTo = row[C_ASTO] || '';
  
  let filledThis = [];
  
  if (!efg || !ftRate || !astTo) {
    const p2026 = findByName(statsByName, playerName);
    if (p2026 && p2026.stats) {
      const st = p2026.stats;
      
      if (!efg && st.avgFieldGoalsMade !== undefined && st.avgFieldGoalsAttempted > 0) {
        const fg = st.avgFieldGoalsMade;
        const fga = st.avgFieldGoalsAttempted;
        const tpm = st.avgThreePointFieldGoalsMade || 0;
        const efgCalc = ((fg + 0.5 * tpm) / fga * 100).toFixed(1);
        efg = efgCalc;
        updates.push({ row: rowNum, col: C_EFG, value: efgCalc });
        filledThis.push('eFG%');
        statsFilledCount++;
      }
      
      if (!ftRate && st.avgFreeThrowsAttempted !== undefined && st.avgFieldGoalsAttempted > 0) {
        const ftRateCalc = (st.avgFreeThrowsAttempted / st.avgFieldGoalsAttempted).toFixed(3);
        ftRate = ftRateCalc;
        updates.push({ row: rowNum, col: C_FTRATE, value: ftRateCalc });
        filledThis.push('FT Rate');
        statsFilledCount++;
      }
      
      if (!astTo && st.avgAssists !== undefined && st.avgTurnovers > 0) {
        const astToCalc = (st.avgAssists / st.avgTurnovers).toFixed(2);
        astTo = astToCalc;
        updates.push({ row: rowNum, col: C_ASTO, value: astToCalc });
        filledThis.push('AST:TO');
        statsFilledCount++;
      }
    }
  }
  
  if (filledThis.length > 0) {
    results.statsFilled.push({ player: playerName, filled: filledThis });
  }
  
  // ---- TASK 5: Audit tracking ----
  if (!row[C_TEAM_RECORD]) auditMissing.teamRecord.push(playerName);
  if (!netAdjRaw) auditMissing.netAdjRtg.push(playerName);
  if (!row[C_GRADE]) auditMissing.grade.push(playerName);
  if (!efg) auditMissing.efg.push(playerName);
  if (!ftRate) auditMissing.ftrate.push(playerName);
  if (!astTo) auditMissing.asto.push(playerName);
  if (cinV2 === null) auditMissing.cinV2.push(playerName);
}

// ============================================================
// WRITE TO SHEET — batchUpdate
// ============================================================
async function writeToSheet() {
  // First, write column headers for new columns
  // AK = Est. Flag, AL = Career Arc, AM = Transfer Count
  const headerUpdates = [
    { range: `Portal Big Board!${colLetter(C_EST_FLAG)}1`, values: [['Est. Flag']] },
    { range: `Portal Big Board!${colLetter(C_CAREER_ARC)}1`, values: [['Career Arc']] },
    { range: `Portal Big Board!${colLetter(C_TRANSFER_CNT)}1`, values: [['Transfer Count']] },
  ];
  
  // Group updates by column for batch efficiency
  // Build array of [range, value] pairs
  const valueRanges = [...headerUpdates];
  
  // Add all player row updates
  for (const upd of updates) {
    const col = colLetter(upd.col);
    valueRanges.push({
      range: `Portal Big Board!${col}${upd.row}`,
      values: [[upd.value === undefined ? '' : upd.value]]
    });
  }
  
  // Write in batches of 500
  const BATCH_SIZE = 500;
  for (let start = 0; start < valueRanges.length; start += BATCH_SIZE) {
    const batch = valueRanges.slice(start, start + BATCH_SIZE);
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: batch
      }
    });
    console.log(`Wrote batch ${Math.floor(start/BATCH_SIZE) + 1} (${batch.length} updates)`);
  }
  
  // ---- TASK 6: Version Stamp ----
  // AH = index 33
  const versionStamp = 'Last enriched: v16 | 2026-02-17 | Cin Score v2 | Career arcs | Completeness audit';
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Portal Big Board!${colLetter(C_LAST_ENRICHED)}1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[versionStamp]] }
  });
  console.log('Version stamp updated');
}

// ============================================================
// SAVE RESULTS TO /tmp
// ============================================================
function saveResults() {
  fs.writeFileSync('/tmp/cin-score-v2-results.json', JSON.stringify({
    generatedAt: new Date().toISOString(),
    formula: 'Cin Score - (netAdj<-3: 15) - (netAdj -3to0: 7) - (grade<52: 10), capped 0-100',
    totalPlayers,
    results: results.cinScoreV2
  }, null, 2));
  console.log('Saved /tmp/cin-score-v2-results.json');
  
  fs.writeFileSync('/tmp/career-arc-v16.json', JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalPlayers,
    matchedInIndex: results.careerArcs.filter(r => r.found).length,
    results: results.careerArcs
  }, null, 2));
  console.log('Saved /tmp/career-arc-v16.json');
  
  const completenessAudit = {
    generatedAt: new Date().toISOString(),
    totalPlayers,
    missing: {
      teamRecord: { count: auditMissing.teamRecord.length, players: auditMissing.teamRecord },
      netAdjRtg: { count: auditMissing.netAdjRtg.length, players: auditMissing.netAdjRtg },
      grade: { count: auditMissing.grade.length, players: auditMissing.grade },
      eFG: { count: auditMissing.efg.length, players: auditMissing.efg },
      ftRate: { count: auditMissing.ftrate.length, players: auditMissing.ftrate },
      astTo: { count: auditMissing.asto.length, players: auditMissing.asto },
      cinScoreV2: { count: auditMissing.cinV2.length, players: auditMissing.cinV2 },
    },
    estimatedValues: { count: auditMissing.estimated.length, players: auditMissing.estimated },
    statsFilled: { count: statsFilledCount, details: results.statsFilled }
  };
  fs.writeFileSync('/tmp/completeness-audit-v16.json', JSON.stringify(completenessAudit, null, 2));
  console.log('Saved /tmp/completeness-audit-v16.json');
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log(`\nProcessing ${totalPlayers} players...`);
  console.log(`Total updates to write: ${updates.length}`);
  console.log(`Stats filled: ${statsFilledCount}`);
  
  // Summary of Cin Score v2
  const adjusted = results.cinScoreV2.filter(r => r.adjustments.length > 0);
  console.log(`Players with Cin Score v2 adjustments: ${adjusted.length}`);
  
  // Summary of estimated flags
  const estimated = results.estFlags.filter(r => r.estFlag);
  console.log(`Players with est. flag: ${estimated.length} — ${estimated.map(r => r.player).join(', ')}`);
  
  // Career arc matches
  const matched = results.careerArcs.filter(r => r.found);
  console.log(`Career arc matches: ${matched.length}/${totalPlayers}`);
  
  saveResults();
  
  console.log('\nWriting to sheet...');
  await writeToSheet();
  
  console.log('\n✅ v16 COMPLETE!');
  console.log(`Tasks completed:
  1. Cin Score v2 recalculated for ${results.cinScoreV2.length} players (${adjusted.length} adjusted)
  2. Est. Flag added for ${estimated.length} players
  3. Career Arc added for ${matched.length}/${totalPlayers} players
  4. Stats filled: ${statsFilledCount} fields across ${results.statsFilled.length} players
  5. Completeness audit saved to /tmp/completeness-audit-v16.json
  6. Version stamp updated to v16`);
}

main().catch(err => {
  console.error('ERROR:', err);
  process.exit(1);
});
