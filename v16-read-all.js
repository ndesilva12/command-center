const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(creds.client_id, creds.client_secret);
auth.setCredentials({ access_token: creds.access_token, refresh_token: creds.refresh_token });
const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

async function main() {
  // Read all data from Portal Big Board
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:AJ300',
  });
  
  const rows = res.data.values || [];
  const headers = rows[0];
  
  console.log(`Total rows: ${rows.length - 1} players`);
  console.log(`Headers: ${JSON.stringify(headers)}`);
  
  // Save full data
  fs.writeFileSync('/tmp/portal-big-board-raw.json', JSON.stringify(rows, null, 2));
  console.log('Saved to /tmp/portal-big-board-raw.json');
  
  // Show a few key stats
  const cinScoreCol = headers.indexOf('Cin. Score');
  const netAdjCol = headers.indexOf('Net Adj.Rtg');
  const gradeCol = headers.indexOf('Grade (20-80)');
  const cinV2Col = headers.indexOf('Cin Score v2');
  const estFlagCol = headers.indexOf('Est. Flag');
  const careerArcCol = headers.indexOf('Career Arc');
  
  console.log(`Column indices: CinScore=${cinScoreCol}, NetAdj=${netAdjCol}, Grade=${gradeCol}, CinV2=${cinV2Col}, EstFlag=${estFlagCol}, CareerArc=${careerArcCol}`);
  
  // Count players with Cin Score = 100
  let count100 = 0;
  let countNegativeNet = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row[1]) continue; // skip empty rows
    const cinScore = parseFloat(row[cinScoreCol]);
    const netAdj = parseFloat(row[netAdjCol]);
    if (cinScore === 100) count100++;
    if (!isNaN(netAdj) && netAdj < 0) countNegativeNet++;
  }
  console.log(`Players with Cin Score = 100: ${count100}`);
  console.log(`Players with negative Net Adj Rtg: ${countNegativeNet}`);
}

main().catch(console.error);
