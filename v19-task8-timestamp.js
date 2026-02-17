// V19 Task 8: Add "Last Updated" Timestamp to sheet header
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

  // Current time
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 16).replace('T', ' ');
  const timestamp = `Last Enriched: V19 - ${dateStr} UTC | Tasks: Dup fix, Perry update, Transfer perf, Conf audit, Records QC, eFG% fix (6), AST:TO verify, Timestamp`;

  // Read current header row to find where to put the timestamp
  const headResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET}'!1:1`
  });
  const headers = headResp.data.values[0];
  
  // Find the "Last enriched" column (col AH = index 33, which was set in V18)
  const lastEnrichedIdx = headers.findIndex(h => h && h.toLowerCase().includes('last enriched'));
  console.log(`Last enriched col: index ${lastEnrichedIdx} = "${headers[lastEnrichedIdx] || '(not found)'}"`);
  
  // Column AH = index 33
  // Let's update that cell with the new timestamp
  const colLetter = lastEnrichedIdx >= 0 
    ? (lastEnrichedIdx < 26 ? String.fromCharCode(65 + lastEnrichedIdx) : 'A' + String.fromCharCode(65 + lastEnrichedIdx - 26))
    : 'AH'; // default to AH if not found
    
  console.log(`Updating timestamp in col ${colLetter} (row 1)...`);
  console.log(`New timestamp: "${timestamp}"`);

  const updateResp = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET}'!${colLetter}1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[timestamp]]
    }
  });
  
  console.log(`✅ Updated timestamp: ${updateResp.data.updatedCells} cell(s)`);
  
  const result = {
    task: 'task8-timestamp',
    success: true,
    column: colLetter,
    timestamp,
    updatedCells: updateResp.data.updatedCells
  };
  
  fs.writeFileSync('/tmp/v19-task8-result.json', JSON.stringify(result, null, 2));
  console.log('Result saved to /tmp/v19-task8-result.json');
  return result;
}

main().catch(e => {
  console.error('ERROR:', e.message);
  if (e.response) console.error('Response:', JSON.stringify(e.response.data));
  process.exit(1);
});
