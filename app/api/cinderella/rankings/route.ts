import { getCinderellaAuth } from '@/lib/cinderella-auth';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Cache disabled — always fetch fresh from Google Sheets

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
  rowIndex: number; // 1-based row index in the sheet for write-back
}

function parseRankingRows(rows: any[][], sectionLabel: string): PlayerRanking[] {
  const players: PlayerRanking[] = [];
  let currentSection = 'Guards';

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
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
      section: sectionLabel === 'BigMen' ? 'BigMen' : currentSection,
      isRedFlag: (row[0] || '').includes('RF'),
      rowIndex: i + 1, // 1-based
    });
  }

  return players;
}

export async function GET() {
  try {
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch Norman's Rankings (guards + forwards)
    const mainResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: "Norman's Rankings!A1:H200",
    });
    const mainRows = mainResponse.data.values || [];
    const mainPlayers = parseRankingRows(mainRows, 'Main');

    // Try to fetch Big Men Rankings tab (may not exist)
    let bigMen: PlayerRanking[] = [];
    try {
      const bigMenResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
        range: "Big Men Rankings!A1:H100",
      });
      const bigMenRows = bigMenResponse.data.values || [];
      bigMen = parseRankingRows(bigMenRows, 'BigMen');
    } catch {
      bigMen = [];
    }

    const result = {
      guards: mainPlayers.filter((p) => p.section === 'Guards'),
      forwards: mainPlayers.filter((p) => p.section === 'Forwards'),
      bigMen,
    };

    return NextResponse.json(result, {
      headers: {
        'X-Cache': 'MISS',
        'X-Synced-At': new Date().toISOString(),
        'Cache-Control': 'no-store',
      }
    });
  } catch (error: any) {
    console.error('Rankings API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/cinderella/rankings — reorder players by writing SortKey back
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { section, players } = body as {
      section: 'guards' | 'forwards' | 'bigMen';
      players: { name: string; rowIndex: number; newRank: number }[];
    };

    if (!section || !players || !Array.isArray(players)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetName = section === 'bigMen' ? 'Big Men Rankings' : "Norman's Rankings";

    // Write new rank (bestBatchRank = col F = index 5) for each player
    const data = players.map(p => ({
      range: `${sheetName}!F${p.rowIndex}`,
      values: [[String(p.newRank)]],
    }));

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      requestBody: {
        valueInputOption: 'RAW',
        data,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Rankings PUT error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
