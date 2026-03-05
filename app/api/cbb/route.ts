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

  // Parse criteria from dashboard - read actual values from the sheet
  // Row 4: Rank Diff - columns: C=RD Min, D=value, E=RD Max, F=value, G=Spread >=, H=value
  const rdRow = dashboard[3] || [];
  // Row 7: Pattern 5 - columns: C=Net >=, D=value, E=Net <, F=value, G=Spread >=, H=value
  const p5Row = dashboard[6] || [];
  // Row 8: Pattern 10 - columns: C=Net >=, D=value, E=Model <=, F=value, G=Spread >=, H=value
  const p10Row = dashboard[7] || [];
  // Row 9: Pattern 2 - columns: C=Net >=, D=value, E=Net <, F=value, G=Spread >=, H=value
  const p2Row = dashboard[8] || [];
  // Row 10: Pattern 9 - columns: E=Net <, F=value, G=Spread >=, H=value
  const p9Row = dashboard[9] || [];
  // Row 11: Pattern 3 - columns: E=Model <=, F=value, G=Spread >=, H=value
  const p3Row = dashboard[10] || [];
  // Row 12: Pattern 8 - columns: E=Model <=, F=value, G=Spread >=, H=value
  const p8Row = dashboard[11] || [];
  // Row 13: Pattern 4 - columns: E=Model <=, F=value, G=Spread >=, H=value
  const p4Row = dashboard[12] || [];
  // Row 14: Pattern 6 - columns: E=Model <=, F=value, G=Spread >=, H=value
  const p6Row = dashboard[13] || [];
  // Row 15: Pattern 1 - columns: E=Model <=, F=value, G=Spread >=, H=value
  const p1Row = dashboard[14] || [];

  const criteria = {
    // Rank Diff criteria
    rdMin: parseFloat(rdRow[3]) || -5,
    rdMax: parseFloat(rdRow[5]) || 5,
    rdSpread: parseFloat(rdRow[7]) || 0,
    // Pattern 5: Net[0,15), Spread>=X
    p5NetMin: parseFloat(p5Row[3]) || 0,
    p5NetMax: parseFloat(p5Row[5]) || 15,
    p5Spread: parseFloat(p5Row[7]) || 11,
    // Pattern 10: Model<=0, Spread>=10, Net>=10
    p10NetMin: parseFloat(p10Row[3]) || 10,
    p10Model: parseFloat(p10Row[5]) || 0,
    p10Spread: parseFloat(p10Row[7]) || 10,
    // Pattern 2: Net[10,15), Spread>=14
    p2NetMin: parseFloat(p2Row[3]) || 10,
    p2NetMax: parseFloat(p2Row[5]) || 15,
    p2Spread: parseFloat(p2Row[7]) || 14,
    // Pattern 9: Spread>=14, Net<20
    p9NetMax: parseFloat(p9Row[5]) || 20,
    p9Spread: parseFloat(p9Row[7]) || 14,
    // Pattern 3: Model<=0, Spread>=14
    p3Model: parseFloat(p3Row[5]) || 0,
    p3Spread: parseFloat(p3Row[7]) || 14,
    // Pattern 8: Model<=0, Spread>=10
    p8Model: parseFloat(p8Row[5]) || 0,
    p8Spread: parseFloat(p8Row[7]) || 10,
    // Pattern 4: Model<=-1, Spread>=14
    p4Model: parseFloat(p4Row[5]) || -1,
    p4Spread: parseFloat(p4Row[7]) || 14,
    // Pattern 6: Model<=-5, Spread>=7
    p6Model: parseFloat(p6Row[5]) || -5,
    p6Spread: parseFloat(p6Row[7]) || 7,
    // Pattern 1: Model<=0, Spread>=18
    p1Model: parseFloat(p1Row[5]) || 0,
    p1Spread: parseFloat(p1Row[7]) || 18,
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
