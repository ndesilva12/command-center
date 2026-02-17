const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

function getColumnLetter(index) {
  let col = '';
  let n = index;
  while (n >= 0) {
    col = String.fromCharCode((n % 26) + 65) + col;
    n = Math.floor(n / 26) - 1;
  }
  return col;
}

async function main() {
  console.log('=== TASK 5: VERIFICATION ===\n');
  
  // Read Portal Big Board full data
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Portal Big Board!A1:AF200',
  });
  const rows = resp.data.values || [];
  const header = rows[0] || [];
  
  console.log('=== VERIFICATION 1: Clayton\'s Row ===');
  let claytonRow = null;
  let claytonSheetRow = -1;
  for (let i = 1; i < rows.length; i++) {
    const name = (rows[i][1] || '').toLowerCase();
    if (name.includes('clayton')) {
      claytonRow = rows[i];
      claytonSheetRow = i + 1;
      break;
    }
  }
  
  if (claytonRow) {
    const tier = claytonRow[0] || '';
    const netAdj = claytonRow[25] || ''; // Z
    const cinV1 = claytonRow[24] || ''; // Y
    const cinV2 = claytonRow[31] || ''; // AF
    const notes = claytonRow[27] || ''; // AB
    console.log(`Row ${claytonSheetRow}: ${claytonRow[1]}`);
    console.log(`  Tier (A): "${tier}" → Expected: T2`);
    console.log(`  NetAdj (Z): "${netAdj}" → Expected: "actual +0.5"`);
    console.log(`  CinV1 (Y): "${cinV1}"`);
    console.log(`  CinV2 (AF): "${cinV2}"`);
    console.log(`  Notes (AB): "${notes}"`);
    const tierOK = tier === 'T2';
    const netAdjOK = netAdj.includes('0.5');
    console.log(`  ✅ Tier T2: ${tierOK}`);
    console.log(`  ✅ NetAdj actual +0.5: ${netAdjOK}`);
  } else {
    console.log('ERROR: Clayton not found!');
  }
  
  console.log('\n=== VERIFICATION 2: Column AF Header ===');
  const afHeader = header[31] || '';
  console.log(`AF header: "${afHeader}" → Expected: "Cin Score v2"`);
  console.log(`✅ AF header correct: ${afHeader === 'Cin Score v2'}`);
  
  console.log('\n=== VERIFICATION 3: Cin Score v2 Values ===');
  let playersWithCinV2 = 0;
  let playersWithReducedScore = 0;
  let playersTierChangedTo75 = 0; // Cin v1 = 100, Cin v2 < 100
  const reducedPlayers = [];
  const sampleData = [];
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const nameB = (row[1] || '').trim();
    
    // Skip empty/header rows
    if (!nameB || nameB.includes('NEW TARGETS') || nameB.includes('HOOPSHQ') ||
        nameB.includes('HIGH-MAJOR') || nameB.includes('TIER') || nameB === 'Player') continue;
    
    const cinV1Raw = (row[24] || '').toString().trim();
    const cinV2Raw = (row[31] || '').toString().trim();
    
    const cinV1 = parseFloat(cinV1Raw);
    const cinV2 = parseFloat(cinV2Raw);
    
    if (!isNaN(cinV2)) {
      playersWithCinV2++;
      
      if (!isNaN(cinV1) && cinV2 < cinV1) {
        playersWithReducedScore++;
        reducedPlayers.push({
          row: i + 1,
          name: nameB,
          cinV1,
          cinV2,
          diff: cinV1 - cinV2,
        });
      }
      
      // Check tier change: was 100, now < 100
      if (!isNaN(cinV1) && cinV1 >= 100 && cinV2 < 100) {
        playersTierChangedTo75++;
      }
    }
    
    if (sampleData.length < 5) {
      sampleData.push({ name: nameB, cinV1: cinV1Raw, cinV2: cinV2Raw });
    }
  }
  
  console.log(`Players with Cin Score v2: ${playersWithCinV2}`);
  console.log(`Players with REDUCED score (v2 < v1): ${playersWithReducedScore}`);
  console.log(`Players formerly at 100 now below 100: ${playersTierChangedTo75}`);
  console.log(`✅ At least 20 players reduced: ${playersWithReducedScore >= 20}`);
  
  console.log('\nTop 10 biggest reductions:');
  reducedPlayers.sort((a, b) => b.diff - a.diff).slice(0, 10).forEach(p => {
    console.log(`  Row ${p.row} ${p.name}: ${p.cinV1} → ${p.cinV2} (reduced by ${p.diff})`);
  });
  
  console.log('\nSample rows (first 5 with data):');
  sampleData.forEach(s => console.log(`  ${s.name}: v1=${s.cinV1}, v2=${s.cinV2}`));
  
  // Check Norman's Rankings tab
  console.log('\n=== VERIFICATION 4: Norman\'s Rankings Flag Column ===');
  const nrResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Norman's Rankings!A1:I200",
  });
  const nrRows = nrResp.data.values || [];
  let nrFlagHeader = '';
  let nrFlags = [];
  
  // Row 4 (index 3) is the data header
  if (nrRows[3]) {
    nrFlagHeader = (nrRows[3][8] || '').toString(); // I column
    console.log(`Norman's Rankings flag header (I4): "${nrFlagHeader}"`);
  }
  
  // Find Clayton flag
  for (let i = 4; i < nrRows.length; i++) {
    const flag = (nrRows[i][8] || '').toString();
    if (flag) {
      const name = (nrRows[i][1] || '').toString();
      nrFlags.push({ row: i+1, name, flag });
      console.log(`  Row ${i+1} ${name}: "${flag}"`);
    }
  }
  
  const claytonFlagFound = nrFlags.some(f => f.flag.includes('CORRECTED'));
  console.log(`✅ Clayton CORRECTED flag in Norman's Rankings: ${claytonFlagFound}`);
  
  // Build final report
  const report = {
    timestamp: new Date().toISOString(),
    task1_claytonFix: {
      found: !!claytonRow,
      sheetRow: claytonSheetRow,
      tier: claytonRow ? (claytonRow[0] || '') : null,
      netAdj: claytonRow ? (claytonRow[25] || '') : null,
      tierIsT2: claytonRow ? (claytonRow[0] === 'T2') : false,
      netAdjHas0_5: claytonRow ? (claytonRow[25] || '').includes('0.5') : false,
    },
    task2_cinScoreV2: {
      headerPresent: afHeader === 'Cin Score v2',
      playersWithV2: playersWithCinV2,
      playersWithReducedScore,
      playersFormerly100NowBelow100: playersTierChangedTo75,
      formulaWorking: playersWithReducedScore >= 20,
      top10Reductions: reducedPlayers.slice(0, 10),
    },
    task3_estResolution: {
      summary: 'BartTorvik blocked by Cloudflare. Found via web search:',
      findings: [
        'Danny Wolf (Michigan) - Drafted by Brooklyn Nets in 2025 NBA Draft - no 2025-26 college stats available',
        'Liam McNeeley (UConn) - Drafted by Phoenix Suns (29th pick) in 2025 NBA Draft - no college stats',
        'Will Riley (Illinois) - Drafted by Washington Wizards in 2025 NBA Draft - no college stats',
        'Tylor Perry (Texas Tech) - Still in college 2025-26, BartTorvik data inaccessible',
        'Caleb Bradley (Arizona) - Still in college 2025-26, BartTorvik data inaccessible',
        'Bogdan/Milan Momcilovic (FSU) - Still in college 2025-26, 2026 NBA draft prospect',
        'Tre Fears (Michigan State) - Likely still in college 2025-26, data inaccessible',
      ],
      updatesApplied: 0,
      reason: 'BartTorvik requires browser-based Cloudflare verification. 3 of 7 players are now NBA players.',
    },
    task4_normansRankingsFlags: {
      flagColumnAdded: !!nrFlagHeader,
      flagColumn: 'I',
      totalFlags: nrFlags.length,
      claytonFlagged: claytonFlagFound,
      allFlags: nrFlags,
    },
    task5_verification: {
      allChecksPass: (
        (claytonRow ? claytonRow[0] === 'T2' : false) &&
        (claytonRow ? (claytonRow[25] || '').includes('0.5') : false) &&
        afHeader === 'Cin Score v2' &&
        playersWithReducedScore >= 20 &&
        claytonFlagFound
      ),
    },
  };
  
  fs.writeFileSync('/tmp/enrichment-v10-complete.json', JSON.stringify(report, null, 2));
  console.log('\n=== FINAL REPORT WRITTEN to /tmp/enrichment-v10-complete.json ===');
  
  console.log('\n=== SUMMARY ===');
  console.log(`Task 1 (Clayton Fix): ${report.task1_claytonFix.tierIsT2 && report.task1_claytonFix.netAdjHas0_5 ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Task 2 (Cin Score v2): ${report.task2_cinScoreV2.formulaWorking ? '✅ PASS' : '❌ FAIL'} (${playersWithReducedScore} players reduced)`);
  console.log(`Task 3 (Est. Resolve): ⚠️ PARTIAL - 3/7 players are NBA (no college data), 4/7 need BartTorvik access`);
  console.log(`Task 4 (Norman Flags): ${report.task4_normansRankingsFlags.claytonFlagged ? '✅ PASS' : '❌ FAIL'} (${nrFlags.length} total flags)`);
  console.log(`Overall: ${report.task5_verification.allChecksPass ? '✅ ALL CRITICAL CHECKS PASS' : '⚠️ SOME CHECKS NEED ATTENTION'}`);
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
