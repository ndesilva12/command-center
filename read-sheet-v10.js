const { google } = require('googleapis');
const fs = require('fs');

const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';

async function main() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const auth = new google.auth.OAuth2();
  auth.setCredentials(token);
  const sheets = google.sheets({ version: 'v4', auth });

  // Read Portal Big Board - rows 140-165 to find Clayton
  const resp1 = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A140:AF165',
  });
  console.log('=== ROWS 140-165 ===');
  (resp1.data.values || []).forEach((row, i) => {
    const rowNum = 140 + i;
    const tier = row[0] || '';
    const name = row[1] || '';
    const school = row[2] || '';
    const grade = row[11] || ''; // L
    const cinV1 = row[24] || ''; // Y
    const netAdj = row[25] || ''; // Z
    const aeCol = row[30] || ''; // AE
    const afCol = row[31] || ''; // AF
    console.log(`Row ${rowNum}: Tier=${tier} | Name=${name} | School=${school} | Grade=${grade} | CinV1=${cinV1} | NetAdj=${netAdj} | AE=${aeCol} | AF=${afCol}`);
  });

  // Read header row
  const resp2 = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:AF1',
  });
  console.log('\n=== HEADER ROW ===');
  console.log(resp2.data.values);

  // Read all data rows 1-160 for column mapping
  const resp3 = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:AF160',
  });
  const allRows = resp3.data.values || [];
  console.log('\n=== ALL ROWS SUMMARY (A, B, L, Y, Z columns) ===');
  allRows.forEach((row, i) => {
    const rowNum = i + 1;
    const a = row[0] || '';
    const b = row[1] || '';
    const l = row[11] || ''; // L = Grade
    const y = row[24] || ''; // Y = Cin Score v1
    const z = row[25] || ''; // Z = Net Adj Rtg
    if (b.includes('Clayton') || b.includes('Wolf') || b.includes('McNeeley') || 
        b.includes('Perry') || b.includes('Bradley') || b.includes('Momcilovic') ||
        b.includes('Riley') || b.includes('Fears')) {
      console.log(`Row ${rowNum}: Tier=${a} | Name=${b} | Grade(L)=${l} | CinV1(Y)=${y} | NetAdj(Z)=${z}`);
    }
  });

  // Check Norman's Rankings tab
  const resp4 = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Norman's Rankings!A1:Z5",
  });
  console.log("\n=== NORMAN'S RANKINGS HEADER ===");
  console.log(resp4.data.values);
  
  // Get full Norman's Rankings to find last column
  const resp5 = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Norman's Rankings!A1:Z2",
  });
  console.log('\nFirst 2 rows:', resp5.data.values);
}

main().catch(console.error);
