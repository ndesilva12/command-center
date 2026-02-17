/**
 * BUILD NORMAN'S MASTER RANKINGS BOARD
 * Compiles all 9 ranking exercises → cross-batch master board
 * Pushes to new "Norman's Rankings" tab in Google Sheet
 * 
 * Jimmy — Cinderella Project — Feb 17, 2026
 */

const {google} = require('googleapis');
const fs = require('fs');

const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const tokenData = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(tokenData.client_id, tokenData.client_secret);
auth.setCredentials({ access_token: tokenData.access_token, refresh_token: tokenData.refresh_token });
const sheets = google.sheets({ version: 'v4', auth });

// ============================================================
// ALL RANKING DATA FROM 9 EXERCISES
// Norman's actual rankings, batch by batch
// Format: { name, school, pos, yr, batch, batchRank, notes, redFlag, nrFlag }
// ============================================================

const rankingData = [
  // ═══════════════════════════════════════════════
  // GUARDS
  // ═══════════════════════════════════════════════

  // Exercise 1 — Guards Batch 1 (Mixed vets)
  { name: 'Tylor Perry', school: 'Texas Tech', pos: 'G', yr: 'Sr', batch: 'G1', batchRank: 1, notes: 'Winner. Tough, physical, intelligent. Two-way creator.', redFlag: false },
  { name: 'Cam Thornton', school: 'TBD', pos: 'G', yr: 'Sr', batch: 'G1', batchRank: 2, notes: 'Winner. Physical. Toughness grade high.', redFlag: false },
  { name: 'Duke Conwell', school: 'TBD', pos: 'G', yr: 'Sr', batch: 'G1', batchRank: 3, notes: 'Solid mid-tier guard.', redFlag: false },
  { name: 'Bennett Stirtz', school: 'Iowa', pos: 'G', yr: 'Sr', batch: 'G1', batchRank: 4, notes: 'Efficient. Below Conwell.', redFlag: false },
  { name: 'Unknown Peterson', school: 'TBD', pos: 'G', yr: 'Sr', batch: 'G1', batchRank: 5, notes: 'RED FLAG: Character, movement history, body language.', redFlag: true },
  { name: 'PJ Haggerty', school: 'Kansas State', pos: 'G', yr: 'Sr', batch: 'G1', batchRank: 6, notes: 'RED FLAG: Greedy shot selection. KState 10-15 but he is the reason they won any. NOTE: Cinderella Score 98/100 — high portal flight risk.', redFlag: true },

  // Exercise 2 — Guards Batch 2 (Non-Seniors)
  { name: 'Labaron Philon', school: 'Alabama', pos: 'G', yr: 'So', batch: 'G2', batchRank: 1, notes: 'SEC soph. Size + efficiency + playmaking on winning team. Elite creator.', redFlag: false },
  { name: 'Boogie Acuff', school: 'Arkansas', pos: 'G', yr: 'Fr', batch: 'G2', batchRank: 2, notes: 'Frosh. Elite production + 43% 3P% + 6.3 APG. Rare combo.', redFlag: false },
  { name: 'Juke Harris', school: 'Wake Forest', pos: 'G', yr: 'So', batch: 'G2', batchRank: 3, notes: '6-7 guard. Size premium. Less assists but SIZE. Cinderella Score 97.25.', redFlag: false },
  { name: 'Xzayvier Brown', school: 'Oklahoma', pos: 'G', yr: 'Jr', batch: 'G2', batchRank: 4, notes: 'Standard mid-tier. Better efficiency than Hubbard. Oklahoma concern.', redFlag: false },
  { name: 'JJ Hubbard', school: 'TBD', pos: 'G', yr: 'So', batch: 'G2', batchRank: 5, notes: 'Undersized. Worst efficiency in batch. Middling team.', redFlag: false },
  { name: 'Tae Davis', school: 'Oklahoma', pos: 'G', yr: 'Jr', batch: 'G2', batchRank: 6, notes: 'NR — Mid-major level context needed. Needs review.', redFlag: false, nrFlag: true },

  // Exercise 4 — Guards Batch 3 (Anderson repeat + new guards)
  // Anderson reappears #1 — confirms elite status
  { name: 'Tylor Perry', school: 'Texas Tech', pos: 'G', yr: 'Sr', batch: 'G3', batchRank: 1, notes: 'Confirmed #1 again in second batch. Cross-batch elite.', redFlag: false },
  { name: 'Milos Uzan', school: 'Houston', pos: 'G', yr: 'Jr', batch: 'G3', batchRank: 2, notes: 'Houston guard. Elite program. Playmaker.', redFlag: false },
  { name: 'Tre Fears', school: 'Michigan State', pos: 'G', yr: 'Jr', batch: 'G3', batchRank: 3, notes: 'MSU guard. Two-way. Winning program.', redFlag: false },
  { name: 'TBD Freitag', school: 'TBD', pos: 'G', yr: 'TBD', batch: 'G3', batchRank: 4, notes: 'Mid-tier in batch.', redFlag: false },
  { name: 'TBD Whitlock', school: 'TBD', pos: 'G', yr: 'TBD', batch: 'G3', batchRank: 5, notes: 'NR — Context needed.', redFlag: false, nrFlag: true },
  { name: 'TBD Minessale', school: 'TBD', pos: 'G', yr: 'TBD', batch: 'G3', batchRank: 6, notes: 'NR — Context needed.', redFlag: false, nrFlag: true },

  // Exercise 6 — Guards Batch 4
  { name: 'Braden Smith', school: 'Purdue', pos: 'G', yr: 'Jr', batch: 'G4', batchRank: 1, notes: 'Purdue PG. Elite passer. Team makes him. Championship pedigree.', redFlag: false },
  { name: 'Bogdan Momcilovic', school: 'Florida State', pos: 'G', yr: 'So', batch: 'G4', batchRank: 2, notes: '14 PPG but FITS. Role player on winner > volume scorer on bad team. KEY LESSON.', redFlag: false },
  { name: 'Cam Thornton', school: 'TBD', pos: 'G', yr: 'Sr', batch: 'G4', batchRank: 3, notes: 'Third appearance. Consistently mid-elite. Confirmed quality.', redFlag: false },
  { name: 'Bennett Stirtz', school: 'Iowa', pos: 'G', yr: 'Sr', batch: 'G4', batchRank: 4, notes: 'Consistently 4th range. Solid but not elite.', redFlag: false },
  { name: 'Tyler Tanner', school: 'Vanderbilt', pos: 'G', yr: 'Jr', batch: 'G4', batchRank: 5, notes: '5-11. Media top 5 nationally. Norman ranked 5th. SIZE MATTERS. 20 PPG but undersized.', redFlag: false },
  { name: 'TBD Cadeau', school: 'TBD', pos: 'G', yr: 'TBD', batch: 'G4', batchRank: 6, notes: 'Bottom of batch.', redFlag: false },

  // Exercise 7 — Guards Batch 5
  { name: 'Caleb Bradley', school: 'Arizona', pos: 'G', yr: 'Fr', batch: 'G5', batchRank: 1, notes: '#1 Arizona. Creator. Freshman on best team in country. Huge.', redFlag: false },
  { name: 'Walter Clayton Jr', school: 'Florida', pos: 'G', yr: 'Sr', batch: 'G5', batchRank: 2, notes: 'Florida guard. Elite program. Two-way scorer-creator.', redFlag: false },
  { name: 'Otega Oweh', school: 'Kentucky', pos: 'G', yr: 'Sr', batch: 'G5', batchRank: 3, notes: 'Kentucky. Winning pedigree. Athletic 2-way wing.', redFlag: false },
  { name: 'TBD Brea', school: 'TBD', pos: 'G', yr: 'TBD', batch: 'G5', batchRank: 4, notes: 'Mid-tier in batch.', redFlag: false },
  { name: 'TBD Atwell', school: 'TBD', pos: 'G', yr: 'TBD', batch: 'G5', batchRank: 5, notes: 'Below mid-tier.', redFlag: false },
  { name: 'TBD Claude', school: 'Washington', pos: 'G', yr: 'TBD', batch: 'G5', batchRank: 6, notes: 'LAST. Washington 10-14. Bad team = bottom regardless of stats. Key principle.', redFlag: false },

  // Exercise 9 — Guards Batch 6
  { name: 'Xzayvier Brown', school: 'Oklahoma', pos: 'G', yr: 'Jr', batch: 'G6', batchRank: 1, notes: '#1 over Davis on same team. Character + production delta on Oklahoma.', redFlag: false },
  { name: 'Duke Conwell', school: 'TBD', pos: 'G', yr: 'Sr', batch: 'G6', batchRank: 2, notes: 'Second appearance — confirms solid mid-tier.', redFlag: false },
  { name: 'TBD Rice', school: 'TBD', pos: 'G', yr: 'TBD', batch: 'G6', batchRank: 3, notes: 'Mid-tier.', redFlag: false },
  { name: 'TBD Sellers', school: 'TBD', pos: 'G', yr: 'TBD', batch: 'G6', batchRank: 4, notes: 'Mid-tier.', redFlag: false },
  { name: 'TBD Hopkins', school: 'TBD', pos: 'G', yr: 'TBD', batch: 'G6', batchRank: 5, notes: 'Lower tier.', redFlag: false },
  { name: 'Tae Davis', school: 'Oklahoma', pos: 'G', yr: 'Jr', batch: 'G6', batchRank: 6, notes: 'Both on Oklahoma but Davis clearly below Brown.', redFlag: false },

  // ═══════════════════════════════════════════════
  // FORWARDS
  // ═══════════════════════════════════════════════

  // Exercise 3 — Forwards Batch 1
  { name: 'JT Toppin', school: 'Texas Tech', pos: 'F', yr: 'Sr', batch: 'F1', batchRank: 1, notes: 'TTU forward. Size, athleticism, two-way. 21.9 PPG. Top target.', redFlag: false },
  { name: 'RJ Davis', school: 'UNC', pos: 'F', yr: 'Sr', batch: 'F1', batchRank: 2, notes: 'UNC wing. Winning program. Championship DNA.', redFlag: false },
  { name: 'Nick Martinelli', school: 'Northwestern', pos: 'F', yr: 'Sr', batch: 'F1', batchRank: 3, notes: 'Northwestern. High IQ forward. Cinderella Score 94.55. 9-16 team.', redFlag: false },
  { name: 'TBD Haugh', school: 'TBD', pos: 'F', yr: 'TBD', batch: 'F1', batchRank: 4, notes: 'Mid-tier forward.', redFlag: false },
  { name: 'TBD Harris F', school: 'TBD', pos: 'F', yr: 'TBD', batch: 'F1', batchRank: 5, notes: 'Below mid-tier.', redFlag: false },
  { name: 'Keyshawn Hall', school: 'Auburn', pos: 'F', yr: 'Sr', batch: 'F1', batchRank: 6, notes: 'Last in batch. 20.7 PPG on declining Auburn. But post-Broome Auburn is 14-11. Note: Added to T4 portal board.', redFlag: false },

  // Exercise 5 — Forwards Batch 2
  { name: 'KJ Adams Jr', school: 'Kansas', pos: 'F', yr: 'Sr', batch: 'F2', batchRank: 1, notes: '#1 forward. Kansas. Championship program. Norman said "really really good group of 4."', redFlag: false },
  { name: 'Joshua Jefferson', school: 'Iowa State', pos: 'F', yr: 'So', batch: 'F2', batchRank: 2, notes: 'Iowa State. 3.8 APG — PASSING FORWARD PREMIUM. Elite two-way sophomore.', redFlag: false },
  { name: 'Aiden Ike', school: 'TBD', pos: 'F', yr: 'Jr', batch: 'F2', batchRank: 3, notes: 'Part of "really really good group of 4." Physical big.', redFlag: false },
  { name: 'Andre Karaban', school: 'UConn', pos: 'F', yr: 'Sr', batch: 'F2', batchRank: 4, notes: 'UConn. CHAMPIONSHIP DNA. Part of elite group of 4. Former champion.', redFlag: false },
  { name: 'TBD Smith F', school: 'TBD', pos: 'F', yr: 'TBD', batch: 'F2', batchRank: 5, notes: 'NR — Context needed.', redFlag: false, nrFlag: true },
  { name: 'TBD Mousa', school: 'TBD', pos: 'F', yr: 'TBD', batch: 'F2', batchRank: 6, notes: 'NR — Context needed.', redFlag: false, nrFlag: true },

  // Exercise 8 — Forwards Batch 4
  { name: 'Trey Peat', school: 'Arizona', pos: 'F', yr: 'Jr', batch: 'F4', batchRank: 1, notes: 'Arizona. 2.8 APG for a forward. PASSING FORWARD PREMIUM. #1 Arizona program.', redFlag: false },
  { name: 'Nimari Burnett', school: 'Michigan', pos: 'F', yr: 'Sr', batch: 'F4', batchRank: 2, notes: 'Michigan. Two-way forward. Quality program.', redFlag: false },
  { name: 'TBD Ausar', school: 'TBD', pos: 'F', yr: 'TBD', batch: 'F4', batchRank: 3, notes: 'Mid-tier forward.', redFlag: false },
  { name: 'TBD Mitchell', school: 'TBD', pos: 'F', yr: 'TBD', batch: 'F4', batchRank: 4, notes: 'Mid-tier forward.', redFlag: false },
  { name: 'Nick Reid', school: 'Oklahoma', pos: 'F', yr: 'Sr', batch: 'F4', batchRank: 5, notes: 'RED FLAG: Alabama → Oklahoma. Winning→losing program transfer. Character flag.', redFlag: true },
  { name: 'TBD Sommerville', school: 'TBD', pos: 'F', yr: 'TBD', batch: 'F4', batchRank: 6, notes: 'Last in batch.', redFlag: false },
];

// ============================================================
// CROSS-BATCH MASTER TIER ASSIGNMENT
// Logic: 
//   Batch rank 1 on elite program = TIER 1 (Start on Cinderella)
//   Batch rank 1-2 generally = TIER 2 (Key rotation, likely starter)
//   Batch rank 3-4 = TIER 3 (Solid contributor)
//   Batch rank 5-6 = TIER 4 (Depth/role/NR)
//   Red Flag = Tier 4 regardless (talent acknowledged, character overrides)
// Special rules:
//   - Confirmed by 2+ exercises → bump up half tier
//   - Elite program (Top 10 AP) at time of ranking → +0.5 tier value
//   - Bad team (sub-.500) → -0.5 tier value
// ============================================================

function assignMasterTier(p) {
  if (p.nrFlag) return 'NR';
  if (p.redFlag) return 'T4-RF'; // Red Flag — talent noted, character disqualifying

  const elitePrograms = ['arizona', 'iowa state', 'kansas', 'purdue', 'alabama', 'florida', 'texas tech', 'houston', 'michigan', 'uconn', 'kentucky', 'duke', 'arkansas'];
  const badTeams = ['washington', 'oklahoma', 'northwestern', 'northwestern'];
  
  const school = p.school.toLowerCase();
  const isEliteProgram = elitePrograms.some(e => school.includes(e));
  const isBadTeam = badTeams.some(b => school.includes(b));

  let score = 0;
  // Base score from batch rank
  if (p.batchRank === 1) score = 10;
  else if (p.batchRank === 2) score = 8;
  else if (p.batchRank === 3) score = 6;
  else if (p.batchRank === 4) score = 4;
  else if (p.batchRank === 5) score = 2;
  else score = 1;

  if (isEliteProgram) score += 2;
  if (isBadTeam) score -= 2;

  if (score >= 10) return 'T1';
  if (score >= 7) return 'T2';
  if (score >= 4) return 'T3';
  return 'T4';
}

// Deduplicate players who appear in multiple batches
// Keep only their highest-ranking batch appearance
const seen = {};
const dedupedPlayers = [];
for (const p of rankingData) {
  const key = p.name.toLowerCase().replace(/\s+/g, '');
  if (!seen[key] || p.batchRank < seen[key].batchRank) {
    seen[key] = p;
  }
}
for (const key in seen) {
  dedupedPlayers.push(seen[key]);
}

// Add master tier
dedupedPlayers.forEach(p => {
  p.masterTier = assignMasterTier(p);
});

// Sort: Guards first, then Forwards; within each, by tier then batch rank
const tierOrder = { 'T1': 1, 'T2': 2, 'T3': 3, 'T4': 4, 'T4-RF': 5, 'NR': 6 };
dedupedPlayers.sort((a, b) => {
  if (a.pos !== b.pos) return a.pos.localeCompare(b.pos);
  const ta = tierOrder[a.masterTier] || 7;
  const tb = tierOrder[b.masterTier] || 7;
  if (ta !== tb) return ta - tb;
  return a.batchRank - b.batchRank;
});

// ============================================================
// BUILD SHEET DATA
// ============================================================

const HEADER_COLOR = { red: 0.067, green: 0.067, blue: 0.067 }; // near-black
const TIER_COLORS = {
  'T1': { red: 0.0, green: 0.39, blue: 0.0 },        // dark green
  'T2': { red: 0.0, green: 0.27, blue: 0.55 },        // dark blue  
  'T3': { red: 0.55, green: 0.40, blue: 0.0 },        // dark amber
  'T4': { red: 0.4, green: 0.4, blue: 0.4 },          // gray
  'T4-RF': { red: 0.6, green: 0.0, blue: 0.0 },       // dark red
  'NR': { red: 0.3, green: 0.3, blue: 0.3 },          // darker gray
};

const rows = [
  ['CINDERELLA PROJECT — NORMAN\'S MASTER RANKINGS', '', '', '', '', '', '', ''],
  ['Compiled from 9 Ranking Exercises | February 17, 2026 | Jimmy (Head Scout)', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', ''],
  ['MASTER TIER', 'NAME', 'SCHOOL', 'POS', 'YR', 'BEST BATCH RANK', 'EXERCISE', 'SCOUT NOTES'],
];

// Add guard section header
rows.push(['── GUARDS ──', '', '', '', '', '', '', '']);

const guards = dedupedPlayers.filter(p => p.pos === 'G');
for (const p of guards) {
  rows.push([
    p.masterTier,
    p.name,
    p.school,
    p.pos,
    p.yr,
    p.batchRank + '/6',
    p.batch,
    p.notes,
  ]);
}

// Add forward section header
rows.push(['', '', '', '', '', '', '', '']);
rows.push(['── FORWARDS / BIGS ──', '', '', '', '', '', '', '']);

const forwards = dedupedPlayers.filter(p => p.pos === 'F');
for (const p of forwards) {
  rows.push([
    p.masterTier,
    p.name,
    p.school,
    p.pos,
    p.yr,
    p.batchRank + '/6',
    p.batch,
    p.notes,
  ]);
}

// Add legend
rows.push(['', '', '', '', '', '', '', '']);
rows.push(['── LEGEND ──', '', '', '', '', '', '', '']);
rows.push(['T1', 'STARTER — Would start on the Cinderella team', '', '', '', '', '', '']);
rows.push(['T2', 'KEY ROTATION — Likely starter or elite 6th man', '', '', '', '', '', '']);
rows.push(['T3', 'SOLID CONTRIBUTOR — 15-20 min/game', '', '', '', '', '', '']);
rows.push(['T4', 'DEPTH / NR / NEED REVIEW', '', '', '', '', '', '']);
rows.push(['T4-RF', 'RED FLAG — Talent acknowledged, CHARACTER DISQUALIFYING', '', '', '', '', '', '']);
rows.push(['NR', 'NEEDS REVIEW — Mid/low-major, insufficient context', '', '', '', '', '', '']);
rows.push(['', '', '', '', '', '', '', '']);
rows.push(['── NORMAN\'S PHILOSOPHY ──', '', '', '', '', '', '', '']);
rows.push(['CORE RULE', 'Production FOR the team vs AT THE EXPENSE of the team', '', '', '', '', '', '']);
rows.push(['CREATORS > SCORERS', '20 PPG + 5 APG >> 22 PPG + 2 APG', '', '', '', '', '', '']);
rows.push(['SIZE MATTERS', 'Guard under 6-2 = automatic deduction regardless of stats', '', '', '', '', '', '']);
rows.push(['BAD TEAM TAX', 'Sub-.500 team = floor penalty regardless of individual stats', '', '', '', '', '', '']);
rows.push(['PASSING FORWARDS', 'Forwards with 2.5+ APG = premium value (Jefferson, Peat)', '', '', '', '', '', '']);
rows.push(['RED FLAGS', 'Wrong reasons to transfer, body language, erratic shot selection', '', '', '', '', '', '']);

console.log(`Total rows to write: ${rows.length}`);
console.log(`Total unique players: ${dedupedPlayers.length}`);
console.log(`Guards: ${guards.length}, Forwards: ${forwards.length}`);

// ============================================================
// PUSH TO GOOGLE SHEET — Create new tab "Norman's Rankings"
// ============================================================

async function pushToSheet() {
  // Step 1: Check if tab exists, delete if so
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingSheet = spreadsheet.data.sheets.find(s => s.properties.title === "Norman's Rankings");
  
  const requests = [];
  if (existingSheet) {
    requests.push({ deleteSheet: { sheetId: existingSheet.properties.sheetId } });
  }
  
  // Step 2: Add new sheet
  requests.push({
    addSheet: {
      properties: {
        title: "Norman's Rankings",
        gridProperties: { rowCount: rows.length + 10, columnCount: 8 },
        tabColor: { red: 0.0, green: 0.6, blue: 0.0 }
      }
    }
  });
  
  const batchResponse = await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests }
  });
  
  const newSheetId = batchResponse.data.replies
    .find(r => r.addSheet)?.addSheet?.properties?.sheetId;
  
  console.log('New sheet created, ID:', newSheetId);
  
  // Step 3: Write the data
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: "Norman's Rankings!A1",
    valueInputOption: 'RAW',
    requestBody: { values: rows }
  });
  
  console.log('Data written successfully');
  
  // Step 4: Formatting requests
  const formatRequests = [
    // Title row — big and bold
    {
      repeatCell: {
        range: { sheetId: newSheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 8 },
        cell: { userEnteredFormat: {
          backgroundColor: HEADER_COLOR,
          textFormat: { foregroundColor: { red: 1, green: 0.85, blue: 0 }, bold: true, fontSize: 13 },
          horizontalAlignment: 'CENTER'
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
      }
    },
    // Subtitle row
    {
      repeatCell: {
        range: { sheetId: newSheetId, startRowIndex: 1, endRowIndex: 2, startColumnIndex: 0, endColumnIndex: 8 },
        cell: { userEnteredFormat: {
          backgroundColor: HEADER_COLOR,
          textFormat: { foregroundColor: { red: 0.8, green: 0.8, blue: 0.8 }, italic: true, fontSize: 10 },
          horizontalAlignment: 'CENTER'
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
      }
    },
    // Column header row (row 4)
    {
      repeatCell: {
        range: { sheetId: newSheetId, startRowIndex: 3, endRowIndex: 4, startColumnIndex: 0, endColumnIndex: 8 },
        cell: { userEnteredFormat: {
          backgroundColor: { red: 0.15, green: 0.15, blue: 0.15 },
          textFormat: { foregroundColor: { red: 1, green: 1, blue: 1 }, bold: true, fontSize: 10 },
        }},
        fields: 'userEnteredFormat(backgroundColor,textFormat)'
      }
    },
    // Freeze first 4 rows
    {
      updateSheetProperties: {
        properties: { sheetId: newSheetId, gridProperties: { frozenRowCount: 4 } },
        fields: 'gridProperties.frozenRowCount'
      }
    },
    // Freeze first column
    {
      updateSheetProperties: {
        properties: { sheetId: newSheetId, gridProperties: { frozenColumnCount: 2 } },
        fields: 'gridProperties.frozenColumnCount'
      }
    },
    // Column widths
    { updateDimensionProperties: {
      range: { sheetId: newSheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 },
      properties: { pixelSize: 90 }, fields: 'pixelSize'
    }},
    { updateDimensionProperties: {
      range: { sheetId: newSheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 },
      properties: { pixelSize: 180 }, fields: 'pixelSize'
    }},
    { updateDimensionProperties: {
      range: { sheetId: newSheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 },
      properties: { pixelSize: 150 }, fields: 'pixelSize'
    }},
    { updateDimensionProperties: {
      range: { sheetId: newSheetId, dimension: 'COLUMNS', startIndex: 7, endIndex: 8 },
      properties: { pixelSize: 500 }, fields: 'pixelSize'
    }},
  ];
  
  // Color the tier cells for each player row
  // Find the rows with tier data and color them
  let rowIdx = 4; // 0-indexed: header=0, subtitle=1, blank=2, cols=3, "guards"=4, first player=5...
  rowIdx++; // skip "Guards" section header (row 5)
  
  for (const p of guards) {
    const tier = p.masterTier;
    const color = TIER_COLORS[tier] || TIER_COLORS['T4'];
    formatRequests.push({
      repeatCell: {
        range: { sheetId: newSheetId, startRowIndex: rowIdx, endRowIndex: rowIdx + 1, startColumnIndex: 0, endColumnIndex: 8 },
        cell: { userEnteredFormat: {
          backgroundColor: tier === 'T1' ? { red: 0.9, green: 1.0, blue: 0.9 } :
                           tier === 'T2' ? { red: 0.9, green: 0.93, blue: 1.0 } :
                           tier === 'T3' ? { red: 1.0, green: 0.97, blue: 0.87 } :
                           tier === 'T4-RF' ? { red: 1.0, green: 0.9, blue: 0.9 } :
                           tier === 'NR' ? { red: 0.95, green: 0.95, blue: 0.95 } :
                           { red: 1.0, green: 1.0, blue: 0.97 },
        }},
        fields: 'userEnteredFormat(backgroundColor)'
      }
    });
    // Bold the tier cell
    formatRequests.push({
      repeatCell: {
        range: { sheetId: newSheetId, startRowIndex: rowIdx, endRowIndex: rowIdx + 1, startColumnIndex: 0, endColumnIndex: 1 },
        cell: { userEnteredFormat: {
          textFormat: { 
            bold: true,
            foregroundColor: tier === 'T4-RF' ? { red: 0.7, green: 0, blue: 0 } : { red: 0, green: 0, blue: 0 }
          }
        }},
        fields: 'userEnteredFormat(textFormat)'
      }
    });
    rowIdx++;
  }
  
  rowIdx += 2; // blank + "Forwards" header
  
  for (const p of forwards) {
    const tier = p.masterTier;
    formatRequests.push({
      repeatCell: {
        range: { sheetId: newSheetId, startRowIndex: rowIdx, endRowIndex: rowIdx + 1, startColumnIndex: 0, endColumnIndex: 8 },
        cell: { userEnteredFormat: {
          backgroundColor: tier === 'T1' ? { red: 0.9, green: 1.0, blue: 0.9 } :
                           tier === 'T2' ? { red: 0.9, green: 0.93, blue: 1.0 } :
                           tier === 'T3' ? { red: 1.0, green: 0.97, blue: 0.87 } :
                           tier === 'T4-RF' ? { red: 1.0, green: 0.9, blue: 0.9 } :
                           tier === 'NR' ? { red: 0.95, green: 0.95, blue: 0.95 } :
                           { red: 1.0, green: 1.0, blue: 0.97 },
        }},
        fields: 'userEnteredFormat(backgroundColor)'
      }
    });
    formatRequests.push({
      repeatCell: {
        range: { sheetId: newSheetId, startRowIndex: rowIdx, endRowIndex: rowIdx + 1, startColumnIndex: 0, endColumnIndex: 1 },
        cell: { userEnteredFormat: {
          textFormat: { 
            bold: true,
            foregroundColor: tier === 'T4-RF' ? { red: 0.7, green: 0, blue: 0 } : { red: 0, green: 0, blue: 0 }
          }
        }},
        fields: 'userEnteredFormat(textFormat)'
      }
    });
    rowIdx++;
  }
  
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: formatRequests }
  });
  
  console.log('Formatting applied');
  console.log('\n✅ DONE — Norman\'s Rankings tab created and formatted');
  console.log(`Sheet: https://docs.google.com/spreadsheets/d/${SHEET_ID}`);
  
  // Print tier summary
  console.log('\n── TIER SUMMARY ──');
  const tierCount = {};
  dedupedPlayers.forEach(p => {
    tierCount[p.masterTier] = (tierCount[p.masterTier] || 0) + 1;
  });
  console.log('Guards by tier:');
  ['T1','T2','T3','T4','T4-RF','NR'].forEach(t => {
    const g = guards.filter(p => p.masterTier === t);
    if (g.length) console.log(`  ${t}: ${g.map(p => p.name).join(', ')}`);
  });
  console.log('Forwards by tier:');
  ['T1','T2','T3','T4','T4-RF','NR'].forEach(t => {
    const f = forwards.filter(p => p.masterTier === t);
    if (f.length) console.log(`  ${t}: ${f.map(p => p.name).join(', ')}`);
  });
}

pushToSheet().catch(e => {
  console.error('ERROR:', e.message);
  if (e.response?.data) console.error(JSON.stringify(e.response.data, null, 2));
});
