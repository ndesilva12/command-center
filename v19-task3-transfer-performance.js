// V19 Task 3: Integrate Historical Transfer Performance
// Cross-reference Portal Big Board players with transfer-index.json
// Fill in PPG Delta (column AQ) where currently empty

const { google } = require('/Users/normandesilva/command-center/command-center/node_modules/googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const TRANSFER_INDEX_PATH = '/tmp/transfer-index.json';
const TRANSFER_SUMMARY_PATH = '/tmp/transfer-summary.json';

function normalizeName(name) {
  return name.toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function getAuth() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
  auth.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
  return auth;
}

async function main() {
  // Load transfer data
  console.log('Loading transfer data...');
  const transferIndex = JSON.parse(fs.readFileSync(TRANSFER_INDEX_PATH));
  const transfers = transferIndex.transfers || [];
  console.log(`Loaded ${transfers.length} transfer records`);

  // Build lookup by normalized name
  const transferByName = new Map();
  for (const t of transfers) {
    const key = normalizeName(t.name || '');
    if (!transferByName.has(key)) {
      transferByName.set(key, []);
    }
    transferByName.get(key).push(t);
  }

  // Auth and read sheet
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const SHEET = 'Portal Big Board';

  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET}'!A1:AT160`
  });
  const rows = resp.data.values || [];
  const headers = rows[0];

  // Column indices (0-based)
  // AO=40, AP=41, AQ=42, AR=43, AS=44, AT=45
  const nameIdx = 1;        // B
  const ppgIdx = 9;         // J - current PPG
  const priorSchoolIdx = 40; // AO
  const prevPPGIdx = 41;    // AP
  const ppgDeltaIdx = 42;   // AQ
  const v18NotesIdx = 45;   // AT

  console.log(`Headers check: AQ=${headers[ppgDeltaIdx]}, AO=${headers[priorSchoolIdx]}`);

  const updates = [];
  const matches = [];
  const noMatch = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameIdx] || '';
    const currentPPG = parseFloat(row[ppgIdx]) || 0;
    const existingDelta = row[ppgDeltaIdx] || '';
    const existingPriorSchool = row[priorSchoolIdx] || '';
    
    if (!name) continue;

    const key = normalizeName(name);
    const playerTransfers = transferByName.get(key) || [];

    if (playerTransfers.length === 0) {
      noMatch.push(name);
      continue;
    }

    // Find the most recent transfer
    const sorted = playerTransfers.sort((a, b) => (b.toSeason || 0) - (a.toSeason || 0));
    const latestTransfer = sorted[0];

    const beforePPG = latestTransfer.statDelta?.avgPoints?.before;
    const afterPPG = latestTransfer.statDelta?.avgPoints?.after;
    const deltaPPG = latestTransfer.statDelta?.avgPoints?.delta;

    // Only fill in AQ if it's currently empty
    if (existingDelta === '' || existingDelta === null || existingDelta === undefined) {
      let deltaStr = '';
      if (deltaPPG !== undefined && deltaPPG !== null) {
        deltaStr = deltaPPG >= 0 ? `+${deltaPPG.toFixed(1)}` : `${deltaPPG.toFixed(1)}`;
      } else if (beforePPG !== undefined && afterPPG !== undefined) {
        const calc = afterPPG - beforePPG;
        deltaStr = calc >= 0 ? `+${calc.toFixed(1)}` : `${calc.toFixed(1)}`;
      }

      if (deltaStr) {
        const rowNum = i + 1;
        // Update AQ (PPG Delta)
        updates.push({
          range: `'${SHEET}'!AQ${rowNum}`,
          values: [[deltaStr]]
        });
        // Update AP (Prev PPG) if empty
        if (!existingPriorSchool && latestTransfer.fromTeam) {
          // Update AO (Prior School) if empty
          updates.push({
            range: `'${SHEET}'!AO${rowNum}`,
            values: [[latestTransfer.fromTeamShort || latestTransfer.fromTeam]]
          });
        }
        if (!(row[prevPPGIdx]) && beforePPG !== undefined) {
          updates.push({
            range: `'${SHEET}'!AP${rowNum}`,
            values: [[beforePPG.toFixed(1)]]
          });
        }

        matches.push({
          name,
          row: rowNum,
          fromTeam: latestTransfer.fromTeam,
          toTeam: latestTransfer.toTeam,
          fromSeason: latestTransfer.fromSeason,
          toSeason: latestTransfer.toSeason,
          beforePPG,
          afterPPG,
          deltaStr
        });
      }
    } else {
      // Already has delta data
      matches.push({
        name,
        row: i + 1,
        alreadyFilled: true,
        existingDelta
      });
    }
  }

  console.log(`\nMatches found: ${matches.length} (${matches.filter(m=>!m.alreadyFilled).length} with new data)`);
  console.log(`No matches: ${noMatch.length}`);
  console.log(`Updates to make: ${updates.length}`);

  // Log matches with new data
  const newMatches = matches.filter(m => !m.alreadyFilled);
  newMatches.forEach(m => {
    console.log(`  Row ${m.row}: ${m.name} | ${m.fromTeam}→${m.toTeam} | ${m.beforePPG}→${m.afterPPG} PPG | Delta: ${m.deltaStr}`);
  });

  // Apply updates in batches of 50
  if (updates.length > 0) {
    const BATCH_SIZE = 50;
    for (let b = 0; b < updates.length; b += BATCH_SIZE) {
      const batch = updates.slice(b, b + BATCH_SIZE);
      const updateResp = await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: 'RAW',
          data: batch
        }
      });
      console.log(`Batch ${Math.floor(b/BATCH_SIZE)+1}: updated ${updateResp.data.totalUpdatedCells} cells`);
    }
    console.log('✅ All updates applied');
  } else {
    console.log('No updates needed (all PPG deltas already filled)');
  }

  const result = {
    task: 'task3-transfer-performance',
    success: true,
    matchesFound: matches.length,
    newDataAdded: newMatches.length,
    noMatch: noMatch.slice(0, 30),
    updates: updates.length,
    topMatches: newMatches.slice(0, 20)
  };

  fs.writeFileSync('/tmp/v19-task3-result.json', JSON.stringify(result, null, 2));
  console.log('Result saved to /tmp/v19-task3-result.json');
  return result;
}

main().catch(e => {
  console.error('ERROR:', e.message);
  if (e.response) console.error('Response:', JSON.stringify(e.response.data));
  process.exit(1);
});
