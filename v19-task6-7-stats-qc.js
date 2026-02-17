// V19 Tasks 6 & 7: eFG%, FT Rate, and AST:TO QC for top 30 by Cin Score v2
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

  // Column indices (0-based)
  const nameIdx = 1;          // B
  const ppgIdx = 9;           // J - PPG  
  const rpgIdx = 10;          // K - RPG
  const apgIdx = 11;          // L - APG
  const fgPctIdx = 12;        // M - FG%
  const threePctIdx = 13;     // N - 3P%
  const ftPctIdx = 14;        // O - FT%
  const efgIdx = 18;          // S - eFG%
  const ftRateIdx = 19;       // T - FT Rate
  const astToIdx = 20;        // U - AST:TO
  const cinV2Idx = 31;        // AF - Cin Score v2
  const tierIdx = 0;

  console.log(`Key columns: eFG%=${headers[efgIdx]}, FTRate=${headers[ftRateIdx]}, AST:TO=${headers[astToIdx]}, CinV2=${headers[cinV2Idx]}`);

  // Collect all eligible players with their Cin Score v2
  const players = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const name = row[nameIdx] || '';
    const tier = row[tierIdx] || '';
    
    // Skip removed/divider rows
    if (!name || tier.includes('REMOVED') || tier.includes('NEW TARGETS') || tier.includes('HOOPSHQ') || tier.includes('HIGH-MAJOR')) continue;
    
    const cinV2Raw = row[cinV2Idx] || '';
    const cinV2 = parseFloat(cinV2Raw) || 0;
    
    players.push({
      row: i + 1,
      name,
      tier,
      cinV2,
      ppg: parseFloat(row[ppgIdx]) || 0,
      rpg: parseFloat(row[rpgIdx]) || 0,
      apg: parseFloat(row[apgIdx]) || 0,
      fgPct: parseFloat(row[fgPctIdx]) || 0,
      threePct: parseFloat(row[threePctIdx]) || 0,
      ftPct: parseFloat(row[ftPctIdx]) || 0,
      efg: row[efgIdx] || '',
      ftRate: row[ftRateIdx] || '',
      astTo: row[astToIdx] || '',
    });
  }

  // Sort by Cin Score v2 descending, take top 30
  players.sort((a, b) => b.cinV2 - a.cinV2);
  const top30 = players.slice(0, 30);

  console.log('\nTop 30 players by Cin Score v2:');
  top30.forEach((p, idx) => {
    console.log(`  ${idx+1}. Row ${p.row}: ${p.name} | CinV2=${p.cinV2} | eFG%="${p.efg}" | FTRate="${p.ftRate}" | AST:TO="${p.astTo}"`);
  });

  // Identify issues and prepare fixes
  const updates = [];
  const fixes = [];

  for (const p of top30) {
    const rowNum = p.row;
    
    // Check eFG%
    // eFG% should be a percentage like 57.9 or decimal like 0.579
    // If it's blank or 0, we can estimate from FG% data
    // Note: Without FGM/3PM/FGA, we can approximate eFG% from FG% and 3P%
    // Simple approximation: if they shoot well from 3, eFG > FG%
    
    let efgFixed = false;
    if (!p.efg || p.efg === '0' || p.efg === '') {
      // Try to estimate: eFG% ≈ FG% + (3P% attempt rate × 3P% × 0.5)
      // Without volume data, best we can do is note it's missing
      // If FG% is available, use it as rough proxy
      if (p.fgPct > 0) {
        // Conservative estimate: assume ~30% of shots are 3s for typical player
        const estimated = (p.fgPct + (p.threePct > 0 ? p.threePct * 0.15 : 0)).toFixed(1);
        console.log(`  ⚠️ Row ${rowNum}: ${p.name} - eFG% blank, estimated ~${estimated}% (using FG% ${p.fgPct})`);
        // Don't overwrite with estimates — too imprecise without volume
      } else {
        console.log(`  ❌ Row ${rowNum}: ${p.name} - eFG% blank AND no FG% data`);
      }
    } else {
      // Validate range
      const efgNum = parseFloat(p.efg);
      if (efgNum > 0 && efgNum < 1) {
        // Convert to percentage if stored as decimal
        const efgPct = (efgNum * 100).toFixed(1);
        console.log(`  ⚠️ Row ${rowNum}: ${p.name} - eFG% stored as decimal ${p.efg}, converting to ${efgPct}%`);
        updates.push({
          range: `'${SHEET}'!S${rowNum}`,
          values: [[efgPct]]
        });
        fixes.push({ row: rowNum, player: p.name, field: 'eFG%', old: p.efg, new: efgPct });
        efgFixed = true;
      } else if (efgNum >= 1 && efgNum <= 100) {
        // Normal percentage range — OK
      } else if (efgNum === 0 || isNaN(efgNum)) {
        console.log(`  ❌ Row ${rowNum}: ${p.name} - eFG% is "${p.efg}" (invalid)`);
      }
    }

    // Check FT Rate
    // FT Rate = FTA/FGA — typically 0.2 to 0.6 for most players (stored as decimal)
    if (!p.ftRate || p.ftRate === '' || p.ftRate === '0') {
      console.log(`  ❌ Row ${rowNum}: ${p.name} - FT Rate blank`);
    } else {
      const ftRateNum = parseFloat(p.ftRate);
      if (ftRateNum > 5) {
        // Probably stored as percentage accidentally — convert
        const ftRateFixed = (ftRateNum / 100).toFixed(3);
        console.log(`  ⚠️ Row ${rowNum}: ${p.name} - FT Rate "${p.ftRate}" looks too high, converting to ${ftRateFixed}`);
        updates.push({
          range: `'${SHEET}'!T${rowNum}`,
          values: [[ftRateFixed]]
        });
        fixes.push({ row: rowNum, player: p.name, field: 'FT Rate', old: p.ftRate, new: ftRateFixed });
      }
    }

    // Check AST:TO
    // Should be a ratio like 2.3 — check if blank
    if (!p.astTo || p.astTo === '' || p.astTo === '0') {
      // Calculate from APG and TPG if we can
      // We have APG (column L, index 11)
      // We need TPG — check if it's in the data somewhere
      // For now, just flag it
      console.log(`  ❌ Row ${rowNum}: ${p.name} - AST:TO blank (APG=${p.apg})`);
    } else {
      const astToNum = parseFloat(p.astTo);
      if (astToNum < 0 || astToNum > 20) {
        console.log(`  ⚠️ Row ${rowNum}: ${p.name} - AST:TO "${p.astTo}" suspicious`);
      }
    }
  }

  console.log(`\nTotal issues found: ${fixes.length} fixes needed`);
  console.log('Fixes:', JSON.stringify(fixes, null, 2));

  // Apply updates
  if (updates.length > 0) {
    const updateResp = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });
    console.log(`✅ Applied ${updateResp.data.totalUpdatedCells} fixes`);
  } else {
    console.log('✅ No format fixes needed for eFG% or FT Rate');
  }

  // Now do AST:TO completion - read TPG data if available
  // First check what columns we have
  console.log('\nHeaders around AST:TO area:');
  for (let i = 18; i <= 25; i++) {
    console.log(`  col ${i} (${String.fromCharCode(65+i)}): "${headers[i] || ''}"`);
  }

  const result = {
    task: 'task6-7-stats-qc',
    success: true,
    top30Checked: top30.length,
    fixesApplied: fixes.length,
    fixes,
    top30Summary: top30.map(p => ({
      row: p.row,
      name: p.name,
      cinV2: p.cinV2,
      efg: p.efg,
      ftRate: p.ftRate,
      astTo: p.astTo,
      issues: (!p.efg ? 'eFG_blank' : '') + (!p.ftRate ? ',ftRate_blank' : '') + (!p.astTo ? ',astTo_blank' : '')
    }))
  };

  fs.writeFileSync('/tmp/v19-task6-7-result.json', JSON.stringify(result, null, 2));
  console.log('\nResult saved to /tmp/v19-task6-7-result.json');
  return result;
}

main().catch(e => {
  console.error('ERROR:', e.message);
  if (e.response) console.error('Response:', JSON.stringify(e.response.data));
  process.exit(1);
});
