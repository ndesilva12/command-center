import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getCinderellaAuth } from '@/lib/cinderella-auth';

const SHEET_ID = '1434MZVRl65IRlNNk6XlKY7_mCbZzDqWANOqjS5AU22Y';

// Pattern definitions matching the dashboard
const PATTERNS = [
  { id: 'rank_diff', name: 'Rank Diff', row: 4, color: '#d8ebd3' },
  { id: 'pattern_1', name: 'Model≤0, Spread≥18', row: 7, color: '#fff2cc' },
  { id: 'pattern_2', name: 'Net[10,15), Spread≥14', row: 8, color: '#d9eaf7' },
  { id: 'pattern_3', name: 'Model≤0, Spread≥14', row: 9, color: '#f4e0e0' },
  { id: 'pattern_4', name: 'Model≤-1, Spread≥14', row: 10, color: '#eae0f4' },
  { id: 'pattern_5', name: 'Net[0,15), Spread≥14', row: 11, color: '#ffe5cc' },
  { id: 'pattern_6', name: 'Model≤-5, Spread≥7', row: 12, color: '#e0f4e0' },
  { id: 'pattern_8', name: 'Model≤0, Spread≥10', row: 13, color: '#cce5ff' },
  { id: 'pattern_9', name: 'Spread≥14, Net<20', row: 14, color: '#f4f4cc' },
  { id: 'pattern_10', name: 'Model≤0, Spread≥10, Net≥10', row: 15, color: '#e0eaf4' },
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'data';

  try {
    if (action === 'data') {
      const data = await fetchSheetData();
      return NextResponse.json(data);
    } else if (action === 'status') {
      return NextResponse.json({ status: 'CBB API ready', patterns: PATTERNS.length });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('CBB API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY || 'http://localhost:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'sync') {
      // Can't reach local gateway from Vercel - tell user to ask Jimmy
      return NextResponse.json({
        success: true,
        message: '📨 Tell Jimmy: "cbb sync" in Telegram to run the sync.'
      });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('CBB API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

async function fetchSheetData() {
  const auth = await getCinderellaAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Get dashboard (rows 1-20)
  const dashboardResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Analysis!A1:N20',
  });
  const dashboard = dashboardResponse.data.values || [];

  // Get all game data (rows 21+)
  const gamesResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Analysis!A21:O5000',
  });
  const gamesRaw = gamesResponse.data.values || [];

  // Parse dashboard data into pattern stats
  const patterns = PATTERNS.map(p => {
    const row = dashboard[p.row - 1] || [];
    return {
      ...p,
      wins: parseFloat(row[9]) || 0,
      losses: parseFloat(row[10]) || 0,
      winPct: parseFloat(row[11]) || 0,
      roi: parseFloat(row[12]) || 0,
      sample: parseFloat(row[13]) || 0,
    };
  });

  // Parse criteria from dashboard row 4
  const criteriaRow = dashboard[3] || [];
  const criteria = {
    rdMin: parseFloat(criteriaRow[1]) || -6,
    rdMax: parseFloat(criteriaRow[3]) || 6,
    rdSpread: parseFloat(criteriaRow[5]) || 0,
  };

  // Parse game data - use Eastern Time for date calculations
  const nowET = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));
  const todayStr = `${nowET.getMonth() + 1}/${nowET.getDate()}`;
  const tomorrow = new Date(nowET);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getMonth() + 1}/${tomorrow.getDate()}`;
  const yesterday = new Date(nowET);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getMonth() + 1}/${yesterday.getDate()}`;

  const games = gamesRaw.map((row: string[], idx: number) => ({
    id: idx,
    row: 21 + idx,  // Actual sheet row number (data starts at row 21)
    team: row[0] || '',
    spread: parseFloat(row[1]) || 0,
    model: parseFloat(row[2]) || 0,
    net: parseFloat(row[3]) || 0,
    rankDiff: parseFloat(row[4]) || 0,
    avgRank: parseFloat(row[5]) || 0,
    offRank: parseFloat(row[6]) || 0,
    defRank: parseFloat(row[7]) || 0,
    netRating: parseFloat(row[8]) || 0,
    oppNetRating: parseFloat(row[9]) || 0,
    final: row[10] || '',
    finalScore: row[11] || '',
    margin: parseFloat(row[12]) || 0,
    ats: row[13] || '',
    date: row[14] || '',
  }));

  const yesterdayGames = games.filter((g: any) => g.date === yesterdayStr);
  const todayGames = games.filter((g: any) => g.date === todayStr);
  const tomorrowGames = games.filter((g: any) => g.date === tomorrowStr);

  return {
    patterns,
    games,
    yesterdayGames,
    todayGames,
    tomorrowGames,
    criteria,
    yesterdayStr,
    todayStr,
    tomorrowStr,
  };
}
