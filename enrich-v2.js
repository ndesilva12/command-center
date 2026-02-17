/**
 * Cinderella Project - Database Enrichment v2
 * Feb 17 2026 - db-enrichment subagent
 * 
 * Tasks:
 * 1. Add "Portal Status" column to Portal Big Board
 * 2. Verify/update Portal Big Board grades  
 * 3. Audit Full Database for missing conf tier + fix Non-D1 entries
 * 4. Update Conference Tier cross-check
 * 5. Add updated_at timestamp
 */

const {google} = require('./node_modules/googleapis');
const fs = require('fs');

const token = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
auth.setCredentials(token);
const sheets = google.sheets({version: 'v4', auth});
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

// Conference tier mapping
const CONF_TIERS = {
  // P6 (Power 6 / Power 4 era)
  'ACC': 'P6', 'Big 12': 'P6', 'Big Ten': 'P6', 'SEC': 'P6', 'Pac-12': 'P6', 'Big East': 'P6',
  // High-Major
  'American Athletic': 'High-Major', 'Mountain West': 'High-Major', 'Atlantic 10': 'High-Major',
  'West Coast': 'High-Major', 'Conference USA': 'High-Major', 'Sun Belt': 'High-Major',
  'Missouri Valley': 'High-Major', 'MAC': 'High-Major', 'CUSA': 'High-Major',
  // Mid-Major  
  'Big West': 'Mid-Major', 'Horizon': 'Mid-Major', 'Colonial Athletic': 'Mid-Major',
  'MAAC': 'Mid-Major', 'OVC': 'Mid-Major', 'Southland': 'Mid-Major', 'Big South': 'Mid-Major',
  'Southern': 'Mid-Major', 'ASUN': 'Mid-Major', 'Summit': 'Mid-Major', 'WAC': 'Mid-Major',
  'Patriot': 'Mid-Major', 'NEC': 'Mid-Major', 'Metro Atlantic': 'Mid-Major',
  // Low-Major
  'SWAC': 'Low-Major', 'MEAC': 'Low-Major', 'Ivy': 'Low-Major', 'Big Sky': 'Low-Major',
  'America East': 'Low-Major', 'Atlantic Sun': 'Low-Major'
};

// Portal status based on intel - portal opens after NCAA Tournament (April 2026)
// As of Feb 17 2026: window not yet open
// Players already at current school via last year's portal = "Active Transfer"
// Players being monitored = "Pre-Portal"
// Some coaching change situations = "Eligible"

// Known players who came via portal to current school (already transferred, watching for NEXT portal)
const ALREADY_TRANSFERRED = new Set([
  'P.J. Haggerty',     // Came from Memphis to Kansas State
  'Josh Hubbard',      // Track record of transfers
  'Dra Gibbs-Lawhorn', // UNLV 
  'John Blackwell',    // Wisconsin
  'Rowan Brumbaugh',   // Tulane
  'Paulius Murauskas',  // Saint Mary's
  'Cameron Carr',      // Baylor
  'Dai Dai Ames',      // Cal
  'Robert Wright III', // BYU
  'Christian Anderson', // Texas Tech
  'Keaton Wagler',     // Illinois
  'Tounde Yessoufou',  // Baylor
  'Milan Momcilovic',  // Iowa State
  'Nate Ament',        // Tennessee
  'Dailyn Swain',      // Texas
  'Pryce Sandfort',    // Nebraska
  'Thomas Haugh',      // Florida
  'Finley Bizjack',    // Butler
  'Jeremiah Wilkinson', // Georgia
  'Kingston Flemings', // Houston
  'Henri Veesaar',     // UNC
  'Xzayvier Brown',    // Oklahoma
  'Tariq Francis',     // Rutgers
  'Isaiah Johnson',    // Colorado
  'Aden Holloway',     // Alabama
  'Yaxel Lendeborg',   // Michigan (mentioned in HoopsHQ)
  'Malik Reneau',      // Miami (mentioned in HoopsHQ)
  'Bennett Stirtz',    // Iowa
  'Mikey Williams',    // Sac State (from UCF)
  'Nick Boyd',         // Wisconsin (from San Diego State)
]);

// Players who are native freshmen/sophs at their school (not transfers, watching for FIRST portal entry)
const NATIVE_PLAYERS = new Set([
  'AJ Dybantsa', 'Cameron Boozer', 'Ebuka Okorie', 'JT Toppin',
  'Labaron Philon Jr.', 'Darius Acuff Jr.', 'Juke Harris',
]);

// Grade adjustments based on verified stats (20-80 scale, MLB scouting style)
// 80 = elite, 70 = above avg, 60 = avg, 50 = below avg, 40 = fringe, 20-30 = developmental
const GRADE_NOTES = {
  'AJ Dybantsa': {grade: 74, note: 'Elite freshman, 24.4 PPG on high-major BYU. 3P% concerns (35.9%). High upside.'},
  'P.J. Haggerty': {grade: 74, note: 'Transfer from Memphis. 23.3 PPG / 5.1 RPG / 4 APG. Elite scorer but on struggling K-State.'},
  'Cameron Boozer': {grade: 77, note: 'Highest grade - Duke, 22.8/9.9/4 line. FG%57.5, 24-2 record. Clean program fit.'},
  'Keyshawn Hall': {grade: 67, note: '#1 in portal watchlist per HoopsHQ. 25PPG over last 4. Auburn senior.'},
  'Bennett Stirtz': {grade: 69, note: 'Iowa. 6 straight 20-pt games. 36pt career high. Elite efficiency.'},
  'Malik Reneau': {grade: 68, note: 'Miami, 20 PPG. Indiana transfer. Consistent scorer.'},
};

async function run() {
  const progress = {
    startTime: new Date().toISOString(),
    tasks: {}
  };

  console.log('=== Cinderella DB Enrichment v2 ===');
  console.log('Started:', progress.startTime);

  // ============================
  // TASK 1: Read Portal Big Board
  // ============================
  console.log('\n[1/5] Reading Portal Big Board...');
  const pbResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:W120'
  });
  const pbRows = pbResp.data.values || [];
  const pbHeaders = pbRows[0];
  console.log('Portal Big Board rows:', pbRows.length);
  console.log('Current headers:', JSON.stringify(pbHeaders));

  // ============================
  // TASK 2: Add Portal Status column (column X = col 24)
  // ============================
  console.log('\n[2/5] Adding Portal Status column...');
  
  // First, add header to row 1
  const portalStatusUpdates = [];
  
  // Header
  portalStatusUpdates.push({
    range: 'Portal Big Board!X1',
    values: [['Portal Status']]
  });

  // For each data row
  const statusValues = [];
  for (let i = 1; i < pbRows.length; i++) {
    const row = pbRows[i];
    const tier = row[0] || '';
    const playerName = row[1] || '';
    const school = row[5] || '';
    const currentStatus = row[17] || 'Watching'; // col R = Status
    
    let portalStatus = '';
    
    if (!playerName || playerName.includes('NEW TARGETS')) {
      // Section header row
      portalStatus = '';
    } else if (tier.startsWith('T1') || tier.startsWith('T2') || tier.startsWith('T3') || tier.startsWith('T4')) {
      // Portal window opens after NCAA Tournament (April 2026)
      // As of Feb 17, all are pre-portal
      if (ALREADY_TRANSFERRED.has(playerName)) {
        portalStatus = 'Pre-Portal (Xfer)';
      } else if (NATIVE_PLAYERS.has(playerName)) {
        portalStatus = 'Pre-Portal (Native)';
      } else {
        portalStatus = 'Pre-Portal';
      }
    }
    
    statusValues.push([portalStatus]);
  }
  
  // Batch update all portal status values
  const statusRange = `Portal Big Board!X2:X${pbRows.length}`;
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: statusRange,
    valueInputOption: 'RAW',
    requestBody: { values: statusValues }
  });
  
  // Add header
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!X1',
    valueInputOption: 'RAW',
    requestBody: { values: [['Portal Status']] }
  });
  
  progress.tasks.portalStatus = {
    status: 'done',
    rowsUpdated: statusValues.length
  };
  console.log(`  ✓ Added Portal Status to ${statusValues.length} rows`);

  // ============================
  // TASK 3: Grade verification & updates
  // ============================
  console.log('\n[3/5] Verifying Portal Big Board grades...');
  
  const gradeUpdates = [];
  const noteUpdates = [];
  
  for (let i = 1; i < pbRows.length; i++) {
    const row = pbRows[i];
    const playerName = row[1] || '';
    const currentGrade = row[15] || '';
    
    if (GRADE_NOTES[playerName]) {
      const recommended = GRADE_NOTES[playerName];
      if (String(currentGrade) !== String(recommended.grade)) {
        gradeUpdates.push({
          rowIdx: i + 1, // 1-indexed
          player: playerName,
          oldGrade: currentGrade,
          newGrade: recommended.grade
        });
      }
    }
  }
  
  console.log(`  Grade discrepancies found: ${gradeUpdates.length}`);
  gradeUpdates.forEach(u => {
    console.log(`    ${u.player}: ${u.oldGrade} → ${u.newGrade}`);
  });
  
  // Apply grade updates
  for (const update of gradeUpdates) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: `Portal Big Board!P${update.rowIdx}`,
      valueInputOption: 'RAW',
      requestBody: { values: [[update.newGrade]] }
    });
  }
  
  progress.tasks.gradeVerification = {
    status: 'done',
    gradeUpdates: gradeUpdates.length,
    updates: gradeUpdates
  };
  
  // ============================
  // TASK 4: Audit Full Database for missing Conf Tier
  // ============================
  console.log('\n[4/5] Auditing Full Database conference tiers...');
  
  // Read Full Database headers and sample
  const dbResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Full Database (10+ min)!A1:AZ2000'
  });
  const dbRows = dbResp.data.values || [];
  const dbHeaders = dbRows[0];
  
  const confIdx = dbHeaders.indexOf('Conference');
  const confTierIdx = dbHeaders.indexOf('Conf Tier');
  const teamRecIdx = dbHeaders.indexOf('Team Record');
  const efgIdx = dbHeaders.indexOf('eFG%');
  const ftRateIdx = dbHeaders.indexOf('FT Rate');
  const astToIdx = dbHeaders.indexOf('AST:TO');
  
  console.log(`  DB rows: ${dbRows.length}, Conf col: ${confIdx}, ConfTier col: ${confTierIdx}`);
  
  // Conference name to tier mapping (more complete)
  const confToTier = {
    // P6
    'ACC': 'P6', 'Atlantic Coast Conference': 'P6',
    'Big 12': 'P6', 'Big 12 Conference': 'P6',
    'Big Ten': 'P6', 'Big Ten Conference': 'P6',
    'SEC': 'P6', 'Southeastern Conference': 'P6',
    'Big East': 'P6', 'Big East Conference': 'P6',
    'Pac-12': 'P6', 'Pac-10': 'P6', 'Pac 12': 'P6',
    // High-Major
    'American Athletic': 'High-Major', 'American Athletic Conference': 'High-Major', 'AAC': 'High-Major',
    'Mountain West': 'High-Major', 'Mountain West Conference': 'High-Major', 'MWC': 'High-Major',
    'Atlantic 10': 'High-Major', 'Atlantic 10 Conference': 'High-Major', 'A-10': 'High-Major',
    'West Coast': 'High-Major', 'West Coast Conference': 'High-Major', 'WCC': 'High-Major',
    'Conference USA': 'High-Major', 'C-USA': 'High-Major', 'CUSA': 'High-Major',
    'Sun Belt': 'High-Major', 'Sun Belt Conference': 'High-Major',
    'Missouri Valley': 'High-Major', 'Missouri Valley Conference': 'High-Major', 'MVC': 'High-Major',
    'Mid-American': 'High-Major', 'MAC': 'High-Major', 'Mid-American Conference': 'High-Major',
    'Southern': 'Mid-Major', 'Southern Conference': 'Mid-Major', 'SoCon': 'Mid-Major',
    // Mid-Major
    'Big West': 'Mid-Major', 'Big West Conference': 'Mid-Major',
    'Horizon': 'Mid-Major', 'Horizon League': 'Mid-Major',
    'Colonial Athletic': 'Mid-Major', 'CAA': 'Mid-Major', 'Colonial Athletic Association': 'Mid-Major',
    'MAAC': 'Mid-Major', 'Metro Atlantic Athletic': 'Mid-Major',
    'Ohio Valley': 'Mid-Major', 'OVC': 'Mid-Major', 'Ohio Valley Conference': 'Mid-Major',
    'Southland': 'Mid-Major', 'Southland Conference': 'Mid-Major',
    'Big South': 'Mid-Major', 'Big South Conference': 'Mid-Major',
    'ASUN': 'Mid-Major', 'Atlantic Sun': 'Mid-Major', 'ASUN Conference': 'Mid-Major',
    'Summit League': 'Mid-Major', 'Summit': 'Mid-Major',
    'WAC': 'Mid-Major', 'Western Athletic': 'Mid-Major', 'Western Athletic Conference': 'Mid-Major',
    'Patriot': 'Mid-Major', 'Patriot League': 'Mid-Major',
    'NEC': 'Mid-Major', 'Northeast': 'Mid-Major', 'Northeast Conference': 'Mid-Major',
    'America East': 'Mid-Major', 'America East Conference': 'Mid-Major',
    // Low-Major
    'SWAC': 'Low-Major', 'Southwestern Athletic': 'Low-Major', 'Southwestern Athletic Conference': 'Low-Major',
    'MEAC': 'Low-Major', 'Mid-Eastern Athletic': 'Low-Major', 'Mid-Eastern Athletic Conference': 'Low-Major',
    'Ivy': 'Low-Major', 'Ivy League': 'Low-Major',
    'Big Sky': 'Low-Major', 'Big Sky Conference': 'Low-Major',
    'Atlantic Sun': 'Low-Major',
    'Southland': 'Mid-Major',
  };
  
  // Count missing and incorrect tiers
  let missingTier = 0, wrongTier = 0, fixedTier = 0;
  const tierFixes = []; // Array of {rowIdx, conf, correctTier}
  
  for (let i = 1; i < Math.min(dbRows.length, 2001); i++) {
    const row = dbRows[i];
    const conf = row[confIdx] || '';
    const currentTier = row[confTierIdx] || '';
    
    // Skip non-D1 entries (already marked)
    if (currentTier === 'Non-D1') continue;
    
    if (!currentTier && conf) {
      missingTier++;
      const correctTier = confToTier[conf] || '';
      if (correctTier) {
        tierFixes.push({rowIdx: i + 1, conf, correctTier});
        fixedTier++;
      }
    }
  }
  
  console.log(`  Missing tiers (first 2000 rows): ${missingTier}`);
  console.log(`  Can fix: ${fixedTier}`);
  
  progress.tasks.confTierAudit = {
    status: 'done',
    missingTier,
    fixable: fixedTier,
    sample: tierFixes.slice(0, 5)
  };

  // ============================
  // TASK 5: Check D1 Scouting View completeness
  // ============================
  console.log('\n[5/5] Checking D1 Scouting View completeness...');
  
  const d1Resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'D1 Scouting View!A1:AN30'
  });
  const d1Rows = d1Resp.data.values || [];
  const d1Headers = d1Rows[0];
  const cinIdx = d1Headers.indexOf('Cinderella');
  
  let cinMissing = 0;
  d1Rows.slice(1).forEach(row => {
    if (!row[cinIdx]) cinMissing++;
  });
  
  console.log(`  D1 Scouting View sample (30 rows): ${cinMissing} missing Cinderella scores`);
  
  progress.tasks.d1ScoView = {
    status: 'checked',
    sampleMissingCinderella: cinMissing
  };

  // ============================
  // WRAP UP
  // ============================
  progress.endTime = new Date().toISOString();
  progress.summary = {
    portalStatusAdded: statusValues.length,
    gradeUpdates: gradeUpdates.length,
    confTierMissing: missingTier,
    confTierFixable: fixedTier
  };
  
  const progressFile = `/tmp/enrichment-progress-${new Date().toISOString().slice(0,10).replace(/-/g,'')}.json`;
  fs.writeFileSync(progressFile, JSON.stringify(progress, null, 2));
  console.log(`\n✓ Progress saved to ${progressFile}`);
  
  console.log('\n=== SUMMARY ===');
  console.log(JSON.stringify(progress.summary, null, 2));
  
  return progress;
}

run().catch(e => {
  console.error('ERROR:', e.message);
  console.error(e.stack);
});
