const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(creds.client_id, creds.client_secret);
auth.setCredentials({ access_token: creds.access_token, refresh_token: creds.refresh_token });
const sheets = google.sheets({ version: 'v4', auth });
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

async function run() {
  // =====================
  // TASK 1: Fix Norman's Rankings
  // =====================
  console.log('📋 Reading Norman\'s Rankings...');
  const nrData = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "Norman's Rankings!A1:J200"
  });
  const rows = nrData.data.values || [];
  console.log('Total rows:', rows.length);
  
  const updates = [];
  
  // Find Tylor Perry row - change Tier to REMOVED and add specific note
  rows.forEach((row, i) => {
    const rowNum = i + 1;
    if (row[1] === 'Tylor Perry') {
      console.log(`Found Tylor Perry at row ${rowNum}:`, JSON.stringify(row));
      // Col A = Tier (index 0), Col I = ⚠️ Flag (index 8)
      updates.push({
        range: `Norman's Rankings!A${rowNum}`,
        values: [['REMOVED']]
      });
      updates.push({
        range: `Norman's Rankings!I${rowNum}`,
        values: [['G-League (Raptors 905) — NOT eligible. Remove from board.']]
      });
    }
  });
  
  // Verify Jaden Bradley is correct (Task 1.2 - may already be done)
  rows.forEach((row, i) => {
    const rowNum = i + 1;
    if (row[1] && row[1].toLowerCase().includes('caleb bradley')) {
      console.log(`Found Caleb Bradley at row ${rowNum} - fixing to Jaden Bradley`);
      updates.push({ range: `Norman's Rankings!B${rowNum}`, values: [['Jaden Bradley']] });
    }
    if (row[1] === 'Jaden Bradley') {
      console.log(`Jaden Bradley already correct at row ${rowNum}`);
    }
  });
  
  // Verify Bogdan → Milan Momcilovic fix (Task 1.3)
  rows.forEach((row, i) => {
    const rowNum = i + 1;
    if (row[1] && row[1].toLowerCase().includes('bogdan')) {
      console.log(`Found Bogdan at row ${rowNum} - fixing`);
      updates.push({ range: `Norman's Rankings!B${rowNum}`, values: [['Milan Momcilovic']] });
      updates.push({ range: `Norman's Rankings!C${rowNum}`, values: [['Iowa State']] });
    }
  });
  
  // Verify Tre Fears → Jeremy Fears Jr. (Task 1.4)
  rows.forEach((row, i) => {
    const rowNum = i + 1;
    if (row[1] && row[1].toLowerCase().includes('tre fears')) {
      console.log(`Found Tre Fears at row ${rowNum} - fixing`);
      updates.push({ range: `Norman's Rankings!B${rowNum}`, values: [['Jeremy Fears Jr.']] });
    }
  });
  
  // Find last row with data for Norman's Rankings
  let lastRow = rows.length;
  for (let i = rows.length - 1; i >= 0; i--) {
    if (rows[i] && rows[i].some(c => c && c.trim())) {
      lastRow = i + 2; // one row after last data
      break;
    }
  }
  console.log('Last row for center gap note:', lastRow);
  
  // Add CENTER GAP ANALYSIS at bottom
  const centerNote = 'CENTER GAP ANALYSIS: 2 centers found matching criteria (P6/High-Major, FG%>52, Grade≥50): [1] Henri Veesaar (UNC, ACC, 7\'0\", 61.5% FG, Grade 58, T3-Portal) — 1yr elig left, immediate T2 upgrade candidate. [2] Graham Ike (Gonzaga, WCC, 7\'0\", 58.2% FG, Grade 61, Cin Score 100) — 0 elig left, verify grad transfer. REMOVED from consideration: Broome (NBA-76ers), Danny Wolf (NBA-Nets). RECOMMENDATION: Elevate Veesaar to T2. CRITICAL GAP — no T1/T2 rim protectors remain after NBA departures.';
  updates.push({
    range: `Norman's Rankings!A${lastRow}:B${lastRow}`,
    values: [['CENTER GAP NOTE', centerNote]]
  });
  
  console.log('\nApplying', updates.length, 'updates to Norman\'s Rankings...');
  
  // Apply updates in batch
  for (const upd of updates) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: upd.range,
      valueInputOption: 'RAW',
      requestBody: { values: upd.values }
    });
    console.log('  ✓ Updated:', upd.range, '->', JSON.stringify(upd.values));
    await new Promise(r => setTimeout(r, 200));
  }
  
  console.log('\n✅ Task 1 complete');
  
  // =====================
  // TASK 5: Version stamp on Portal Big Board AH1
  // =====================
  console.log('\n📋 Updating Portal Big Board version stamp (AH1)...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!AH1',
    valueInputOption: 'RAW',
    requestBody: { values: [['Last enriched: v14 | 2026-02-17 | Identity fixes | Center query | Transfer intelligence added']] }
  });
  console.log('✅ Version stamp updated: AH1');
  
  // =====================
  // TASK 4: Create/Update Transfer Intelligence tab
  // =====================
  console.log('\n📋 Setting up Transfer Intelligence tab...');
  
  // Check if tab exists
  const sheetsInfo = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingSheets = sheetsInfo.data.sheets.map(s => s.properties.title);
  console.log('Existing sheets:', existingSheets);
  
  if (!existingSheets.includes('Transfer Intelligence')) {
    console.log('Creating Transfer Intelligence tab...');
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: 'Transfer Intelligence',
              gridProperties: { rowCount: 100, columnCount: 26 }
            }
          }
        }]
      }
    });
    console.log('✅ Tab created');
  } else {
    console.log('Transfer Intelligence tab already exists');
  }
  
  // Write top 3 findings to A1
  const profile = JSON.parse(fs.readFileSync('/tmp/transfer-success-profile-v14.json'));
  const top3 = profile.top3ForSheet;
  const a1Content = `TRANSFER INTELLIGENCE — v14 | 2026-02-17\n\nFINDING 1: ${top3[0]}\n\nFINDING 2: ${top3[1]}\n\nFINDING 3: ${top3[2]}`;
  
  const tiData = [
    ['TRANSFER INTELLIGENCE — Cinderella Project v14', '', '', ''],
    ['Generated: 2026-02-17 | Based on 50 tracked transfers (2024→2025 season)', '', '', ''],
    ['', '', '', ''],
    ['KEY FINDING 1', top3[0], '', ''],
    ['', '', '', ''],
    ['KEY FINDING 2', top3[1], '', ''],
    ['', '', '', ''],
    ['KEY FINDING 3', top3[2], '', ''],
    ['', '', '', ''],
    ['FULL ANALYSIS', '', '', ''],
    ['Metric', 'Successful Transfers (+2PPG)', 'Failed Transfers (-2PPG)', 'All Transfers'],
    ['Count', profile.successfulTransferProfile.count, profile.failedTransferProfile.count, profile.overallStats.totalTransfers],
    ['Avg Prev PPG', profile.successfulTransferProfile.avgPrevPPG, profile.failedTransferProfile.avgPrevPPG, 'N/A'],
    ['Avg Prev Minutes', profile.successfulTransferProfile.avgPrevMinutes, profile.failedTransferProfile.avgPrevMinutes, 'N/A'],
    ['Avg PPG Delta', profile.successfulTransferProfile.avgPPGdelta, profile.failedTransferProfile.avgPPGdelta, profile.overallStats.avgPPGdelta],
    ['Avg RPG Delta', profile.successfulTransferProfile.avgRPGdelta, profile.failedTransferProfile.avgRPGdelta, profile.overallStats.avgRPGdelta],
    ['Avg APG Delta', profile.successfulTransferProfile.avgAPGdelta, profile.failedTransferProfile.avgAPGdelta, profile.overallStats.avgAPGdelta],
    ['', '', '', ''],
    ['CINDERELLA TARGETING RULE', 'Target: 10-18 min/game, 6-12 PPG at high-major — underutilized, proven, ready to EXPLODE', '', ''],
    ['AVOID', 'High-usage stars (22+ PPG) transferring laterally — typically underperform', '', ''],
    ['', '', '', ''],
    ['Data file', '/tmp/transfer-success-profile-v14.json', '', ''],
  ];
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Transfer Intelligence!A1:D22',
    valueInputOption: 'RAW',
    requestBody: { values: tiData }
  });
  console.log('✅ Transfer Intelligence tab populated');
  
  console.log('\n🎉 ALL TASKS COMPLETE');
}

run().catch(e => {
  console.error('ERROR:', e.message);
  if (e.response) console.error('Details:', JSON.stringify(e.response.data, null, 2));
});
