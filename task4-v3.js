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
  // Step 1: Get sheet metadata to find the Norman's Rankings sheet ID
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const normansSheet = meta.data.sheets.find(s => s.properties.title === "Norman's Rankings");
  if (!normansSheet) {
    console.log('ERROR: Norman\'s Rankings tab not found!');
    console.log('Available tabs:', meta.data.sheets.map(s => s.properties.title).join(', '));
    return;
  }
  
  const sheetId = normansSheet.properties.sheetId;
  const currentCols = normansSheet.properties.gridProperties.columnCount;
  const currentRows = normansSheet.properties.gridProperties.rowCount;
  console.log(`Norman's Rankings sheet ID: ${sheetId}`);
  console.log(`Current dimensions: ${currentRows} rows x ${currentCols} cols`);
  
  // Step 2: Expand columns if needed (add 2 more columns)
  if (currentCols <= 8) {
    console.log('Expanding columns to 10...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{
          appendDimension: {
            sheetId: sheetId,
            dimension: 'COLUMNS',
            length: 2,
          }
        }]
      }
    });
    console.log('Columns expanded!');
  }
  
  // Step 3: Read Norman's Rankings data
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Norman's Rankings!A1:Z200",
  });
  const rows = resp.data.values || [];
  
  // Data header is at row 4 (index 3)
  const dataHeader = rows[3] || [];
  console.log('Header:', JSON.stringify(dataHeader));
  
  // Flag column = column I (index 8) - after SCOUT NOTES (index 7)
  const flagColIdx = 8;
  const flagColLetter = getColumnLetter(flagColIdx); // I
  console.log(`Flag column: ${flagColLetter}`);
  
  // Build NetAdj lookup from Portal Big Board
  console.log('Reading Portal Big Board for cross-reference...');
  const pbResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Portal Big Board!A1:Z200',
  });
  const pbRows = pbResp.data.values || [];
  
  const netAdjLookup = {};
  for (let i = 1; i < pbRows.length; i++) {
    const pbRow = pbRows[i];
    const rawName = (pbRow[1] || '').toString().trim();
    const netAdj = (pbRow[25] || '').toString().trim(); // Z column
    if (rawName && netAdj) {
      netAdjLookup[rawName.toLowerCase()] = netAdj;
      // Store without suffixes like "Jr." or "Sr."
      const simpleName = rawName.toLowerCase().replace(/\s+jr\.?$|\s+sr\.?$/, '').trim();
      if (simpleName !== rawName.toLowerCase()) {
        netAdjLookup[simpleName] = netAdj;
      }
    }
  }
  console.log(`NetAdj lookup has ${Object.keys(netAdjLookup).length} entries`);
  
  const updates = [];
  
  // Write flag header to row 4 (the data header row)
  updates.push({
    range: `Norman's Rankings!${flagColLetter}4`,
    values: [['⚠️ Flag']],
  });
  
  let flagCount = 0;
  let claytonFound = false;
  
  // Process player rows (starting from row 5 = index 4)
  const playerColIdx = 1; // NAME is column B
  
  for (let i = 4; i < rows.length; i++) {
    const row = rows[i];
    const sheetRow = i + 1;
    
    if (!row || row.length === 0) continue;
    
    const rawName = (row[playerColIdx] || '').toString().trim();
    if (!rawName) continue;
    
    // Skip section dividers
    if (rawName.startsWith('──') || rawName.startsWith('—')) continue;
    
    const lowerName = rawName.toLowerCase();
    const isClayton = lowerName.includes('clayton');
    
    // Look up NetAdj in portal board
    let netAdjRaw = netAdjLookup[lowerName] || '';
    
    // Try variations
    if (!netAdjRaw) {
      const simpleName = lowerName.replace(/\s+jr\.?$|\s+sr\.?$/, '').trim();
      netAdjRaw = netAdjLookup[simpleName] || '';
    }
    if (!netAdjRaw) {
      // Try first + last name only (skip middle)
      const parts = lowerName.split(' ');
      if (parts.length >= 2) {
        const shortName = parts[0] + ' ' + parts[parts.length - 1];
        netAdjRaw = netAdjLookup[shortName] || '';
      }
    }
    
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
      console.log(`Clayton at row ${sheetRow}: ${rawName} → "${flag}"`);
    } else if (!isEstimated && netAdjVal !== null && netAdjVal < 1.0) {
      flag = 'LOW ON/OFF';
      console.log(`LOW ON/OFF at row ${sheetRow}: ${rawName} (NetAdj=${netAdjRaw})`);
    }
    
    if (flag) {
      updates.push({
        range: `Norman's Rankings!${flagColLetter}${sheetRow}`,
        values: [[flag]],
      });
      flagCount++;
    }
  }
  
  console.log(`\nTotal flags: ${flagCount}, Clayton found: ${claytonFound}`);
  console.log(`Total updates to write: ${updates.length}`);
  
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
  
  const state = { flagColLetter, flagCount, claytonFound, sheetId };
  fs.writeFileSync('/tmp/normans-rankings-state-v3.json', JSON.stringify(state, null, 2));
  console.log('State saved.');
  return state;
}

main().catch(err => {
  console.error('ERROR:', err.message);
  process.exit(1);
});
