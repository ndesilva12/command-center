import { getCinderellaAuth } from '@/lib/cinderella-auth';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const SHEET_NAME = 'Roster Configs';

// GET — load all saved configs
export async function GET() {
  try {
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Try to get the sheet; create it if it doesn't exist
    let rows: any[][] = [];
    try {
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A:H`,
      });
      rows = response.data.values || [];
    } catch (err: any) {
      // If sheet doesn't exist, create it
      if (err.message?.includes('Unable to parse range') || err.status === 400) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: SPREADSHEET_ID,
          requestBody: {
            requests: [{
              addSheet: {
                properties: { title: SHEET_NAME }
              }
            }]
          }
        });
        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${SHEET_NAME}!A1:H1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [['Config', 'Slot', 'Player', 'ESPN ID', 'Salary', 'Notes', 'Pos', 'School']]
          }
        });
        rows = [['Config', 'Slot', 'Player', 'ESPN ID', 'Salary', 'Notes', 'Pos', 'School']];
      }
    }

    if (rows.length <= 1) {
      return NextResponse.json({ configs: [] });
    }

    // Group rows by Config name
    const configMap: Record<string, any[]> = {};
    for (const row of rows.slice(1)) {
      const configName = row[0] || '';
      if (!configName) continue;
      if (!configMap[configName]) configMap[configName] = [];
      configMap[configName].push({
        slot: row[1] || '',
        player: row[2] || '',
        espnId: row[3] || '',
        salary: parseInt(row[4] || '0', 10),
        notes: row[5] || '',
        pos: row[6] || '',
        school: row[7] || '',
      });
    }

    const configs = Object.entries(configMap).map(([name, slots]) => ({
      name,
      slots,
    }));

    return NextResponse.json({ configs }, {
      headers: { 'Cache-Control': 'no-store' }
    });
  } catch (error: any) {
    console.error('Roster Configs GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST — save a config (overwrites existing config with same name)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, slots } = body as {
      name: string;
      slots: {
        slot: string;
        player: string;
        espnId?: string;
        salary: number;
        notes?: string;
        pos?: string;
        school?: string;
      }[];
    };

    if (!name || !slots || !Array.isArray(slots)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Ensure sheet exists
    try {
      await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
      });
    } catch {
      // Create the sheet
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          requests: [{ addSheet: { properties: { title: SHEET_NAME } } }]
        }
      });
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1:H1`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [['Config', 'Slot', 'Player', 'ESPN ID', 'Salary', 'Notes', 'Pos', 'School']]
        }
      });
    }

    // Read current data to find and remove existing rows for this config
    const current = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    });
    const currentRows = current.data.values || [];

    // Build new full data: keep rows NOT belonging to this config + add new rows
    const header = currentRows[0] || ['Config', 'Slot', 'Player', 'ESPN ID', 'Salary', 'Notes', 'Pos', 'School'];
    const kept = currentRows.slice(1).filter(row => row[0] !== name);
    const newRows = slots.map(s => [
      name,
      s.slot,
      s.player,
      s.espnId || '',
      String(s.salary),
      s.notes || '',
      s.pos || '',
      s.school || '',
    ]);
    const allData = [header, ...kept, ...newRows];

    // Clear and rewrite
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    });
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: allData },
    });

    return NextResponse.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (error: any) {
    console.error('Roster Configs POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE — delete a config by name
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name');
    if (!name) return NextResponse.json({ error: 'name param required' }, { status: 400 });

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const current = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    });
    const currentRows = current.data.values || [];
    const header = currentRows[0] || [];
    const kept = currentRows.slice(1).filter(row => row[0] !== name);

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    });
    if (kept.length > 0 || header.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [header, ...kept] },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Roster Configs DELETE error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
