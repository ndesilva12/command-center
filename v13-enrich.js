/**
 * v13 Enrichment Script - Cinderella Project Database
 * Tasks: Multi-season stats, Full DB enrichment, Transfer analysis, Sortability, Version stamp
 */

const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';

function colLetter(n) {
  let result = '';
  n++;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

function normName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Build player lookup from a season file: name -> player stats
function buildSeasonLookup(seasonData) {
  const lookup = {};
  const players = seasonData.players || [];
  for (const p of players) {
    const key = normName(p.name);
    if (key) {
      // If duplicate, keep higher gamesPlayed
      if (!lookup[key] || (p.stats.gamesPlayed || 0) > (lookup[key].stats.gamesPlayed || 0)) {
        lookup[key] = p;
      }
    }
  }
  return lookup;
}

// Conference tier mapping based on conference name
function getConfTier(confName) {
  if (!confName) return '';
  const c = confName.toLowerCase();
  if (c.includes('big 12') || c.includes('big 10') || c.includes('big ten') || 
      c.includes('acc') || c.includes('sec') || c.includes('pac-12') || c.includes('pac 12') ||
      c.includes('american') || c.includes('aac') || c.includes('mountain west')) {
    return 'P6';
  }
  if (c.includes('atlantic 10') || c.includes('a-10') || c.includes('wcc') || 
      c.includes('mvc') || c.includes('cusa') || c.includes('conference usa') ||
      c.includes('sun belt') || c.includes('mac ') || c === 'mac' ||
      c.includes('caa') || c.includes('maac')) {
    return 'High-Major';
  }
  if (c.includes('big west') || c.includes('ovc') || c.includes('socon') ||
      c.includes('big south') || c.includes('colonial') || c.includes('patriot') ||
      c.includes('horizon') || c.includes('summit') || c.includes('southern') ||
      c.includes('swac') || c.includes('meac') || c.includes('america east') ||
      c.includes('ivy') || c.includes('nec') || c.includes('northeast') ||
      c.includes('western athletic') || c.includes('wac')) {
    return 'Mid-Major';
  }
  return 'Low-Major';
}

function getPosGroup(pos) {
  if (!pos) return '';
  const p = pos.toUpperCase();
  if (p === 'G' || p === 'PG' || p === 'SG' || p.includes('GUARD')) return 'Guard';
  if (p === 'C' || p.includes('CENTER')) return 'Center';
  if (p === 'F' || p === 'SF' || p === 'PF' || p.includes('FORWARD')) return 'Forward';
  if (p === 'G/F' || p === 'F/G') return 'Forward';
  return pos;
}

// Determine tier sort key from Tier column
function getTierSortKey(tier) {
  if (!tier) return 9;
  const t = tier.toString().trim().toUpperCase();
  if (t === 'T1') return 1;
  if (t === 'T2') return 2;
  if (t === 'T3') return 3;
  if (t === 'T4') return 4;
  if (t === 'INELIGIBLE') return 5;
  return 9;
}

// Standardize Conference Tier values
function standardizeConfTier(val) {
  if (!val) return '';
  const v = val.toString().trim().toUpperCase();
  if (v === 'P6' || v === 'P5' || v.includes('POWER')) return 'P6';
  if (v === 'HIGH-MAJOR' || v === 'HIGH MAJOR' || v === 'HIGHMAJOR') return 'High-Major';
  if (v === 'MID-MAJOR' || v === 'MID MAJOR' || v === 'MIDMAJOR') return 'Mid-Major';
  if (v === 'LOW-MAJOR' || v === 'LOW MAJOR' || v === 'LOWMAJOR') return 'Low-Major';
  // Already fine
  if (['P6','High-Major','Mid-Major','Low-Major'].includes(val.trim())) return val.trim();
  return val.trim();
}

async function main() {
  console.log('=== V13 Enrichment Started ===');
  const startTime = Date.now();
  
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
  auth.setCredentials(token);
  const sheets = google.sheets({ version: 'v4', auth });

  // ============================================================
  // LOAD ALL DATA FILES
  // ============================================================
  console.log('\n[1/5] Loading season data files...');
  const season2026 = JSON.parse(fs.readFileSync('/tmp/season-2026-stats.json'));
  const season2025 = JSON.parse(fs.readFileSync('/tmp/season-2025-stats.json'));
  const season2024 = JSON.parse(fs.readFileSync('/tmp/season-2024-stats.json'));
  const season2023 = JSON.parse(fs.readFileSync('/tmp/season-2023-stats.json'));
  const season2022 = JSON.parse(fs.readFileSync('/tmp/season-2022-stats.json'));
  const transferIdx = JSON.parse(fs.readFileSync('/tmp/transfer-index.json'));
  const transferSummary = JSON.parse(fs.readFileSync('/tmp/transfer-summary.json'));
  const teamLookup = JSON.parse(fs.readFileSync('/tmp/team-lookup-full.json'));
  
  console.log('Building lookups...');
  const lookup2026 = buildSeasonLookup(season2026);
  const lookup2025 = buildSeasonLookup(season2025);
  const lookup2024 = buildSeasonLookup(season2024);
  const lookup2023 = buildSeasonLookup(season2023);
  const lookup2022 = buildSeasonLookup(season2022);
  
  // Build career arc lookup by name
  const careerArcs = {};
  for (const arc of (transferIdx.careerArcs || [])) {
    const key = normName(arc.name);
    if (key && !careerArcs[key]) {
      careerArcs[key] = arc;
    }
  }
  
  // Build transfer lookup (players who changed teams)
  const transferMap = {};
  for (const t of (transferIdx.transfers || [])) {
    const key = normName(t.name);
    if (key) {
      if (!transferMap[key]) transferMap[key] = [];
      transferMap[key].push(t);
    }
  }
  
  // Build team → conference lookup
  const teamConf = {};
  if (teamLookup.teams) {
    for (const team of teamLookup.teams) {
      if (team.id) teamConf[team.id] = team.conference || team.conf || '';
    }
  } else if (Array.isArray(teamLookup)) {
    for (const team of teamLookup) {
      if (team.id) teamConf[team.id] = team.conference || team.conf || '';
    }
  } else {
    // It's an object keyed by id
    for (const [id, team] of Object.entries(teamLookup)) {
      if (typeof team === 'object') {
        teamConf[id] = team.conference || team.conf || team.name || '';
      }
    }
  }
  console.log('Team conf entries:', Object.keys(teamConf).length);

  // ============================================================
  // READ PORTAL BIG BOARD
  // ============================================================
  console.log('\n[2/5] Reading Portal Big Board...');
  const pbbResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Portal Big Board'!A1:AZ200",
  });
  const pbbRows = pbbResp.data.values || [];
  const pbbHeaders = pbbRows[0] || [];
  console.log(`PBB: ${pbbRows.length} rows, ${pbbHeaders.length} columns`);

  // Column indices in PBB
  const COL = {};
  pbbHeaders.forEach((h, i) => { COL[h] = i; });
  // Key columns:
  const iPlayer = 1; // B
  const iTier = 0;   // A
  const iConfTier = 22; // W
  const iCinScore = 24; // Y - Cin. Score
  
  // New columns to add (after AH = index 33):
  // AI (34): 2024-25 PPG
  // AJ (35): 2023-24 PPG
  // AK (36): Career Trend
  // AL (37): Seasons Played
  // AM (38): Transfer History
  // AN (39): SortKey
  const NEW_COLS = {
    PPG_2425: 34,   // AI
    PPG_2324: 35,   // AJ
    CAREER_TREND: 36, // AK
    SEASONS_PLAYED: 37, // AL
    TRANSFER_HISTORY: 38, // AM
    SORT_KEY: 39,   // AN
  };

  // ============================================================
  // TASK 1 + 3 + 4: Enrich Portal Big Board
  // ============================================================
  console.log('\n[3/5] Enriching Portal Big Board...');
  
  // We'll prepare the updates for each row
  // First, let's fix the existing data and add new columns
  
  const pbbUpdates = []; // array of {range, values}
  
  // Add headers for new columns
  const newHeaderRow = [
    '2024-25 PPG', // AI
    '2023-24 PPG', // AJ
    'Career Trend', // AK
    'Seasons Played', // AL
    'Transfer History', // AM
    'SortKey', // AN
  ];
  pbbUpdates.push({
    range: `'Portal Big Board'!AI1:AN1`,
    values: [newHeaderRow]
  });
  
  // Update version stamp in AH1
  pbbUpdates.push({
    range: `'Portal Big Board'!AH1`,
    values: [['Last enriched: v13 | 2026-02-17 | Multi-season stats + transfer history | Career trends added']]
  });

  // Process each player row
  let matchCount = 0;
  let noMatchCount = 0;
  const pbbStats = [];
  
  for (let r = 1; r < pbbRows.length; r++) {
    const row = pbbRows[r];
    const playerName = (row[iPlayer] || '').trim();
    if (!playerName) continue;
    
    const key = normName(playerName);
    const tier = row[iTier] || '';
    
    // Look up career arc
    const arc = careerArcs[key];
    const transfers = transferMap[key] || [];
    
    // Get stats from each season
    const p2426 = lookup2026[key];
    const p2425 = lookup2025[key];
    const p2324 = lookup2024[key];
    const p2223 = lookup2023[key];
    const p2122 = lookup2022[key];
    
    // Current (2025-26) PPG - from column J (index 9) which is already there
    // 2024-25 PPG
    const ppg2425 = p2425 ? parseFloat((p2425.stats.avgPoints || 0).toFixed(1)) : '';
    // 2023-24 PPG
    const ppg2324 = p2324 ? parseFloat((p2324.stats.avgPoints || 0).toFixed(1)) : '';
    
    // Career Trend (based on 2023-24 → 2024-25 trajectory)
    let careerTrend = '';
    if (ppg2425 !== '' && ppg2324 !== '') {
      const delta = ppg2425 - ppg2324;
      if (delta > 1.5) careerTrend = 'UP';
      else if (delta < -1.5) careerTrend = 'DOWN';
      else careerTrend = 'FLAT';
    } else if (arc) {
      // Use arc trajectory
      if (arc.trajectory && arc.trajectory.ptsDelta) {
        const d = arc.trajectory.ptsDelta;
        if (d > 1.5) careerTrend = 'UP';
        else if (d < -1.5) careerTrend = 'DOWN';
        else careerTrend = 'FLAT';
      }
    }
    
    // Seasons Played
    let seasonsPlayed = 0;
    if (p2426) seasonsPlayed++;
    if (p2425) seasonsPlayed++;
    if (p2324) seasonsPlayed++;
    if (p2223) seasonsPlayed++;
    if (p2122) seasonsPlayed++;
    if (arc && arc.numSeasons > seasonsPlayed) seasonsPlayed = arc.numSeasons;
    
    // Transfer History
    let transferHistory = '1st-time';
    if (arc) {
      const numTransfers = (arc.idTransfers || 0) + (arc.nameTransfers || 0);
      if (numTransfers === 0 && transfers.length === 0) {
        transferHistory = '1st-time'; // native (no prior transfer)
      } else if (numTransfers === 1 || transfers.length === 1) {
        transferHistory = '1st-time'; // transferred once
      } else if (numTransfers === 2 || transfers.length === 2) {
        transferHistory = '2nd-time'; // 2nd transfer
      } else if (numTransfers >= 3 || transfers.length >= 3) {
        transferHistory = '3rd-time'; // 3+ transfers
      }
    } else if (transfers.length > 0) {
      if (transfers.length === 1) transferHistory = '1st-time';
      else if (transfers.length === 2) transferHistory = '2nd-time';
      else transferHistory = '3rd-time';
    }
    
    // SortKey
    const sortKey = getTierSortKey(tier);
    
    if (p2425 || p2324 || arc) matchCount++;
    else noMatchCount++;
    
    // Store stats for reporting
    pbbStats.push({
      name: playerName,
      key,
      ppg2425,
      ppg2324,
      careerTrend,
      seasonsPlayed,
      transferHistory,
      sortKey,
      hasArc: !!arc,
      transferCount: transfers.length
    });
    
    // Add update for this row
    const rowData = [
      ppg2425 !== '' ? ppg2425 : '',
      ppg2324 !== '' ? ppg2324 : '',
      careerTrend,
      seasonsPlayed || '',
      transferHistory,
      sortKey
    ];
    pbbUpdates.push({
      range: `'Portal Big Board'!AI${r+1}:AN${r+1}`,
      values: [rowData]
    });
  }
  
  console.log(`Matched: ${matchCount}, No match: ${noMatchCount}`);
  
  // Task 4: Fix Conference Tier column (W = col index 22) and numeric fields
  // Read existing W column values and standardize
  const confTierUpdates = [];
  for (let r = 1; r < pbbRows.length; r++) {
    const row = pbbRows[r];
    if (!row[iPlayer]) continue;
    const currentConfTier = row[iConfTier] || '';
    const standardized = standardizeConfTier(currentConfTier);
    if (standardized !== currentConfTier && standardized) {
      confTierUpdates.push({
        range: `'Portal Big Board'!W${r+1}`,
        values: [[standardized]]
      });
    }
  }
  console.log(`Conference tier fixes: ${confTierUpdates.length}`);
  pbbUpdates.push(...confTierUpdates);

  // ============================================================
  // APPLY ALL PBB UPDATES
  // ============================================================
  console.log(`\nApplying ${pbbUpdates.length} PBB updates...`);
  
  // Batch in groups of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < pbbUpdates.length; i += BATCH_SIZE) {
    const batch = pbbUpdates.slice(i, i + BATCH_SIZE);
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: batch.map(u => ({ range: u.range, values: u.values }))
      }
    });
    console.log(`  Batch ${Math.floor(i/BATCH_SIZE)+1}/${Math.ceil(pbbUpdates.length/BATCH_SIZE)} done`);
    if (i + BATCH_SIZE < pbbUpdates.length) await sleep(500);
  }
  console.log('✓ PBB updates complete');

  // ============================================================
  // TASK 3: Transfer Success Rate Analysis
  // ============================================================
  console.log('\n[4/5] Transfer Success Rate Analysis...');
  
  // Conference tier hierarchy
  const tierOrder = { 'P6': 4, 'High-Major': 3, 'Mid-Major': 2, 'Low-Major': 1, '': 0 };
  
  let totalTransfers = 0;
  let upwardTransfers = 0;
  let improvedPPG = 0;
  let improvedRPG = 0;
  let improvedAPG = 0;
  let improvedAll = 0;
  
  const transfers = transferIdx.transfers || [];
  for (const t of transfers) {
    // Check if it's an upward transfer (lower-major → higher-major)
    const fromConf = getConfTier(t.fromTeam || '');
    const toConf = getConfTier(t.toTeam || '');
    const fromTier = tierOrder[fromConf] || 0;
    const toTier = tierOrder[toConf] || 0;
    
    if (toTier > fromTier && fromTier > 0) {
      upwardTransfers++;
      const d = t.statDelta || {};
      const ppgImproved = d.avgPoints && d.avgPoints.delta > 0;
      const rpgImproved = d.avgRebounds && d.avgRebounds.delta > 0;
      const apgImproved = d.avgAssists && d.avgAssists.delta > 0;
      if (ppgImproved) improvedPPG++;
      if (rpgImproved) improvedRPG++;
      if (apgImproved) improvedAPG++;
      if (ppgImproved && rpgImproved && apgImproved) improvedAll++;
    }
    totalTransfers++;
  }
  
  const transferAnalysis = {
    totalTransfers,
    upwardTransfers,
    pctImprovedPPG: upwardTransfers > 0 ? ((improvedPPG / upwardTransfers) * 100).toFixed(1) : 'N/A',
    pctImprovedRPG: upwardTransfers > 0 ? ((improvedRPG / upwardTransfers) * 100).toFixed(1) : 'N/A',
    pctImprovedAPG: upwardTransfers > 0 ? ((improvedAPG / upwardTransfers) * 100).toFixed(1) : 'N/A',
    pctImprovedAll: upwardTransfers > 0 ? ((improvedAll / upwardTransfers) * 100).toFixed(1) : 'N/A',
  };
  console.log('Transfer Analysis:', JSON.stringify(transferAnalysis));
  
  // Find repeat transfers in PBB
  const repeatTransfers = pbbStats.filter(p => 
    p.transferHistory === '2nd-time' || p.transferHistory === '3rd-time'
  );
  console.log('Repeat transfers in PBB:', repeatTransfers.map(p => `${p.name} (${p.transferHistory})`).join(', '));

  // ============================================================
  // TASK 2: Enrich Full Database
  // ============================================================
  console.log('\n[5/5] Enriching Full Database (10+ min)...');
  
  // Read the Full Database (all rows)
  const fdbResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Full Database (10+ min)'!A1:AS7000",
  });
  const fdbRows = fdbResp.data.values || [];
  const fdbHeaders = fdbRows[0] || [];
  console.log(`FDB: ${fdbRows.length} rows`);
  
  // Column indices in FDB
  const fCOL = {};
  fdbHeaders.forEach((h, i) => { fCOL[h] = i; });
  
  const iName = 0;   // A: Player
  const iTeam = 1;   // B: Team
  const iConf = 2;   // C: Conference
  const iPos  = 3;   // D: Position
  const iYear = 4;   // E: Year
  const iGP   = 7;   // H: GP
  const iPPG  = 9;   // J: PPG
  const iRPG  = 10;  // K: RPG
  const iAPG  = 11;  // L: APG
  const iFGP  = 12;  // M: FG%
  const i3PP  = 13;  // N: 3P%
  const iFTP  = 14;  // O: FT%
  
  const fdbUpdates = [];
  let fdbMatchCount = 0;
  let fdbFillCount = 0;
  
  for (let r = 1; r < fdbRows.length; r++) {
    const row = fdbRows[r];
    if (!row) continue;
    const pname = (row[iName] || '').trim();
    if (!pname) continue;
    
    const key = normName(pname);
    const p = lookup2026[key];
    if (!p) continue;
    fdbMatchCount++;
    
    const rowUpdates = [];
    let hasFill = false;
    
    const stats = p.stats || {};
    
    // Check and fill each stat
    const checkFill = (colIdx, val, colLet) => {
      const existing = (row[colIdx] || '').toString().trim();
      if (!existing && val !== undefined && val !== null && val !== '') {
        rowUpdates.push({ col: colIdx, val, colLet });
        hasFill = true;
      }
    };
    
    checkFill(iGP, stats.gamesPlayed, 'H');
    checkFill(iPPG, stats.avgPoints ? parseFloat(stats.avgPoints.toFixed(1)) : '', 'J');
    checkFill(iRPG, stats.avgRebounds ? parseFloat(stats.avgRebounds.toFixed(1)) : '', 'K');
    checkFill(iAPG, stats.avgAssists ? parseFloat(stats.avgAssists.toFixed(1)) : '', 'L');
    checkFill(iFGP, stats.fieldGoalPct ? parseFloat(stats.fieldGoalPct.toFixed(1)) : '', 'M');
    checkFill(i3PP, stats.threePointFieldGoalPct ? parseFloat(stats.threePointFieldGoalPct.toFixed(1)) : '', 'N');
    checkFill(iFTP, stats.freeThrowPct ? parseFloat(stats.freeThrowPct.toFixed(1)) : '', 'O');
    
    // Fill Conference if blank
    const existingConf = (row[iConf] || '').trim();
    if (!existingConf && p.teamId && teamConf[p.teamId]) {
      rowUpdates.push({ col: iConf, val: teamConf[p.teamId], colLet: 'C' });
      hasFill = true;
    }
    
    // Fill Position if blank
    const existingPos = (row[iPos] || '').trim();
    if (!existingPos && p.position) {
      rowUpdates.push({ col: iPos, val: p.position, colLet: 'D' });
      hasFill = true;
    }
    
    if (hasFill) {
      fdbFillCount++;
      // Build individual cell updates
      for (const u of rowUpdates) {
        fdbUpdates.push({
          range: `'Full Database (10+ min)'!${u.colLet}${r+1}`,
          values: [[u.val]]
        });
      }
    }
  }
  
  console.log(`FDB matched: ${fdbMatchCount}, rows with fills: ${fdbFillCount}, total cells: ${fdbUpdates.length}`);
  
  // Batch FDB updates in groups of 100
  if (fdbUpdates.length > 0) {
    console.log(`Applying ${fdbUpdates.length} FDB updates...`);
    for (let i = 0; i < fdbUpdates.length; i += 100) {
      const batch = fdbUpdates.slice(i, i + 100);
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: batch.map(u => ({ range: u.range, values: u.values }))
        }
      });
      process.stdout.write(`\r  FDB batch ${Math.floor(i/100)+1}/${Math.ceil(fdbUpdates.length/100)} done`);
      if (i + 100 < fdbUpdates.length) await sleep(300);
    }
    console.log('\n✓ FDB updates complete');
  } else {
    console.log('No FDB updates needed (all already filled)');
  }

  // ============================================================
  // COMPLETION REPORT
  // ============================================================
  const endTime = Date.now();
  const report = {
    version: 'v13',
    completedAt: new Date().toISOString(),
    durationSeconds: ((endTime - startTime) / 1000).toFixed(1),
    tasks: {
      task1_multiSeasonStats: {
        status: 'COMPLETE',
        pbbRowsProcessed: pbbStats.length,
        matched: matchCount,
        noMatch: noMatchCount,
        newColumns: ['AI: 2024-25 PPG', 'AJ: 2023-24 PPG', 'AK: Career Trend', 'AL: Seasons Played'],
        careerTrendBreakdown: {
          UP: pbbStats.filter(p => p.careerTrend === 'UP').length,
          DOWN: pbbStats.filter(p => p.careerTrend === 'DOWN').length,
          FLAT: pbbStats.filter(p => p.careerTrend === 'FLAT').length,
          unknown: pbbStats.filter(p => !p.careerTrend).length,
        }
      },
      task2_fullDatabaseEnrich: {
        status: 'COMPLETE',
        totalRows: fdbRows.length - 1,
        matchedPlayers: fdbMatchCount,
        rowsUpdated: fdbFillCount,
        cellsUpdated: fdbUpdates.length,
        focusedStats: ['GP', 'PPG', 'RPG', 'APG', 'FG%', '3P%', 'FT%', 'Conference', 'Position'],
        note: 'Only filled blank cells — no overwrites'
      },
      task3_transferAnalysis: {
        status: 'COMPLETE',
        analysis: transferAnalysis,
        repeatTransfersInPBB: repeatTransfers.map(p => ({
          name: p.name,
          history: p.transferHistory
        })),
        newColumn: 'AM: Transfer History (1st-time/2nd-time/3rd-time)'
      },
      task4_sortability: {
        status: 'COMPLETE',
        confTierFixes: confTierUpdates.length,
        sortKeyColumn: 'AN: SortKey (1=T1, 2=T2, etc.)',
        versionStampUpdated: true
      },
      task5_versionStamp: {
        status: 'COMPLETE',
        cell: 'AH1',
        value: 'Last enriched: v13 | 2026-02-17 | Multi-season stats + transfer history | Career trends added'
      }
    },
    pbbPlayerStats: pbbStats.slice(0, 20), // first 20 for brevity
    notes: [
      'Perry=G-League (INELIGIBLE), Bradley=Jaden Bradley, Momcilovic=Milan@Iowa State, Fears=Jeremy Fears Jr.',
      'Walter Clayton Jr. is T2',
      'Wolf/McNeeley/Riley are NBA — INELIGIBLE',
      'Norman\'s Rankings tab NOT touched'
    ]
  };
  
  fs.writeFileSync('/tmp/enrichment-v13-complete.json', JSON.stringify(report, null, 2));
  console.log('\n=== V13 COMPLETE ===');
  console.log(`Duration: ${report.durationSeconds}s`);
  console.log(`Report saved: /tmp/enrichment-v13-complete.json`);
  console.log(JSON.stringify(report.tasks, null, 2));
}

main().catch(e => {
  console.error('FATAL ERROR:', e.message);
  console.error(e.stack);
  process.exit(1);
});
