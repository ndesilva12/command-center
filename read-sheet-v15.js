const { google } = require('./node_modules/googleapis');
const fs = require('fs');
const creds = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(creds.client_id, creds.client_secret);
auth.setCredentials({ access_token: creds.access_token, refresh_token: creds.refresh_token });
const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

async function main() {
  // Read header row first
  const headerResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:AM1'
  });
  const headers = headerResp.data.values[0];
  console.log('HEADERS:', JSON.stringify(headers));
  console.log('Column count:', headers.length);

  // Read all data
  const dataResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:AM160'
  });
  const rows = dataResp.data.values;
  console.log('Total rows:', rows.length);
  
  // Show first 5 data rows
  for (let i = 1; i <= 5; i++) {
    const row = rows[i];
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = row ? row[idx] || '' : ''; });
    console.log(`Row ${i+1}:`, JSON.stringify(obj));
  }

  // Find columns with blanks
  const colStats = {};
  headers.forEach(h => { colStats[h] = { blank: 0, filled: 0 }; });
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    headers.forEach((h, idx) => {
      const val = row ? (row[idx] || '') : '';
      if (val === '') colStats[h].blank++;
      else colStats[h].filled++;
    });
  }
  
  console.log('\nCOLUMN BLANK COUNTS:');
  Object.entries(colStats).forEach(([h, stats]) => {
    if (stats.blank > 0) console.log(`  ${h}: ${stats.blank} blanks`);
  });

  // Save full data
  fs.writeFileSync('/tmp/pbb-v15-full.json', JSON.stringify({ headers, rows }, null, 2));
  console.log('\nSaved to /tmp/pbb-v15-full.json');
  
  // Also read Norman's Rankings tab
  const nrResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Norman's Rankings!A1:Z60"
  });
  const nrRows = nrResp.data.values;
  console.log('\nNORMAN\'S RANKINGS rows:', nrRows.length);
  nrRows.forEach((row, i) => {
    if (row && row.length > 0) console.log(`NR Row ${i+1}:`, row.slice(0, 8).join(' | '));
  });
  
  fs.writeFileSync('/tmp/normans-rankings-v15.json', JSON.stringify(nrRows, null, 2));
  
  // List all tabs
  const metaResp = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tabs = metaResp.data.sheets.map(s => s.properties.title);
  console.log('\nALL TABS:', tabs);
}

main().catch(e => {
  console.error('ERROR:', e.message);
  process.exit(1);
});
