const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

// Parse CSV
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current); current = ''; }
    else { current += char; }
  }
  result.push(current);
  return result;
}

const csvData = fs.readFileSync('/tmp/barttorvik-2026.csv', 'utf8');
const csvRows = csvData.trim().split('\n').map(parseCSVLine);

// Build lookup: player name -> actual net adj rtg (col 48)
const netAdjLookup = {};
csvRows.forEach(row => {
  const name = (row[0] || '').trim();
  const netAdj = parseFloat(row[48]);
  if (name && !isNaN(netAdj)) {
    netAdjLookup[name.toLowerCase()] = netAdj;
  }
});

console.log('Total players in CSV:', Object.keys(netAdjLookup).length);

// Load portal board
const board = JSON.parse(fs.readFileSync('/tmp/portal-board-live.json', 'utf8'));
const { header, rows, mainSheet } = board;

const colMap = {};
header.forEach((h, i) => { colMap[h] = i; });

const SECTION_LABELS = ['T4 - NEW TARGETS (Recommend Review)', 'T5 - HOOPSHQ WATCHLIST (Feb 10 2026)', 'T3 - HIGH-MAJOR EXPANSION'];

// Find all "est." Net Adj Rtg rows
const updates = [];
rows.forEach((row, i) => {
  const rowNum = i + 2; // +2 for header row
  const player = (row[colMap['Player']] || '').trim();
  const netAdj = (row[colMap['Net Adj.Rtg']] || '').trim();
  
  if (netAdj.toLowerCase().startsWith('est.')) {
    // Look up actual value
    const playerLower = player.toLowerCase();
    let actualVal = null;
    
    // Try exact match
    if (netAdjLookup[playerLower] !== undefined) {
      actualVal = netAdjLookup[playerLower];
    } else {
      // Try partial match
      for (const [csvName, val] of Object.entries(netAdjLookup)) {
        const firstName = playerLower.split(' ')[0];
        const lastName = playerLower.split(' ').pop();
        if (csvName.includes(firstName) && csvName.includes(lastName)) {
          actualVal = val;
          break;
        }
      }
    }
    
    if (actualVal !== null) {
      const rounded = Math.round(actualVal * 10) / 10;
      const newVal = rounded >= 0 ? `+${rounded}` : `${rounded}`;
      console.log(`  ${player}: est=${netAdj} → actual=${newVal} (from CSV: ${actualVal})`);
      updates.push({
        rowNum,
        player,
        oldVal: netAdj,
        newVal,
        colIndex: colMap['Net Adj.Rtg']
      });
    } else {
      console.log(`  ${player}: est=${netAdj} → NOT FOUND in CSV - keeping estimate`);
    }
  }
});

console.log(`\nFound ${updates.length} values to update`);

async function main() {
  if (updates.length === 0) {
    console.log('No updates needed.');
    return;
  }
  
  // Build batch update
  const batchData = updates.map(u => ({
    range: `${mainSheet}!${colToLetter(u.colIndex)}${u.rowNum}`,
    values: [[u.newVal]]
  }));
  
  console.log('\nUpdating cells...');
  const resp = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: batchData
    }
  });
  
  console.log('Updated:', resp.data.totalUpdatedCells, 'cells');
  
  // Save result
  fs.writeFileSync('/tmp/net-adj-updates.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    updates,
    totalUpdated: resp.data.totalUpdatedCells
  }, null, 2));
  
  console.log('Saved to /tmp/net-adj-updates.json');
}

function colToLetter(idx) {
  if (idx < 26) return String.fromCharCode(65 + idx);
  const first = String.fromCharCode(65 + Math.floor(idx / 26) - 1);
  const second = String.fromCharCode(65 + (idx % 26));
  return first + second;
}

main().catch(err => { console.error('Error:', err.message); if (err.response) console.error(JSON.stringify(err.response.data)); });
