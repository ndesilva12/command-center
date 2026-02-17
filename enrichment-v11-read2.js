const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

async function main() {
  console.log('=== READ PORTAL BIG BOARD v11 (Full Data) ===\n');

  const readResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Portal Big Board!A1:AF200',
  });
  const allRows = readResp.data.values || [];
  const header = allRows[0] || [];

  // Correct column indices
  const TIER = 0, PLAYER = 1, POSITION = 2, SCHOOL = 5, CLASS = 7, 
        GRADE = 15, NET_ADJ = 25, CIN_V1 = 24, CIN_V2 = 31;

  console.log('Header check:');
  console.log('  TIER(0):', header[0]);
  console.log('  PLAYER(1):', header[1]);
  console.log('  POSITION(2):', header[2]);
  console.log('  SCHOOL(5):', header[5]);
  console.log('  GRADE(15):', header[15]);
  console.log('  NET_ADJ(25):', header[25]);
  console.log('  CIN_V1(24):', header[24]);
  console.log('  CIN_V2(31):', header[31]);

  const playerRows = [];
  for (let i = 1; i < allRows.length; i++) {
    const r = allRows[i];
    if (!r || (!r[PLAYER] && !r[SCHOOL])) continue;
    playerRows.push({ rowNum: i + 1, rowIdx: i, data: r });
  }

  console.log(`\nTotal player rows: ${playerRows.length}`);

  // Players with est. Net Adj
  console.log('\n=== est. NET ADJ PLAYERS ===');
  playerRows.forEach(({ rowNum, data }) => {
    const netAdj = data[NET_ADJ] || '';
    if (netAdj.includes('est.')) {
      console.log(`  Row ${rowNum}: ${data[PLAYER]} | ${data[SCHOOL]} | Tier:${data[TIER]} | NetAdj:${netAdj} | CinV2:${data[CIN_V2]}`);
    }
  });

  // Position distribution
  console.log('\n=== POSITION BREAKDOWN ===');
  const posGroups = {};
  playerRows.forEach(({ rowNum, data }) => {
    const pos = (data[POSITION] || '').trim();
    if (!posGroups[pos]) posGroups[pos] = [];
    posGroups[pos].push({ rowNum, name: data[PLAYER], school: data[SCHOOL] });
  });
  Object.entries(posGroups).sort().forEach(([pos, players]) => {
    console.log(`  "${pos}": ${players.length} players`);
  });

  // Read Norman's Rankings tab
  const normResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: "Norman's Rankings!A1:J100",
  });
  const normRows = normResp.data.values || [];
  console.log(`\n=== NORMAN'S RANKINGS TAB ===`);
  console.log(`Total rows: ${normRows.length}`);
  normRows.slice(0, 60).forEach((r, i) => {
    if (r && (r[0] || r[1] || r[2])) {
      console.log(`  Row ${i+1}: ${JSON.stringify(r)}`);
    }
  });

  // Save full data
  const output = {
    header,
    playerRows: playerRows.map(({ rowNum, rowIdx, data }) => ({
      rowNum, rowIdx,
      tier: data[TIER] || '',
      player: data[PLAYER] || '',
      position: data[POSITION] || '',
      school: data[SCHOOL] || '',
      class: data[CLASS] || '',
      grade: data[GRADE] || '',
      netAdj: data[NET_ADJ] || '',
      cinV1: data[CIN_V1] || '',
      cinV2: data[CIN_V2] || '',
      fullRow: data,
    })),
    normansRankingsRows: normRows,
    posGroups,
  };
  fs.writeFileSync('/tmp/v11-full-read.json', JSON.stringify(output, null, 2));
  console.log('\n✅ Saved to /tmp/v11-full-read.json');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
