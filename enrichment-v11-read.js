const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

async function main() {
  console.log('=== READ PORTAL BIG BOARD v11 ===\n');

  // Read full Portal Big Board including AF (Cin Score v2)
  const readResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: 'Portal Big Board!A1:AF200',
  });
  const allRows = readResp.data.values || [];
  console.log(`Total rows: ${allRows.length}`);

  const header = allRows[0] || [];
  console.log('Header (A-AF):', JSON.stringify(header));

  // Find column indices
  const colIdx = {};
  header.forEach((h, i) => { colIdx[h] = i; });
  console.log('\nColumn indices:', JSON.stringify(colIdx));

  // Find Position column
  const posColIdx = header.findIndex(h => h && (h.toLowerCase().includes('pos') || h.toLowerCase() === 'position'));
  console.log(`\nPosition column index: ${posColIdx} (${header[posColIdx]})`);

  // Show first 20 data rows with Position and other key fields
  console.log('\n=== SAMPLE ROWS (2-25) ===');
  const playerRows = [];
  for (let i = 1; i < allRows.length; i++) {
    const r = allRows[i];
    if (!r || !r[1]) continue;
    playerRows.push({ rowIdx: i, data: r });
  }

  console.log(`\nTotal non-empty rows (excluding header): ${playerRows.length}`);

  // Show positions distribution
  const posMap = {};
  playerRows.forEach(({ data }) => {
    const pos = data[posColIdx] || 'EMPTY';
    posMap[pos] = (posMap[pos] || 0) + 1;
  });
  console.log('\nPosition distribution:');
  Object.entries(posMap).sort().forEach(([pos, count]) => {
    console.log(`  ${pos}: ${count}`);
  });

  // Show top 25 rows: Name, Tier, School, Position, NetAdj, Grade, CinScoreV1, CinScoreV2
  const nameIdx = header.findIndex(h => h && h.toLowerCase().includes('name'));
  const tierIdx = header.findIndex(h => h && h.toLowerCase() === 'tier');
  const schoolIdx = header.findIndex(h => h && h.toLowerCase().includes('school'));
  const netAdjIdx = header.findIndex(h => h && h.toLowerCase().includes('net adj'));
  const gradeIdx = header.findIndex(h => h && h.toLowerCase().includes('grade'));
  const cinV1Idx = header.findIndex(h => h && h.toLowerCase().includes('cin score') && !h.includes('v2'));
  const cinV2Idx = header.findIndex(h => h && h.includes('v2'));

  console.log(`\nKey columns: Name=${nameIdx}, Tier=${tierIdx}, School=${schoolIdx}, Pos=${posColIdx}, NetAdj=${netAdjIdx}, Grade=${gradeIdx}, CinV1=${cinV1Idx}, CinV2=${cinV2Idx}`);

  // Show players with "est." in NetAdj
  console.log('\n=== PLAYERS WITH est. NET ADJ ===');
  playerRows.forEach(({ rowIdx, data }) => {
    const netAdj = data[netAdjIdx] || '';
    if (netAdj.includes('est.')) {
      const name = data[nameIdx] || '';
      const school = data[schoolIdx] || '';
      const tier = data[tierIdx] || '';
      const cinV2 = data[cinV2Idx] || '';
      console.log(`  Row ${rowIdx+1}: ${name} | ${school} | Tier: ${tier} | NetAdj: ${netAdj} | CinV2: ${cinV2}`);
    }
  });

  // Show top 25 rows for CinScore v2 verification
  console.log('\n=== TOP 25 ROWS (Cin Score Check) ===');
  playerRows.slice(0, 25).forEach(({ rowIdx, data }) => {
    const name = data[nameIdx] || '';
    const tier = data[tierIdx] || '';
    const pos = data[posColIdx] || '';
    const netAdj = data[netAdjIdx] || '';
    const cinV1 = data[cinV1Idx] || '';
    const cinV2 = data[cinV2Idx] || '';
    console.log(`  Row ${rowIdx+1}: ${name} | Tier:${tier} | Pos:${pos} | NetAdj:${netAdj} | V1:${cinV1} | V2:${cinV2}`);
  });

  // Save full data for v11 processing
  const output = {
    header,
    playerRows: playerRows.map(({ rowIdx, data }) => ({ rowIdx, data })),
    colIndices: { nameIdx, tierIdx, schoolIdx, posColIdx, netAdjIdx, gradeIdx, cinV1Idx, cinV2Idx },
    posMap,
  };
  fs.writeFileSync('/tmp/v11-sheet-read.json', JSON.stringify(output, null, 2));
  console.log('\n✅ Saved to /tmp/v11-sheet-read.json');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
