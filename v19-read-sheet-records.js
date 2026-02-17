// Read Portal Big Board to find missing/empty team records and collect current records
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

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET}'!A1:AT160`
  });
  const rows = resp.data.values || [];
  const headers = rows[0];

  // Find Team Record column (V = index 21)
  const teamRecordIdx = headers.findIndex(h => h && h.toLowerCase().includes('team record'));
  const currentSchoolIdx = 5; // F
  const nameIdx = 1;
  const tierIdx = 0;
  
  console.log(`Team Record column: index ${teamRecordIdx} = "${headers[teamRecordIdx]}"`);
  console.log(`Current School column: index ${currentSchoolIdx} = "${headers[currentSchoolIdx]}"`);

  // Collect missing records and by school
  const missingRecords = [];
  const schoolCounts = new Map();
  
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const tier = row[tierIdx] || '';
    const name = row[nameIdx] || '';
    const school = row[currentSchoolIdx] || '';
    const record = teamRecordIdx >= 0 ? (row[teamRecordIdx] || '') : '';
    
    // Skip removed/NBA rows
    if (tier.includes('REMOVED') || tier.includes('NBA')) continue;
    
    if (!school.trim()) {
      console.log(`Row ${i+1}: ${name} - no school listed`);
      continue;
    }
    
    if (!schoolCounts.has(school)) schoolCounts.set(school, { rows: [], hasRecord: false });
    const entry = schoolCounts.get(school);
    entry.rows.push(i + 1);
    if (record.trim()) entry.hasRecord = true;
    
    if (!record.trim()) {
      missingRecords.push({ row: i + 1, name, school, tier });
    }
  }
  
  console.log(`\nTotal rows with missing team records: ${missingRecords.length}`);
  
  // Group by school
  const missingBySchool = new Map();
  for (const m of missingRecords) {
    if (!missingBySchool.has(m.school)) missingBySchool.set(m.school, []);
    missingBySchool.get(m.school).push(m.row);
  }
  
  console.log('\nSchools with missing team records:');
  for (const [school, rows] of missingBySchool.entries()) {
    console.log(`  ${school}: rows ${rows.join(', ')}`);
  }
  
  // Show all schools with their current records (for reference)
  console.log('\n--- All schools and current records ---');
  const allSchoolRecords = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const tier = row[tierIdx] || '';
    if (tier.includes('REMOVED')) continue;
    const school = row[currentSchoolIdx] || '';
    const record = teamRecordIdx >= 0 ? (row[teamRecordIdx] || '') : '';
    const name = row[nameIdx] || '';
    if (school && !allSchoolRecords.has(school)) {
      allSchoolRecords.set(school, { record, samplePlayer: name, teamRecordColIdx: teamRecordIdx });
    }
  }
  for (const [school, info] of allSchoolRecords.entries()) {
    const status = info.record ? `"${info.record}"` : '⚠️ MISSING';
    console.log(`  ${school}: ${status}`);
  }
  
  // Save state
  const state = {
    teamRecordColIdx: teamRecordIdx,
    teamRecordColLetter: String.fromCharCode(65 + teamRecordIdx),
    missingRecords,
    missingBySchool: [...missingBySchool.entries()].map(([school, rows]) => ({ school, rows })),
    allSchools: [...allSchoolRecords.entries()].map(([s, v]) => ({ school: s, record: v.record }))
  };
  fs.writeFileSync('/tmp/v19-missing-records.json', JSON.stringify(state, null, 2));
  console.log('\nSaved to /tmp/v19-missing-records.json');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
