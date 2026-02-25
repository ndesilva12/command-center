import { getCinderellaAuth } from '@/lib/cinderella-auth';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const SHEET_NAME = "Norman's Rankings";

// Headers: Player, Team, Conference, Position, Year, PPG, RPG, APG, FG%, 3P%, School History, Added

export async function GET() {
  try {
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:L`,
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) {
      return NextResponse.json({ players: [], total: 0 });
    }

    const headers = rows[0];
    const players = rows.slice(1)
      .filter(row => row[0]) // Has player name
      .map((row, index) => {
        const obj: Record<string, string> = { _rowIndex: String(index + 2) };
        headers.forEach((header: string, i: number) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });

    return NextResponse.json({
      players,
      total: players.length,
    }, {
      headers: {
        'Cache-Control': 'no-store',
      }
    });
  } catch (error: any) {
    console.error('Rankings API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add a player to Big Board
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { player, team, conference, position, year, ppg, rpg, apg, fg, threePt, schoolHistory } = body;

    if (!player || !team) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Check if player already exists
    const existing = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });
    const existingPlayers = (existing.data.values || []).flat();
    if (existingPlayers.includes(player)) {
      return NextResponse.json({ error: 'Player already on Big Board' }, { status: 409 });
    }

    // Add new row
    const newRow = [
      player,
      team,
      conference || '',
      position || '',
      year || '',
      ppg || '',
      rpg || '',
      apg || '',
      fg || '',
      threePt || '',
      schoolHistory || '',
      new Date().toISOString().split('T')[0], // Added date
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:L`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [newRow],
      },
    });

    return NextResponse.json({ ok: true, player });
  } catch (error: any) {
    console.error('Rankings POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove a player or clear all
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerName = searchParams.get('player');
    const clearAll = searchParams.get('clearAll') === 'true';

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    if (clearAll) {
      // Get row count
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:L`,
      });
      const rowCount = response.data.values?.length || 0;
      
      if (rowCount > 1) {
        // Clear all data rows (keep header)
        await sheets.spreadsheets.values.clear({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A2:L${rowCount}`,
        });
      }
      return NextResponse.json({ ok: true, cleared: rowCount - 1 });
    }

    if (playerName) {
      // Find and remove specific player
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:L`,
      });
      const rows = response.data.values || [];

      for (let i = 1; i < rows.length; i++) {
        if (rows[i][0] === playerName) {
          await sheets.spreadsheets.values.clear({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A${i + 1}:L${i + 1}`,
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
