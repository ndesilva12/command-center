const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';

function normName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function main() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
  auth.setCredentials(token);
  const sheets = google.sheets({ version: 'v4', auth });

  // Verify PBB headers + first few rows
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Portal Big Board'!A1:AN5",
  });
  const rows = resp.data.values || [];
  console.log('=== PORTAL BIG BOARD VERIFICATION ===');
  console.log('Headers (AH-AN):');
  const h = rows[0] || [];
  for (let i = 33; i < h.length; i++) {
    console.log(`  col ${i} (${colLetter(i)}): ${h[i]}`);
  }
  
  console.log('\nFirst 4 player rows (AI-AN):');
  for (let r = 1; r < Math.min(5, rows.length); r++) {
    const row = rows[r] || [];
    console.log(`  Row ${r+1} (${row[1]}): AI=${row[34]} AJ=${row[35]} AK=${row[36]} AL=${row[37]} AM=${row[38]} AN=${row[39]}`);
  }

  // Check who wasn't matched
  const season2026 = JSON.parse(fs.readFileSync('/tmp/season-2026-stats.json'));
  const season2025 = JSON.parse(fs.readFileSync('/tmp/season-2025-stats.json'));
  const season2024 = JSON.parse(fs.readFileSync('/tmp/season-2024-stats.json'));
  
  const lookup2026 = {};
  const lookup2025 = {};
  const lookup2024 = {};
  
  for (const p of season2026.players || []) {
    const k = normName(p.name);
    if (k && !lookup2026[k]) lookup2026[k] = p;
  }
  for (const p of season2025.players || []) {
    const k = normName(p.name);
    if (k && !lookup2025[k]) lookup2025[k] = p;
  }
  for (const p of season2024.players || []) {
    const k = normName(p.name);
    if (k && !lookup2024[k]) lookup2024[k] = p;
  }
  
  const pbbResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Portal Big Board'!A1:AN200",
  });
  const pbbRows = pbbResp.data.values || [];
  
  console.log('\n=== UNMATCHED PLAYERS (no data in any season file) ===');
  const unmatched = [];
  for (let r = 1; r < pbbRows.length; r++) {
    const row = pbbRows[r] || [];
    const name = (row[1] || '').trim();
    if (!name) continue;
    const k = normName(name);
    if (!lookup2026[k] && !lookup2025[k] && !lookup2024[k]) {
      unmatched.push(`Row ${r+1}: ${name} | Tier=${row[0]} | School=${row[5]} | Status=${row[17]}`);
    }
  }
  unmatched.forEach(u => console.log(' ', u));
  console.log(`Total unmatched: ${unmatched.length}`);
  
  // Verify career trend breakdown
  console.log('\n=== CAREER TREND BREAKDOWN ===');
  const trends = { UP: 0, DOWN: 0, FLAT: 0, '': 0 };
  for (let r = 1; r < pbbRows.length; r++) {
    const row = pbbRows[r] || [];
    if (!row[1]) continue;
    const trend = row[36] || '';
    trends[trend] = (trends[trend] || 0) + 1;
  }
  console.log(trends);
  
  // Sample transfer history
  console.log('\n=== TRANSFER HISTORY SAMPLE ===');
  for (let r = 1; r < pbbRows.length; r++) {
    const row = pbbRows[r] || [];
    if (!row[1]) continue;
    if (row[38] && row[38] !== '1st-time') {
      console.log(`  ${row[1]}: ${row[38]}`);
    }
  }
}

function colLetter(n) {
  let result = '';
  n++;
  while (n > 0) {
    const rem = (n - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
