/**
 * BUILD TRANSFER INDEX (v2 - Name-based matching)
 * 
 * ESPN often gives new IDs when players transfer.
 * This script does BOTH:
 *   1. ID-based matching (exact, but misses many transfers)
 *   2. Name-based matching (catches more, may have false positives)
 * 
 * Output: /tmp/transfer-index.json
 */

const fs = require('fs');

const SEASONS = [2022, 2023, 2024, 2025, 2026];
const teamLookup = JSON.parse(fs.readFileSync('/tmp/team-lookup-full.json', 'utf8'));

function getTeamName(teamId, fallback) {
  const t = teamLookup[teamId];
  if (t && t.fullName) return t.fullName;
  if (t) return `${t.teamName} (${t.teamShortName})`;
  return fallback || `Team#${teamId}`;
}

function normName(name) {
  return (name || '')
    .toLowerCase()
    .replace(/\./g, '').replace(/'/g, '').replace(/'/g, '')
    .replace(/\s+(jr|sr|ii|iii|iv|v)\s*$/i, '')
    .replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

console.log('📚 Loading seasons...');
const seasonMaps = {};  // season → Map(id → playerEntry)
const seasonNameMaps = {}; // season → Map(normName → [playerEntry])

for (const season of SEASONS) {
  const data = JSON.parse(fs.readFileSync(`/tmp/season-${season}-stats.json`, 'utf8'));
  const idMap = new Map();
  const nameMap = new Map();
  
  for (const p of data.players) {
    if (p.id) idMap.set(p.id, { ...p, season });
    const nn = normName(p.name);
    if (nn) {
      if (!nameMap.has(nn)) nameMap.set(nn, []);
      nameMap.get(nn).push({ ...p, season });
    }
  }
  seasonMaps[season] = idMap;
  seasonNameMaps[season] = nameMap;
  console.log(`  ${season}: ${data.players.length} players loaded`);
}

// ─── Phase 1: ID-based player tracking ────────────────────────────────────────
console.log('\n🔗 Phase 1: ID-based cross-season matching...');
const idPlayerIndex = {};

for (const season of SEASONS) {
  for (const [id, p] of seasonMaps[season]) {
    if (!idPlayerIndex[id]) {
      idPlayerIndex[id] = { id, name: p.name, position: p.position, seasons: [] };
    }
    idPlayerIndex[id].name = p.name; // most recent
    idPlayerIndex[id].seasons.push({
      season, teamId: p.teamId, teamName: getTeamName(p.teamId, p.teamName),
      teamShortName: p.teamShortName, stats: p.stats,
    });
  }
}

const idPlayers = Object.values(idPlayerIndex);
console.log(`  Unique ID-tracked athletes: ${idPlayers.length}`);

// ─── Phase 2: Name-based transfer detection ────────────────────────────────────
console.log('\n🔗 Phase 2: Name-based transfer detection...');
const nameTransfers = [];
const processedNames = new Set();

for (const season of SEASONS.slice(1)) {  // start from 2nd season
  const prevSeason = SEASONS[SEASONS.indexOf(season) - 1];
  const currMap = seasonNameMaps[season];
  const prevMap = seasonNameMaps[prevSeason];
  
  for (const [nn, currEntries] of currMap) {
    if (!prevMap.has(nn)) continue;  // not in previous season, skip
    const prevEntries = prevMap.get(nn);
    
    // Disambiguate: if multiple players with same name, skip
    if (currEntries.length > 1 || prevEntries.length > 1) continue;
    
    const curr = currEntries[0];
    const prev = prevEntries[0];
    
    // Same team → not a transfer
    if (curr.teamId === prev.teamId) continue;
    if (!curr.teamId || !prev.teamId) continue;
    
    const key = `${nn}|${prevSeason}→${season}`;
    if (processedNames.has(key)) continue;
    processedNames.add(key);
    
    // Build stat delta
    const keyStats = [
      'avgPoints', 'avgRebounds', 'avgAssists', 'avgMinutes',
      'fieldGoalPct', 'threePointFieldGoalPct', 'freeThrowPct',
      'gamesPlayed', 'PER',
    ];
    const statDelta = {};
    for (const stat of keyStats) {
      const bef = prev.stats?.[stat];
      const aft = curr.stats?.[stat];
      if (bef != null && aft != null) {
        statDelta[stat] = {
          before: parseFloat((bef || 0).toFixed(2)),
          after: parseFloat((aft || 0).toFixed(2)),
          delta: parseFloat((aft - bef).toFixed(2)),
        };
      }
    }
    
    nameTransfers.push({
      id: curr.id !== prev.id ? `${prev.id}→${curr.id}` : curr.id,
      prevId: prev.id,
      currId: curr.id,
      name: curr.name || prev.name,
      position: curr.position || prev.position,
      fromSeason: prevSeason,
      toSeason: season,
      fromTeam: getTeamName(prev.teamId, prev.teamName),
      fromTeamId: prev.teamId,
      fromTeamShort: prev.teamShortName,
      toTeam: getTeamName(curr.teamId, curr.teamName),
      toTeamId: curr.teamId,
      toTeamShort: curr.teamShortName,
      statDelta,
      idMatch: curr.id === prev.id ? 'same_id' : 'name_matched',
    });
  }
}

console.log(`  Name-based transfers detected: ${nameTransfers.length}`);

// ─── Combine and deduplicate ───────────────────────────────────────────────────
// Remove name-transfers that are already ID-matched
const idTransferKeys = new Set();
for (const p of idPlayers) {
  const sorted = p.seasons.sort((a, b) => a.season - b.season);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].teamId !== sorted[i-1].teamId) {
      idTransferKeys.add(`${normName(p.name)}|${sorted[i-1].season}→${sorted[i].season}`);
    }
  }
}

const uniqueNameTransfers = nameTransfers.filter(t => {
  const key = `${normName(t.name)}|${t.fromSeason}→${t.toSeason}`;
  return !idTransferKeys.has(key);
});

const allTransfers = [...nameTransfers]; // name-based already includes ID-matches since we check team change
console.log(`  Unique transfers (combined): ${allTransfers.length}`);

// ─── Analysis ──────────────────────────────────────────────────────────────────
const withPtsData = allTransfers.filter(t => t.statDelta.avgPoints);
if (withPtsData.length > 0) {
  const avgDelta = withPtsData.reduce((s, t) => s + t.statDelta.avgPoints.delta, 0) / withPtsData.length;
  const improved = withPtsData.filter(t => t.statDelta.avgPoints.delta > 1).length;
  const declined = withPtsData.filter(t => t.statDelta.avgPoints.delta < -1).length;
  const neutral = withPtsData.length - improved - declined;
  
  console.log(`\n📊 Transfer Outcomes (${withPtsData.length} with scoring data):`);
  console.log(`  Avg points change: ${avgDelta.toFixed(2)} PPG`);
  console.log(`  Improved (+1+ PPG): ${improved} (${(improved/withPtsData.length*100).toFixed(1)}%)`);
  console.log(`  Declined (-1+ PPG): ${declined} (${(declined/withPtsData.length*100).toFixed(1)}%)`);
  console.log(`  Neutral (±1 PPG):   ${neutral} (${(neutral/withPtsData.length*100).toFixed(1)}%)`);

  // Top gainers
  const topGainers = [...withPtsData]
    .sort((a, b) => b.statDelta.avgPoints.delta - a.statDelta.avgPoints.delta)
    .slice(0, 15);
  console.log(`\n🔝 Top scoring gains post-transfer:`);
  topGainers.forEach(t => {
    const d = t.statDelta.avgPoints;
    console.log(`  ${t.name}: ${d.before}→${d.after} (+${d.delta}) | ${t.fromTeamShort}→${t.toTeamShort} | ${t.fromSeason}→${t.toSeason}`);
  });
}

// ─── Build career arcs for all ID-tracked multi-season players ─────────────────
console.log('\n📈 Building career arcs...');
const careerArcs = idPlayers
  .filter(p => p.seasons.length >= 2)
  .map(player => {
    const sorted = player.seasons.sort((a, b) => a.season - b.season);
    const transfers = [];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].teamId !== sorted[i-1].teamId && sorted[i].teamId && sorted[i-1].teamId) {
        transfers.push({ fromSeason: sorted[i-1].season, toSeason: sorted[i].season, fromTeam: sorted[i-1].teamName, toTeam: sorted[i].teamName });
      }
    }
    const first = sorted[0];
    const last = sorted[sorted.length - 1];
    return {
      id: player.id,
      name: player.name,
      position: player.position,
      numSeasons: sorted.length,
      firstSeason: first.season,
      lastSeason: last.season,
      currentTeam: last.teamName,
      currentTeamId: last.teamId,
      idTransfers: transfers.length,
      trajectory: sorted.length >= 2 && first.stats.avgPoints != null ? {
        ptsBefore: parseFloat((first.stats.avgPoints || 0).toFixed(2)),
        ptsAfter: parseFloat((last.stats.avgPoints || 0).toFixed(2)),
        ptsDelta: parseFloat(((last.stats.avgPoints || 0) - (first.stats.avgPoints || 0)).toFixed(2)),
      } : null,
      seasons: sorted.map(s => ({
        season: s.season, teamShort: s.teamShortName, teamId: s.teamId,
        gp: s.stats.gamesPlayed,
        pts: parseFloat((s.stats.avgPoints || 0).toFixed(2)),
        reb: parseFloat((s.stats.avgRebounds || 0).toFixed(2)),
        ast: parseFloat((s.stats.avgAssists || 0).toFixed(2)),
        fgPct: parseFloat((s.stats.fieldGoalPct || 0).toFixed(1)),
        threePct: parseFloat((s.stats.threePointFieldGoalPct || 0).toFixed(1)),
        min: parseFloat((s.stats.avgMinutes || 0).toFixed(1)),
      })),
    };
  })
  .sort((a, b) => b.numSeasons - a.numSeasons || b.lastSeason - a.lastSeason);

// ─── Save ──────────────────────────────────────────────────────────────────────
console.log('\n💾 Saving...');

const output = {
  generatedAt: new Date().toISOString(),
  methodology: {
    idBased: 'Players tracked by ESPN athlete ID (same ID = same player)',
    nameBased: 'Additional transfers detected by normalized name matching across consecutive seasons',
    note: 'ESPN often assigns new IDs when players transfer, so name-based matching catches more'
  },
  stats: {
    totalUniqueAthletes: idPlayers.length,
    multiSeasonAthletes: idPlayers.filter(p => p.seasons.length >= 2).length,
    totalTransfersDetected: allTransfers.length,
    idMatchedTransfers: nameTransfers.filter(t => t.idMatch === 'same_id').length,
    nameMatchedTransfers: nameTransfers.filter(t => t.idMatch === 'name_matched').length,
    seasons: SEASONS,
  },
  transfers: allTransfers.sort((a, b) => a.fromSeason - b.fromSeason),
  careerArcs,
};

fs.writeFileSync('/tmp/transfer-index.json', JSON.stringify(output, null, 2));
const sz = fs.statSync('/tmp/transfer-index.json').size;
console.log(`  ✅ /tmp/transfer-index.json (${(sz/1024/1024).toFixed(1)} MB)`);

// Lighter summary
const summary = {
  generatedAt: output.generatedAt,
  stats: output.stats,
  topTransfers: allTransfers
    .filter(t => t.statDelta.avgPoints)
    .sort((a, b) => (b.statDelta.avgPoints?.delta || 0) - (a.statDelta.avgPoints?.delta || 0))
    .slice(0, 300),
  multiSeasonPlayers: careerArcs.filter(p => p.numSeasons >= 3).slice(0, 1000),
};
fs.writeFileSync('/tmp/transfer-summary.json', JSON.stringify(summary, null, 2));
console.log(`  ✅ /tmp/transfer-summary.json`);

console.log('\n🎉 COMPLETE!');
console.log(`  ${idPlayers.length} unique athletes`);
console.log(`  ${careerArcs.length} multi-season career arcs`);
console.log(`  ${allTransfers.length} total transfer events`);
