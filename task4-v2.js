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
  // Read wider range to see all columns
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Norman's Rankings!A1:Z200",
  });
  const rows = resp.data.values || [];
  
  // Show all columns in header rows
  console.log('=== ALL ROWS STRUCTURE ===');
  rows.slice(0, 7).forEach((row, i) => {
    console.log(`Row ${i+1} [${row.length} cols]:`, JSON.stringify(row));
  });
  
  // The real header is at row 4 (index 3)
  const dataHeader = rows[3] || [];
  console.log('\nData header (row 4):', JSON.stringify(dataHeader));
  console.log('All header columns:');
  dataHeader.forEach((h, i) => console.log(`  ${getColumnLetter(i)} (${i}): "${h}"`));
  
  // Find Net Adj Rtg column in the data header
  let netAdjColIdx = -1;
  let playerColIdx = -1;
  for (let i = 0; i < dataHeader.length; i++) {
    const h = (dataHeader[i] || '').toLowerCase();
    if (h.includes('net') || h.includes('adj') || h.includes('on/off') || h.includes('rtg')) {
      console.log(`Potential NetAdj col: ${getColumnLetter(i)} = "${dataHeader[i]}"`);
      netAdjColIdx = i;
    }
    if (h === 'name' || h.includes('player')) {
      playerColIdx = i;
    }
  }
  
  if (playerColIdx === -1) playerColIdx = 1; // default to B (index 1)
  
  // Determine the last column used in data
  let maxCols = 0;
  for (let i = 4; i < rows.length; i++) {
    if (rows[i] && rows[i].length > maxCols) maxCols = rows[i].length;
  }
  console.log(`\nMax columns in data rows: ${maxCols}`);
  console.log(`Next available column: ${getColumnLetter(maxCols)}`);
  
  // The flag column goes after the last used column
  const flagColIdx = maxCols;
  const flagColLetter = getColumnLetter(flagColIdx);
  console.log(`Flag column: ${flagColLetter}`);
  
  const updates = [];
  
  // Add flag header in row 4
  updates.push({
    range: `Norman's Rankings!${flagColLetter}4`,
    values: [['⚠️ Flag']],
  });
  
  let flagCount = 0;
  let claytonFound = false;
  
  // Process data rows (starting from row 5, index 4)
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    const sheetRow = i + 1;
    
    if (!row || row.length === 0) continue;
    
    // Get player name
    const playerName = (row[playerColIdx] || '').toString().toLowerCase();
    if (!playerName || playerName.includes('──') || playerName.includes('TIER') || 
        playerName.includes('GUARDS') || playerName.includes('FORWARDS') || 
        playerName.includes('CENTERS') || playerName.includes('WINGS')) continue;
    
    // Get Net Adj Rtg (if column exists)
    let netAdjRaw = '';
    if (netAdjColIdx >= 0 && netAdjColIdx < row.length) {
      netAdjRaw = (row[netAdjColIdx] || '').toString().trim();
    }
    
    // Check if Clayton
    const isClayton = playerName.includes('clayton');
    
    // Parse NetAdj value
    let netAdjVal = null;
    let isEstimated = false;
    
    if (netAdjRaw.toLowerCase().startsWith('est.') || netAdjRaw.toLowerCase().startsWith('est ')) {
      isEstimated = true;
    } else if (netAdjRaw.toLowerCase().startsWith('actual')) {
      const match = netAdjRaw.match(/[-+]?\d+\.?\d*/);
      if (match) netAdjVal = parseFloat(match[0]);
    } else {
      const num = parseFloat(netAdjRaw);
      if (!isNaN(num)) netAdjVal = num;
    }
    
    let flag = '';
    
    if (isClayton) {
      flag = 'CORRECTED: was +5.8, actual +0.5';
      claytonFound = true;
      console.log(`Clayton found at row ${sheetRow}`);
    } else if (!isEstimated && netAdjVal !== null && netAdjVal < 1.0) {
      flag = 'LOW ON/OFF';
    }
    
    if (flag) {
      updates.push({
        range: `Norman's Rankings!${flagColLetter}${sheetRow}`,
        values: [[flag]],
      });
      flagCount++;
      console.log(`  Row ${sheetRow} "${playerName}": flag="${flag}"`);
    }
  }
  
  // If no NetAdj found in Norman's Rankings, cross-reference from Portal Big Board
  if (netAdjColIdx === -1) {
    console.log('\nNo NetAdj column in Norman\'s Rankings. Need to cross-reference with Portal Big Board.');
    
    // Read Portal Big Board for NetAdj values
    const pbResp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Portal Big Board!A1:Z200',
    });
    const pbRows = pbResp.data.values || [];
    
    // Build lookup: player name -> NetAdj
    const netAdjLookup = {};
    for (let i = 1; i < pbRows.length; i++) {
      const name = (pbRows[i][1] || '').toLowerCase().trim();
      const netAdj = (pbRows[i][25] || '').toString().trim(); // Z column
      if (name && netAdj) {
        netAdjLookup[name] = netAdj;
        // Also store partial name match
        const parts = name.split(' ');
        parts.forEach(p => {
          if (p.length > 4 && !netAdjLookup[p]) netAdjLookup[p] = netAdj;
        });
      }
    }
    
    console.log(`Built lookup with ${Object.keys(netAdjLookup).length} players`);
    
    // Re-process player rows with cross-referenced data
    for (let i = 4; i < rows.length; i++) {
      const row = rows[i];
      const sheetRow = i + 1;
      
      if (!row || row.length === 0) continue;
      const playerName = (row[playerColIdx] || '').toString().toLowerCase();
      if (!playerName || playerName.includes('──') || !playerName) continue;
      
      // Look up in portal board
      let netAdjRaw = netAdjLookup[playerName] || '';
      if (!netAdjRaw) {
        // Try partial match
        for (const [key, val] of Object.entries(netAdjLookup)) {
          if (playerName.includes(key) || key.includes(playerName.split(' ')[0])) {
            netAdjRaw = val;
            break;
          }
        }
      }
      
      const isClayton = playerName.includes('clayton');
      
      let netAdjVal = null;
      let isEstimated = false;
      
      if (netAdjRaw.toLowerCase().startsWith('est.') || netAdjRaw.toLowerCase().startsWith('est ')) {
        isEstimated = true;
      } else if (netAdjRaw.toLowerCase().startsWith('actual')) {
        const match = netAdjRaw.match(/[-+]?\d+\.?\d*/);
        if (match) netAdjVal = parseFloat(match[0]);
      } else {
        const num = parseFloat(netAdjRaw);
        if (!isNaN(num)) netAdjVal = num;
      }
      
      // Check if already flagged
      const existingFlag = updates.find(u => u.range.includes(`${flagColLetter}${sheetRow}`));
      if (existingFlag) continue;
      
      let flag = '';
      if (isClayton) {
        flag = 'CORRECTED: was +5.8, actual +0.5';
        claytonFound = true;
      } else if (!isEstimated && netAdjVal !== null && netAdjVal < 1.0) {
        flag = 'LOW ON/OFF';
      }
      
      if (flag) {
        updates.push({
          range: `Norman's Rankings!${flagColLetter}${sheetRow}`,
          values: [[flag]],
        });
        flagCount++;
        console.log(`  Row ${sheetRow} "${playerName}" (cross-ref NetAdj=${netAdjRaw}): flag="${flag}"`);
      }
    }
  }
  
  console.log(`\nTotal flags: ${flagCount}, Clayton found: ${claytonFound}`);
  console.log(`Total updates: ${updates.length}`);
  
  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates,
      },
    });
    console.log('Task 4 writes complete!');
  }
  
  const state = { flagColLetter, flagColIdx, flagCount, claytonFound };
  fs.writeFileSync('/tmp/normans-rankings-state.json', JSON.stringify(state, null, 2));
}

main().catch(err => {
  console.error('ERROR:', err.message);
  console.error(err.stack);
  process.exit(1);
});
