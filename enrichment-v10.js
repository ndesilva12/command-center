const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

const SECTION_LABELS = [
  'T4', 'T5', 'T3', 'T1', 'T2',
  'T4 - NEW TARGETS', 'T5 - HOOPSHQ WATCHLIST', 'T3 - HIGH-MAJOR EXPANSION',
];

function isSectionHeader(row) {
  const a = (row[0] || '').trim();
  const b = (row[1] || '').trim();
  // Section headers have tier in col A and a descriptive label in col B, or are blank
  if (!b && !a) return true;
  if (b && b.startsWith('T') && !b.includes(' ') && b.length <= 3) return false; // actual tier values
  // If col B looks like a section header label
  if (b.includes('NEW TARGETS') || b.includes('HOOPSHQ') || b.includes('HIGH-MAJOR') || 
      b.includes('WATCHLIST') || b.includes('EXPANSION') || b.includes('TIER')) return true;
  return false;
}

async function main() {
  console.log('=== ENRICHMENT V10 START ===\n');

  // ============================================================
  // STEP 1: Read Portal Big Board
  // ============================================================
  const readResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Portal Big Board!A1:AF200',
  });
  const allRows = readResp.data.values || [];
  console.log(`Read ${allRows.length} rows from Portal Big Board`);

  const header = allRows[0] || [];
  console.log('Header:', JSON.stringify(header));
  console.log(`Total columns: ${header.length}`);

  // Show rows around Clayton
  console.log('\n=== ROWS 148-160 ===');
  for (let i = 148; i <= Math.min(160, allRows.length - 1); i++) {
    const r = allRows[i];
    if (!r) continue;
    const rowNum = i + 1;
    console.log(`Row ${rowNum}: Tier="${r[0]}" | Name="${r[1]}" | Grade="${r[11]}" | CinV1="${r[24]}" | NetAdj="${r[25]}" | AE="${r[30]}" | AF="${r[31]}"`);
  }

  // Find Walter Clayton Jr.
  let claytonRowIdx = -1;
  for (let i = 1; i < allRows.length; i++) {
    const name = (allRows[i][1] || '').toLowerCase();
    if (name.includes('clayton') && name.includes('walter')) {
      claytonRowIdx = i;
      console.log(`\nFound Walter Clayton Jr. at row ${i + 1} (0-indexed: ${i})`);
      console.log('Full row:', JSON.stringify(allRows[i]));
      break;
    }
  }
  
  // Also search just "clayton"
  if (claytonRowIdx === -1) {
    for (let i = 1; i < allRows.length; i++) {
      const name = (allRows[i][1] || '').toLowerCase();
      if (name.includes('clayton')) {
        console.log(`Row ${i+1}: "${allRows[i][1]}" - School: "${allRows[i][2]}"`);
      }
    }
  }

  // ============================================================
  // TASK 1: Fix Walter Clayton Jr.
  // ============================================================
  console.log('\n=== TASK 1: Fix Walter Clayton Jr. ===');
  
  const updates = [];
  
  if (claytonRowIdx !== -1) {
    const sheetRow = claytonRowIdx + 1; // 1-indexed
    const claytonRow = allRows[claytonRowIdx];
    
    console.log(`Clayton at sheet row ${sheetRow}`);
    console.log(`Current tier (A): "${claytonRow[0]}"`);
    console.log(`Current NetAdj (Z): "${claytonRow[25]}"`);
    
    // Update Z (NetAdj) from "est. +5.8" to "actual +0.5" - column Z = index 25
    updates.push({
      range: `Portal Big Board!Z${sheetRow}`,
      values: [['actual +0.5']],
    });
    
    // Update tier to T2 - column A = index 0  
    updates.push({
      range: `Portal Big Board!A${sheetRow}`,
      values: [['T2']],
    });
    
    // Find Notes column - check if there's one after AE
    // Based on task: Notes column, or add at end of row
    // Check what's in columns after AE (col 30)
    console.log(`Current row length: ${claytonRow.length}`);
    console.log(`Col AE (30): "${claytonRow[30]}"`);
    
    // Notes - let's put CORRECTED in column AF (31) for now if no notes col
    // Actually, let's check the header for a "Notes" column
    let notesColIdx = -1;
    for (let i = 0; i < header.length; i++) {
      if ((header[i] || '').toLowerCase().includes('note')) {
        notesColIdx = i;
        console.log(`Found Notes column at index ${i}: "${header[i]}"`);
        break;
      }
    }
    
    if (notesColIdx !== -1) {
      const colLetter = getColumnLetter(notesColIdx);
      const existingNote = (claytonRow[notesColIdx] || '');
      const newNote = existingNote ? existingNote + ' | CORRECTED' : 'CORRECTED';
      updates.push({
        range: `Portal Big Board!${colLetter}${sheetRow}`,
        values: [[newNote]],
      });
      console.log(`Will add CORRECTED to Notes column ${colLetter}`);
    } else {
      // Put in a notes-ish place - we'll skip AF since that's for Cin Score v2
      // Let's not add to a random column, just note it
      console.log('No Notes column found - will skip CORRECTED note to avoid conflicts');
    }
    
    console.log(`Task 1: Will update row ${sheetRow} - Tier=T2, NetAdj=actual +0.5`);
  } else {
    console.log('ERROR: Could not find Walter Clayton Jr. in sheet!');
  }

  // ============================================================
  // TASK 2: Cin Score v2 Column (AF)
  // ============================================================
  console.log('\n=== TASK 2: Calculate Cin Score v2 ===');
  
  // Add header AF1
  updates.push({
    range: 'Portal Big Board!AF1',
    values: [['Cin Score v2']],
  });
  
  let playersWithPenalty = 0;
  let playerRows = [];
  
  for (let i = 1; i < allRows.length; i++) {
    const row = allRows[i];
    const sheetRow = i + 1;
    
    const tierA = (row[0] || '').trim();
    const nameB = (row[1] || '').trim();
    
    // Skip section headers and empty rows
    if (!nameB) continue;
    if (nameB.includes('NEW TARGETS') || nameB.includes('HOOPSHQ') || 
        nameB.includes('HIGH-MAJOR') || nameB.includes('WATCHLIST') ||
        nameB.includes('EXPANSION') || nameB.includes('TIER')) continue;
    
    // Skip if Tier looks like a header label
    if (tierA === 'Tier' || tierA === 'Rank') continue;
    
    const gradeL = parseFloat(row[11]) || 0; // L
    const cinV1Raw = (row[24] || '').toString().trim(); // Y = Cin Score v1
    const netAdjZ = (row[25] || '').toString().trim(); // Z = Net Adj Rtg
    
    const cinV1 = parseFloat(cinV1Raw);
    if (isNaN(cinV1)) continue; // No Cin Score v1, skip
    
    // Parse Net Adj Rtg
    let netAdjVal = null;
    let isEstimated = false;
    
    if (netAdjZ.startsWith('est.') || netAdjZ.startsWith('est ')) {
      isEstimated = true;
      // Extract the number from "est. +X.X"
      const match = netAdjZ.match(/[-+]?\d+\.?\d*/);
      if (match) netAdjVal = parseFloat(match[0]);
    } else if (netAdjZ.startsWith('actual')) {
      const match = netAdjZ.match(/[-+]?\d+\.?\d*/);
      if (match) netAdjVal = parseFloat(match[0]);
    } else {
      const num = parseFloat(netAdjZ);
      if (!isNaN(num)) netAdjVal = num;
    }
    
    let penalty = 0;
    
    if (!isEstimated && netAdjVal !== null) {
      // Apply reality check penalty based on confirmed data
      const gradeHigh = gradeL >= 65;
      
      if (netAdjVal < -3) {
        if (gradeHigh) {
          penalty += 5; // trapped star exception
        } else {
          penalty += 15;
        }
      } else if (netAdjVal < 0) {
        if (gradeHigh) {
          penalty += 5; // trapped star exception
        } else {
          penalty += 8;
        }
      }
    }
    
    // Grade penalty (applies regardless of est. status)
    if (gradeL > 0 && gradeL < 52) {
      penalty += 10;
    }
    
    const cinV2 = Math.max(cinV1 - penalty, 0);
    
    if (penalty > 0) {
      playersWithPenalty++;
    }
    
    playerRows.push({
      sheetRow,
      name: nameB,
      cinV1,
      cinV2,
      penalty,
      netAdjVal,
      isEstimated,
      gradeL,
    });
    
    updates.push({
      range: `Portal Big Board!AF${sheetRow}`,
      values: [[cinV2]],
    });
  }
  
  console.log(`Calculated Cin Score v2 for ${playerRows.length} players`);
  console.log(`Players with penalty: ${playersWithPenalty}`);
  console.log('\nSample players with penalties:');
  playerRows.filter(p => p.penalty > 0).slice(0, 10).forEach(p => {
    console.log(`  ${p.name}: CinV1=${p.cinV1} → CinV2=${p.cinV2} (penalty=${p.penalty}, NetAdj=${p.netAdjVal})`);
  });

  // ============================================================
  // Execute TASK 1 & 2 writes
  // ============================================================
  console.log('\n=== WRITING TASK 1 & 2 UPDATES ===');
  console.log(`Total updates: ${updates.length}`);
  
  // Batch update
  const batchData = updates.map(u => ({ range: u.range, values: u.values }));
  
  await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'USER_ENTERED',
      data: batchData,
    },
  });
  console.log('Tasks 1 & 2 writes complete!');

  // Save player data for verification
  fs.writeFileSync('/tmp/player-rows-v10.json', JSON.stringify(playerRows, null, 2));
  console.log('Player data saved to /tmp/player-rows-v10.json');

  return { playerRows, claytonRowIdx };
}

function getColumnLetter(index) {
  let col = '';
  let n = index;
  while (n >= 0) {
    col = String.fromCharCode((n % 26) + 65) + col;
    n = Math.floor(n / 26) - 1;
  }
  return col;
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
