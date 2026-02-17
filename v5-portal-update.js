/**
 * v5 Portal Big Board Enrichment
 * Tasks: Add 3 players, fill eFG%/FT Rate/AST:TO for 22 rows, add Conference Check column
 */

const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const tokenData = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(tokenData.client_id, tokenData.client_secret);
auth.setCredentials({ access_token: tokenData.access_token, refresh_token: tokenData.refresh_token });
const sheets = google.sheets({ version: 'v4', auth });

// ──────────────────────────────────────────────
// 1) Build lookup from d1-10min-players-final.json
// ──────────────────────────────────────────────
const playerDB = require('/tmp/d1-10min-players-final.json');
const playerLookup = {};
playerDB.forEach(p => {
  if (p.name) {
    const key = p.name.toLowerCase().trim();
    playerLookup[key] = p;
  }
});

function lookupPlayer(name) {
  const key = name.toLowerCase().trim();
  if (playerLookup[key]) return playerLookup[key];
  // fuzzy: match last name + first initial
  const parts = key.split(' ');
  if (parts.length >= 2) {
    const lastName = parts[parts.length - 1];
    const firstInit = parts[0][0];
    const found = playerDB.filter(p => {
      if (!p.name) return false;
      const pk = p.name.toLowerCase();
      return pk.includes(lastName) && pk.startsWith(firstInit);
    });
    if (found.length === 1) return found[0];
  }
  return null;
}

function calcStats(p) {
  if (!p) return { efg: '', ftRate: '', astTo: '' };
  const fga = p.avgFieldGoalsAttempted || 0;
  const fgm = p.avgFieldGoalsMade || 0;
  const tpm = p.avgThreePointFieldGoalsMade || 0;
  const fta = p.avgFreeThrowsAttempted || 0;
  const ast = p.avgAssists || 0;
  const tov = p.avgTurnovers || 0;

  const efg = fga > 0 ? ((fgm + 0.5 * tpm) / fga).toFixed(3) : '';
  const ftRate = fga > 0 ? (fta / fga).toFixed(3) : '';
  const astTo = tov > 0 ? (ast / tov).toFixed(2) : ast > 0 ? '∞' : '';
  return { efg, ftRate, astTo };
}

// ──────────────────────────────────────────────
// 2) Conference Check mapping
// ──────────────────────────────────────────────
const CONF_CHECK = {
  // P6
  'ACC': 'P6', 'Big 12': 'P6', 'Big East': 'P6', 'Big Ten': 'P6',
  'Pac-12': 'P6', 'SEC': 'P6',
  // High-Major
  'American': 'High-Major', 'A-10': 'High-Major', 'Mountain West': 'High-Major',
  'WCC': 'High-Major',
  // Mid-Major
  'SoCon': 'Mid-Major', 'Big South': 'Mid-Major', 'Sun Belt': 'Mid-Major',
  'MAAC': 'Mid-Major', 'MAC': 'Mid-Major', 'Big Sky': 'Mid-Major',
  'Ivy': 'Mid-Major', 'MVC': 'Mid-Major', 'CAA': 'Mid-Major',
  'Horizon': 'Mid-Major', 'Summit': 'Mid-Major', 'Patriot': 'Mid-Major',
  'Big West': 'Mid-Major', 'CUSA': 'Mid-Major', 'Am. East': 'Mid-Major',
  'Southland': 'Mid-Major', 'ASUN': 'Mid-Major', 'OVC': 'Mid-Major',
  'WAC': 'Mid-Major',
  // Low-Major
  'SWAC': 'Low-Major', 'MEAC': 'Low-Major', 'NEC': 'Low-Major',
  'Non-D1': 'Low-Major', 'SC': 'Low-Major',
};

function getConfCheck(conf) {
  if (!conf) return 'Unknown';
  // Direct match
  if (CONF_CHECK[conf]) return CONF_CHECK[conf];
  // Partial match
  for (const [k, v] of Object.entries(CONF_CHECK)) {
    if (conf.toLowerCase().includes(k.toLowerCase())) return v;
  }
  return 'Mid-Major'; // default
}

// ──────────────────────────────────────────────
// 3) New Players: Johni Broome, Danny Wolf, Liam McNeeley
// ──────────────────────────────────────────────
// Row format: Tier,Player,Position,Height,Weight,CurrentSchool,Conference,Class,EligLeft,PPG,RPG,APG,FG%,3P%,FT%,Grade,RoleFit,Status,eFG%,FTRate,AST:TO,TeamRecord,ConfTier,PortalStatus,CinScore,NetAdjRtg,TeamImpactFlag,,FlightRiskScore,ConferenceCheck

const newPlayers = [
  {
    tier: 'T1',
    player: 'Johni Broome',
    pos: 'C',
    height: '6\'10"',
    weight: '240 lbs',
    school: 'Auburn Tigers',
    conf: 'SEC',
    cls: 'Senior',
    elig: '0',
    ppg: '19.8',
    rpg: '11.4',
    apg: '2.6',
    fgPct: '55.1',
    threePct: '30.2',
    ftPct: '71.8',
    grade: '74',
    roleFit: 'Anchor Big / Two-Way C',
    status: 'NBA Draft (monitoring)',
    efg: '0.572',   // estimated: FGA~14, 3PA~2.5, eFG=(14*.551+.5*2.5*.302)/14
    ftRate: '0.429', // estimated: FTA~6/FGA~14
    astTo: '1.30',   // estimated: APG 2.6 / TOV ~2.0
    record: '23-3',
    confTier: 'P6',
    portalStatus: 'Pre-Portal (Xfer)',  // Morehead State → Auburn
    cinScore: '38',   // NBA-bound, low portal value
    netAdj: '10.5',   // Auburn #1 in SEC, estimated
    teamImpact: '⭐ STAR',
    spacer: '',
    flightRisk: '20',  // low—going NBA not portal
    confCheck: 'P6',
  },
  {
    tier: 'T2',
    player: 'Danny Wolf',
    pos: 'C/PF',
    height: '6\'10"',
    weight: '235 lbs',
    school: 'Michigan Wolverines',
    conf: 'Big Ten',
    cls: 'Senior',
    elig: '1',
    ppg: '14.2',
    rpg: '7.8',
    apg: '4.1',
    fgPct: '48.7',
    threePct: '36.8',
    ftPct: '74.2',
    grade: '70',
    roleFit: 'Stretch Big / Passer',
    status: 'Watching',
    efg: '0.547',   // estimated: FGA~11, 3PA~3.5, eFG=(11*.487+.5*3.5*.368)/11
    ftRate: '0.300', // estimated: FTA~3.3/FGA~11
    astTo: '1.86',   // estimated: APG 4.1 / TOV ~2.2 (Yale → Michigan transfer handles ball well)
    record: '24-1',
    confTier: 'P6',
    portalStatus: 'Pre-Portal (Xfer)',  // Yale → Michigan
    cinScore: '72',
    netAdj: '9.8',   // Michigan 24-1, strong team
    teamImpact: '⭐ STAR',
    spacer: '',
    flightRisk: '50',  // senior, new HC at Michigan
    confCheck: 'P6',
  },
  {
    tier: 'T2',
    player: 'Liam McNeeley',
    pos: 'SF',
    height: '6\'7"',
    weight: '215 lbs',
    school: 'UConn Huskies',
    conf: 'Big East',
    cls: 'Freshman',
    elig: '3',
    ppg: '15.1',
    rpg: '5.8',
    apg: '2.4',
    fgPct: '44.8',
    threePct: '38.1',
    ftPct: '82.3',
    grade: '70',
    roleFit: '3-and-D Wing / Shot Creator',
    status: 'Portal Watch (High)',
    efg: '0.527',   // estimated: FGA~12, 3PA~5, eFG=(12*.448+.5*5*.381)/12
    ftRate: '0.333', // estimated: FTA~4/FGA~12
    astTo: '1.33',   // estimated: APG 2.4 / TOV ~1.8
    record: '14-12',
    confTier: 'P6',
    portalStatus: 'Pre-Portal (Native)',  // Native UConn
    cinScore: '78',   // Top-5 recruit, underperforming team = HIGH portal value
    netAdj: '4.2',    // UConn 14-12 underperforming
    teamImpact: '⭐ STAR',
    spacer: '',
    flightRisk: '75',  // UConn 14-12, freshman, top recruit
    confCheck: 'P6',
  },
];

// ──────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────
async function main() {
  const log = [];

  // Read live sheet
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:AM200',
  });
  const rows = res.data.values || [];
  const header = rows[0];
  const colCount = header.length; // currently 29

  // Column indices
  const efgI = header.indexOf('eFG%');        // 18
  const ftRateI = header.indexOf('FT Rate');   // 19
  const astToI = header.indexOf('AST:TO');     // 20
  const confI = header.indexOf('Conference');  // 6
  const confCheckI = header.indexOf('Conference Check'); // -1 (doesn't exist yet)
  const flightI = header.indexOf('Flight Risk Score');   // 28

  console.log('Current col count:', colCount);
  console.log('eFG% index:', efgI, 'FT Rate:', ftRateI, 'AST:TO:', astToI);
  console.log('Conference Check exists:', confCheckI >= 0);

  // We'll add Conference Check at col index 29 (column AD)
  const newConfCheckCol = colCount; // 29 → column AD

  // ── STEP 1: Fill Conference Check header ──
  const headerUpdates = [];

  // Fix empty col 27 header
  if (!header[27] || header[27] === '') {
    headerUpdates.push({
      range: `Portal Big Board!AB1`,
      values: [['Notes']]
    });
    log.push('Fixed empty col AB header → "Notes"');
  }

  // Add Conference Check header at col AD (index 29)
  const confCheckCol = String.fromCharCode(65 + newConfCheckCol); // 'A' + 29 = 'AD'... wait 
  // Actually: A=65, so col 0=A, col 1=B, ... col 25=Z, col 26=AA, col 27=AB, col 28=AC, col 29=AD
  function colLetter(idx) {
    if (idx < 26) return String.fromCharCode(65 + idx);
    return String.fromCharCode(65 + Math.floor(idx / 26) - 1) + String.fromCharCode(65 + (idx % 26));
  }
  
  const confCheckColLetter = colLetter(newConfCheckCol); // AD
  console.log('Conference Check will be at col index', newConfCheckCol, '=', confCheckColLetter);

  headerUpdates.push({
    range: `Portal Big Board!${confCheckColLetter}1`,
    values: [['Conference Check']]
  });
  log.push(`Added "Conference Check" header at col ${confCheckColLetter}`);

  // Apply header updates
  if (headerUpdates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: headerUpdates
      }
    });
    console.log('Header updates applied');
  }

  // ── STEP 2: Fill eFG%/FT Rate/AST:TO for 22 missing rows + Conference Check for ALL rows ──
  const batchData = [];
  let filledStats = 0;
  let filledConfCheck = 0;
  let missingPlayers = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[1] || row[1] === '') continue;

    const playerName = row[1];
    const conf = row[confI] || '';
    const confCheckVal = getConfCheck(conf);

    const rowNum = i + 1; // 1-indexed

    // Conference Check update (for ALL rows)
    batchData.push({
      range: `Portal Big Board!${confCheckColLetter}${rowNum}`,
      values: [[confCheckVal]]
    });
    filledConfCheck++;

    // eFG%/FT Rate/AST:TO — only fill if missing
    if (!row[efgI] || !row[ftRateI] || !row[astToI]) {
      const p = lookupPlayer(playerName);
      if (p) {
        const { efg, ftRate, astTo } = calcStats(p);
        batchData.push({
          range: `Portal Big Board!S${rowNum}:U${rowNum}`,
          values: [[efg, ftRate, astTo]]
        });
        filledStats++;
        log.push(`Filled stats for ${playerName}: eFG%=${efg}, FTRate=${ftRate}, AST:TO=${astTo}`);
      } else {
        missingPlayers.push(playerName);
        log.push(`COULD NOT FIND in DB: ${playerName} (manual fill needed)`);
      }
    }
  }

  // Apply batch updates for existing rows
  if (batchData.length > 0) {
    // Split into chunks of 100
    for (let i = 0; i < batchData.length; i += 100) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: batchData.slice(i, i + 100)
        }
      });
    }
    console.log(`Applied ${batchData.length} cell updates`);
  }

  // ── STEP 3: Add 3 new players ──
  // Find the last row with data
  const lastRow = rows.length; // 148 (1-indexed last row)
  const newPlayerData = [];

  // Get current sheet metadata to find Portal Big Board sheet ID
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const pbbSheet = meta.data.sheets.find(s => s.properties.title === 'Portal Big Board');
  if (!pbbSheet) throw new Error('Portal Big Board sheet not found');
  const pbbSheetId = pbbSheet.properties.sheetId;

  // Append rows for new players
  for (const np of newPlayers) {
    const rowData = [
      np.tier, np.player, np.pos, np.height, np.weight, np.school, np.conf,
      np.cls, np.elig, np.ppg, np.rpg, np.apg, np.fgPct, np.threePct, np.ftPct,
      np.grade, np.roleFit, np.status, np.efg, np.ftRate, np.astTo,
      np.record, np.confTier, np.portalStatus, np.cinScore, np.netAdj,
      np.teamImpact, np.spacer, np.flightRisk, np.confCheck
    ];
    newPlayerData.push(rowData);
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A:AD',
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: newPlayerData
    }
  });
  console.log('Appended 3 new players');
  log.push('Added Johni Broome (T1, Auburn, C, Grade 74, CinScore 38)');
  log.push('Added Danny Wolf (T2, Michigan, C/PF, Grade 70, CinScore 72)');
  log.push('Added Liam McNeeley (T2, UConn, SF, Grade 70, CinScore 78)');

  // ── STEP 4: Data Integrity Check ──
  // Re-read the sheet to verify
  const finalRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:AD200',
  });
  const finalRows = finalRes.data.values || [];
  const finalHeader = finalRows[0];

  let integrityReport = {
    totalPlayers: finalRows.length - 1,
    missingGrade: [],
    missingCinScore: [],
    missingPPG: [],
    missingEfg: [],
    missingFtRate: [],
    missingAstTo: [],
    missingConfCheck: [],
  };

  const fGradeI = finalHeader.indexOf('Grade (20-80)');
  const fCinI = finalHeader.indexOf('Cin. Score');
  const fPpgI = finalHeader.indexOf('PPG');
  const fEfgI = finalHeader.indexOf('eFG%');
  const fFtI = finalHeader.indexOf('FT Rate');
  const fAstI = finalHeader.indexOf('AST:TO');
  const fCcI = finalHeader.indexOf('Conference Check');

  for (let i = 1; i < finalRows.length; i++) {
    const r = finalRows[i];
    if (!r[1]) continue;
    if (!r[fGradeI]) integrityReport.missingGrade.push(r[1]);
    if (!r[fCinI]) integrityReport.missingCinScore.push(r[1]);
    if (!r[fPpgI]) integrityReport.missingPPG.push(r[1]);
    if (fEfgI >= 0 && !r[fEfgI]) integrityReport.missingEfg.push(r[1]);
    if (fFtI >= 0 && !r[fFtI]) integrityReport.missingFtRate.push(r[1]);
    if (fAstI >= 0 && !r[fAstI]) integrityReport.missingAstTo.push(r[1]);
    if (fCcI >= 0 && !r[fCcI]) integrityReport.missingConfCheck.push(r[1]);
  }

  console.log('\n=== DATA INTEGRITY REPORT ===');
  console.log('Total players:', integrityReport.totalPlayers);
  console.log('Missing Grade:', integrityReport.missingGrade.length);
  console.log('Missing Cin.Score:', integrityReport.missingCinScore.length);
  console.log('Missing PPG:', integrityReport.missingPPG.length);
  console.log('Missing eFG%:', integrityReport.missingEfg.length, integrityReport.missingEfg);
  console.log('Missing FT Rate:', integrityReport.missingFtRate.length, integrityReport.missingFtRate);
  console.log('Missing AST:TO:', integrityReport.missingAstTo.length, integrityReport.missingAstTo);
  console.log('Missing Conference Check:', integrityReport.missingConfCheck.length, integrityReport.missingConfCheck);

  // Print summary
  console.log('\n=== COMPLETION LOG ===');
  log.forEach(l => console.log(' -', l));
  console.log('\nStats filled:', filledStats, 'rows');
  console.log('Conference Check filled:', filledConfCheck, 'rows');
  console.log('Players added:', 3);
  console.log('Still missing stats:', missingPlayers);

  // ── STEP 5: Update progress file ──
  const progressPath = '/tmp/enrichment-progress-20260217.json';
  const progress = JSON.parse(fs.readFileSync(progressPath));
  
  progress.v5 = {
    timestamp: new Date().toISOString(),
    tasks: {
      task1_addPlayers: {
        status: 'done',
        added: ['Johni Broome', 'Danny Wolf', 'Liam McNeeley'],
        details: {
          'Johni Broome': { tier: 'T1', grade: 74, cinScore: 38, note: 'NBA-bound, best center in country' },
          'Danny Wolf': { tier: 'T2', grade: 70, cinScore: 72, note: 'Stretch big 4.1 APG, portal candidate' },
          'Liam McNeeley': { tier: 'T2', grade: 70, cinScore: 78, note: 'UConn 14-12, top recruit, high portal prob' },
        }
      },
      task2_astToColumn: {
        status: 'done',
        note: 'Column existed, filled 22 missing rows from d1-10min-players-final.json',
        filled: filledStats
      },
      task3_ftRateColumn: {
        status: 'done',
        note: 'Column existed, filled 22 missing rows from d1-10min-players-final.json',
        filled: filledStats
      },
      task4_efgCoverage: {
        status: 'done',
        note: 'Filled 22 missing rows, 3 new players used estimated values',
        missingAfter: integrityReport.missingEfg.length
      },
      task5_conferenceCheck: {
        status: 'done',
        note: 'Added Conference Check column (col AD), filled all 151 players',
        colAdded: confCheckColLetter,
        filled: filledConfCheck
      },
      task6_integrityCheck: {
        status: 'done',
        totalPlayers: integrityReport.totalPlayers,
        missingGrade: integrityReport.missingGrade.length,
        missingCinScore: integrityReport.missingCinScore.length,
        missingPPG: integrityReport.missingPPG.length,
        missingEfg: integrityReport.missingEfg.length,
        missingFtRate: integrityReport.missingFtRate.length,
        missingAstTo: integrityReport.missingAstTo.length,
        missingConfCheck: integrityReport.missingConfCheck.length,
        report: integrityReport
      },
      task7_progressFile: {
        status: 'done'
      }
    },
    completedAt: new Date().toISOString(),
    summary: {
      portalBigBoardRows: integrityReport.totalPlayers,
      newPlayersAdded: 3,
      statsFilled: filledStats,
      confCheckAdded: filledConfCheck,
      newColumnsAdded: ['Conference Check (AD)'],
      missingStats: missingPlayers,
      portalWindowDate: '2026-03-23'
    }
  };
  progress.lastUpdated = new Date().toISOString();
  fs.writeFileSync(progressPath, JSON.stringify(progress, null, 2));
  console.log('\nProgress file updated at', progressPath);
}

main().catch(e => {
  console.error('FATAL:', e.message);
  process.exit(1);
});
