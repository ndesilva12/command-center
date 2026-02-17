/**
 * DB Enrichment v6 — Build "Strike List" Tab + Fix Cameron Boozer Cin. Score
 * Run from: /Users/normandesilva/command-center/command-center/
 */

const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';

const tokenData = JSON.parse(fs.readFileSync(TOKEN_PATH));
const auth = new google.auth.OAuth2(tokenData.client_id, tokenData.client_secret);
auth.setCredentials({
  access_token: tokenData.access_token,
  refresh_token: tokenData.refresh_token
});
const sheets = google.sheets({ version: 'v4', auth });

// ─── Wave definitions ───────────────────────────────────────────────────────
const WAVE_DEFS = [
  // Wave 1
  { wave: 1, player: 'JT Toppin',        school: 'Texas Tech',      pos: 'F',  cls: 'SR' },
  { wave: 1, player: 'Labaron Philon',   school: 'Alabama',         pos: 'G',  cls: 'FR' },
  { wave: 1, player: 'Yaxel Lendeborg',  school: 'Michigan',        pos: 'F/C',cls: 'SR' },
  { wave: 1, player: 'Danny Wolf',       school: 'Michigan',        pos: 'F',  cls: 'JR' },
  { wave: 1, player: 'Liam McNeeley',    school: 'UConn',           pos: 'G/F',cls: 'FR' },
  { wave: 1, player: 'Tylor Perry',      school: 'Texas Tech',      pos: 'G',  cls: 'SR',
    defaultGrade: 72, defaultCin: null, defaultFlight: null, defaultConf: null, defaultOnOff: null,
    why: 'Senior guard, top Norman-ranked T1, must contact if he portals' },
  // Wave 2
  { wave: 2, player: 'Boogie Acuff',     school: 'Arkansas',        pos: 'G',  cls: 'FR' },
  { wave: 2, player: 'Caleb Bradley',    school: 'Arizona',         pos: 'G',  cls: 'FR' },
  { wave: 2, player: 'Bogdan Momcilovic',school: 'Florida State',   pos: 'G/F',cls: 'SO' },
  { wave: 2, player: 'Milos Uzan',       school: 'Houston',         pos: 'G',  cls: 'SR' },
  { wave: 2, player: 'Walter Clayton Jr.',school: 'Florida',        pos: 'G',  cls: 'SR' },
  { wave: 2, player: 'PJ Haggerty',      school: 'Kansas State',    pos: 'G',  cls: 'SO',
    defaultGrade: 75, defaultCin: 98, defaultFlight: 7, defaultConf: 'P6', defaultOnOff: null,
    why: 'Highest Cin Score in DB (98), KState 10-15, he IS their team' },
  { wave: 2, player: 'Will Riley',       school: 'Illinois',        pos: 'F',  cls: 'FR',
    defaultGrade: 70, defaultCin: null, defaultFlight: null, defaultConf: null, defaultOnOff: null,
    why: '6\'8" frosh wing, Illinois winning but NBA-track, portal possible' },
  // Wave 3
  { wave: 3, player: 'Juke Harris',      school: 'Wake Forest',     pos: 'G/F',cls: 'SO' },
  { wave: 3, player: 'Keaton Wagler',    school: 'Illinois',        pos: 'F',  cls: 'JR' },
  { wave: 3, player: 'Cameron Carr',     school: 'Baylor',          pos: 'G/F',cls: 'SR' },
  { wave: 3, player: 'Xzayvier Brown',   school: 'Oklahoma',        pos: 'G',  cls: 'SO' },
  { wave: 3, player: 'Tre Fears',        school: 'Michigan State',  pos: 'G',  cls: 'FR' },
];

// ─── Why We Want Him (default/override) ────────────────────────────────────
const WHY_MAP = {
  'JT Toppin':         'T1 forward on winning TTU — Sr. portal risk, Tim Grover TTU network gives us direct line',
  'Labaron Philon':    'Best guard on our board. Explosive creator, elite efficiency, max NIL anchor target',
  'Yaxel Lendeborg':   'Rim protector on 3rd school. New HC Dusty May = unstable. Big role + NIL to close',
  'Danny Wolf':        '6\'10" with 4.1 APG = unicorn big. New HC makes him vulnerable. NYC/Chicago market angle',
  'Liam McNeeley':     'Top-5 recruit on 14-12 team. Highest flight risk on board — will portal, we must be first',
  'Tylor Perry':       'Senior guard, top Norman-ranked T1, must contact if he portals',
  'Boogie Acuff':      'FR guard with 6.3 APG, efficiency monster. Portal risk if Arkansas slumps post-tourney',
  'Caleb Bradley':     'Creator on #1 Arizona — if early tourney exit, morale dips. Elite pipeline target',
  'Bogdan Momcilovic': '14 PPG role player who can start for us. Bigger role + title shot pitch wins here',
  'Milos Uzan':        'Sr. SG, elite creator. Portal likely post-Kelvin Sampson era. Legacy play + title shot',
  'Walter Clayton Jr.':'Talented guard on inconsistent Florida — Wants to win, we offer that narrative',
  'PJ Haggerty':       'Highest Cin Score in DB (98), KState 10-15, he IS their team',
  'Will Riley':        '6\'8" frosh wing, Illinois winning but NBA-track, portal possible',
  'Juke Harris':       '+6.4 on/off, invisible on bad Wake Forest team. Nobody calling him — steal candidate',
  'Keaton Wagler':     '+7.1 on/off, best on/off on our board. Wing who makes teams measurably better',
  'Cameron Carr':      'Cin Score 93.9, +5.4 on/off. Undiscovered talent — information edge = leverage',
  'Xzayvier Brown':    'T2 guard on Oklahoma losing-record team. Portal likely — get ahead of the crowd',
  'Tre Fears':         'Young guard on MSU. Underutilized talent, system fit for our offense',
};

// ─── Coaching Connections ───────────────────────────────────────────────────
function getConnection(player, school) {
  if (player === 'JT Toppin' || player === 'Tylor Perry') {
    return 'Tim Grover → TTU (Grover has Chicago/Big 12 connections)';
  }
  if (player === 'Labaron Philon') {
    return 'SEC network — research Oats connections to Chicago';
  }
  if (player === 'Yaxel Lendeborg' || player === 'Danny Wolf') {
    return 'Dusty May new HC = unstable. Direct outreach.';
  }
  if (player === 'Liam McNeeley') {
    return 'UConn struggling — Dan Hurley may not fight to keep him';
  }
  if (player === 'Caleb Bradley') {
    return 'Arizona #1 — Tommy Lloyd connections, elite pipeline';
  }
  if (player === 'PJ Haggerty') {
    return 'KState → BIG 12 transfer, no special connection — lead with NIL';
  }
  return 'TBD — research needed';
}

// ─── NIL Tier ───────────────────────────────────────────────────────────────
function getNilTier(player) {
  const anchors = ['Labaron Philon', 'JT Toppin'];
  const starters = ['Caleb Bradley', 'Boogie Acuff', 'Walter Clayton Jr.', 'Milos Uzan', 'Danny Wolf', 'Yaxel Lendeborg'];
  const keyRotation = ['Bogdan Momcilovic', 'Tre Fears', 'Xzayvier Brown', 'Liam McNeeley', 'Will Riley', 'Tylor Perry', 'PJ Haggerty'];
  const sleepers = ['Juke Harris', 'Keaton Wagler', 'Cameron Carr'];

  if (anchors.includes(player)) return 'ANCHOR ($2.5M-$4M)';
  if (starters.includes(player)) return 'STARTER ($1M-$2.5M)';
  if (keyRotation.includes(player)) return 'KEY ROTATION ($500K-$1M)';
  if (sleepers.includes(player)) return 'SLEEPER ($300K-$800K)';
  return 'TBD';
}

// ─── Color helpers ──────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  return { red: r, green: g, blue: b };
}

// ─── Name aliases: Strike List name → actual Portal Big Board name ──────────
// Used when board uses a different variant of the name
const NAME_ALIASES = {
  'labaron philon':     'labaron philon jr.',
  'pj haggerty':        'p.j. haggerty',
  'p.j. haggerty':      'p.j. haggerty',
  'boogie acuff':       'darius acuff jr.',  // Darius "Boogie" Acuff Jr.
};

function classAbbr(full) {
  const map = { 'freshman':'FR','sophomore':'SO','junior':'JR','senior':'SR' };
  return map[(full||'').toLowerCase()] || full || '';
}

// ─── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('📊 Reading Portal Big Board...');

  // Read the full Portal Big Board
  const boardRes = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A:AD',
  });
  const boardRows = boardRes.data.values || [];
  const header = boardRows[0] || [];
  console.log(`  → ${boardRows.length - 1} data rows. Headers: ${header.length} cols`);

  // Build lookup by player name (col B = index 1), keyed lowercase
  const boardLookup = {};
  for (let i = 1; i < boardRows.length; i++) {
    const row = boardRows[i];
    const name = (row[1] || '').trim();
    if (name) {
      boardLookup[name.toLowerCase()] = { row: i + 1, data: row };
    }
  }

  // Column indices from Portal Big Board header
  const colIdx = {};
  header.forEach((h, i) => { colIdx[h] = i; });

  console.log('\n  Key column indices:');
  const importantCols = ['Grade (20-80)', 'Cin. Score', 'Flight Risk Score', 'Conference Check', 'Net Adj.Rtg', 'Class', 'Position', 'Current School'];
  importantCols.forEach(c => console.log(`    ${c}: ${colIdx[c] !== undefined ? colIdx[c] : 'NOT FOUND'}`));

  // Also check what Cameron Boozer's row looks like
  const boozerKey = 'cameron boozer';
  const boozerEntry = boardLookup[boozerKey];
  if (boozerEntry) {
    console.log(`\n  Cameron Boozer found at row ${boozerEntry.row}`);
    console.log(`    Cin. Score: "${boozerEntry.data[colIdx['Cin. Score']]}" (col ${colIdx['Cin. Score']})`);
    console.log(`    Grade: "${boozerEntry.data[colIdx['Grade (20-80)']]}" (col ${colIdx['Grade (20-80)']})`);
    console.log(`    School: "${boozerEntry.data[2]}", PPG: "${boozerEntry.data[colIdx['PPG']]}"`);
  } else {
    console.log('\n  Cameron Boozer NOT FOUND in board');
    // Show all names for debugging
    const names = Object.keys(boardLookup).filter(k => k.includes('cam') || k.includes('boozer'));
    console.log('  Near matches:', names);
  }

  // ─── Get sheet metadata to find/create Strike List tab ───
  console.log('\n📋 Getting sheet metadata...');
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const tabs = meta.data.sheets;
  const tabNames = tabs.map(s => s.properties.title);
  console.log('  Existing tabs:', tabNames.join(', '));

  let strikeSheetId = null;
  const existingStrike = tabs.find(s => s.properties.title === 'Strike List');
  if (existingStrike) {
    strikeSheetId = existingStrike.properties.sheetId;
    console.log(`  Strike List tab already exists (id=${strikeSheetId}), will clear and rebuild`);
  }

  // ─── Create or clear Strike List tab ───
  const requests = [];

  if (!existingStrike) {
    requests.push({
      addSheet: {
        properties: {
          title: 'Strike List',
          gridProperties: { rowCount: 50, columnCount: 15 }
        }
      }
    });
  }

  if (requests.length > 0) {
    const addRes = await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: { requests }
    });
    if (!existingStrike) {
      strikeSheetId = addRes.data.replies[0].addSheet.properties.sheetId;
      console.log(`  Created Strike List tab (id=${strikeSheetId})`);
    }
  }

  if (existingStrike) {
    // Clear existing content
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SHEET_ID,
      range: 'Strike List!A:O',
    });
    console.log('  Cleared existing Strike List content');
  }

  // ─── Build data rows ───
  console.log('\n🎯 Building Strike List data...');

  const headerRow = ['Wave', 'Player', 'School', 'Pos', 'Class', 'Grade', 'Cin. Score',
    'Flight Risk', 'Conference Check', 'On/Off', 'Why We Want Him',
    'Coaching Connection', 'NIL Tier', 'Contact Status', 'Notes'];

  const dataRows = [headerRow];
  const rowMeta = []; // track wave for coloring

  // Sort: Wave first, then by Cin. Score descending within wave
  const sorted = [...WAVE_DEFS].sort((a, b) => {
    if (a.wave !== b.wave) return a.wave - b.wave;
    // Get cin scores for sorting
    const cinA = getCinScore(a, boardLookup, colIdx);
    const cinB = getCinScore(b, boardLookup, colIdx);
    return cinB - cinA;
  });

  function getCinScore(playerDef, lookup, colIdx) {
    const entry = lookup[playerDef.player.toLowerCase()];
    if (entry) {
      const cin = parseFloat(entry.data[colIdx['Cin. Score']] || '0');
      if (!isNaN(cin)) return cin;
    }
    return playerDef.defaultCin || 0;
  }

  const manualPlayers = [];

  for (const pd of sorted) {
    const rawKey = pd.player.toLowerCase();
    const lookupKey = NAME_ALIASES[rawKey] || rawKey;
    const entry = boardLookup[lookupKey];

    let grade = '', cinScore = '', flightRisk = '', confCheck = '', onOff = '';
    let notes = '';

    if (entry) {
      grade      = entry.data[colIdx['Grade (20-80)']]     || '';
      cinScore   = entry.data[colIdx['Cin. Score']]         || '';
      flightRisk = entry.data[colIdx['Flight Risk Score']]  || '';
      confCheck  = entry.data[colIdx['Conference Check']]   || '';
      onOff      = entry.data[colIdx['Net Adj.Rtg']]        || '';
      // Fallback to defaults if board has no value
      if (!grade     && pd.defaultGrade)  grade      = pd.defaultGrade;
      if (!cinScore  && pd.defaultCin)    cinScore   = pd.defaultCin;
      if (!flightRisk && pd.defaultFlight !== undefined && pd.defaultFlight !== null) flightRisk = pd.defaultFlight;
      if (!confCheck && pd.defaultConf)   confCheck  = pd.defaultConf;
    } else {
      // Not in board — use defaults
      grade      = pd.defaultGrade  || '';
      cinScore   = pd.defaultCin    || '';
      flightRisk = (pd.defaultFlight !== undefined && pd.defaultFlight !== null) ? pd.defaultFlight : '';
      confCheck  = pd.defaultConf   || '';
      onOff      = pd.defaultOnOff  || '';
      notes      = '(manual)';
      manualPlayers.push(pd.player);
      console.log(`  ⚠ ${pd.player} not in Portal Big Board → using defaults`);
    }

    // Class: pull from board (col 7 = "Class"), convert to abbrev, fallback to our def
    const rawClass = entry ? (entry.data[colIdx['Class']] || pd.cls) : pd.cls;
    const boardClass = classAbbr(rawClass) || rawClass;
    // Pos: pull from board (col 2 = "Position") or use our def
    const boardPos = entry ? (entry.data[colIdx['Position']] || entry.data[2] || pd.pos) : pd.pos;
    // School: board col 5 = "Current School"
    const boardSchool = entry ? (entry.data[5] || pd.school) : pd.school;

    const why = WHY_MAP[pd.player] || pd.why || 'See scouting notes';
    const conn = getConnection(pd.player, pd.school);
    const nil = getNilTier(pd.player);

    dataRows.push([
      pd.wave,
      pd.player,
      boardSchool,
      boardPos,
      boardClass,
      grade,
      cinScore,
      flightRisk,
      confCheck,
      onOff,
      why,
      conn,
      nil,
      '',   // Contact Status — blank for Norman
      notes // Notes
    ]);
    rowMeta.push({ wave: pd.wave, player: pd.player });
    console.log(`  ✓ Wave ${pd.wave}: ${pd.player} | Grade=${grade} | Cin=${cinScore} | FR=${flightRisk}`);
  }

  // ─── Write data to Strike List ───
  console.log('\n📝 Writing Strike List data...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Strike List!A1',
    valueInputOption: 'RAW',
    requestBody: { values: dataRows }
  });
  console.log(`  → Wrote ${dataRows.length} rows (1 header + ${dataRows.length - 1} players)`);

  // ─── Formatting requests ───
  console.log('\n🎨 Applying formatting...');
  const fmtRequests = [];

  const numRows = dataRows.length;
  const numCols = 15;

  // 1) Header row: dark navy bg, white bold text
  fmtRequests.push({
    repeatCell: {
      range: {
        sheetId: strikeSheetId,
        startRowIndex: 0, endRowIndex: 1,
        startColumnIndex: 0, endColumnIndex: numCols
      },
      cell: {
        userEnteredFormat: {
          backgroundColor: hexToRgb('#1a237e'),
          textFormat: {
            foregroundColor: { red: 1, green: 1, blue: 1 },
            bold: true,
            fontSize: 11
          },
          horizontalAlignment: 'CENTER'
        }
      },
      fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
    }
  });

  // 2) Wave-colored row backgrounds
  const waveColors = {
    1: '#e8f5e9', // green tint
    2: '#e3f2fd', // blue tint
    3: '#fff8e1', // amber tint
  };

  for (let r = 0; r < rowMeta.length; r++) {
    const rowIndex = r + 1; // +1 for header
    const wave = rowMeta[r].wave;
    const bgHex = waveColors[wave];
    fmtRequests.push({
      repeatCell: {
        range: {
          sheetId: strikeSheetId,
          startRowIndex: rowIndex, endRowIndex: rowIndex + 1,
          startColumnIndex: 0, endColumnIndex: numCols
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: hexToRgb(bgHex),
          }
        },
        fields: 'userEnteredFormat.backgroundColor'
      }
    });
  }

  // 3) Freeze row 1
  fmtRequests.push({
    updateSheetProperties: {
      properties: {
        sheetId: strikeSheetId,
        gridProperties: { frozenRowCount: 1 }
      },
      fields: 'gridProperties.frozenRowCount'
    }
  });

  // 4) Auto-resize columns
  fmtRequests.push({
    autoResizeDimensions: {
      dimensions: {
        sheetId: strikeSheetId,
        dimension: 'COLUMNS',
        startIndex: 0,
        endIndex: numCols
      }
    }
  });

  // 5) Bold the Wave column (col A) for data rows
  fmtRequests.push({
    repeatCell: {
      range: {
        sheetId: strikeSheetId,
        startRowIndex: 1, endRowIndex: numRows,
        startColumnIndex: 0, endColumnIndex: 1
      },
      cell: {
        userEnteredFormat: {
          textFormat: { bold: true, fontSize: 12 },
          horizontalAlignment: 'CENTER'
        }
      },
      fields: 'userEnteredFormat(textFormat,horizontalAlignment)'
    }
  });

  // 6) Center-align Grade, Cin Score, Flight Risk, Wave, Pos, Class columns
  fmtRequests.push({
    repeatCell: {
      range: {
        sheetId: strikeSheetId,
        startRowIndex: 1, endRowIndex: numRows,
        startColumnIndex: 3, endColumnIndex: 10  // D through J
      },
      cell: {
        userEnteredFormat: { horizontalAlignment: 'CENTER' }
      },
      fields: 'userEnteredFormat.horizontalAlignment'
    }
  });

  // 7) Wrap text for Why We Want Him (col K = index 10) and Coaching Connection (col L = 11)
  fmtRequests.push({
    repeatCell: {
      range: {
        sheetId: strikeSheetId,
        startRowIndex: 1, endRowIndex: numRows,
        startColumnIndex: 10, endColumnIndex: 13
      },
      cell: {
        userEnteredFormat: { wrapStrategy: 'WRAP' }
      },
      fields: 'userEnteredFormat.wrapStrategy'
    }
  });

  // 8) Set column widths manually for readability
  const colWidths = [
    { col: 0, width: 60 },   // Wave
    { col: 1, width: 160 },  // Player
    { col: 2, width: 130 },  // School
    { col: 3, width: 70 },   // Pos
    { col: 4, width: 60 },   // Class
    { col: 5, width: 65 },   // Grade
    { col: 6, width: 85 },   // Cin. Score
    { col: 7, width: 85 },   // Flight Risk
    { col: 8, width: 130 },  // Conference Check
    { col: 9, width: 80 },   // On/Off
    { col: 10, width: 260 }, // Why We Want Him
    { col: 11, width: 240 }, // Coaching Connection
    { col: 12, width: 180 }, // NIL Tier
    { col: 13, width: 130 }, // Contact Status
    { col: 14, width: 160 }, // Notes
  ];
  for (const { col, width } of colWidths) {
    fmtRequests.push({
      updateDimensionProperties: {
        range: {
          sheetId: strikeSheetId,
          dimension: 'COLUMNS',
          startIndex: col,
          endIndex: col + 1
        },
        properties: { pixelSize: width },
        fields: 'pixelSize'
      }
    });
  }

  // 9) Add green left border accent on Wave column for wave 1
  for (let r = 0; r < rowMeta.length; r++) {
    if (rowMeta[r].wave === 1) {
      fmtRequests.push({
        updateBorders: {
          range: {
            sheetId: strikeSheetId,
            startRowIndex: r + 1, endRowIndex: r + 2,
            startColumnIndex: 0, endColumnIndex: 1
          },
          left: {
            style: 'SOLID_THICK',
            color: hexToRgb('#2e7d32') // dark green
          }
        }
      });
    }
  }

  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SHEET_ID,
    requestBody: { requests: fmtRequests }
  });
  console.log(`  → Applied ${fmtRequests.length} formatting requests`);

  // ─── Fix Cameron Boozer Cin. Score ───
  console.log('\n🦁 Fixing Cameron Boozer Cin. Score...');

  let boozerFixResult = { status: 'NOT FOUND in Portal Big Board' };

  if (boozerEntry) {
    const existingCin = boozerEntry.data[colIdx['Cin. Score']];
    const cinColLetter = colNumToLetter(colIdx['Cin. Score'] + 1);
    const boozerRowNum = boozerEntry.row;
    const boozerRange = `Portal Big Board!${cinColLetter}${boozerRowNum}`;

    // Task says "currently has null Cin. Score" and to set ~75-82.
    // NOTE: board had an existing value of ${existingCin} (may have been set by v5).
    // Per task spec, we write 79 (midpoint of 75-82 range).
    const boozerCinScore = 79;

    if (existingCin && existingCin !== '' && existingCin !== '0') {
      console.log(`  ⚠ Boozer already has Cin. Score: "${existingCin}" — task said it was null, likely set by v5 enrichment`);
      console.log(`  Per task spec, overwriting with calculated value: ${boozerCinScore}`);
    }

    console.log(`  Writing ${boozerCinScore} to ${boozerRange} (basis: 16.2 PPG / 8.5 RPG / Duke 24-2 / FR / ACC)`);
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range: boozerRange,
      valueInputOption: 'RAW',
      requestBody: { values: [[boozerCinScore]] }
    });
    console.log(`  ✓ Cameron Boozer Cin. Score set to ${boozerCinScore} (row ${boozerRowNum}, col ${cinColLetter})`);

    boozerFixResult = {
      player: 'Cameron Boozer',
      school: 'Duke',
      priorValue: existingCin || 'null/empty',
      cinScoreWritten: boozerCinScore,
      basis: '16.2 PPG / 8.5 RPG / Duke 24-2 record / FR with 3 years remaining / ACC (P6-caliber) = midpoint 79',
      note: existingCin ? `Prior value was "${existingCin}" — task spec said null; v5 may have already calculated it. Overwritten per instructions.` : 'Was null, now set to 79',
      range: boozerRange
    };
  } else {
    console.log('  ⚠ Cameron Boozer not found in Portal Big Board — skipping fix');
  }

  // ─── Write completion summary ───
  const summary = {
    timestamp: new Date().toISOString(),
    task: 'DB Enrichment v6 — Strike List + Boozer Fix',
    strikeListTab: {
      name: 'Strike List',
      sheetId: strikeSheetId,
      sheetUrl: `https://docs.google.com/spreadsheets/d/${SHEET_ID}`,
      totalPlayers: dataRows.length - 1,
      wave1Count: rowMeta.filter(r => r.wave === 1).length,
      wave2Count: rowMeta.filter(r => r.wave === 2).length,
      wave3Count: rowMeta.filter(r => r.wave === 3).length,
      columns: headerRow,
      players: sorted.map(pd => {
        const rawKey = pd.player.toLowerCase();
        const lookupKey = NAME_ALIASES[rawKey] || rawKey;
        return {
          wave: pd.wave,
          player: pd.player,
          boardName: boardLookup[lookupKey] ? (boardLookup[lookupKey].data[1]) : 'manual',
          school: pd.school,
          nilTier: getNilTier(pd.player),
          foundInBoard: !!boardLookup[lookupKey]
        };
      })
    },
    boozerFix: boozerFixResult,
    manualFallbackPlayers: manualPlayers,
    formatting: {
      headerColor: '#1a237e',
      wave1Color: '#e8f5e9 (green tint)',
      wave2Color: '#e3f2fd (blue tint)',
      wave3Color: '#fff8e1 (amber tint)',
      frozenRows: 1,
      columnCount: 15,
      waveLeftBorder: 'Wave 1 rows have thick dark-green left border on Wave column'
    }
  };

  fs.writeFileSync('/tmp/enrichment-v6-complete.json', JSON.stringify(summary, null, 2));
  console.log('\n📄 Summary written to /tmp/enrichment-v6-complete.json');
  console.log('\n✅ DONE! Strike List built successfully.');
  console.log(`   ${rowMeta.filter(r=>r.wave===1).length} Wave 1 | ${rowMeta.filter(r=>r.wave===2).length} Wave 2 | ${rowMeta.filter(r=>r.wave===3).length} Wave 3 players`);
  if (manualPlayers.length) console.log(`   Manual fallback (not in board): ${manualPlayers.join(', ')}`);
}

// Helper: column number (1-indexed) → letter(s)
function colNumToLetter(n) {
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

main().catch(e => {
  console.error('ERROR:', e.message);
  if (e.response) console.error('API response:', JSON.stringify(e.response.data, null, 2));
  process.exit(1);
});
