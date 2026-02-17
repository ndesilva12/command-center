const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

async function main() {
  const board = JSON.parse(fs.readFileSync('/tmp/portal-board-live.json', 'utf8'));
  const { header, rows } = board;

  // Map column names to indices
  const colMap = {};
  header.forEach((h, i) => { colMap[h] = i; });
  console.log('Columns mapped:', JSON.stringify(colMap, null, 2));

  // Filter out section header rows (rows where col A is a section label not T1/T2/etc.)
  const SECTION_LABELS = ['T4 - NEW TARGETS (Recommend Review)', 'T5 - HOOPSHQ WATCHLIST (Feb 10 2026)', 'T3 - HIGH-MAJOR EXPANSION'];
  const playerRows = rows.filter(r => !SECTION_LABELS.includes(r[0]) && r[1] && r[1].trim() !== '');
  console.log(`\nPlayer rows: ${playerRows.length} (filtered from ${rows.length})`);

  // --- CINDERELLA SCORE FORMULA AUDIT ---
  console.log('\n=== CINDERELLA SCORE FORMULA AUDIT ===');
  // Pick 10 "random" spread rows
  const sampleIndices = [0, 15, 30, 50, 65, 80, 95, 110, 125, 140];
  const auditResults = [];

  for (const idx of sampleIndices) {
    const row = rows[idx];
    if (!row || SECTION_LABELS.includes(row[0])) continue;

    const player = row[colMap['Player']] || 'Unknown';
    const tier = row[colMap['Tier']] || '';
    const cinScore = parseFloat(row[colMap['Cin. Score']]) || 0;
    const flightRisk = parseFloat(row[colMap['Flight Risk Score']]) || 0;
    const netAdj = row[colMap['Net Adj.Rtg']] || '';
    const confTier = row[colMap['Conf Tier']] || '';
    const teamRecord = row[colMap['Team Record']] || '';
    const grade = parseFloat(row[colMap['Grade (20-80)']]) || 0;
    const portalTarget = row[colMap['Portal Target']] || '';

    // Expected score formula components:
    // Higher Flight Risk = higher Cin Score
    // Higher conference tier = lower Cin Score (P6 players are less "cinderella")
    // Better Net Adj Rtg = higher Cin Score
    // Better grade = higher Cin Score
    // T1/T2 players should have higher Cin Score than T3

    let flagged = false;
    let flags = [];

    // Check: T1 player with low Cin Score
    if (tier === 'T1' && cinScore < 50) {
      flagged = true;
      flags.push(`T1 player with low Cin Score (${cinScore})`);
    }
    // Check: High Flight Risk with low Cin Score
    if (flightRisk >= 70 && cinScore < 60) {
      flagged = true;
      flags.push(`High FR (${flightRisk}) but low Cin Score (${cinScore})`);
    }
    // Check: Low Flight Risk with very high Cin Score
    if (flightRisk <= 20 && cinScore >= 90) {
      flagged = true;
      flags.push(`Low FR (${flightRisk}) but very high Cin Score (${cinScore})`);
    }
    // Check: P6 player with Cin Score >= 95 (suspiciously high)
    if (confTier === 'P6' && cinScore >= 95) {
      flagged = true;
      flags.push(`P6 player with Cin Score 95+ (${cinScore})`);
    }

    auditResults.push({
      rowIdx: idx,
      player,
      tier,
      cinScore,
      flightRisk,
      netAdj,
      confTier,
      grade,
      portalTarget,
      flagged,
      flags
    });
  }

  auditResults.forEach(r => {
    const status = r.flagged ? '⚠️ FLAGGED' : '✓ OK';
    console.log(`  ${status} | ${r.player} | Tier=${r.tier} | CinScore=${r.cinScore} | FR=${r.flightRisk} | NetAdj=${r.netAdj} | ConfTier=${r.confTier}`);
    if (r.flags.length > 0) r.flags.forEach(f => console.log(`    → ${f}`));
  });

  // --- SLEEPER CANDIDATES ---
  console.log('\n=== SLEEPER CANDIDATES (FR>=60, CinScore>=70, T3+) ===');
  const sleepers = [];
  playerRows.forEach((row, i) => {
    const tier = (row[colMap['Tier']] || '').trim();
    const cinScore = parseFloat(row[colMap['Cin. Score']]) || 0;
    const flightRisk = parseFloat(row[colMap['Flight Risk Score']]) || 0;
    const player = row[colMap['Player']] || '';
    const notes = row[colMap['Notes']] || '';

    // T3 or lower (T3, T4, T5 are lower tier)
    const isT3orLower = tier === 'T3' || tier === 'T4' || tier === 'T5';

    if (flightRisk >= 60 && cinScore >= 70 && isT3orLower) {
      // Check if already has Sleeper Flag
      const alreadyFlagged = notes.toLowerCase().includes('sleeper');
      sleepers.push({
        rowIdx: i + 2, // +2 for header + 0-index
        player,
        tier,
        cinScore,
        flightRisk,
        notes,
        alreadyFlagged
      });
    }
  });

  console.log(`Found ${sleepers.length} sleeper candidates:`);
  sleepers.forEach(s => {
    console.log(`  ${s.alreadyFlagged ? '[ALREADY FLAGGED]' : '[NEW]'} Row ${s.rowIdx}: ${s.player} | Tier=${s.tier} | CinScore=${s.cinScore} | FR=${s.flightRisk}`);
    console.log(`    Notes: ${s.notes.substring(0, 80)}`);
  });

  // --- CONFERENCE BREAKDOWN by TIER ---
  console.log('\n=== CONFERENCE BREAKDOWN BY TIER ===');
  const confBreakdown = {};
  playerRows.forEach(row => {
    const conf = (row[colMap['Conference']] || 'Unknown').trim();
    const confTier = (row[colMap['Conf Tier']] || 'Unknown').trim();
    const tier = (row[colMap['Tier']] || '').trim();
    const cinScore = parseFloat(row[colMap['Cin. Score']]) || 0;
    const player = row[colMap['Player']] || '';

    if (!confBreakdown[conf]) {
      confBreakdown[conf] = {
        conf, confTier,
        total: 0, T1: 0, T2: 0, T3: 0, T4: 0, T5: 0,
        cinScores: [], topPlayer: '', topScore: 0
      };
    }
    confBreakdown[conf].total++;
    if (tier === 'T1') confBreakdown[conf].T1++;
    else if (tier === 'T2') confBreakdown[conf].T2++;
    else if (tier === 'T3') confBreakdown[conf].T3++;
    else if (tier === 'T4') confBreakdown[conf].T4++;
    else if (tier === 'T5') confBreakdown[conf].T5++;
    confBreakdown[conf].cinScores.push(cinScore);
    if (cinScore > confBreakdown[conf].topScore) {
      confBreakdown[conf].topScore = cinScore;
      confBreakdown[conf].topPlayer = player;
    }
  });

  // Compute averages
  Object.values(confBreakdown).forEach(c => {
    c.avgCinScore = c.cinScores.length > 0
      ? Math.round(c.cinScores.reduce((a, b) => a + b, 0) / c.cinScores.length * 10) / 10
      : 0;
    delete c.cinScores;
  });

  console.log('Conference breakdown:');
  Object.values(confBreakdown)
    .sort((a, b) => b.total - a.total)
    .forEach(c => {
      console.log(`  ${c.conf} (${c.confTier}): total=${c.total} T1=${c.T1} T2=${c.T2} T3=${c.T3} avgCin=${c.avgCinScore} top="${c.topPlayer}" (${c.topScore})`);
    });

  // Check "est." values in Net Adj Rtg
  console.log('\n=== NET ADJ RTG - EST. VALUES ===');
  const estRows = playerRows.filter(row => {
    const val = (row[colMap['Net Adj.Rtg']] || '').toLowerCase();
    return val.startsWith('est.');
  });
  console.log(`Found ${estRows.length} rows with "est." Net Adj Rtg:`);
  estRows.forEach(r => {
    console.log(`  ${r[colMap['Player']]}: ${r[colMap['Net Adj.Rtg']]}`);
  });

  // Save analysis
  const analysis = {
    timestamp: new Date().toISOString(),
    totalPlayerRows: playerRows.length,
    auditResults,
    sleepers,
    confBreakdown,
    estNetAdjRows: estRows.map(r => ({
      player: r[colMap['Player']],
      netAdj: r[colMap['Net Adj.Rtg']],
      school: r[colMap['Current School']]
    }))
  };

  fs.writeFileSync('/tmp/v9-audit.json', JSON.stringify(analysis, null, 2));
  console.log('\nAnalysis saved to /tmp/v9-audit.json');
  
  return analysis;
}

main().catch(err => { console.error('Error:', err.message); if (err.response) console.error(JSON.stringify(err.response.data)); });
