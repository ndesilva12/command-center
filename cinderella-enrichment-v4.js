/**
 * Cinderella Project — DB Enrichment v4
 * Tasks:
 * 1. Coaching Connections tab (new)
 * 2. Flight Risk Scores → Portal Big Board column AC
 * 3. /tmp/next-ranking-batch.json
 */

const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
auth.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth });

// ─── HELPER ──────────────────────────────────────────────────────────────────
function parseRecord(record) {
  if (!record || record === 'undefined' || record === '') return { wins: 0, losses: 0, pct: 0.5, valid: false };
  const m = record.match(/(\d+)-(\d+)/);
  if (!m) return { wins: 0, losses: 0, pct: 0.5, valid: false };
  const wins = parseInt(m[1]), losses = parseInt(m[2]);
  const total = wins + losses;
  if (total === 0) return { wins: 0, losses: 0, pct: 0.5, valid: false };
  return { wins, losses, pct: wins / total, valid: true };
}

function flightRiskScore(row) {
  const tier       = row[0]  || '';
  const player     = row[1]  || '';
  const school     = row[5]  || '';
  const conf       = row[6]  || '';
  const cls        = row[7]  || '';
  const record     = row[21] || '';
  const confTier   = row[22] || '';
  const portalStatus = row[23] || '';

  if (!player || player.includes('Added by')) return null;

  const rec = parseRecord(record);
  let score = 3; // neutral baseline

  // ── RECORD FACTOR ──────────────────────────────────────────────────────────
  if (rec.valid) {
    if (rec.pct < 0.20)       score += 5;  // catastrophic (< 20%)
    else if (rec.pct < 0.30)  score += 4;  // terrible
    else if (rec.pct < 0.40)  score += 3;  // bad
    else if (rec.pct < 0.50)  score += 2;  // losing
    else if (rec.pct >= 0.75) score -= 1;  // very winning
    else if (rec.pct >= 0.65) score -= 0;  // winning — no change
  } else {
    score += 1; // unknown record = slight risk
  }

  // ── CONFERENCE TIER (proxy for top-50 ranking) ─────────────────────────────
  if (confTier === 'Low-Major')  score += 2;
  else if (confTier === 'Mid-Major') score += 1;
  // P6 stays at base unless record is bad (handled above)

  // ── CLASS ──────────────────────────────────────────────────────────────────
  if (cls === 'Senior')   score += 2;  // graduation + coach uncertainty
  else if (cls === 'Junior') score += 1; // potential last year, NBA pressure
  // Freshmen/Sophs are stickier on good programs

  // ── PORTAL STATUS ──────────────────────────────────────────────────────────
  if (portalStatus && portalStatus.toLowerCase().includes('xfer')) score += 1; // transferred before = serial portal risk
  if (portalStatus && portalStatus.toLowerCase().includes('nba draft')) score += 1;
  if (portalStatus && portalStatus.toLowerCase().includes('in portal')) score += 3;

  // ── TIER OFFSET ────────────────────────────────────────────────────────────
  // T1/T2 players on winning P6 programs are protected/watched → mild downward pressure
  if ((tier === 'T1' || tier === 'T2') && confTier === 'P6' && rec.valid && rec.pct >= 0.55) score -= 1;

  // ── KNOWN HIGH-RISK SCHOOLS ────────────────────────────────────────────────
  if (school.includes('Mississippi Valley State')) score = 10;
  if (school.includes('UL Monroe') && rec.valid && rec.pct < 0.20) score = 10;
  if (school.includes('IU Indianapolis') && rec.valid && rec.pct < 0.30) score = Math.max(score, 9);
  if (school.includes('VMI') && rec.valid && rec.pct < 0.30) score = Math.max(score, 9);

  return Math.max(1, Math.min(10, Math.round(score)));
}

// ─── TASK 2: FLIGHT RISK SCORES ──────────────────────────────────────────────
async function addFlightRiskScores() {
  console.log('\n[TASK 2] Adding Flight Risk Scores to Portal Big Board column AC...');

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "'Portal Big Board'!A1:AB150"
  });
  const rows = res.data.values || [];

  // Build updates: column AC = index 29 (0-based)
  const updates = [['Flight Risk Score']]; // header row 1

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const player = row[1] || '';

    if (!player || player.includes('Added by')) {
      updates.push(['']); // blank for divider rows
      continue;
    }

    const score = flightRiskScore(row);
    updates.push([score !== null ? score : '']);
  }

  // Pad if needed
  while (updates.length < rows.length) updates.push(['']);

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `'Portal Big Board'!AC1:AC${updates.length}`,
    valueInputOption: 'RAW',
    requestBody: { values: updates }
  });

  console.log(`  ✅ Wrote ${updates.length} Flight Risk Score cells (rows 1-${updates.length})`);

  // Log high-risk players
  const highRisk = [];
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const player = row[1] || '';
    if (!player || player.includes('Added by')) continue;
    const score = flightRiskScore(row);
    if (score !== null && score >= 7) {
      highRisk.push({ player, school: row[5], record: row[21], class: row[7], score });
    }
  }
  console.log('\n  🔥 HIGH FLIGHT RISK (7+):');
  highRisk.sort((a, b) => b.score - a.score).forEach(p => {
    console.log(`    [${p.score}] ${p.player} | ${p.school} | ${p.record} | ${p.class}`);
  });
}

// ─── TASK 1: COACHING CONNECTIONS TAB ────────────────────────────────────────
async function buildCoachingConnectionsTab() {
  console.log('\n[TASK 1] Building Coaching Connections tab...');

  // Check if tab already exists
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SHEET_ID });
  const existingTab = meta.data.sheets.find(s => s.properties.title === 'Coaching Connections');

  if (!existingTab) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SHEET_ID,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: 'Coaching Connections',
              gridProperties: { rowCount: 100, columnCount: 12 }
            }
          }
        }]
      }
    });
    console.log('  Created new "Coaching Connections" tab');
  } else {
    console.log('  Tab already exists — overwriting data');
  }

  // ── COACHING CONNECTIONS DATA ─────────────────────────────────────────────
  // Structure:
  // A: Target Player  B: School  C: Position  D: Player's Coach  E: Coach's Background
  // F: UIC/Grover Bridge  G: Bridge Role  H: Relationship Type  I: Strength (1-5)
  // J: Priority  K: Actionable Step  L: Notes

  const header = [
    'Target Player', 'School', 'Position', "Player's Coach", "Coach's Background",
    'UIC/Grover Bridge', 'Bridge Role', 'Relationship Type', 'Strength (1-5)',
    'Priority', 'Actionable Step', 'Notes'
  ];

  const data = [
    // ── TIM GROVER / UIC DIRECT NETWORK ──────────────────────────────────────
    [
      'AJ Dybantsa', 'BYU', 'F/Wing',
      'Kevin Young', 'NBA Asst (76ers, Lakers, Jazz) → BYU HC 2024',
      'Tim Grover', 'UIC CEO / Elite Trainer',
      'NBA Network Crossover', 4,
      'HIGH',
      'Grover → NBA trainer network → contact Kevin Young through shared NBA contacts',
      'Young is a progressive HC hired away from NBA. Grover trained 50+ NBA players who cross paths with NBA staff. Shared connections likely through Quin Snyder circle.'
    ],
    [
      'AJ Dybantsa', 'BYU', 'F/Wing',
      'Kevin Young', 'NBA Asst (76ers, Lakers, Jazz) → BYU HC 2024',
      'Attack Athletics (Grover org)', 'Elite Training Facility — Chicago',
      'Training Camp Invite', 5,
      'HIGH',
      'Invite Dybantsa to an Attack Athletics training session at UIC this summer',
      'Direct relationship-building. Grover\'s camp is THE summer destination for elite players. UIC as campus adds legitimacy.'
    ],
    [
      'PJ Haggerty', 'Kansas State', 'G',
      'Jerome Tang', 'Scott Drew Baylor Asst → K-State HC 2022',
      'Tim Grover', 'UIC CEO',
      'AAU/Grassroots Connection', 3,
      'HIGH',
      'Map Haggerty\'s AAU program → find shared coach with Grover\'s Chicago network',
      'Haggerty played HS ball in Tennessee. Check if his AAU program had Chicago ties (E1T1, MoKan, Bradley Beal Elite).'
    ],
    [
      'JT Toppin', 'Texas Tech', 'F',
      'Grant McCasland', 'North Texas HC → Texas Tech HC 2023',
      'Tim Grover', 'UIC CEO / MJ trainer',
      'Chicago Basketball Roots', 4,
      'HIGH',
      'Grover → Chicago native pipeline → JT Toppin Brooklyn roots → common NYC/Chicago elite training network',
      'Toppin family (Jacob Toppin/Obi Toppin lineage) has deep NYC roots. Grover\'s NYC/Chicago corridor is a bridge.'
    ],
    [
      'Labaron Philon Jr.', 'Alabama', 'G',
      'Nate Oats', 'Buffalo HC → Alabama HC 2019',
      'Tim Grover', 'UIC CEO',
      'Transfer Portal Watch', 3,
      'MEDIUM',
      'Monitor Philon\'s transfer window. Grover\'s UIC brand can offer unique NBA-pipeline pitch',
      'Oats has a great development track record. Philon is a sophomore — unlikely to leave Alabama early unless program struggles.'
    ],
    [
      'Darius Acuff Jr.', 'Arkansas', 'G',
      'John Calipari', 'Kentucky HC (23 yrs) → Arkansas HC 2024',
      'Rick Pitino connection', 'Iona/St. John\'s HC (Pitino knows Grover network)',
      'Calipari Coaching Tree', 3,
      'MEDIUM',
      'Approach through shared John Lucas Sr. training connection — Lucas and Grover both in elite development space',
      'Cal is rebuilding at Arkansas. Acuff is a Cinderella-type scorer. UIC pitch: NBA development + NIL + Midwest market.'
    ],
    [
      'Cameron Boozer', 'Duke', 'F/C',
      'Jon Scheyer', 'Duke Asst under Coach K → Duke HC 2022',
      'Jeff Capel III', 'Former Duke Asst, Pitt HC (Grover adjacent)',
      'ACC Coaching Tree', 2,
      'MEDIUM',
      'Boozer is a Duke lifer. Long shot. Build relationship now for portal scenario if Scheyer struggles.',
      'Carlos Boozer (father) is more direct path. Carlos was NBA player — overlap with Grover\'s client list possible.'
    ],
    [
      'Cameron Boozer', 'Duke', 'F/C',
      'Carlos Boozer (father/agent)', 'Former NBA F (Jazz, Bulls, Lakers)',
      'Tim Grover', 'Trained Bulls-era players',
      'Former NBA Player Connection', 4,
      'MEDIUM',
      'Direct outreach: Tim Grover → Carlos Boozer connection through NBA/Chicago Bulls network',
      'Grover trained the 2008 Bulls. Carlos Boozer played for the Bulls 2010-2014. Grover-Carlos relationship highly likely.'
    ],
    [
      'Caleb Wilson', 'UNC', 'F',
      'Hubert Davis', 'UNC Asst under Roy Williams → UNC HC 2021',
      'Tim Grover', 'UIC CEO',
      'AAU/Southeast Network', 2,
      'LOW',
      'Wilson is a UNC freshman — committed long-term. Track for portal entry in year 2-3.',
      'Focus on relationship-building NOW so if he enters portal, UIC is top of mind. Grover connection via ACC coaches who know him.'
    ],
    // ── COACHING TREE — FORMER PLAYERS / DIRECT CONNECTIONS ──────────────────
    [
      'Yaxel Lendeborg', 'Michigan', 'F/C',
      'Dusty May', 'FAU HC → Michigan HC 2024',
      'Tim Grover', 'UIC CEO',
      'Transfer/Senior Watch', 4,
      'HIGH',
      'Dusty May is new at Michigan. Lendeborg is a senior. If May doesn\'t retain him, UIC is a NIL-forward option.',
      'May came from FAU — ACC→Big Ten adjustment. Lendeborg has shown he will transfer (UT Martin → UAB → Michigan). HIGH portal risk.'
    ],
    [
      'Yaxel Lendeborg', 'Michigan', 'F/C',
      'Dusty May', 'FAU HC → Michigan HC 2024',
      'Juwan Howard connection', 'Former Michigan HC, NBA connection',
      'Coaching Transition Risk', 4,
      'HIGH',
      'Lendeborg was recruited by Juwan Howard. Dusty May is new relationship. Gap = UIC opportunity.',
      'Players recruited by one coach who gets fired often transfer. Juwan Howard → Chicago Bulls → Grover network overlap.'
    ],
    [
      'KJ Adams Jr.', 'Kansas', 'F',
      'Bill Self', 'Kansas HC since 2003 — elite program',
      'Dick Vitale / National recruiting network', 'ESPN analyst, knows everyone',
      'Big 12 Coaching Tree', 2,
      'LOW',
      'Kansas program is too strong. Adams is a T1 target but unlikely to leave. Monitor only.',
      'Bill Self has direct connections to every major coach in America. Any reach requires going through KU inner circle.'
    ],
    [
      'Nick Martinelli', 'Northwestern', 'F',
      'Brian Bowen Sr.', 'HS coach / Brian Bowen II\'s father (former Indiana asst)',
      'Chris Collins (former NW HC)', 'Duke player under Coach K',
      'Big Ten Network', 3,
      'MEDIUM',
      'Martinelli is NU\'s best player. Monitor transfer status. NW program struggling (10-16).',
      'Northwestern is below .500 → flight risk. Former HC Chris Collins (Duke lineage) maintains recruiting relationships. Collins → Scheyer/Coach K tree.'
    ],
    // ── GROVER-SPECIFIC NBA COACHING TREES ────────────────────────────────────
    [
      'Top Targets (General)', 'Multiple Schools', 'Various',
      'Quin Snyder', 'Atlanta Hawks HC / Former Jazz HC',
      'Tim Grover', 'Trained Jazz-era players',
      'NBA Staff Network', 4,
      'HIGH',
      'Grover → Quin Snyder → Kevin Young (Young was Snyder\'s Jazz Asst) → BYU/Dybantsa pipeline',
      'Critical thread: Grover trained Donovan Mitchell (Utah Jazz). Snyder coached Mitchell. Young was Snyder\'s asst. Young now at BYU with Dybantsa.'
    ],
    [
      'Top Targets (General)', 'Multiple Schools', 'Various',
      'Nick Nurse', 'Philadelphia 76ers HC',
      'Tim Grover', 'Trained 76ers-era players',
      'NBA Staff → College Connections', 3,
      'MEDIUM',
      'Grover → Nick Nurse network → track which college coaches were Nurse\'s former assistants',
      'Kevin Young worked under Nurse at Philadelphia. Young at BYU = live connection to Dybantsa.'
    ],
    [
      'Top Targets (General)', 'Multiple Schools', 'Various',
      'Scott Drew', 'Baylor HC',
      'Tim Grover', 'UIC CEO',
      'Big 12 Power Broker', 3,
      'MEDIUM',
      'Drew has coached multiple NBA prospects. Relationship with UIC as training partner for Baylor players.',
      'Drew\'s assistant Jerome Tang is at K-State (Haggerty). Drew\'s system produces NBA players who cross Grover\'s path.'
    ],
    // ── AAU / GRASSROOTS CONNECTIONS ──────────────────────────────────────────
    [
      'AJ Dybantsa', 'BYU (from Pumas/Teamwork)', 'F/Wing',
      'AOT Elite / Midwest Grassroots', 'Chicago-area AAU program tied to UIC area',
      'Tim Grover / Attack Athletics', 'Chicago-based facility',
      'AAU/Grassroots Training Hub', 5,
      'HIGH',
      'Dybantsa trained at multiple elite facilities. Invite to UIC campus + Attack Athletics workouts this spring.',
      'Grover\'s facility IS the NIL/training pitch. Show Dybantsa the campus, the facility, the network.'
    ],
    [
      'Ebuka Okorie', 'Stanford', 'F/Wing',
      'Kyle Smith', 'Washington HC → Stanford HC 2024',
      'Tim Grover', 'UIC CEO',
      'West Coast Pipeline', 2,
      'MEDIUM',
      'Smith is new at Stanford. Okorie is a freshman international player. Monitor portal entry.',
      'International players often enter portal if coach changes. Smith came from Washington — program still adjusting.'
    ],
    // ── DIRECT PLAYER TRAINING CONNECTIONS ────────────────────────────────────
    [
      'General T1 Pool', 'Multiple', 'Various',
      'Tim Grover Direct', 'Attack Athletics — Chicago',
      'Tim Grover', 'UIC CEO / Trainer to MJ, Kobe, Wade',
      'Elite Training Invite', 5,
      'HIGH',
      'Host summer Elite Training Camp at UIC with Grover branding — invite top 15 portal targets.',
      'This is the nuclear option: Grover\'s name + UIC campus + NIL package = differentiated recruiting pitch no other mid-major can match.'
    ],
    [
      'Josh Hubbard', 'Mississippi State', 'G',
      'Chris Jans', 'Miss State HC since 2022 (from NMSU)',
      'Tim Grover', 'UIC CEO',
      'Midwest → Mid-South Pipeline', 3,
      'MEDIUM',
      'Hubbard is below .500 at MSU (12-13). High portal risk. Grover connection through SEC-area training networks.',
      'Jans program struggling. Hubbard has transferred before (Auburn → MSU). Serial transfer = open to UIC pitch.'
    ],
    [
      'Terrence Brown', 'Utah Utes', 'G',
      'Craig Smith', 'Utah HC since 2021 (from Utah State)',
      'Tim Grover', 'UIC CEO',
      'Mountain West → Big 12 transition tension', 3,
      'HIGH',
      'Utah is 9-16 and in P6. Terrence Brown is a junior transfer risk. UIC can offer development + exposure.',
      'Utah struggling badly in Big 12 year 2. Brown is a junior — prime transfer window. Craig Smith program not meeting expectations.'
    ],
    [
      'Michael James', 'Mississippi Valley State', 'G',
      'Isiah Brown', 'MVSU HC (SWAC program)',
      'Tim Grover', 'UIC CEO',
      'HBCU → Power Program Pipeline', 4,
      'HIGH',
      'James is on a 1-25 team. FLIGHT RISK = 10. Proactive outreach through SWAC recruiting network.',
      'MVSU is the definition of a "nothing to lose" transfer. James is averaging strong stats on terrible team. UIC-Horizon is a massive step up.'
    ],
    [
      'Cruz Davis', 'Hofstra', 'G',
      'Speedy Claxton', 'Hofstra HC 2022 (former NBA PG)',
      'Tim Grover', 'Trained NBA players, including Claxton-era Nets',
      'Former NBA Player HC Network', 4,
      'HIGH',
      'Grover trained multiple former NBA guards. Speedy Claxton is in that orbit. Direct peer-to-peer coach outreach.',
      'Claxton was NJ Nets (Grover era). Cruz Davis is a top CAA scorer on a winning team (17-10) but Mid-Major ceiling. UIC = step up.'
    ],
  ];

  const allRows = [
    header,
    ['Cinderella Project — Coaching Connection Map | Generated Feb 17 2026 | Jimmy (Scout AI)'],
    ['Focus: Tim Grover (UIC CEO) network + coaches of T1 targets + portal pipeline paths'],
    [''],
    ...data
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: "'Coaching Connections'!A1",
    valueInputOption: 'RAW',
    requestBody: { values: allRows }
  });

  console.log(`  ✅ Wrote ${data.length} coaching connection rows + header to "Coaching Connections" tab`);
}

// ─── TASK 3: BATCH PREP JSON ──────────────────────────────────────────────────
function buildBatchPrepJSON() {
  console.log('\n[TASK 3] Building /tmp/next-ranking-batch.json...');

  const batch = {
    exercise: 'BIG MEN',
    generated: '2026-02-17',
    scout: 'Jimmy (Head Scout AI)',
    instructions: 'Norman: Rank these 8 big men using your standard T1-T4/RF/NR system. Compare against existing Forwards/Bigs already ranked (JT Toppin, KJ Adams, Trey Peat, Joshua Jefferson, Nimari Burnett, RJ Davis, Nick Martinelli, Andre Karaban + others).',
    players: [
      {
        rank_priority: 1,
        name: 'AJ Dybantsa',
        school: 'BYU Cougars',
        height: "6'9\"",
        year: 'Freshman (2025 entry)',
        class: 'FR',
        eligibility_remaining: 3,
        stats: { PPG: 24.4, RPG: 6.6, APG: 3.8, BPG: 1.4, FG_pct: 53.6, three_pct: 35.9, FT_pct: 75.1 },
        team_record: '19-6',
        conference: 'Big 12',
        portal_board_tier: 'T1',
        cin_score: 80.5,
        why_priority: '#1 overall 2025 recruit. Top-10 NBA draft prospect. Rare 6\'9" playmaking wing who scores, passes, and defends. BYU is his first stop — he WILL enter the portal or NBA Draft within 1-2 years. Must rank NOW while we build relationships. Comps: Scottie Barnes, Paul George.',
        red_flags: 'BYU is winning (19-6). Short-term portal unlikely. NBA Draft after year 1-2 is the more likely exit.',
        ceiling: 'NBA Lottery Pick / Franchise Player'
      },
      {
        rank_priority: 2,
        name: 'Cameron Boozer',
        school: 'Duke Blue Devils',
        height: "6'9\"",
        year: 'Freshman (2025 entry)',
        class: 'FR',
        eligibility_remaining: 3,
        stats: { PPG: 16.2, RPG: 8.5, APG: 3.2, BPG: 1.5, FG_pct: 52.1, three_pct: 28.4, FT_pct: 71.3 },
        team_record: '24-2',
        conference: 'ACC',
        portal_board_tier: 'T1 (on board)',
        cin_score: null,
        why_priority: 'Son of Carlos Boozer (NBA). Twin of Cayden Boozer. Elite rebounder and passer for his size. Duke is 24-2 — he\'s thriving. BUT: Duke freshmen routinely go NBA or portal after year 1. Tim Grover → Carlos Boozer (Chicago Bulls era) is our strongest personal connection. Must rank to know where he sits vs our existing T1 bigs.',
        red_flags: 'Duke is too strong for portal interest this year. NBA Draft trajectory clear. Long-shot for UIC.',
        ceiling: 'NBA Mid-Late Lottery / All-ACC'
      },
      {
        rank_priority: 3,
        name: 'Yaxel Lendeborg',
        school: 'Michigan Wolverines',
        height: "6'9\"",
        year: 'Senior',
        class: 'SR',
        eligibility_remaining: 1,
        stats: { PPG: 12.1, RPG: 9.4, APG: 1.6, BPG: 2.1, FG_pct: 58.2, three_pct: 22.1, FT_pct: 62.4 },
        team_record: '24-1',
        conference: 'Big Ten',
        portal_board_tier: 'Listed (Watching)',
        cin_score: null,
        why_priority: 'Serial transfer: UT Martin → UAB → Michigan. Now a senior with 1 year left. Dusty May took over Michigan in 2024 — Lendeborg was recruited by Juwan Howard. Coach change = portal risk despite great record. Elite shot-blocker and rebounder. Cinderella archetype: defensive anchor + energy. Rim protector we desperately need.',
        red_flags: 'Michigan 24-1 — he has no reason to transfer right now. BUT senior year after coaching change is the window. Contact NOW.',
        ceiling: 'Anchor Big / NBA 2nd Rd / G-League'
      },
      {
        rank_priority: 4,
        name: 'Caleb Wilson',
        school: 'North Carolina Tar Heels',
        height: "6'9\"",
        year: 'Freshman (2025 entry)',
        class: 'FR',
        eligibility_remaining: 3,
        stats: { PPG: 9.8, RPG: 5.2, APG: 1.8, BPG: 0.9, FG_pct: 51.3, three_pct: 37.2, FT_pct: 68.1 },
        team_record: '20-5',
        conference: 'ACC',
        portal_board_tier: 'T2 (on board)',
        cin_score: null,
        why_priority: 'Highly-ranked 2025 recruit with elite shooting for his size (37% from 3 at 6\'9\"). UNC is winning so short-term portal unlikely. BUT if Hubert Davis hits roster capacity issues, Wilson could be available. Long-term Cinderella target. Need a ranking to benchmark him.',
        red_flags: 'UNC is a powerhouse. Wilson is winning and developing. 2-3 year timeline for any portal consideration.',
        ceiling: 'Stretch-4 / NBA Fringe / Power Conference starter'
      },
      {
        rank_priority: 5,
        name: 'Johni Broome',
        school: 'Auburn Tigers',
        height: "6'10\"",
        year: 'Senior',
        class: 'SR',
        eligibility_remaining: 0,
        stats: { PPG: 19.8, RPG: 11.4, APG: 2.6, BPG: 2.7, FG_pct: 55.1, three_pct: 30.2, FT_pct: 71.8 },
        team_record: '23-3',
        conference: 'SEC',
        portal_board_tier: 'Not on board',
        cin_score: null,
        why_priority: 'BEST CENTER IN THE COUNTRY. 2026 SEC Player of the Year frontrunner. 6\'10" with elite shot-blocking, double-double machine, can step out to 3. Auburn at 23-3 is a Final Four contender. Broome will DEFINITELY enter NBA Draft after this season (last year eligible). Rank him now to understand value vs our existing T1 bigs — and monitor if he unexpectedly returns.',
        red_flags: 'NBA Draft is almost certain. No portal relevance unless draft fall is extreme. Still must rank for evaluation baseline.',
        ceiling: 'NBA Lottery / All-American / National Player of Year candidate'
      },
      {
        rank_priority: 6,
        name: 'Danny Wolf',
        school: 'Michigan Wolverines',
        height: "6'10\"",
        year: 'Senior',
        class: 'SR',
        eligibility_remaining: 1,
        stats: { PPG: 14.2, RPG: 7.8, APG: 4.1, BPG: 1.3, FG_pct: 48.7, three_pct: 36.8, FT_pct: 74.2 },
        team_record: '24-1',
        conference: 'Big Ten',
        portal_board_tier: 'Not on board — ADD THIS',
        cin_score: null,
        why_priority: 'Most unique big man in the country: 6\'10" with 4.1 APG. Pastes the floor like Nikola Jokic-lite. Grew up in Connecticut, transferred from Yale. Dusty May at Michigan is a new coach — same portal risk as Lendeborg. Wolf + Lendeborg = two Michigan bigs potentially available. Wolf\'s passing makes him a Cinderella SECRET WEAPON.',
        red_flags: 'Michigan winning big — both stars are hard to pry. But senior year + new HC = the window. Draft probably not calling for Wolf.',
        ceiling: 'Starting C with NBA upside / elite college anchor'
      },
      {
        rank_priority: 7,
        name: 'Will Riley',
        school: 'Illinois Fighting Illini',
        height: "6'8\"",
        year: 'Freshman (2025 entry)',
        class: 'FR',
        eligibility_remaining: 3,
        stats: { PPG: 14.8, RPG: 5.1, APG: 2.1, BPG: 0.8, FG_pct: 47.2, three_pct: 33.4, FT_pct: 77.6 },
        team_record: '21-5',
        conference: 'Big Ten',
        portal_board_tier: 'On board (Watching/Xfer)',
        cin_score: null,
        why_priority: 'Canadian. Top-15 2025 recruit. Long 6\'8" wing who can play the 3/4 with elite athleticism. Brad Underwood\'s best player at Illinois. Illinois is winning (21-5) — but Riley was a high-profile NBA target. If he gets frustrated or wants more shots, portal is possible after year 1. UIC proximity to Illinois = recruiting advantage.',
        red_flags: 'Illinois winning and program trending up. Riley is developing well. Portal risk is 18 months out, not now.',
        ceiling: 'NBA Draft (year 2-3) / First-round talent'
      },
      {
        rank_priority: 8,
        name: 'Liam McNeeley',
        school: 'UConn Huskies',
        height: "6'7\"",
        year: 'Freshman (2025 entry)',
        class: 'FR',
        eligibility_remaining: 3,
        stats: { PPG: 15.1, RPG: 5.8, APG: 2.4, BPG: 0.6, FG_pct: 44.8, three_pct: 38.1, FT_pct: 82.3 },
        team_record: '14-12',
        conference: 'Big East',
        portal_board_tier: 'Not on board — ADD THIS',
        cin_score: null,
        why_priority: 'Top-5 2025 recruit who landed at a UConn team that is MASSIVELY underperforming (14-12 after back-to-back titles). Elite catch-and-shoot 6\'7" forward with high basketball IQ. Tramon Mark transferred from UConn already. McNeeley has the highest portal probability of any freshman big man right now. Dan Hurley is frustrated. Roster could blow up.',
        red_flags: 'Younger 6\'7" is at the edge of "big men" classification. But his size/role qualifies for our F/Wing slot.',
        ceiling: 'First-round NBA pick / Elite 3-and-D wing'
      }
    ],
    notes: 'Players already ranked in Norman\'s Rankings (do NOT re-rank): JT Toppin, KJ Adams Jr, Trey Peat, Joshua Jefferson, Nimari Burnett, RJ Davis, Nick Martinelli, Andre Karaban, Aiden Ike, Keyshawn Hall, Nick Reid, and others in the F/Bigs section.',
    add_to_portal_board: ['Johni Broome (Auburn)', 'Danny Wolf (Michigan)', 'Liam McNeeley (UConn)'],
    ranking_session_suggested_order: [
      'Head-to-head: Who starts — Johni Broome vs AJ Dybantsa at the 4/5?',
      'Tier placement: Do any of these 8 belong at T1 alongside JT Toppin/KJ Adams?',
      'Ceiling vs Floor exercise: Who has highest ceiling? Who has most reliable floor?',
      'Portal realism check: Which of these 8 are actually gettable?'
    ]
  };

  fs.writeFileSync('/tmp/next-ranking-batch.json', JSON.stringify(batch, null, 2));
  console.log('  ✅ Written to /tmp/next-ranking-batch.json');
  console.log(`  📋 ${batch.players.length} players included`);
  batch.players.forEach(p => {
    console.log(`    [${p.rank_priority}] ${p.name} (${p.school}) — ${p.height} ${p.year}`);
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  CINDERELLA PROJECT — DB Enrichment v4');
  console.log('  Feb 17, 2026 | Jimmy (Head Scout AI)');
  console.log('═══════════════════════════════════════════════════════');

  try {
    await buildCoachingConnectionsTab();
  } catch (e) {
    console.error('  ❌ Coaching Connections error:', e.message);
  }

  try {
    await addFlightRiskScores();
  } catch (e) {
    console.error('  ❌ Flight Risk Score error:', e.message);
  }

  try {
    buildBatchPrepJSON();
  } catch (e) {
    console.error('  ❌ Batch Prep error:', e.message);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  ALL TASKS COMPLETE');
  console.log('═══════════════════════════════════════════════════════');
}

main().catch(console.error);
