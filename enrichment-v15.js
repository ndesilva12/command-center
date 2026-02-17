/**
 * Enrichment v15 — Cinderella Project Portal Big Board
 * Tasks: Net Adj Rtg fixes, Advanced stats fill, Rankings audit, Big Men tab, Version stamp
 */
const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(creds.client_id, creds.client_secret);
auth.setCredentials({ access_token: creds.access_token, refresh_token: creds.refresh_token });
const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

const report = {
  version: 'v15',
  completedAt: new Date().toISOString(),
  tasks: {},
  cellsUpdated: 0
};

// Column indices (0-based)
const COL = {
  Tier: 0, Player: 1, Position: 2, Height: 3, Weight: 4, School: 5,
  Conference: 6, Class: 7, EligLeft: 8, PPG: 9, RPG: 10, APG: 11,
  FGpct: 12, ThreePpct: 13, FTpct: 14, Grade: 15, RoleFit: 16,
  Status: 17, eFGpct: 18, FTRate: 19, ASTtoTO: 20, TeamRecord: 21,
  ConfTier: 22, PortalStatus: 23, CinScore: 24, NetAdj: 25,
  TeamImpact: 26, Notes: 27, FlightRisk: 28, ConfCheck: 29,
  PortalTarget: 30, CinScoreV2: 31, PosGroup: 32,
  VersionStamp: 33, // AH
  PPG2425: 34, PPG2324: 35, CareerTrend: 36, SeasonsPlayed: 37, TransferHistory: 38
};

// Helper: column index to letter
function colLetter(idx) {
  let s = '';
  idx++;
  while (idx > 0) {
    const r = (idx - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    idx = Math.floor((idx - 1) / 26);
  }
  return s;
}

function cellRef(col, row) {
  return `Portal Big Board!${colLetter(col)}${row}`;
}

async function batchUpdate(updates) {
  // updates: array of { range, value }
  const data = updates.map(u => ({
    range: u.range,
    values: [[u.value]]
  }));
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SHEET_ID,
    resource: {
      valueInputOption: 'USER_ENTERED',
      data
    }
  });
  report.cellsUpdated += updates.length;
  return updates.length;
}

async function task1_netAdjFixes() {
  console.log('\n=== TASK 1: Net Adj Rtg Fixes ===');
  const updates = [];
  
  // Row 41: Milan Momcilovic (main entry) - was 3.5, real value 4.03 from BartTorvik
  updates.push({ range: cellRef(COL.NetAdj, 41), value: '+4.0' });
  
  // Row 153: Jaden Bradley - was "est. +3.5 (unverified)", real 4.48 from BartTorvik
  updates.push({ range: cellRef(COL.NetAdj, 153), value: '+4.5' });
  // Also update eFG%, FT Rate, AST:TO for Jaden Bradley (significant errors)
  updates.push({ range: cellRef(COL.eFGpct, 153), value: '52.2' });
  updates.push({ range: cellRef(COL.FTRate, 153), value: '0.549' });
  updates.push({ range: cellRef(COL.ASTtoTO, 153), value: '2.71' });
  
  // Row 154: Milan Momcilovic (duplicate) - update Net Adj
  updates.push({ range: cellRef(COL.NetAdj, 154), value: '+4.0' });
  
  // Row 158: Jeremy Fears Jr. - was "est. +5.2 (unverified)", real 4.28 from BartTorvik
  updates.push({ range: cellRef(COL.NetAdj, 158), value: '+4.3' });
  // Also update stats for Fears (significant errors)
  updates.push({ range: cellRef(COL.eFGpct, 158), value: '47.0' });
  updates.push({ range: cellRef(COL.FTRate, 158), value: '0.615' });
  updates.push({ range: cellRef(COL.ASTtoTO, 158), value: '4.28' });
  
  await batchUpdate(updates);
  
  report.tasks.task1_netAdjFixes = {
    status: 'COMPLETE',
    updates: [
      { row: 41, player: 'Milan Momcilovic', oldVal: '3.5', newVal: '+4.0', source: 'BartTorvik CSV position 48' },
      { row: 153, player: 'Jaden Bradley', oldVal: 'est. +3.5 (unverified)', newVal: '+4.5', source: 'BartTorvik 4.47974' },
      { row: 154, player: 'Milan Momcilovic (dup)', oldVal: 'est. +3.8 (unverified)', newVal: '+4.0', source: 'BartTorvik 4.03196' },
      { row: 158, player: 'Jeremy Fears Jr.', oldVal: 'est. +5.2 (unverified)', newVal: '+4.3', source: 'BartTorvik 4.27932' },
    ],
    statsAlsoUpdated: ['Jaden Bradley eFG%/FTRate/AST:TO', 'Jeremy Fears Jr. eFG%/FTRate/AST:TO'],
    skipped: ['Danny Wolf (NBA)', 'Liam McNeeley (NBA)', 'Tylor Perry (G-League)', 'Will Riley (NBA)']
  };
  console.log('✓ Task 1 complete:', updates.length, 'cells updated');
}

async function task2_fillMissingStats() {
  console.log('\n=== TASK 2: Fill Missing Advanced Stats ===');
  const updates = [];
  
  // Team records for blank rows
  const teamRecords = JSON.parse(fs.readFileSync('/tmp/team-records-v15.json'));
  
  // Map school names in PBB to our team records keys
  const schoolRecordMap = {
    'Lafayette Leopards': '8-19',
    'James Madison Dukes': '14-13',
    'Gonzaga Bulldogs': '25-2',
    'Utah State Aggies': '22-3',
    'Drake Bulldogs': '17-7',
    'Cornell Big Red': '12-11',
    'Geo. Washington Revolutionaries': '9-17',
    'Florida Atlantic Owls': '14-12',
    'Fresno State Bulldogs': '12-13',
    'Rice Owls': '11-15',
    'Dayton Flyers': null,  // API returned N/A - skip
    'St. Bonaventure Bonnies': '14-11',
    'UAB Blazers': '13-12',
    'Indiana State Sycamores': '10-17',
    'South Florida Bulls': '18-8',
    'VCU Rams': '20-6',
    'New Mexico Lobos': '19-6',
    'George Mason Patriots': null,  // API returned N/A - skip
    "Saint Mary's Gaels": '23-4',
    'Southern Illinois Salukis': '12-15',
    'East Carolina Pirates': '9-16',
    'Washington State Cougars': '11-16',
  };
  
  // Fill team records by scanning the PBB data
  const pbbData = JSON.parse(fs.readFileSync('/tmp/pbb-v15-full.json'));
  const rows = pbbData.rows;
  
  const blanksFixed = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const player = row[COL.Player] || '';
    const school = row[COL.School] || '';
    const teamRec = row[COL.TeamRecord] || '';
    
    if (teamRec === '' && player !== '') {
      const record = schoolRecordMap[school];
      if (record) {
        updates.push({ range: cellRef(COL.TeamRecord, i + 1), value: record });
        blanksFixed.push({ player, school, record, row: i + 1 });
      }
    }
  }
  
  // Fix Graham Ike eFG% format (0.604 → 60.4)
  updates.push({ range: cellRef(COL.eFGpct, 127), value: '60.4' });
  
  // Fix Henri Veesaar Net Adj format (4.2 → +4.2)
  updates.push({ range: cellRef(COL.NetAdj, 86), value: '+4.2' });
  
  // Fix Graham Ike Net Adj format (4.3 → +4.3)
  updates.push({ range: cellRef(COL.NetAdj, 127), value: '+4.3' });
  
  // Fix Graham Ike Team Record
  updates.push({ range: cellRef(COL.TeamRecord, 127), value: '25-2' });
  
  await batchUpdate(updates);
  
  report.tasks.task2_fillMissingStats = {
    status: 'COMPLETE',
    teamRecordsFilled: blanksFixed.length + 1, // +1 for Gonzaga
    efgFormatFixed: ['Graham Ike (0.604 → 60.4)'],
    netAdjFormatFixed: ['Henri Veesaar (4.2 → +4.2)', 'Graham Ike (4.3 → +4.3)'],
    blanks: blanksFixed
  };
  console.log('✓ Task 2 complete:', updates.length, 'cells updated');
  console.log('  Team records filled:', blanksFixed.length + 1);
}

async function task3_rankingsAudit() {
  console.log('\n=== TASK 3: Norman\'s Rankings Integrity Audit ===');
  
  // Read current Norman's Rankings
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Norman's Rankings!A1:Z60"
  });
  const nrRows = resp.data.values || [];
  
  const issues = [];
  const confirmed = [];
  
  // Check known-corrected names
  const knownCorrections = [
    { wrong: 'Caleb Bradley', correct: 'Jaden Bradley', school: 'Arizona' },
    { wrong: 'Bogdan Momcilovic', correct: 'Milan Momcilovic', school: 'Iowa State' },
    { wrong: 'Tre Fears', correct: 'Jeremy Fears Jr.', school: 'Michigan State' },
  ];
  
  // Check for "TBD" entries and NBA players
  const nbaNonEligible = ['Danny Wolf', 'Liam McNeeley', 'Will Riley', 'Flemings'];
  
  for (let i = 0; i < nrRows.length; i++) {
    const row = nrRows[i];
    if (!row || row.length < 2) continue;
    
    const name = row[1] || '';
    const school = row[2] || '';
    
    // Check for wrong names
    for (const corr of knownCorrections) {
      if (name.toLowerCase().includes(corr.wrong.toLowerCase())) {
        issues.push({ row: i + 1, problem: 'WRONG_NAME', name, correction: corr.correct });
      }
    }
    
    // Check for TBD entries that need filling
    if (name.startsWith('TBD ')) {
      issues.push({ row: i + 1, problem: 'TBD_PLACEHOLDER', name, note: 'Placeholder from unranked batch' });
    }
    
    // Check for NBA ineligible players
    for (const nba of nbaNonEligible) {
      if (name.toLowerCase().includes(nba.toLowerCase())) {
        issues.push({ row: i + 1, problem: 'NBA_INELIGIBLE', name, note: 'Should be marked REMOVED' });
      }
    }
    
    // Confirm known-good corrections are in place
    if (name === 'Jaden Bradley' && school.toLowerCase().includes('arizona')) {
      confirmed.push('Jaden Bradley @ Arizona ✓');
    }
    if (name === 'Milan Momcilovic') {
      confirmed.push('Milan Momcilovic ✓ (was Bogdan Momcilovic/FSU)');
    }
    if (name === 'Jeremy Fears Jr.') {
      confirmed.push('Jeremy Fears Jr. ✓ (was Tre Fears)');
    }
    if (row[0] === 'REMOVED' && name === 'Tylor Perry') {
      confirmed.push('Tylor Perry → REMOVED ✓ (G-League)');
    }
  }
  
  report.tasks.task3_rankingsAudit = {
    status: 'COMPLETE',
    totalRows: nrRows.filter(r => r && r.length > 1).length,
    confirmedCorrections: confirmed,
    issues: issues,
    summary: `${confirmed.length} corrections confirmed, ${issues.filter(i => i.problem === 'WRONG_NAME').length} wrong names found, ${issues.filter(i => i.problem === 'TBD_PLACEHOLDER').length} TBD placeholders`
  };
  
  console.log('✓ Task 3 complete:');
  console.log('  Confirmed corrections:', confirmed);
  if (issues.length > 0) {
    console.log('  Issues found:', issues.length);
    issues.forEach(iss => console.log('   -', iss.problem, ':', iss.name, iss.note || ''));
  }
}

async function task4_checkMissingPlayers() {
  console.log('\n=== TASK 4: Check Missing Players ===');
  
  const pbbData = JSON.parse(fs.readFileSync('/tmp/pbb-v15-full.json'));
  const rows = pbbData.rows;
  
  const targets = ['Henri Veesaar', 'Graham Ike', 'Haggerty'];
  const found = [];
  const missing = [];
  
  for (const target of targets) {
    const row = rows.find((r, i) => i > 0 && r && (r[1] || '').toLowerCase().includes(target.toLowerCase()));
    if (row) {
      found.push({ name: row[1], school: row[5], tier: row[0] });
    } else {
      missing.push(target);
    }
  }
  
  report.tasks.task4_missingPlayers = {
    status: 'COMPLETE',
    found: found,
    missing: missing,
    note: missing.length === 0 ? 'All target players already in Portal Big Board' : `Missing: ${missing.join(', ')}`
  };
  
  console.log('✓ Task 4 complete:');
  found.forEach(p => console.log('  ✓ Found:', p.name, '@', p.school, '(', p.tier, ')'));
  missing.forEach(p => console.log('  ✗ Missing:', p));
}

async function task5_bigMenTab() {
  console.log('\n=== TASK 5: Populate Big Men Rankings Tab ===');
  
  // Clear existing content first (rows 1-25)
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: 'Big Men Rankings!A1:P30'
  });
  
  // New data for the tab
  const headers = [
    'Rank', 'Name', 'School', 'Pos', 'Ht', 
    'PPG', 'RPG', 'APG', 'BPG', 'FG%',
    'Net Adj Rtg', 'Cin Score v2', 'Grade (20-80)', 'T1/T2 Desig.', 'Portal Target', 'Notes'
  ];
  
  const bigMen = [
    {
      rank: 1, name: 'Cameron Boozer', school: 'Duke', pos: 'PF', ht: "6' 9\"",
      ppg: 22.8, rpg: 9.9, apg: 4.0, bpg: 0.5, fgPct: 57.5,
      netAdj: '+5.7', cinV2: 88.9, grade: 77, desig: 'T1',
      portalTarget: 'NO',
      notes: "Duke's engine (22.8/9.9/4.0 on 24-2 squad). Best all-around big in country. Near-zero portal risk."
    },
    {
      rank: 2, name: 'AJ Dybantsa', school: 'BYU', pos: 'F', ht: "6' 9\"",
      ppg: 24.4, rpg: 6.6, apg: 3.8, bpg: 0.4, fgPct: 53.6,
      netAdj: '+4.0', cinV2: 80.5, grade: 74, desig: 'T1',
      portalTarget: 'NO',
      notes: "Elite creator at BYU (24.4 PPG). 3 yrs eligibility. Top draft pick — no portal risk unless situation changes."
    },
    {
      rank: 3, name: 'Yaxel Lendeborg', school: 'Michigan', pos: 'PF/C', ht: "6' 9\"",
      ppg: 18.9, rpg: 9.1, apg: 3.4, bpg: 1.4, fgPct: 56.2,
      netAdj: '+5.0', cinV2: 68.2, grade: 70, desig: 'T1',
      portalTarget: 'MAYBE',
      notes: "DJ Burns archetype. Michigan's rim anchor (1.4 BPG, +5.0 net rtg) on 24-1 squad. SR — final season. Most important Cinderella-fit big available."
    },
    {
      rank: 4, name: 'Caleb Wilson', school: 'UNC', pos: 'PF/C', ht: "6' 10\"",
      ppg: 19.8, rpg: 9.4, apg: 2.7, bpg: 1.4, fgPct: 57.8,
      netAdj: '+4.7', cinV2: 73.7, grade: 67, desig: 'T2',
      portalTarget: 'NO',
      notes: "UNC's efficient 6'10\" FR (19.8/9.4 on 20-5). Low portal risk. Track post-tourney."
    },
    {
      rank: 5, name: 'Graham Ike', school: 'Gonzaga', pos: 'C', ht: "7' 0\"",
      ppg: 19.8, rpg: 8.7, apg: 2.7, bpg: 0.7, fgPct: 58.2,
      netAdj: '+4.3', cinV2: 100, grade: 61, desig: 'T2',
      portalTarget: 'MAYBE',
      notes: "Gonzaga center (58.2% FG, Gonzaga 25-2). Grade 61. Center gap addition — verify grad transfer eligibility."
    },
    {
      rank: 6, name: 'Henri Veesaar', school: 'UNC', pos: 'C', ht: "7' 0\"",
      ppg: 16.4, rpg: 9.0, apg: 2.0, bpg: 1.2, fgPct: 61.5,
      netAdj: '+4.2', cinV2: 70.6, grade: 58, desig: 'T2',
      portalTarget: 'MAYBE',
      notes: "UNC's rim protector (61.5% FG, 1.2 BPG). One of only 2 true centers passing P6/FG%>52 filters. Recommend T2 upgrade."
    }
  ];
  
  // Build rows array
  const rowData = [headers];
  for (const p of bigMen) {
    rowData.push([
      p.rank, p.name, p.school, p.pos, p.ht,
      p.ppg, p.rpg, p.apg, p.bpg, p.fgPct,
      p.netAdj, p.cinV2, p.grade, p.desig, p.portalTarget, p.notes
    ]);
  }
  
  // Add separator and legend
  rowData.push([]);
  rowData.push(['', '── CENTER GAP ANALYSIS ──']);
  rowData.push(['', 'True Centers (C pos, FG%>52%, P6/High-Major, Grade≥50): Only 2 qualify']);
  rowData.push(['', 'Veesaar (#6) and Ike (#5) are the ONLY centers passing all quality filters as of 2026-02-17']);
  rowData.push([]);
  rowData.push(['', '── PORTAL TARGET LOGIC ──']);
  rowData.push(['', 'YES = Flight Risk ≥ 60 | MAYBE = 40-59 | NO = < 40']);
  rowData.push([]);
  rowData.push(['', '── T1/T2 DESIGNATION KEY ──']);
  rowData.push(['', 'T1 = Would start on the Cinderella team | T2 = Key rotation / likely starter']);
  rowData.push([]);
  rowData.push(['', `v15 Generated: ${new Date().toISOString()} | Source: BartTorvik + ESPN 2025-26 data`]);
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Big Men Rankings!A1',
    valueInputOption: 'USER_ENTERED',
    resource: { values: rowData }
  });
  
  report.tasks.task5_bigMenTab = {
    status: 'COMPLETE',
    playersAdded: bigMen.map(p => p.name),
    columns: headers,
    note: 'Cleared old 7-player list (included NBA/G-League), replaced with correct 6 big men'
  };
  
  console.log('✓ Task 5 complete: Big Men Rankings tab populated with 6 players');
  bigMen.forEach(p => console.log('  #' + p.rank, p.name, '(' + p.school + ')', p.desig));
}

async function task6_versionStamp() {
  console.log('\n=== TASK 6: Version Stamp ===');
  
  const stampValue = 'Last enriched: v15 | 2026-02-17 | Advanced stats fill | Rankings audit | Big Men tab populated';
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!AH1',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[stampValue]] }
  });
  
  report.tasks.task6_versionStamp = {
    status: 'COMPLETE',
    cell: 'AH1',
    value: stampValue
  };
  
  console.log('✓ Task 6 complete:', stampValue);
}

async function main() {
  console.log('🏀 Cinderella Project DB Enrichment v15');
  console.log('Started:', new Date().toISOString());
  
  try {
    await task1_netAdjFixes();
    await task2_fillMissingStats();
    await task3_rankingsAudit();
    await task4_checkMissingPlayers();
    await task5_bigMenTab();
    await task6_versionStamp();
    
    report.summary = {
      totalCellsUpdated: report.cellsUpdated,
      allTasksComplete: true,
      spreadsheetUrl: 'https://docs.google.com/spreadsheets/d/1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs'
    };
    
    fs.writeFileSync('/tmp/enrichment-v15-complete.json', JSON.stringify(report, null, 2));
    console.log('\n✅ All tasks complete!');
    console.log('Total cells updated:', report.cellsUpdated);
    console.log('Report saved to /tmp/enrichment-v15-complete.json');
    
  } catch (e) {
    console.error('ERROR:', e.message);
    report.error = e.message;
    fs.writeFileSync('/tmp/enrichment-v15-complete.json', JSON.stringify(report, null, 2));
    process.exit(1);
  }
}

main();
