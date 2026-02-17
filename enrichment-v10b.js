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
  console.log('=== ENRICHMENT V10b START ===\n');

  // ============================================================
  // Read Portal Big Board
  // ============================================================
  const readResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Portal Big Board!A1:AF200',
  });
  const allRows = readResp.data.values || [];
  const header = allRows[0] || [];

  console.log('Header columns:');
  header.forEach((h, i) => console.log(`  ${getColumnLetter(i)} (${i}): "${h}"`));

  // Column indices based on actual header
  // A=0:Tier, B=1:Player, L=11:APG, P=15:Grade(20-80), Y=24:Cin.Score, Z=25:Net Adj.Rtg
  // AB=27:Notes, AE=30:Portal Target
  
  // Find Grade column
  let gradeColIdx = -1;
  for (let i = 0; i < header.length; i++) {
    if ((header[i] || '').toLowerCase().includes('grade')) {
      gradeColIdx = i;
      console.log(`\nFound Grade column at index ${i} (column ${getColumnLetter(i)}): "${header[i]}"`);
      break;
    }
  }
  
  if (gradeColIdx === -1) {
    console.log('Grade column not found! Using index 15 as fallback.');
    gradeColIdx = 15; // column P
  }

  const updates = [];

  // ============================================================
  // TASK 1: Fix Walter Clayton Jr.
  // ============================================================
  console.log('\n=== TASK 1: Fix Walter Clayton Jr. ===');
  
  let claytonRowIdx = -1;
  for (let i = 1; i < allRows.length; i++) {
    const name = (allRows[i][1] || '').toLowerCase();
    if (name.includes('clayton') && (name.includes('walter') || name.includes('jr'))) {
      claytonRowIdx = i;
      break;
    }
  }
  // Try broader search
  if (claytonRowIdx === -1) {
    for (let i = 1; i < allRows.length; i++) {
      const name = (allRows[i][1] || '').toLowerCase();
      if (name.includes('clayton')) {
        console.log(`Found Clayton variant at row ${i+1}: "${allRows[i][1]}"`);
        if ((allRows[i][5] || '').toLowerCase().includes('florida')) {
          claytonRowIdx = i;
          break;
        }
      }
    }
  }

  if (claytonRowIdx !== -1) {
    const sheetRow = claytonRowIdx + 1;
    const claytonRow = allRows[claytonRowIdx];
    console.log(`Found at sheet row ${sheetRow}: Tier="${claytonRow[0]}", NetAdj="${claytonRow[25]}", Grade="${claytonRow[gradeColIdx]}"`);
    
    // Fix tier: T1 → T2
    updates.push({ range: `Portal Big Board!A${sheetRow}`, values: [['T2']] });
    
    // Fix NetAdj to "actual +0.5"
    const currentNetAdj = (claytonRow[25] || '').toString();
    if (!currentNetAdj.startsWith('actual')) {
      updates.push({ range: `Portal Big Board!Z${sheetRow}`, values: [['actual +0.5']] });
    } else {
      console.log('NetAdj already has "actual" prefix, keeping as-is but ensuring correct value');
      updates.push({ range: `Portal Big Board!Z${sheetRow}`, values: [['actual +0.5']] });
    }
    
    // Add CORRECTED note (Notes is at AB = index 27)
    const notesIdx = 27; // AB column
    const existingNote = (claytonRow[notesIdx] || '').toString();
    const newNote = existingNote ? existingNote + ' | CORRECTED' : 'CORRECTED';
    updates.push({ range: `Portal Big Board!AB${sheetRow}`, values: [[newNote]] });
    
    console.log(`Clayton updates queued: A${sheetRow}=T2, Z${sheetRow}=actual +0.5, AB${sheetRow}=${newNote}`);
  } else {
    console.log('ERROR: Walter Clayton Jr. not found!');
  }

  // ============================================================
  // TASK 2: Cin Score v2 (corrected Grade column)
  // ============================================================
  console.log('\n=== TASK 2: Calculate Cin Score v2 (corrected) ===');
  
  // Add header AF1
  updates.push({ range: 'Portal Big Board!AF1', values: [['Cin Score v2']] });
  
  let playersWithPenalty = 0;
  let playerRows = [];
  let skippedRows = [];
  
  for (let i = 1; i < allRows.length; i++) {
    const row = allRows[i];
    const sheetRow = i + 1;
    
    const tierA = (row[0] || '').trim();
    const nameB = (row[1] || '').trim();
    
    // Skip section header rows
    if (!nameB) { skippedRows.push({row: sheetRow, reason: 'empty name'}); continue; }
    if (nameB.includes('NEW TARGETS') || nameB.includes('HOOPSHQ') || 
        nameB.includes('HIGH-MAJOR') || nameB.includes('WATCHLIST') ||
        nameB.includes('EXPANSION') || nameB.includes('TIER') ||
        nameB === 'Player') { 
      skippedRows.push({row: sheetRow, reason: 'section header', name: nameB});
      continue; 
    }
    
    // Grade (20-80 scale) - column P (index 15)
    const gradeRaw = (row[gradeColIdx] || '').toString().trim();
    const gradeL = parseFloat(gradeRaw) || 0;
    
    // Cin Score v1 - column Y (index 24)
    const cinV1Raw = (row[24] || '').toString().trim();
    const cinV1 = parseFloat(cinV1Raw);
    if (isNaN(cinV1)) { 
      skippedRows.push({row: sheetRow, reason: 'no cinV1', name: nameB});
      continue; 
    }
    
    // Net Adj Rtg - column Z (index 25)
    const netAdjZ = (row[25] || '').toString().trim();
    
    let netAdjVal = null;
    let isEstimated = false;
    
    if (netAdjZ.toLowerCase().startsWith('est.') || netAdjZ.toLowerCase().startsWith('est ')) {
      isEstimated = true;
      const match = netAdjZ.match(/[-+]?\d+\.?\d*/);
      if (match) netAdjVal = parseFloat(match[0]);
    } else if (netAdjZ.toLowerCase().startsWith('actual')) {
      const match = netAdjZ.match(/[-+]?\d+\.?\d*/);
      if (match) netAdjVal = parseFloat(match[0]);
    } else {
      const num = parseFloat(netAdjZ);
      if (!isNaN(num)) netAdjVal = num;
    }
    
    let penalty = 0;
    
    // Reality check: only apply NetAdj penalty if we have confirmed (non-estimated) data
    if (!isEstimated && netAdjVal !== null) {
      const isTrappedStar = gradeL >= 65 && netAdjVal < 0;
      
      if (netAdjVal < -3) {
        penalty += isTrappedStar ? 5 : 15;
      } else if (netAdjVal < 0) {
        penalty += isTrappedStar ? 5 : 8;
      }
    }
    
    // Grade penalty: applies regardless of est. status
    if (gradeL > 0 && gradeL < 52) {
      penalty += 10;
    }
    
    const cinV2 = Math.max(cinV1 - penalty, 0);
    
    if (penalty > 0) playersWithPenalty++;
    
    playerRows.push({
      sheetRow, name: nameB, cinV1, cinV2, penalty,
      netAdjVal, isEstimated, gradeL, tierA,
    });
    
    updates.push({
      range: `Portal Big Board!AF${sheetRow}`,
      values: [[cinV2]],
    });
  }
  
  console.log(`Cin Score v2 calculated for ${playerRows.length} players`);
  console.log(`Players with any penalty: ${playersWithPenalty}`);
  console.log(`Skipped rows: ${skippedRows.length}`);
  
  console.log('\nTop 15 players with highest penalties:');
  playerRows.filter(p => p.penalty > 0).sort((a,b) => b.penalty - a.penalty).slice(0,15).forEach(p => {
    console.log(`  Row ${p.sheetRow} ${p.name}: CinV1=${p.cinV1} → CinV2=${p.cinV2} (penalty=${p.penalty}, NetAdj=${p.isEstimated ? 'est.' : ''}${p.netAdjVal}, Grade=${p.gradeL})`);
  });
  
  console.log('\nPlayers with NO penalty (good signs):');
  playerRows.filter(p => p.penalty === 0).slice(0,10).forEach(p => {
    console.log(`  ${p.name}: CinV1=CinV2=${p.cinV1}, NetAdj=${p.netAdjVal}, Grade=${p.gradeL}`);
  });

  // ============================================================
  // Write TASKS 1 & 2
  // ============================================================
  console.log(`\n=== WRITING ${updates.length} UPDATES ===`);
  
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: updates,
    },
  });
  console.log('Tasks 1 & 2 writes complete!');

  // Save for later steps
  fs.writeFileSync('/tmp/player-rows-v10b.json', JSON.stringify(playerRows, null, 2));
  fs.writeFileSync('/tmp/skipped-rows-v10.json', JSON.stringify(skippedRows, null, 2));
  
  return { playerRows, claytonRowIdx, gradeColIdx };
}

main().then(result => {
  console.log('\n=== TASKS 1 & 2 DONE ===');
  console.log('Grade column used:', getColumnLetter(result.gradeColIdx), `(index ${result.gradeColIdx})`);
}).catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
