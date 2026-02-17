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

  // 1. Read Portal Big Board - all rows
  console.log('Reading Portal Big Board...');
  const pbb = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Portal Big Board'!A1:AZ200",
  });
  const pbbData = pbb.data.values || [];
  console.log('PBB rows:', pbbData.length);
  console.log('PBB cols:', pbbData[0] ? pbbData[0].length : 0);
  
  // Save PBB data
  fs.writeFileSync('/tmp/pbb-data.json', JSON.stringify(pbbData, null, 2));
  console.log('Saved /tmp/pbb-data.json');

  // 2. Read Full Database headers + first 5 rows
  console.log('\nReading Full Database (10+ min) headers...');
  const fdb = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Full Database (10+ min)'!1:3",
  });
  const fdbData = fdb.data.values || [];
  console.log('Full DB headers:', fdbData[0] ? fdbData[0].length : 0, 'columns');
  if (fdbData[0]) {
    fdbData[0].forEach((h, i) => console.log(`  ${colLetter(i)}: ${h}`));
  }
  if (fdbData[1]) {
    console.log('Row 2 sample:');
    fdbData[1].forEach((v, i) => console.log(`  ${colLetter(i)}: ${v}`));
  }
  
  // Get full count
  const fdbCount = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Full Database (10+ min)'!A:A",
  });
  console.log('Full DB rows:', fdbCount.data.values ? fdbCount.data.values.length : 0);
}

main().catch(e => { console.error('ERROR:', e.message, e.stack); process.exit(1); });
