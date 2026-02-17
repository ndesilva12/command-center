// V19 Task 2: Verify and update Tylor Perry status
// Tylor Perry: Undrafted 2024, signed Exhibit 10 with Toronto, now on Raptors 905 (G League)
// He is NOT at Texas Tech 2025-26 — he's a pro G League player

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

  // Read full sheet to find Tylor Perry's row
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET}'!A1:AT160`
  });
  const rows = resp.data.values || [];
  const headers = rows[0];
  
  console.log('Headers:', headers.slice(0, 10));
  
  // Find column indices
  const colIndex = (name) => {
    const idx = headers.findIndex(h => h && h.toLowerCase().includes(name.toLowerCase()));
    return idx;
  };
  
  // Find key columns
  const tierCol = 0; // A
  const nameCol = 1; // B
  
  // Find column AR (NBA Status) and AT (V18 Notes) - these are 0-indexed
  // Headers array: A=0, B=1... AR = 43, AS = 44, AT = 45
  const nbaStatusColLetter = 'AR';
  const inflatedFlagColLetter = 'AS';
  const v18NotesColLetter = 'AT';
  
  // AR is the 44th column (0-indexed: 43)
  const nbaStatusColIdx = 43;
  const v18NotesColIdx = 45;
  
  console.log('NBA Status col idx:', nbaStatusColIdx, '= header:', headers[nbaStatusColIdx]);
  console.log('V18 Notes col idx:', v18NotesColIdx, '= header:', headers[v18NotesColIdx]);

  // Find Tylor Perry
  let perryRow = -1;
  for (let i = 1; i < rows.length; i++) {
    const name = (rows[i][1] || '').toLowerCase();
    if (name.includes('tylor perry') || name.includes('tyler perry')) {
      perryRow = i + 1; // 1-based row number
      console.log(`Found Tylor Perry at row ${perryRow}: ${JSON.stringify(rows[i].slice(0, 6))}`);
      console.log(`  Current tier: ${rows[i][0]}`);
      console.log(`  Current NBA Status: ${rows[i][nbaStatusColIdx] || '(blank)'}`);
      console.log(`  Current V18 Notes: ${rows[i][v18NotesColIdx] || '(blank)'}`);
      break;
    }
  }

  if (perryRow === -1) {
    console.log('❌ Tylor Perry not found in sheet!');
    return { success: false, reason: 'Not found' };
  }

  // Update Tylor Perry's row:
  // - Tier: REMOVED - PRO (G League)
  // - NBA Status (AR): Raptors 905 (NBA G League) — NCAA Ineligible
  // - V18 Notes (AT): append note about G League status
  
  const updates = [
    {
      range: `'${SHEET}'!A${perryRow}`,
      values: [['REMOVED - PRO']]
    },
    {
      range: `'${SHEET}'!${nbaStatusColLetter}${perryRow}`,
      values: [['Raptors 905 (NBA G League) — NCAA Ineligible']]
    },
    {
      range: `'${SHEET}'!${v18NotesColLetter}${perryRow}`,
      values: [['V19: Confirmed pro — Raptors 905 (G League). Undrafted 2024, Exhibit 10 with Toronto. NOT at Texas Tech 2025-26.']]
    }
  ];

  const updateResp = await sheets.spreadsheets.values.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      valueInputOption: 'RAW',
      data: updates
    }
  });

  console.log('✅ Updated Tylor Perry row', perryRow);
  console.log('Update response totalUpdatedCells:', updateResp.data.totalUpdatedCells);

  const result = {
    task: 'task2-tylor-perry',
    success: true,
    row: perryRow,
    finding: 'Tylor Perry is on Raptors 905 (NBA G League), undrafted 2024, NOT at Texas Tech 2025-26',
    updates: updates.map(u => ({ range: u.range, value: u.values[0][0] }))
  };
  fs.writeFileSync('/tmp/v19-task2-result.json', JSON.stringify(result, null, 2));
  console.log('Result saved to /tmp/v19-task2-result.json');
  return result;
}

main().catch(e => {
  console.error('ERROR:', e.message);
  if (e.response) console.error('Response:', JSON.stringify(e.response.data));
  process.exit(1);
});
