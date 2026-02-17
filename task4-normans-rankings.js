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
  // Read Norman's Rankings tab
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Norman's Rankings!A1:AZ200",
  });
  const rows = resp.data.values || [];
  console.log(`Norman's Rankings: ${rows.length} rows`);
  if (rows.length === 0) {
    console.log('ERROR: No data in Norman\'s Rankings tab!');
    return;
  }
  
  const header = rows[0] || [];
  console.log('Header:', JSON.stringify(header));
  console.log('Column count:', header.length);
  console.log('Last column:', getColumnLetter(header.length - 1), '=', header[header.length - 1]);
  
  // Show first 5 data rows
  console.log('\nFirst 10 data rows:');
  rows.slice(1, 11).forEach((row, i) => {
    console.log(`Row ${i+2}: ${JSON.stringify(row.slice(0, 5))} ... last=${row[row.length-1]}`);
  });

  // Find the Net Adj Rtg column in Norman's Rankings
  let netAdjColIdx = -1;
  let playerColIdx = -1;
  for (let i = 0; i < header.length; i++) {
    const h = (header[i] || '').toLowerCase();
    if (h.includes('net') && (h.includes('adj') || h.includes('rtg') || h.includes('rating'))) {
      netAdjColIdx = i;
      console.log(`Found NetAdj column at index ${i} (${getColumnLetter(i)}): "${header[i]}"`);
    }
    if (h.includes('player') || h.includes('name')) {
      playerColIdx = i;
      console.log(`Found Player column at index ${i} (${getColumnLetter(i)}): "${header[i]}"`);
    }
  }
  
  // If no NetAdj column found, show all headers
  if (netAdjColIdx === -1) {
    console.log('\nAll headers:');
    header.forEach((h, i) => console.log(`  ${getColumnLetter(i)} (${i}): "${h}"`));
  }
  
  // Determine where to add the flag column (after last column)
  const lastColIdx = header.length; // 0-indexed, so this is the next available column
  const flagColLetter = getColumnLetter(lastColIdx);
  console.log(`\nWill add ⚠️ Flag column at: ${flagColLetter} (index ${lastColIdx})`);
  
  // Add header
  const updates = [];
  updates.push({
    range: `Norman's Rankings!${flagColLetter}1`,
    values: [['⚠️ Flag']],
  });
  
  // Check each player row for low on/off or Clayton
  let flagCount = 0;
  let claytonFound = false;
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const sheetRow = i + 1;
    
    if (!row || !row[0]) continue;
    
    // Find player name - check playerColIdx or first non-empty col
    const playerName = (playerColIdx >= 0 ? row[playerColIdx] : row[0] || row[1] || '').toString().toLowerCase();
    
    // Get Net Adj Rtg
    let netAdjRaw = '';
    if (netAdjColIdx >= 0) {
      netAdjRaw = (row[netAdjColIdx] || '').toString().trim();
    }
    
    // Check if Clayton
    const isClayton = playerName.includes('clayton');
    
    // Parse NetAdj
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
      console.log(`Clayton found at row ${sheetRow}: "${playerName}"`);
    } else if (!isEstimated && netAdjVal !== null && netAdjVal < 1.0) {
      flag = 'LOW ON/OFF';
    }
    
    if (flag) {
      updates.push({
        range: `Norman's Rankings!${flagColLetter}${sheetRow}`,
        values: [[flag]],
      });
      flagCount++;
      console.log(`Row ${sheetRow}: "${playerName}" → flag="${flag}" (NetAdj=${netAdjRaw})`);
    }
  }
  
  console.log(`\nTotal flags: ${flagCount} (Clayton found: ${claytonFound})`);
  
  if (updates.length > 0) {
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'USER_ENTERED',
        data: updates,
      },
    });
    console.log(`Task 4 complete! Wrote ${updates.length} cells.`);
  } else {
    console.log('No updates to write.');
  }
  
  // Save state
  const state = { 
    flagColLetter, flagCount, claytonFound, 
    totalRows: rows.length, headerCols: header.length 
  };
  fs.writeFileSync('/tmp/normans-rankings-state.json', JSON.stringify(state, null, 2));
  console.log('State saved to /tmp/normans-rankings-state.json');
}

main().catch(err => {
  console.error('ERROR:', err.message);
  console.error(err.stack);
  process.exit(1);
});
