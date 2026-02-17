const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(
  token.client_id,
  token.client_secret
);
oauth2Client.setCredentials({
  access_token: token.access_token,
  refresh_token: token.refresh_token
});

const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

async function main() {
  // First, list all sheets/tabs
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetNames = meta.data.sheets.map(s => ({ id: s.properties.sheetId, title: s.properties.title }));
  console.log('Tabs:', JSON.stringify(sheetNames, null, 2));

  // Read the main portal board (assume first sheet or "Portal Big Board")
  const mainSheet = sheetNames[0].title;
  console.log('\nReading main sheet:', mainSheet);

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${mainSheet}!A1:AJ200`
  });

  const rows = resp.data.values || [];
  console.log('\nTotal rows (including header):', rows.length);

  if (rows.length === 0) {
    console.log('No data found!');
    return;
  }

  const header = rows[0];
  console.log('\nHeader row:');
  header.forEach((col, i) => {
    const colLetter = String.fromCharCode(65 + i);
    console.log(`  ${colLetter} (${i}): ${col}`);
  });

  // Analyze gaps
  const dataRows = rows.slice(1);
  console.log('\nData rows:', dataRows.length);

  // Column indices to check
  const colsToCheck = {
    'eFG%': 18,      // S
    'FT Rate': 19,   // T
    'AST:TO': 20,    // U
    'Net Adj.Rtg': 25, // Z
    'Flight Risk': 28, // AC
    'Portal Target': 30, // AE
    'Conference Check': 29 // AD
  };

  // Build report
  const report = {};
  for (const [name, idx] of Object.entries(colsToCheck)) {
    const blanks = [];
    const values = [];
    dataRows.forEach((row, i) => {
      const val = row[idx];
      if (!val || val.trim() === '') {
        blanks.push({ rowNum: i+2, player: row[1] || row[0] || `Row ${i+2}` });
      } else {
        values.push(val);
      }
    });
    report[name] = {
      colIndex: idx,
      totalFilled: values.length,
      totalBlanks: blanks.length,
      blanks: blanks.slice(0, 20), // first 20 blanks
      sampleValues: values.slice(0, 5)
    };
    console.log(`\n${name} (col ${String.fromCharCode(65+idx)}): ${values.length} filled, ${blanks.length} blank`);
    if (blanks.length > 0) {
      console.log('  Blanks:', blanks.map(b => b.player).slice(0,10).join(', '));
    }
  }

  // Check Flight Risk values are 0-100
  console.log('\n--- Flight Risk Analysis ---');
  const frIdx = 28;
  dataRows.forEach((row, i) => {
    const val = row[frIdx];
    if (val) {
      const num = parseFloat(val);
      if (num > 100 || num < 0) {
        console.log(`  Row ${i+2} ${row[1]}: FR=${val} OUT OF RANGE`);
      }
    }
  });

  // Check Portal Target values
  console.log('\n--- Portal Target Values ---');
  const ptIdx = 30;
  const ptValues = {};
  dataRows.forEach((row, i) => {
    const val = (row[ptIdx] || '').trim().toUpperCase();
    ptValues[val] = (ptValues[val] || 0) + 1;
  });
  console.log('Distribution:', JSON.stringify(ptValues));

  // Check Conference Check values
  console.log('\n--- Conference Check Values ---');
  const ccIdx = 29;
  const ccValues = {};
  dataRows.forEach((row, i) => {
    const val = (row[ccIdx] || '').trim();
    ccValues[val] = (ccValues[val] || 0) + 1;
  });
  console.log('Distribution (top 10):', JSON.stringify(Object.fromEntries(Object.entries(ccValues).slice(0,10))));

  // Save full board to file
  fs.writeFileSync('/tmp/portal-board-live.json', JSON.stringify({
    header,
    rows: dataRows,
    sheetNames,
    mainSheet,
    readAt: new Date().toISOString()
  }, null, 2));
  console.log('\nFull board saved to /tmp/portal-board-live.json');
  console.log('Report:', JSON.stringify(report, null, 2));
}

main().catch(err => {
  console.error('Error:', err.message);
  if (err.response) console.error('Response:', JSON.stringify(err.response.data));
});
