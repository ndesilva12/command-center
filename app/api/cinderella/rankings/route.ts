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

// POST /api/cinderella/rankings — add a player to the Big Board
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { player, team, position, year, conference, ppg, rpg, apg, section, tier } = body;

    if (!player || !team || !position) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetName = "Norman's Rankings";

    // Get current data to find the right insertion point
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: `${sheetName}!A:H`,
    });
    const rows = response.data.values || [];

    // Find section start row (GUARDS or FORWARDS)
    const posGroup = ['G', 'PG', 'SG'].includes(position) ? 'GUARDS' : 'FORWARDS';
    let insertRow = rows.length + 1;
    
    for (let i = 0; i < rows.length; i++) {
      const first = (rows[i][0] || '').toString();
      if (posGroup === 'GUARDS' && first.includes('GUARDS') && first.includes('──')) {
        // Find the next section or end of guards
        for (let j = i + 1; j < rows.length; j++) {
          const check = (rows[j][0] || '').toString();
          if (check.includes('FORWARDS') && check.includes('──')) {
            insertRow = j + 1; // Insert before forwards section
            break;
          }
          if (check.includes('LEGEND')) {
            insertRow = j + 1;
            break;
          }
        }
        // If no forwards found, insert at end of current section
        if (insertRow === rows.length + 1) {
          for (let j = i + 1; j < rows.length; j++) {
            if (!rows[j][0] && !rows[j][1]) {
              insertRow = j + 1;
              break;
            }
          }
        }
        break;
      }
      if (posGroup === 'FORWARDS' && first.includes('FORWARDS') && first.includes('──')) {
        // Insert after the header
        for (let j = i + 1; j < rows.length; j++) {
          const check = (rows[j][0] || '').toString();
          if (check.includes('LEGEND') && check.includes('──')) {
            insertRow = j + 1;
            break;
          }
          if (!rows[j][0] && !rows[j][1]) {
            insertRow = j + 1;
            break;
          }
        }
        break;
      }
    }

    // Build the new row: Tier, Player, School, Pos, Year, Rank, Exercise, Notes
    const tierVal = tier || 'NR';
    const stats = [ppg, rpg, apg].filter(Boolean).join('/');
    const newRow = [tierVal, player, team, position, year || '', '', '', stats ? `Stats: ${stats}` : ''];

    // Append to the sheet
    await sheets.spreadsheets.values.append({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: `${sheetName}!A:H`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow],
      },
    });

    return NextResponse.json({ ok: true, player, section: posGroup });
  } catch (error: any) {
    console.error('Rankings POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/cinderella/rankings — clear all rankings (or remove specific player)
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get('player');
    const clearAll = searchParams.get('clearAll') === 'true';

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetName = "Norman's Rankings";

    if (clearAll) {
      // Get current data
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
        range: `${sheetName}!A:H`,
      });
      const rows = response.data.values || [];

      // Find all player rows (not headers) and clear them
      const validTiers = ['T1', 'T2', 'T3', 'T4-RF', 'T4', 'NR'];
      const clearRanges: string[] = [];
      
      for (let i = 0; i < rows.length; i++) {
        const first = (rows[i][0] || '').toString();
        if (validTiers.some(t => first === t || first.startsWith(t + ' '))) {
          clearRanges.push(`${sheetName}!A${i + 1}:H${i + 1}`);
        }
      }

      if (clearRanges.length > 0) {
        // Clear all player rows
        await sheets.spreadsheets.values.batchClear({
          spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
          requestBody: {
            ranges: clearRanges,
          },
        });
      }

      return NextResponse.json({ ok: true, cleared: clearRanges.length });
    }

    if (playerName) {
      // Remove specific player
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
        range: `${sheetName}!A:H`,
      });
      const rows = response.data.values || [];

      for (let i = 0; i < rows.length; i++) {
        if (rows[i][1] === playerName) {
          await sheets.spreadsheets.values.clear({
            spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
            range: `${sheetName}!A${i + 1}:H${i + 1}`,
          });
          return NextResponse.json({ ok: true, removed: playerName });
        }
      }
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Missing player or clearAll param' }, { status: 400 });
  } catch (error: any) {
    console.error('Rankings DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
