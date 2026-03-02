import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY || 'http://localhost:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';
const SHEET_ID = '1434MZVRl65IRlNNk6XlKY7_mCbZzDqWANOqjS5AU22Y';
const TOKEN_PATH = '/Users/normandesilva/.config/google/token_norman_desilva_gmail_com.json';

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
      // Fetch all data from the sheet
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'sync') {
      // Run cbb_sync.sh via OpenClaw gateway
      const command = 'cd /Users/normandesilva/openclaw/openclaw/skills/cbb-scraper && bash cbb_sync.sh 2>&1 | grep -v "FutureWarning\\|NotOpenSSLWarning\\|warnings.warn\\|google-auth"';
      
      const response = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'exec',
          args: {
            command: command,
            timeout: 120
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Gateway error: ${response.status}`, details: errorText },
          { status: 500 }
        );
      }

      const data = await response.json();
      return NextResponse.json({
        success: true,
        output: data.result?.stdout || 'Sync completed',
        error: data.result?.stderr
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
  // Use exec to run a Python script that fetches the data
  const pythonScript = `
import json
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

TOKEN_PATH = '${TOKEN_PATH}'
SHEET_ID = '${SHEET_ID}'

with open(TOKEN_PATH, 'r') as f:
    token_data = json.load(f)

creds = Credentials(
    token=token_data['access_token'],
    refresh_token=token_data.get('refresh_token'),
    token_uri='https://oauth2.googleapis.com/token',
    client_id=token_data.get('client_id'),
    client_secret=token_data.get('client_secret')
)

service = build('sheets', 'v4', credentials=creds)

# Get dashboard (rows 1-20)
dashboard = service.spreadsheets().values().get(
    spreadsheetId=SHEET_ID,
    range='Analysis!A1:N20',
    valueRenderOption='FORMATTED_VALUE'
).execute().get('values', [])

# Get all game data (rows 21+)
games = service.spreadsheets().values().get(
    spreadsheetId=SHEET_ID,
    range='Analysis!A21:O5000',
    valueRenderOption='FORMATTED_VALUE'
).execute().get('values', [])

print(json.dumps({'dashboard': dashboard, 'games': games}))
`;

  const command = `/usr/bin/python3 -c "${pythonScript.replace(/"/g, '\\"').replace(/\n/g, '\\n')}" 2>/dev/null`;

  const response = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      tool: 'exec',
      args: {
        command: command,
        timeout: 30
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Gateway error: ${response.status}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  const stdout = data.result?.stdout || '{}';
  const result = JSON.parse(stdout);
  
  // Parse dashboard data into pattern stats
  const patterns = PATTERNS.map(p => {
    const row = result.dashboard[p.row - 1] || [];
    return {
      ...p,
      wins: parseInt(row[9]) || 0,
      losses: parseInt(row[10]) || 0,
      winPct: parseFloat(row[11]) || 0,
      roi: parseFloat(row[12]) || 0,
      sample: parseInt(row[13]) || 0,
    };
  });

  // Parse game data
  const today = new Date();
  const todayStr = `${today.getMonth() + 1}/${today.getDate()}`;
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = `${tomorrow.getMonth() + 1}/${tomorrow.getDate()}`;

  const games = (result.games || []).map((row: string[], idx: number) => ({
    id: idx,
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

  // Get dashboard criteria for pattern matching
  const dashboardData = result.dashboard || [];
  const criteria = {
    rdMin: parseFloat(dashboardData[3]?.[1]) || -6,
    rdMax: parseFloat(dashboardData[3]?.[3]) || 6,
    rdSpread: parseFloat(dashboardData[3]?.[5]) || 0,
    // Add more criteria as needed
  };

  return {
    patterns,
    games,
    todayGames: games.filter((g: any) => g.date === todayStr),
    tomorrowGames: games.filter((g: any) => g.date === tomorrowStr),
    criteria,
    todayStr,
    tomorrowStr,
  };
}
