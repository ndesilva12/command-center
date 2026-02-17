const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

const TAB = 'Conference Breakdown';

async function main() {
  // Load analysis data
  const analysis = JSON.parse(fs.readFileSync('/tmp/v9-audit.json', 'utf8'));
  const { confBreakdown } = analysis;

  // Read current Conference Breakdown to understand structure
  const curr = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TAB}!A1:H35`
  });
  const currRows = curr.data.values || [];
  console.log('Current header:', currRows[0]);
  console.log('Current rows:', currRows.length);

  // Current structure: Conference, Tier, # Players (10+ min), Avg Cin. Score, Top Player by Cin. Score, Top Cin. Score, Top Player by Grade, Top Grade Score
  // We need to ADD after col B (Tier): Portal Board #, # T1, # T2, # T3, Avg Portal Cin Score, Top Portal Player

  // Build updated data - keep existing data but add portal-specific columns
  // New columns will be added at end (cols I+): Portal # Players, # T1, # T2, # T3, Avg Cin Score (Portal), Top Portal Player by Cin Score

  const newHeader = [
    'Conference', 'Tier', '# Players (Full DB 10+ min)', 'Avg Cin. Score (Full DB)',
    'Top Player by Cin. Score', 'Top Cin. Score', 'Top Player by Grade', 'Top Grade Score',
    'Portal Board #', '# T1', '# T2', '# T3', 'Avg Cin Score (Portal)', 'Top Portal Player'
  ];

  // Map conference data from audit
  const confMap = {};
  Object.values(confBreakdown).forEach(c => {
    confMap[c.conf] = c;
  });

  // Build updated rows
  const updatedRows = [newHeader];
  
  // Process existing data rows
  for (let i = 1; i < currRows.length; i++) {
    const row = currRows[i];
    if (!row || !row[0]) continue;
    
    const confName = row[0];
    const portalData = confMap[confName];
    
    // Keep existing 8 columns, add 6 new ones
    const newRow = [
      row[0] || '', row[1] || '', row[2] || '', row[3] || '',
      row[4] || '', row[5] || '', row[6] || '', row[7] || '',
      portalData ? portalData.total : '0',
      portalData ? portalData.T1 : '0',
      portalData ? portalData.T2 : '0',
      portalData ? portalData.T3 : '0',
      portalData ? portalData.avgCinScore : 'N/A',
      portalData ? `${portalData.topPlayer} (${portalData.topScore})` : 'N/A'
    ];
    updatedRows.push(newRow);
  }

  // Check for conferences in portal board but not in full DB breakdown
  const existingConfs = currRows.slice(1).map(r => r[0]).filter(Boolean);
  Object.values(confBreakdown).forEach(c => {
    if (!existingConfs.includes(c.conf)) {
      console.log(`New conference in portal not in full DB: ${c.conf}`);
      updatedRows.push([
        c.conf, c.confTier, 'N/A', 'N/A', 'N/A', 'N/A', 'N/A', 'N/A',
        c.total, c.T1, c.T2, c.T3, c.avgCinScore,
        `${c.topPlayer} (${c.topScore})`
      ]);
    }
  });

  console.log('\nUpdated rows to write:', updatedRows.length);
  
  // Clear existing data and write new
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TAB}!A1:N50`
  });
  
  const resp = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TAB}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: updatedRows }
  });
  
  console.log('Updated:', resp.data.updatedCells, 'cells');
  
  // Also add a summary row
  const totalPortal = Object.values(confBreakdown).reduce((a, c) => a + c.total, 0);
  const totalT1 = Object.values(confBreakdown).reduce((a, c) => a + c.T1, 0);
  const totalT2 = Object.values(confBreakdown).reduce((a, c) => a + c.T2, 0);
  const totalT3 = Object.values(confBreakdown).reduce((a, c) => a + c.T3, 0);
  
  console.log('\nPortal Board Summary:');
  console.log(`  Total: ${totalPortal} players (T1=${totalT1}, T2=${totalT2}, T3=${totalT3})`);
  
  fs.writeFileSync('/tmp/conf-breakdown-update.json', JSON.stringify({
    timestamp: new Date().toISOString(),
    totalRowsUpdated: updatedRows.length,
    portalSummary: { total: totalPortal, T1: totalT1, T2: totalT2, T3: totalT3 }
  }, null, 2));
  
  console.log('Done. Saved to /tmp/conf-breakdown-update.json');
}

main().catch(err => { console.error('Error:', err.message); if (err.response) console.error(JSON.stringify(err.response.data)); });
