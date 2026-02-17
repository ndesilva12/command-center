// Check rows 102, 118, 126 which have 'Added by Jimmy AI' in school column
const { google } = require('/Users/normandesilva/command-center/command-center/node_modules/googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';

async function getAuth() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
  auth.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
  return auth;
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const SHEET = 'Portal Big Board';

  // Read headers first
  const headResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET}'!1:1`
  });
  const headers = headResp.data.values[0];

  // Read the specific rows
  for (const rowNum of [102, 118, 126]) {
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${SHEET}'!A${rowNum}:AT${rowNum}`
    });
    const row = resp.data.values ? resp.data.values[0] : [];
    console.log(`\n=== Row ${rowNum} ===`);
    for (let i = 0; i < Math.max(row.length, 10); i++) {
      if (row[i] !== undefined && row[i] !== '') {
        console.log(`  ${headers[i] || `col${i}`} (col ${i}): "${row[i]}"`);
      }
    }
  }
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
