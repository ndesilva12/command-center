const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';

function colLetter(n) {
  let result = '';
  n++;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

async function main() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
  auth.setCredentials(token);
  const sheets = google.sheets({ version: 'v4', auth });

  // Read row 1 of Portal Big Board to get all headers
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Portal Big Board'!1:1",
  });

  const headers = resp.data.values ? resp.data.values[0] : [];
  console.log('HEADERS:');
  headers.forEach((h, i) => {
    const col = colLetter(i);
    console.log(`${col} (${i}): ${h}`);
  });
  console.log('Total columns:', headers.length);

  // Also read row 2 to understand data types
  const resp2 = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Portal Big Board'!A2:AZ2",
  });
  const row2 = resp2.data.values ? resp2.data.values[0] : [];
  console.log('\nROW 2 SAMPLE:');
  row2.forEach((v, i) => {
    const col = colLetter(i);
    console.log(`${col}: ${v}`);
  });

  // Also check what tabs exist
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  console.log('\nSHEET TABS:');
  meta.data.sheets.forEach(s => console.log(` - "${s.properties.title}" (id: ${s.properties.sheetId})`));
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
