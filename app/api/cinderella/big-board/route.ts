import { getCinderellaAuth } from '@/lib/cinderella-auth';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const SHEET_NAME = 'Portal Big Board';

function colToLetter(col: number): string {
  // col is 0-indexed
  let s = '';
  let n = col + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export async function GET() {
  try {
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AH`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json([]);
    }

    const headers = rows[0];
    const data = rows.slice(1)
      .filter(row => row[1] && row[0] && !row[0].includes('──'))
      .map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((header: string, i: number) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'X-Synced-At': new Date().toISOString(),
        'Cache-Control': 'no-store',
      }
    });
  } catch (error: any) {
    console.error('Big Board API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH: update a specific field for a player (Flagged or User Notes)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { playerName, field, value } = body;
    if (!playerName || !field) {
      return NextResponse.json({ error: 'Missing playerName or field' }, { status: 400 });
    }

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Get all rows to find player row and column index
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AH`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) return NextResponse.json({ error: 'Sheet empty' }, { status: 404 });

    const headers = rows[0];
    let fieldIdx = headers.findIndex((h: string) => h === field);

    // If column doesn't exist, add it at the end
    if (fieldIdx === -1) {
      fieldIdx = headers.length;
      const newColLetter = colToLetter(fieldIdx);
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!${newColLetter}1`,
        valueInputOption: 'RAW',
        requestBody: { values: [[field]] },
      });
    }

    // Find the player row (column B = index 1 is "Player")
    const rowIdx = rows.findIndex((row: string[], i: number) => i > 0 && row[1] === playerName);
    if (rowIdx === -1) return NextResponse.json({ error: 'Player not found' }, { status: 404 });

    const colLetter = colToLetter(fieldIdx);
    const cellRange = `${SHEET_NAME}!${colLetter}${rowIdx + 1}`;

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: cellRange,
      valueInputOption: 'RAW',
      requestBody: { values: [[value]] },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error('Big Board PATCH error:', e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
