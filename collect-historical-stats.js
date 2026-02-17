/**
 * HISTORICAL STATS COLLECTION
 * 
 * Fetches ESPN stats for seasons 2022-2026 (2021-22 through 2025-26)
 * Saves each season to /tmp/season-YYYY-stats.json
 * 
 * API pagination: j.pagination.pages, j.pagination.count
 * Category names: top-level j.categories[i].names
 * Athlete stat values: athlete.categories[i].values
 */

const https = require('https');
const fs = require('fs');

const SEASONS = [2022, 2023, 2024, 2025, 2026];
const BASE_URL = 'https://site.web.api.espn.com/apis/common/v3/sports/basketball/mens-college-basketball/statistics/byathlete';
const LIMIT = 500;
const DELAY_MS = 600;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetchPage(season, page) {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}?season=${season}&seasontype=2&limit=${LIMIT}&page=${page}`;
    const req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
      timeout: 30000,
    }, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }
      let data = '';
      res.on('data', d => data += d);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse: ${e.message}`)); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function parseAthletes(data, topCategories) {
  const athletes = data.athletes || [];
  return athletes.map(entry => {
    const a = entry.athlete || {};
    
    // Build stats object by merging category names + values
    const stats = {};
    const cats = entry.categories || [];
    
    cats.forEach((cat, ci) => {
      const topCat = topCategories[ci] || {};
      const names = topCat.names || [];
      const values = cat.values || cat.totals || [];
      
      names.forEach((name, ni) => {
        if (name && values[ni] !== undefined) {
          stats[name] = values[ni];
        }
      });
    });
    
    // Team info is directly on athlete (not nested)
    // a.teamName = mascot name ("Deacons"), a.teamShortName = abbrev ("BFC"), a.teamId = "2854"
    // a.teams may be an array of team links
    
    return {
      id: a.id,
      name: a.displayName || [a.firstName, a.lastName].filter(Boolean).join(' '),
      firstName: a.firstName,
      lastName: a.lastName,
      position: a.position?.abbreviation || '',
      teamName: a.teamName || '',       // mascot name
      teamShortName: a.teamShortName || '', // abbreviation  
      teamId: a.teamId || '',           // ESPN team ID
      year: a.experience?.displayValue || a.eligibility?.displayValue || '',
      slug: a.slug || '',
      stats,
    };
  });
}

async function collectSeason(season) {
  const outputFile = `/tmp/season-${season}-stats.json`;
  
  // Skip if already collected and substantial
  if (fs.existsSync(outputFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(outputFile, 'utf8'));
      if (existing.players && existing.players.length > 1000) {
        console.log(`  ⏭️  Season ${season}: Already have ${existing.players.length} players → skipping`);
        return existing.players.length;
      }
    } catch (e) { /* re-fetch */ }
  }
  
  console.log(`\n📅 Season ${season} (${season-1}-${String(season).slice(2)})...`);
  
  let allPlayers = [];
  let topCategories = [];
  let totalPages = 1;
  let totalCount = 0;
  
  for (let page = 1; page <= totalPages; page++) {
    let data;
    try {
      process.stdout.write(`  p${page}/${totalPages}... `);
      data = await fetchPage(season, page);
    } catch (err) {
      console.log(`❌ ${err.message}`);
      if (err.message.includes('404') || err.message.includes('400') || err.message.includes('403')) {
        console.log(`  Season ${season} unavailable, skipping`);
        return 0;
      }
      await sleep(3000);
      try {
        data = await fetchPage(season, page);
      } catch (e2) {
        console.log(`  Retry failed: ${e2.message}`);
        break;
      }
    }
    
    // First page: set up pagination + category structure
    if (page === 1) {
      const pag = data.pagination || {};
      totalCount = pag.count || 0;
      totalPages = pag.pages || 1;
      topCategories = data.categories || [];
      console.log(`total=${totalCount}, pages=${totalPages}`);
    }
    
    const parsed = parseAthletes(data, topCategories);
    allPlayers = allPlayers.concat(parsed);
    process.stdout.write(`✅ +${parsed.length} (${allPlayers.length})\n`);
    
    if (page < totalPages) await sleep(DELAY_MS);
  }
  
  const result = {
    season,
    seasonLabel: `${season-1}-${String(season).slice(2)}`,
    fetchedAt: new Date().toISOString(),
    totalPlayers: allPlayers.length,
    categorySchema: (topCategories || []).map(c => ({ name: c.name, names: c.names, displayNames: c.displayNames })),
    players: allPlayers,
  };
  
  fs.writeFileSync(outputFile, JSON.stringify(result, null, 2));
  console.log(`  💾 ${allPlayers.length} players saved → ${outputFile}`);
  return allPlayers.length;
}

async function main() {
  console.log('🏀 HISTORICAL STATS COLLECTION');
  console.log(`Seasons: ${SEASONS.join(', ')}\n`);
  
  const results = {};
  for (const season of SEASONS) {
    results[season] = await collectSeason(season);
    if (season < SEASONS[SEASONS.length - 1]) await sleep(1200);
  }
  
  console.log('\n\n📊 SUMMARY:');
  let total = 0;
  for (const [s, n] of Object.entries(results)) {
    console.log(`  ${s}: ${n.toLocaleString()} players`);
    total += n;
  }
  console.log(`  TOTAL: ${total.toLocaleString()} player-seasons`);
  
  fs.writeFileSync('/tmp/historical-stats-summary.json', JSON.stringify({
    collectedAt: new Date().toISOString(),
    seasons: results,
    totalPlayerSeasons: total,
  }, null, 2));
  console.log('\n✅ Done! /tmp/historical-stats-summary.json');
}

main().catch(err => {
  console.error('❌ Fatal:', err.message);
  process.exit(1);
});
