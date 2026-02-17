const { google } = require('/Users/normandesilva/command-center/command-center/node_modules/googleapis');
const fs = require('fs');
const path = require('path');

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';

async function getAuth() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const auth = new google.auth.OAuth2(
    token.client_id || '764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com',
    token.client_secret || 'd-FL95Q19q7MQmFpd7hHD0Ty',
    'urn:ietf:wg:oauth:2.0:oob'
  );
  auth.setCredentials(token);
  return auth;
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // First get sheet info
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheetNames = meta.data.sheets.map(s => s.properties.title);
  console.log('SHEETS:', JSON.stringify(sheetNames));

  // Read the Portal Big Board
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Portal Big Board!A1:AF200',
  });

  const rows = resp.data.values || [];
  console.log('\nTOTAL ROWS:', rows.length);
  console.log('\nHEADER ROW:', JSON.stringify(rows[0]));
  
  if (rows.length > 1) {
    console.log('\nROW 2 (first data):', JSON.stringify(rows[1]));
  }

  // Find the big men
  const targets = ['dybantsa', 'boozer', 'lendeborg', 'wilson', 'wolf', 'mcneeley', 'riley'];
  
  console.log('\n--- BIG MEN ROWS ---');
  rows.forEach((row, idx) => {
    if (idx === 0) return;
    const playerName = (row[1] || '').toLowerCase();
    if (targets.some(t => playerName.includes(t))) {
      console.log(`\nROW ${idx + 1} (sheet row ${idx + 1}):`);
      console.log(JSON.stringify(row));
    }
  });
}

main().catch(console.error);
