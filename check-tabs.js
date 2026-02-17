const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

async function main() {
  // Read HS Recruiting tab
  console.log('=== HS Recruiting (Top 50) ===');
  const hs = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'HS Recruiting (Top 50)!A1:P60'
  });
  const hsRows = hs.data.values || [];
  console.log('Rows:', hsRows.length);
  if (hsRows.length > 0) {
    console.log('Header:', JSON.stringify(hsRows[0]));
    console.log('First 3 data rows:');
    hsRows.slice(1, 4).forEach((r, i) => console.log(`  Row ${i+2}:`, JSON.stringify(r)));
    console.log('Last 3 rows:');
    hsRows.slice(-3).forEach((r, i) => console.log(`  Row ${hsRows.length-2+i}:`, JSON.stringify(r)));
  }

  // Read Conference Breakdown tab
  console.log('\n=== Conference Breakdown ===');
  const cb = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Conference Breakdown!A1:H30'
  });
  const cbRows = cb.data.values || [];
  console.log('Rows:', cbRows.length);
  if (cbRows.length > 0) {
    console.log('Content:');
    cbRows.forEach((r, i) => console.log(`  Row ${i+1}:`, JSON.stringify(r)));
  }

  // Save for analysis
  fs.writeFileSync('/tmp/existing-tabs.json', JSON.stringify({
    hsRecruiting: { header: hsRows[0], rows: hsRows.slice(1), total: hsRows.length },
    confBreakdown: { rows: cbRows, total: cbRows.length }
  }, null, 2));
  console.log('\nSaved to /tmp/existing-tabs.json');
}

main().catch(err => { console.error('Error:', err.message); if (err.response) console.error(JSON.stringify(err.response.data)); });
