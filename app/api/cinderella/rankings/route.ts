import { getCinderellaAuth } from '@/lib/cinderella-auth';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';



interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache: { rankings?: CacheEntry } = {};
const CACHE_TTL_MS = 15 * 60 * 1000;


interface PlayerRanking {
  tier: string;
  name: string;
  school: string;
  pos: string;
  yr: string;
  bestBatchRank: string;
  exercise: string;
  scoutNotes: string;
  section: string;
  isRedFlag: boolean;
}

function parseRankingRows(rows: any[][]): PlayerRanking[] {
  const players: PlayerRanking[] = [];
  let currentSection = 'Guards';

  for (const row of rows) {
    if (!row || row.length === 0) continue;
    const first = row[0] || '';

    // Section headers
    if (first.includes('GUARDS') && first.includes('──')) {
      currentSection = 'Guards';
      continue;
    }
    if (first.includes('FORWARDS') && first.includes('──')) {
      currentSection = 'Forwards';
      continue;
    }
    if (first.includes('LEGEND') && first.includes('──')) break;

    // Skip meta/header rows
    if (
      first === 'MASTER TIER' ||
      first.startsWith('CINDERELLA') ||
      first.startsWith('Compiled') ||
      first === '' ||
      !first
    )
      continue;

    // Valid player rows start with recognized tiers
    const validTiers = ['T1', 'T2', 'T3', 'T4-RF', 'T4', 'NR'];
    if (!validTiers.some((t) => first === t || first.startsWith(t + ' '))) continue;

    players.push({
      tier: row[0] || '',
      name: row[1] || '',
      school: row[2] || '',
      pos: row[3] || '',
      yr: row[4] || '',
      bestBatchRank: row[5] || '',
      exercise: row[6] || '',
      scoutNotes: row[7] || '',
      section: currentSection,
      isRedFlag: (row[0] || '').includes('RF'),
    });
  }

  return players;
}

export async function GET() {
  try {
    const now = Date.now();
    if (cache.rankings && now - cache.rankings.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cache.rankings.data, { headers: { 'X-Cache': 'HIT' } });
    }

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch Norman's Rankings (guards + forwards)
    const mainResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: "Norman's Rankings!A1:H200",
    });
    const mainRows = mainResponse.data.values || [];
    const mainPlayers = parseRankingRows(mainRows);

    // Try to fetch Big Men Rankings tab (may not exist)
    let bigMen: PlayerRanking[] = [];
    try {
      const bigMenResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
        range: "Big Men Rankings!A1:H100",
      });
      const bigMenRows = bigMenResponse.data.values || [];
      // Parse big men — all rows in this tab are treated as the same section
      for (const row of bigMenRows) {
        if (!row || row.length === 0) continue;
        const first = row[0] || '';
        if (first === 'MASTER TIER' || first === '' || !first) continue;
        const validTiers = ['T1', 'T2', 'T3', 'T4-RF', 'T4', 'NR'];
        if (!validTiers.some((t) => first === t || first.startsWith(t + ' '))) continue;
        bigMen.push({
          tier: row[0] || '',
          name: row[1] || '',
          school: row[2] || '',
          pos: row[3] || '',
          yr: row[4] || '',
          bestBatchRank: row[5] || '',
          exercise: row[6] || '',
          scoutNotes: row[7] || '',
          section: 'BigMen',
          isRedFlag: (row[0] || '').includes('RF'),
        });
      }
    } catch {
      // Tab doesn't exist or read error — silently skip
      bigMen = [];
    }

    const result = {
      guards: mainPlayers.filter((p) => p.section === 'Guards'),
      forwards: mainPlayers.filter((p) => p.section === 'Forwards'),
      bigMen,
    };

    cache.rankings = { data: result, timestamp: now };
    return NextResponse.json(result, { headers: { 'X-Cache': 'MISS' } });
  } catch (error: any) {
    console.error('Rankings API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
