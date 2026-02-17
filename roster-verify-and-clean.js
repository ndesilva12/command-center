/**
 * ROSTER VERIFICATION + CLEANUP
 * 
 * Cross-reference DB player names against ESPN 2025-26 roster.
 * Players not found in current roster → moved to "Removed" tab.
 * Walter Clayton Jr. → always removed.
 * Non-D1 players → skip (roster only has D1).
 */

const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const TOKEN_FILE = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const ROSTER_FILE = '/tmp/all-players-roster.json';

// ─── Auth ─────────────────────────────────────────────────────────────────
const token = JSON.parse(fs.readFileSync(TOKEN_FILE, 'utf8'));
const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

// ─── Load Roster ──────────────────────────────────────────────────────────
const rosterData = JSON.parse(fs.readFileSync(ROSTER_FILE, 'utf8'));
console.log(`✅ Loaded ${rosterData.length} players from ESPN roster (D1 2025-26)`);

// Normalize a name for matching
function normalizeName(name) {
  return name
    .toLowerCase()
    .replace(/\./g, '')          // remove periods
    .replace(/'/g, '')           // remove apostrophes
    .replace(/`/g, '')
    .replace(/'/g, '')           // fancy apostrophe
    .replace(/\s+(jr|sr|ii|iii|iv|v)\s*$/i, '') // remove suffixes
    .replace(/[^a-z0-9\s]/g, '') // remove remaining special chars
    .replace(/\s+/g, ' ')
    .trim();
}

// Build roster lookup sets
const rosterNormNames = new Set(rosterData.map(p => normalizeName(p.name)));
const rosterNormByName = {};
for (const p of rosterData) {
  const key = normalizeName(p.name);
  if (!rosterNormByName[key]) rosterNormByName[key] = [];
  rosterNormByName[key].push(p);
}

console.log(`  Unique normalized names in roster: ${rosterNormNames.size}`);

// Also build a set of (normalized_name + team_keyword) for disambiguation
const rosterTeamMap = {};
for (const p of rosterData) {
  const nameKey = normalizeName(p.name);
  const teamKey = p.team.toLowerCase().replace(/[^a-z]/g, '').slice(0, 8);
  rosterTeamMap[`${nameKey}|${teamKey}`] = p;
}

async function main() {
  // ─── Get sheet info ──────────────────────────────────────────────────────
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const allSheets = meta.data.sheets.map(s => ({
    id: s.properties.sheetId,
    title: s.properties.title,
    index: s.properties.index,
    rowCount: s.properties.gridProperties.rowCount,
  }));
  console.log('\n📋 Tabs:', allSheets.map(s => s.title).join(', '));

  // ─── Find Full Database tab ──────────────────────────────────────────────
  const dbTab = allSheets.find(s => s.title.includes('Full Database'));
  if (!dbTab) { console.error('❌ Full Database tab not found!'); return; }
  console.log(`\n🔍 Using: "${dbTab.title}" (sheetId: ${dbTab.id})`);

  // ─── Read all data ───────────────────────────────────────────────────────
  const readResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${dbTab.title}'!A1:AZ8000`,
  });
  const allRows = readResp.data.values || [];
  const header = allRows[0];
  const dataRows = allRows.slice(1);
  
  console.log(`📊 DB rows: ${dataRows.length}`);
  
  // Column indices
  const COL_PLAYER = 0;       // "Player"
  const COL_TEAM = 1;         // "Team"
  const COL_CONF = 2;         // "Conference"
  const COL_POS = 3;          // "Position"
  const COL_YEAR = 4;         // "Year"

  // ─── Cross-reference ─────────────────────────────────────────────────────
  const toKeep = [];
  const toRemove = [];
  const noD1Skip = [];
  let walterFound = 0;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const playerName = String(row[COL_PLAYER] || '').trim();
    const team = String(row[COL_TEAM] || '').trim();
    const conf = String(row[COL_CONF] || '').trim();
    const rowNum = i + 2; // 1-indexed + header row

    if (!playerName) {
      // Blank row - keep it
      toKeep.push({ rowNum, playerName, row, note: 'blank' });
      continue;
    }

    // ── Walter Clayton Jr. - always remove ──
    if (playerName.toLowerCase().includes('walter clayton')) {
      walterFound++;
      console.log(`🚨 FOUND: Walter Clayton Jr. at row ${rowNum} (team: ${team})`);
      toRemove.push({ rowNum, playerName, row, reason: 'Walter Clayton Jr. - NBA Draft, no longer enrolled' });
      continue;
    }

    // ── Non-D1 entries - skip roster check ──
    if (conf === 'Non-D1' || team.toLowerCase().includes('non-d1')) {
      noD1Skip.push({ rowNum, playerName });
      toKeep.push({ rowNum, playerName, row, note: 'non-d1-skip' });
      continue;
    }

    // ── Normalize name for matching ──
    const normName = normalizeName(playerName);
    
    if (!normName) {
      toKeep.push({ rowNum, playerName, row, note: 'empty-after-norm' });
      continue;
    }

    // ── Primary match: normalized name ──
    if (rosterNormNames.has(normName)) {
      toKeep.push({ rowNum, playerName, row });
      continue;
    }

    // ── Secondary: try removing "Jr." from DB name ──
    const noSuffix = normName.replace(/\s*(jr|sr|ii|iii|iv)\s*$/, '').trim();
    if (noSuffix !== normName && rosterNormNames.has(noSuffix)) {
      toKeep.push({ rowNum, playerName, row, note: 'matched-without-suffix' });
      continue;
    }
    
    // ── Tertiary: first + last name only (handle middle names) ──
    const parts = normName.split(' ');
    if (parts.length > 2) {
      const firstLast = `${parts[0]} ${parts[parts.length - 1]}`;
      if (rosterNormNames.has(firstLast)) {
        toKeep.push({ rowNum, playerName, row, note: 'matched-first-last' });
        continue;
      }
    }

    // ── Not found → suspect ──
    toRemove.push({
      rowNum,
      playerName,
      team,
      conf,
      row,
      reason: 'Not found in 2025-26 ESPN D1 roster',
    });
  }

  console.log(`\n📊 CROSS-REFERENCE RESULTS:`);
  console.log(`  ✅ Keep (confirmed/skipped): ${toKeep.length}`);
  console.log(`  ❌ Remove (not in roster): ${toRemove.length}`);
  console.log(`  ⏭️  Non-D1 skipped: ${noD1Skip.length}`);
  console.log(`  🚨 Walter Clayton Jr.: ${walterFound} found`);

  // Show sample of removed players
  console.log(`\n🗑️  Sample removed players (first 40):`);
  toRemove.slice(0, 40).forEach(r => {
    console.log(`  Row ${r.rowNum}: ${r.playerName} | ${r.team} | ${r.conf}`);
  });
  if (toRemove.length > 40) console.log(`  ... and ${toRemove.length - 40} more`);

  // ─── Save report ──────────────────────────────────────────────────────────
  const report = {
    timestamp: new Date().toISOString(),
    rosterCount: rosterData.length,
    dbCount: dataRows.length,
    kept: toKeep.length,
    removed: toRemove.length,
    nonD1Skipped: noD1Skip.length,
    walterClayton: walterFound,
    removedPlayers: toRemove.map(r => ({
      row: r.rowNum,
      name: r.playerName,
      team: r.team,
      conf: r.conf,
      reason: r.reason,
    })),
  };
  fs.writeFileSync('/tmp/roster-verify-report.json', JSON.stringify(report, null, 2));
  console.log('\n💾 Saved report → /tmp/roster-verify-report.json');

  if (toRemove.length === 0) {
    console.log('\n✅ Nothing to remove. All D1 players verified!');
    return;
  }

  // ─── Create / find Removed tab ────────────────────────────────────────────
  let removedTab = allSheets.find(s =>
    s.title.toLowerCase().includes('removed') ||
    s.title.toLowerCase().includes('no longer')
  );

  if (!removedTab) {
    console.log('\n📝 Creating "Removed - No Longer Enrolled" tab...');
    const addResp = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: {
        requests: [{
          addSheet: {
            properties: { title: 'Removed - No Longer Enrolled', index: allSheets.length },
          },
        }],
      },
    });
    const newProps = addResp.data.replies[0].addSheet.properties;
    removedTab = { id: newProps.sheetId, title: newProps.title };

    // Write header
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${removedTab.title}'!A1`,
      valueInputOption: 'RAW',
      resource: { values: [['Removed Date', 'Reason', ...header]] },
    });
    console.log(`  ✅ Created: "${removedTab.title}"`);
  } else {
    console.log(`\n📋 Using existing removed tab: "${removedTab.title}"`);
  }

  // ─── Copy rows to Removed tab ─────────────────────────────────────────────
  const removedReadResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${removedTab.title}'!A:A`,
  });
  const nextRow = (removedReadResp.data.values || []).length + 1;
  console.log(`  Writing to row ${nextRow}...`);

  const removedValues = toRemove.map(r => [
    new Date().toISOString().slice(0, 10),
    r.reason,
    ...r.row,
  ]);

  const BATCH = 500;
  for (let i = 0; i < removedValues.length; i += BATCH) {
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `'${removedTab.title}'!A${nextRow + i}`,
      valueInputOption: 'RAW',
      resource: { values: removedValues.slice(i, i + BATCH) },
    });
    console.log(`  ✅ Archived batch ${Math.floor(i / BATCH) + 1}/${Math.ceil(removedValues.length / BATCH)}`);
  }

  // ─── Delete from DB tab (bottom-up) ───────────────────────────────────────
  console.log(`\n🗑️  Deleting ${toRemove.length} rows from "${dbTab.title}"...`);
  const rowNums = toRemove.map(r => r.rowNum).sort((a, b) => b - a);

  // Group consecutive rows for efficiency
  const deleteRequests = rowNums.map(rowNum => ({
    deleteDimension: {
      range: {
        sheetId: dbTab.id,
        dimension: 'ROWS',
        startIndex: rowNum - 1,
        endIndex: rowNum,
      },
    },
  }));

  // Process in batches of 100 (API limit caution)
  for (let i = 0; i < deleteRequests.length; i += 100) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      resource: { requests: deleteRequests.slice(i, i + 100) },
    });
    const done = Math.min(i + 100, deleteRequests.length);
    console.log(`  ✅ Deleted batch ${Math.floor(i / 100) + 1}: rows ${i + 1}-${done} of ${deleteRequests.length}`);
    await new Promise(r => setTimeout(r, 600));
  }

  console.log('\n🎉 ROSTER VERIFICATION COMPLETE!');
  console.log(`  Before: ${dataRows.length} players`);
  console.log(`  Removed: ${toRemove.length}`);
  console.log(`  After: ${dataRows.length - toRemove.length} active D1 players`);
  console.log(`  Walter Clayton Jr.: ${walterFound > 0 ? '✅ REMOVED' : 'ℹ️  Was already gone'}`);
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  if (err.errors) console.error(JSON.stringify(err.errors));
  process.exit(1);
});
