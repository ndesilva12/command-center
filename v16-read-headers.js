const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(creds.client_id, creds.client_secret);
auth.setCredentials({ access_token: creds.access_token, refresh_token: creds.refresh_token });
const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

async function main() {
  // Read first 3 rows to get headers and sample data
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:AJ3',
  });
  
  const rows = res.data.values || [];
  console.log('Header row (row 1):');
  if (rows[0]) {
    rows[0].forEach((h, i) => {
      const col = String.fromCharCode(65 + (i < 26 ? i : 0));
      const colLetter = i < 26 ? String.fromCharCode(65 + i) : 'A' + String.fromCharCode(65 + i - 26);
      console.log(`  ${colLetter} (${i}): "${h}"`);
    });
  }
  
  console.log('\nRow 2 (first data row):');
  if (rows[1]) {
    rows[1].forEach((v, i) => {
      const colLetter = i < 26 ? String.fromCharCode(65 + i) : 'A' + String.fromCharCode(65 + i - 26);
      console.log(`  ${colLetter} (${i}): "${v}"`);
    });
  }
  
  console.log('\nTotal header columns:', rows[0] ? rows[0].length : 0);
}

main().catch(console.error);
