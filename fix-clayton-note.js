const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

async function main() {
  // Fix double CORRECTED in Clayton's notes (AB156)
  // Current: "Senior SEC scorer, elite portal target post-season | CORRECTED | CORRECTED"
  // Target: "Senior SEC scorer, elite portal target post-season | CORRECTED"
  
  const correctNote = 'Senior SEC scorer, elite portal target post-season | CORRECTED';
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Portal Big Board!AB156',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[correctNote]],
    },
  });
  
  console.log('Fixed Clayton note: removed duplicate CORRECTED');
  console.log(`New note: "${correctNote}"`);
  
  // Also verify the B column flag in Norman's Rankings
  const nrResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Norman's Rankings!A1:J80",
  });
  const nrRows = nrResp.data.values || [];
  
  console.log('\nNorman\'s Rankings rows with data in col I (flag):');
  nrRows.forEach((row, i) => {
    const flag = (row[8] || '').toString();
    if (flag) {
      console.log(`  Row ${i+1}: "${row[1] || row[0]}" → "${flag}"`);
    }
  });
  
  // Read the Portal Big Board to check Norman's Rankings players
  const pbResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Portal Big Board!A1:Z200',
  });
  const pbRows = pbResp.data.values || [];
  
  // Build lookup
  const netAdjLookup = {};
  for (let i = 1; i < pbRows.length; i++) {
    const pbRow = pbRows[i];
    const rawName = (pbRow[1] || '').toString().trim();
    const netAdj = (pbRow[25] || '').toString().trim();
    if (rawName && netAdj) {
      netAdjLookup[rawName.toLowerCase()] = netAdj;
    }
  }
  
  // Check each Norman's Rankings player
  console.log('\nNorman\'s Rankings cross-reference check:');
  for (let i = 5; i < nrRows.length; i++) {
    const row = nrRows[i];
    const name = (row[1] || '').toString().trim();
    if (!name || name.startsWith('──') || !row[0]) continue;
    
    const lowerName = name.toLowerCase();
    const netAdj = netAdjLookup[lowerName] || 'not found in portal board';
    
    // Parse it
    let val = null;
    let isEst = false;
    if (netAdj.startsWith('est.')) isEst = true;
    else if (netAdj.startsWith('actual')) { const m = netAdj.match(/[-+]?\d+\.?\d*/); if(m) val = parseFloat(m[0]); }
    else { val = parseFloat(netAdj); }
    
    const flag = !isEst && val !== null && val < 1.0 ? `LOW ON/OFF (${netAdj})` : '';
    console.log(`  Row ${i+1}: "${name}" → NetAdj="${netAdj}"${flag ? ' ⚠️ ' + flag : ''}`);
  }
}

main().catch(err => {
  console.error('ERROR:', err.message);
});
