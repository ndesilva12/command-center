const { google } = require('/Users/normandesilva/command-center/command-center/node_modules/googleapis');
const fs = require('fs');
const path = require('path');

const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';

async function main() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const auth = new google.auth.OAuth2();
  auth.setCredentials(token);
  const sheets = google.sheets({ version: 'v4', auth });

  // Get sheet metadata
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tabNames = meta.data.sheets.map(s => s.properties.title);
  console.log('Tabs:', tabNames.join(', '));

  // Read Portal Big Board
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:AZ200',
  });
  const rows = res.data.values || [];
  console.log('\nPortal Big Board:');
  console.log('Total rows:', rows.length);
  console.log('Header:', JSON.stringify(rows[0]));
  console.log('Column count:', rows[0] ? rows[0].length : 0);
  
  // Show last few rows
  console.log('\nLast 5 data rows:');
  rows.slice(-5).forEach((r, i) => {
    console.log(`Row ${rows.length - 4 + i}: Player="${r[1]}", Tier="${r[0]}", Cols=${r.length}`);
  });
  
  // Check for missing eFG%, FT Rate, AST:TO
  if (rows[0]) {
    const header = rows[0];
    console.log('\nColumn indices:');
    header.forEach((h, i) => console.log(` ${i}: "${h}"`));
    
    // Check how many rows have eFG%
    const efgIdx = header.indexOf('eFG%');
    const ftRateIdx = header.indexOf('FT Rate');
    const astToIdx = header.indexOf('AST:TO');
    const confCheckIdx = header.indexOf('Conference Check');
    const teamImpactIdx = header.indexOf('Team Impact Flag');
    const flightRiskIdx = header.indexOf('Flight Risk Score');
    
    console.log('\nKey column indices:');
    console.log('eFG%:', efgIdx, 'FT Rate:', ftRateIdx, 'AST:TO:', astToIdx);
    console.log('Conference Check:', confCheckIdx);
    console.log('Team Impact Flag:', teamImpactIdx);
    console.log('Flight Risk Score:', flightRiskIdx);
    
    let missingEfg = 0, missingFtRate = 0, missingAstTo = 0;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1]) continue; // skip empty rows
      if (efgIdx >= 0 && !r[efgIdx]) missingEfg++;
      if (ftRateIdx >= 0 && !r[ftRateIdx]) missingFtRate++;
      if (astToIdx >= 0 && !r[astToIdx]) missingAstTo++;
    }
    console.log(`\nMissing eFG%: ${missingEfg}, FT Rate: ${missingFtRate}, AST:TO: ${missingAstTo}`);
    
    // Show players missing key data
    console.log('\nRows missing Grade or Cin. Score or PPG:');
    const gradeIdx = header.indexOf('Grade (20-80)');
    const cinIdx = header.indexOf('Cin. Score');
    const ppgIdx = header.indexOf('PPG');
    let missingCount = 0;
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r[1]) continue;
      if (!r[gradeIdx] || !r[cinIdx] || !r[ppgIdx]) {
        console.log(`  Row ${i+1}: Player="${r[1]}", Grade="${r[gradeIdx]}", Cin="${r[cinIdx]}", PPG="${r[ppgIdx]}"`);
        missingCount++;
      }
    }
    console.log('Total missing:', missingCount);
  }
  
  // Save full data
  fs.writeFileSync('/tmp/portal-board-live.json', JSON.stringify(rows, null, 2));
  console.log('\nSaved to /tmp/portal-board-live.json');
}

main().catch(e => { console.error(e.message); process.exit(1); });
