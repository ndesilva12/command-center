/**
 * build-roster-mockup.js
 * Builds the Roster Builder tab in the Cinderella Project Google Sheet
 * Based on Norman's Rankings (9 exercises) + Portal Big Board on/off data
 * 
 * Jimmy — Head Scout, Cinderella Project
 * Created: Feb 17, 2026, ~5:47 AM EST
 */

const { google } = require('googleapis');
const fs = require('fs');
const token = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const { OAuth2Client } = require('google-auth-library');
const auth = new OAuth2Client(token.client_id, token.client_secret);
auth.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth });

const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TAB = 'Roster Builder';

// ─── ROSTER DATA ─────────────────────────────────────────────────────────────
// Based on all 9 Norman ranking exercises + Portal Big Board on/off enrichment

const rosterData = [
  // === HEADER ===
  ['CINDERELLA PROJECT — ROSTER MOCK-UPS', '', '', '', '', '', '', '', '', '', ''],
  ['Norman de Silva (Scout) + Jimmy (AI Scout) | Updated: Feb 17, 2026', '', '', '', '', '', '', '', '', '', ''],
  ['Based on 9 ranking exercises + full DB enrichment', '', '', '', '', '', '', '', '', '', ''],
  [],

  // === FRAMEWORK ===
  ['CHAMPIONSHIP ROSTER FORMULA', '', '', '', '', '', '', '', '', '', ''],
  ['Position', 'Role', 'What We Need', '', '', '', '', '', '', '', ''],
  ['PG', 'Primary Creator', 'Elite passer + playmaker. 6+ APG. Makes everyone better. Positive on/off.', '', '', '', '', '', '', '', ''],
  ['SG/Combo', 'Knockdown Shooter', '40%+ 3P. Secondary creator. Size (6\'3"+). Can guard 1-3.', '', '', '', '', '', '', '', ''],
  ['Wing (SF)', 'The Glue Guy', '3-and-D. Two-way. Best defender on team. 6\'5"-6\'7". Championship DNA.', '', '', '', '', '', '', '', ''],
  ['PF/Big', 'Stretch 4 or Passing 4', '6\'8"+. Can shoot. Can pass. Sets screens. AST:TO matters for a big.', '', '', '', '', '', '', '', ''],
  ['C', 'Rim Protector / Anchor', 'Defensive anchor. Rebounder. Does NOT need to score. Must protect rim.', '', '', '', '', '', '', '', ''],
  ['6th Man', 'Elite Reserve', 'Could start on most teams. Provides same quality off the bench.', '', '', '', '', '', '', '', ''],
  ['7th Man', 'Defensive Specialist', 'Stops the other team\'s best player when starter needs rest.', '', '', '', '', '', '', '', ''],
  ['8th Man', 'Energy/Spot Starter', 'Floor spacer or big who plays hard for 15 min. High motor.', '', '', '', '', '', '', '', ''],
  [],

  // === CRITICAL OBSERVATION ===
  ['⚠️ ROSTER GAP ANALYSIS (Feb 17, 2026)', '', '', '', '', '', '', '', '', '', ''],
  ['Gap', 'Severity', 'Notes', '', '', '', '', '', '', '', ''],
  ['True Rim Protector (C)', '🔴 CRITICAL', 'No certified shot-blocker/anchor in our T1/T2. Need a dedicated big. Board is guard-heavy.', '', '', '', '', '', '', '', ''],
  ['3-and-D Wing (SF)', '🔴 CRITICAL', 'Oweh (Kentucky) is best candidate but only T2. Need a true glue guy in top 10 of board.', '', '', '', '', '', '', '', ''],
  ['Guards (PG/SG)', '🟢 EXCELLENT', '8 T1 guards ranked. Deep, quality options. Championship-caliber at top.', '', '', '', '', '', '', '', ''],
  ['Forward/PF Options', '🟡 MODERATE', '5 T1 forwards but many are "wing-forwards." Need to separate PF from SF.', '', '', '', '', '', '', '', ''],
  ['Portal Availability', '🟡 MODERATE', 'Our best-ranked players are on WINNING teams — harder to poach. Paradox of quality.', '', '', '', '', '', '', '', ''],
  [],

  // === CONFIG A: THE DREAM ===
  ['═══ CONFIG A: "THE EMPIRE" — If portal breaks perfectly ═══', '', '', '', '', '', '', '', '', '', ''],
  ['Scenario: Top 3-4 portal targets all commit. Best-case outcome.', '', '', '', '', '', '', '', '', '', ''],
  [],
  ['POS', 'PLAYER', 'SCHOOL (Current)', 'YR', 'HEIGHT', 'Norman Tier', 'On/Off', 'Key Stat', 'Portal Risk', 'Role', 'Notes'],
  ['PG', 'Labaron Philon Jr.', 'Alabama', 'So', '6\'4"', 'T1 Guards', '+10.4', '15.6 PPG / 4.1 APG / 42% 3P', 'MODERATE (Bama is winning)', 'Primary Creator', 'Best on/off of any guard (+10.4). Elite SEC guard. Will he portal after Soph year? His only path to more usage is here.'],
  ['SG', 'Walter Clayton Jr.', 'Florida', 'Sr', '6\'4"', 'T1 Guards', 'N/A', '18.7 PPG / 4.0 APG', 'HIGH (Sr, program transition)', 'Scorer-Creator', 'Senior on Florida. Once Gator run ends, he\'s ours. Two-way scorer. Championship-caliber guard.'],
  ['SF', 'Otega Oweh', 'Kentucky', 'Sr', '6\'5"', 'T2 Guards', 'N/A', '12.3 PPG / 2.4 APG', 'MODERATE-HIGH (Sr)', 'Glue Guy / Wing', 'Best pure wing on our board. Two-way. Kentucky DNA. Fits the glue guy role perfectly.'],
  ['PF', 'JT Toppin', 'Texas Tech', 'Jr', '6\'9"', 'T1 Forwards', '+8.5', '21.9 PPG / 6.7 RPG', 'HIGH (TTU rebuilding)', 'Athletic Forward', '#1 Norman forward. Big 12 dominant. Two-way. TTU\'s future is uncertain — high portal probability.'],
  ['C', 'KJ Adams Jr.', 'Kansas', 'Sr', '6\'7"', 'T1 Forwards', 'N/A', '16.6 PPG / 7.1 RPG', 'MODERATE-HIGH (Sr)', 'Rim Presence / Anchor', 'Norman\'s #1 forward from Batch 2. Championship DNA. Kansas program. Physical. NOTE: May not be pure rim-protector.'],
  [],
  ['BENCH', '', '', '', '', '', '', '', '', '', ''],
  ['6th', 'Darius Acuff Jr. (Boogie)', 'Arkansas', 'Fr', '6\'3"', 'T1 Guards', '+7.6', '16.6 PPG / 6.3 APG / 43% 3P', 'LOW (Fr on winning team)', 'Elite Reserve', 'Could start. Freshman — likely won\'t portal. But if he does? Instant T1 starter. Best case off bench.'],
  ['7th', 'Trey Peat', 'Arizona', 'Jr', '6\'7"', 'T1 Forwards', 'N/A', '12.8 PPG / 2.8 APG', 'MODERATE (Jr)', 'Stretch Big', '2.8 APG for a forward = PREMIUM. Arizona program. Passing big who spaces floor.'],
  ['8th', 'Joshua Jefferson', 'Iowa State', 'So', '6\'8"', 'T1 Forwards', 'N/A', '14.2 PPG / 3.8 APG', 'LOW (ISU winning, So)', 'Passing Big', '3.8 APG as a forward = Norman\'s dream. But ISU is winning — unlikely to portal.'],
  ['9th', 'Cam Thornton', '(TBD)', 'Sr', 'N/A', 'T2 Guards', 'N/A', 'Winner. Physical.', 'HIGH (Sr)', 'Veteran Leader', 'Toughness guy. Senior energy. Won\'t cost NIL of a starter.'],
  [],
  ['Config A Championship Probability:', 'ELITE — 70%+ Final Four', '', '', '', '', '', '', '', '', ''],
  ['Config A Portal Reality Check:', '⚠️ 20% chance all commit. Several on winning teams (Bama, ISU) likely staying.', '', '', '', '', '', '', '', '', ''],
  [],

  // === CONFIG B: THE REALISTIC BUILD ===
  ['═══ CONFIG B: "THE TACTICAL BUILD" — Realistic portal targets ═══', '', '', '', '', '', '', '', '', '', ''],
  ['Scenario: Players on mid-tier programs, seniors, system mismatches. More gettable.', '', '', '', '', '', '', '', '', '', ''],
  [],
  ['POS', 'PLAYER', 'SCHOOL (Current)', 'YR', 'HEIGHT', 'Norman Tier', 'On/Off', 'Key Stat', 'Portal Risk', 'Role', 'Notes'],
  ['PG', 'Milos Uzan', 'Houston', 'Jr', '6\'2"', 'T1 Guards', 'N/A', '11.9 PPG / 5.8 APG', 'MODERATE (Jr, program plateau?)', 'System PG', 'Houston guard. Elite program. Playmaker. Jr year — if Houston\'s ceiling seems limited, he leaves.'],
  ['SG', 'Bogdan Momcilovic', 'Florida State', 'So', '6\'6"', 'T1 Guards', 'N/A', '14.3 PPG / 2.5 APG', 'HIGH (FSU struggling)', 'Fit Player / Shooter', 'KEY LESSON PLAYER: 14 PPG but FITS. Norman ranked him T1 because role fit > raw numbers. FSU is not winning — he\'s more likely to portal.'],
  ['SF', 'Tre Fears', 'Michigan State', 'Jr', '6\'4"', 'T2 Guards', 'N/A', '13.7 PPG / 3.0 APG', 'MODERATE', 'Two-Way Wing', 'MSU two-way guard. Best defensive wing option from our board below Oweh.'],
  ['PF', 'Joshua Jefferson', 'Iowa State', 'So', '6\'8"', 'T1 Forwards', 'N/A', '14.2 PPG / 3.8 APG', 'LOW-MODERATE', 'Passing Forward', '3.8 APG is the premium stat. Best passing forward on board. Sophomore on winning ISU team — but if he wants more usage...'],
  ['C', 'AJ Dybantsa', 'BYU', 'Fr', '6\'9"', 'UNRANKED (Norman hasn\'t seen)', '+5.6', 'Portal Big Board Grade 80+', 'LOW (Fr)', '⚠️ TO ADD TO RANKING QUEUE', 'CRITICAL NOTE: Dybantsa is in our Portal Big Board T1 but Norman hasn\'t ranked him. 6\'9" freshman. Needs to be in next exercise. Could be our anchor.'],
  [],
  ['BENCH', '', '', '', '', '', '', '', '', '', ''],
  ['6th', 'Xzayvier Brown', 'Oklahoma', 'Jr', 'N/A', 'T2 Guards', 'N/A', '#1 on Oklahoma', 'HIGH (Okla is struggling)', 'Versatile Reserve', 'Norman ranked him #1 over Davis on same team. Character + production delta. Oklahoma likely to shed players.'],
  ['7th', 'Duke Conwell', '(TBD)', 'Sr', 'N/A', 'T2 Guards', 'N/A', 'Two appearances in exercises', 'HIGH (Sr)', 'Veteran Playmaker', 'Two exercise appearances = solid T2. Seniors are always available.'],
  ['8th', 'Nimari Burnett', 'Michigan', 'Sr', 'N/A', 'T1 Forwards', 'N/A', 'Michigan forward', 'HIGH (Sr)', 'Two-Way Forward', 'T1 forward. Michigan program. Senior — available.'],
  ['9th', 'RJ Davis', 'UNC', 'Sr', 'N/A', 'T2 Forwards', 'N/A', 'UNC wing. Winning pedigree.', 'MODERATE (Sr)', 'Wing Depth', 'UNC winning program. Senior wing. Championship DNA.'],
  [],
  ['Config B Championship Probability:', 'STRONG — 50%+ Big Dance, 25%+ Final Four', '', '', '', '', '', '', '', '', ''],
  ['Config B Portal Reality Check:', '✅ 60% chance this core materializes. FSU, Okla, Houston players are more moveable.', '', '', '', '', '', '', '', '', ''],
  [],

  // === CONFIG C: THE STEAL BOARD ===
  ['═══ CONFIG C: "THE STEAL BOARD" — Under-the-radar / undervalued targets ═══', '', '', '', '', '', '', '', '', '', ''],
  ['Scenario: Players with strong on/off, on bad teams, NOT on everyone\'s radar. We strike first.', '', '', '', '', '', '', '', '', '', ''],
  [],
  ['POS', 'PLAYER', 'SCHOOL (Current)', 'YR', 'HEIGHT', 'Cin Score', 'On/Off', 'Why Undervalued', 'Portal Risk', 'Role', 'Norman-Aligned?'],
  ['PG', 'Juke Harris', 'Wake Forest', 'So', '6\'7"', '97.3', '+6.4', '6\'7" GUARD. Media undersells because of height at guard position. Norman loves size.', 'HIGH (Wake Forest struggling)', 'Oversized Creator', '✅ YES — Norman values size at guard. Harris ranked T3 but that was in a loaded guard batch.'],
  ['SG', 'Keaton Wagler', 'Illinois', 'Fr', '6\'6"', '78.5', '+7.1', 'Freshman on Big Ten program. Scouts sleeping on him. +7.1 on/off is elite.', 'LOW (Fr)', 'Future T1 Target', '⚠️ NEEDS RANKING — Present to Norman. 6\'6" freshman with elite on/off.'],
  ['SF', 'Cameron Carr', 'Baylor', 'So', '6\'5"', '93.9', '+5.4', 'On Baylor\'s bench. Not getting minutes. But Cin Score 93.9 says he\'s elite when he plays.', 'MODERATE (So, wants PT)', 'Breakout Candidate', '⚠️ NEEDS RANKING — Baylor player not getting minutes = portal flight risk.'],
  ['PF', 'Caleb Wilson', 'UNC', 'Fr', '6\'10"', '73.7', '+4.1', '6\'10" freshman. UNC. On/off positive. Media ignores because he\'s not scoring.', 'LOW (Fr)', 'Big Man Development', '⚠️ NEEDS RANKING — 6\'10" freshman with positive on/off and UNC DNA.'],
  ['C', 'John Blackwell', 'Wisconsin', 'Jr', '6\'4"', '73.9', '+6.6', 'Playing out of position at Wisconsin. His natural game fits as our C in small-ball.', 'MODERATE', 'Small-Ball Anchor', '⚠️ NEEDS RANKING — Interesting small-ball option.'],
  [],
  ['STEAL BOARD PHILOSOPHY:', 'Hit the portal on DAY ONE for these guys. Not waiting.', '', '', '', '', '', '', '', '', ''],
  ['Why they\'re steals:', 'On/off data is NOT on national recruiting boards. Most coaches are looking at PPG. We\'re looking at team impact.', '', '', '', '', '', '', '', '', ''],
  [],

  // === PORTAL STRIKE ORDER ===
  ['═══ PORTAL STRIKE ORDER — Who to Call First (Opens ~March 23, 2026) ═══', '', '', '', '', '', '', '', '', '', ''],
  ['Priority', 'Player', 'School', 'Reason', 'NIL Est.', 'Timeline', 'Risk Level', '', '', '', ''],
  ['#1 IMMEDIATE', 'JT Toppin', 'Texas Tech', 'Best available forward. TTU rebuilding. Gets First Day calls from 50 programs.', '$800K-$1.2M/yr', 'Portal Day 1', 'HIGH COMPETITION'],
  ['#2 IMMEDIATE', 'Labaron Philon', 'Alabama', 'Best guard on board (+10.4 on/off). Sophomore — rare portal candidate.', '$600K-$900K/yr', 'Portal Week 1', 'HIGH COMPETITION'],
  ['#3 FIRST WEEK', 'Walter Clayton Jr.', 'Florida', 'Senior, likely exploring options. Florida\'s future murky.', '$400K-$600K/yr', 'Portal Week 1-2', 'MODERATE'],
  ['#4 FIRST WEEK', 'Bogdan Momcilovic', 'Florida State', 'FSU struggling. His style fits us perfectly. Won\'t get 50 calls.', '$300K-$500K/yr', 'Portal Week 1-2', 'LOWER COMPETITION'],
  ['#5 FAST FOLLOW', 'Xzayvier Brown', 'Oklahoma', 'Oklahoma hemorrhaging. He\'s going to portal. Get him before the Big Boys do.', '$200K-$400K/yr', 'Portal Week 2', 'MODERATE'],
  ['#6 SLEEPER', 'Juke Harris', 'Wake Forest', 'Nobody talking about 6\'7" guard because of conference. WE know.', '$150K-$300K/yr', 'Portal Week 2-3', 'LOW COMPETITION ← OUR EDGE'],
  ['#7 SLEEPER', 'Keaton Wagler', 'Illinois', 'Big Ten freshman. +7.1 on/off. Season\'s end will clarify.', '$100K-$200K/yr', 'End of Season', 'LOW COMPETITION ← OUR EDGE'],
  [],

  // === RANKING GAPS — NEXT EXERCISES ===
  ['═══ RANKING PRIORITIES — What Norman Needs to See Next ═══', '', '', '', '', '', '', '', '', '', ''],
  ['Priority', 'Player', 'School', 'Why We Need This Ranking', 'Position', '', '', '', '', '', ''],
  ['#1', 'AJ Dybantsa', 'BYU', '6\'9" freshman. Portal Big Board T1. Our potential anchor big. Norman hasn\'t ranked him. CRITICAL.', 'F/C', '', '', '', '', '', ''],
  ['#2', 'Cameron Boozer', 'Duke', '6\'9" Duke freshman. Blue chip. Could be our center.', 'F/C', '', '', '', '', '', ''],
  ['#3', 'Keaton Wagler', 'Illinois', '6\'6" frosh, +7.1 on/off. Steal candidate.', 'G/SF', '', '', '', '', '', ''],
  ['#4', 'Cameron Carr', 'Baylor', 'Cin Score 93.9, +5.4 on/off. Undiscovered.', 'SF', '', '', '', '', '', ''],
  ['#5', 'Yaxel Lendeborg', 'Michigan', '6\'9" Michigan forward. 24-1 team. When Michigan\'s season ends, is he portal-bound?', 'F', '', '', '', '', '', ''],
  ['#6', 'Nick Boyd', 'Wisconsin', '20.6 PPG, Grade 71. Big Ten senior.', 'G', '', '', '', '', '', ''],
  ['#7', 'Lamar Wilkerson', 'Indiana', '22.1 PPG, 28.2 in last 6 games. Hot hand. Indiana portal candidate.', 'G', '', '', '', '', '', ''],
  ['#8', 'Bennett Stirtz', 'Iowa', 'Iowa senior, 22.4 PPG. Potential NBA Draft risk flag.', 'G', '', '', '', '', '', ''],
  [],

  // === CHAMPIONSHIP FORMULA VERDICT ===
  ['═══ JIMMY\'S ASSESSMENT — Feb 17, 2026 ═══', '', '', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', '', '', ''],
  ['THE GOOD:', 'Guard corps is stacked. 8 T1 guards, depth at PG and SG. Norman\'s philosophy is calibrated. We know what we want.', '', '', '', '', '', '', '', '', ''],
  ['THE GAP:', 'We need a rim-protecting center and a true 3-and-D wing. These two spots are the difference between Sweet 16 and Final Four. Current T1 roster has no certified shot-blocker.', '', '', '', '', '', '', '', '', ''],
  ['THE PARADOX:', 'Best players are on winning teams (Bama, Purdue, Arizona). Lower portal probability. We may need to reach deeper into T2 for our core.', '', '', '', '', '', '', '', '', ''],
  ['THE OPPORTUNITY:', 'Team Impact Flags caught 12 players with negative on/off despite high PPG. Every program targeting those guys is wasting NIL money. We won\'t.', '', '', '', '', '', '', '', '', ''],
  ['THE VERDICT:', 'Config B is most likely. Targeting: Momcilovic (PG/SG), Uzan or Brown (PG), Jefferson or Peat (PF), Toppin if TTU collapses (F), plus two steals from the Steal Board.', '', '', '', '', '', '', '', '', ''],
  ['', '', '', '', '', '', '', '', '', '', ''],
  ['NEXT STEPS FOR NORMAN:', '1) Rank Batch: Dybantsa, Boozer, Lendeborg, Wilkerson — our potential big men  |  2) Confirm Steal Board players  |  3) Decide: Philon is worth T1 NIL even as a sophomore?', '', '', '', '', '', '', '', '', ''],
];

async function buildRosterTab() {
  // Clear existing content
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A1:K200`
  });

  // Write all data
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${TAB}!A1`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: rosterData }
  });

  console.log('✅ Roster Builder tab populated. Total rows:', rosterData.length);
  
  // Apply formatting
  const sheetsReq = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const rosterSheet = sheetsReq.data.sheets.find(s => s.properties.title === TAB);
  const sheetId = rosterSheet.properties.sheetId;

  const requests = [
    // Title row: large bold
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 0, endRowIndex: 1, startColumnIndex: 0, endColumnIndex: 11 },
        cell: { userEnteredFormat: { 
          textFormat: { bold: true, fontSize: 16, foregroundColor: { red: 0.2, green: 0.6, blue: 1.0 } },
          backgroundColor: { red: 0.1, green: 0.1, blue: 0.15 }
        }},
        fields: 'userEnteredFormat'
      }
    },
    // Config A header: green
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 23, endRowIndex: 24, startColumnIndex: 0, endColumnIndex: 11 },
        cell: { userEnteredFormat: { 
          textFormat: { bold: true, fontSize: 12, foregroundColor: { red: 0.2, green: 0.9, blue: 0.3 } },
          backgroundColor: { red: 0.05, green: 0.2, blue: 0.05 }
        }},
        fields: 'userEnteredFormat'
      }
    },
    // Config B header: blue
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 40, endRowIndex: 41, startColumnIndex: 0, endColumnIndex: 11 },
        cell: { userEnteredFormat: { 
          textFormat: { bold: true, fontSize: 12, foregroundColor: { red: 0.4, green: 0.7, blue: 1.0 } },
          backgroundColor: { red: 0.0, green: 0.1, blue: 0.25 }
        }},
        fields: 'userEnteredFormat'
      }
    },
    // Config C header: amber/gold
    {
      repeatCell: {
        range: { sheetId, startRowIndex: 57, endRowIndex: 58, startColumnIndex: 0, endColumnIndex: 11 },
        cell: { userEnteredFormat: { 
          textFormat: { bold: true, fontSize: 12, foregroundColor: { red: 1.0, green: 0.8, blue: 0.1 } },
          backgroundColor: { red: 0.2, green: 0.15, blue: 0.0 }
        }},
        fields: 'userEnteredFormat'
      }
    },
    // Freeze top row
    {
      updateSheetProperties: {
        properties: { sheetId, gridProperties: { frozenRowCount: 4 } },
        fields: 'gridProperties.frozenRowCount'
      }
    },
    // Column widths
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 0, endIndex: 1 }, properties: { pixelSize: 120 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 1, endIndex: 2 }, properties: { pixelSize: 180 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 2, endIndex: 3 }, properties: { pixelSize: 160 }, fields: 'pixelSize' } },
    { updateDimensionProperties: { range: { sheetId, dimension: 'COLUMNS', startIndex: 10, endIndex: 11 }, properties: { pixelSize: 280 }, fields: 'pixelSize' } },
  ];

  await sheets.spreadsheets.batchUpdate({ spreadsheetId: SHEET_ID, requestBody: { requests } });
  console.log('✅ Formatting applied');
}

buildRosterTab().catch(console.error);
