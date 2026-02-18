import { getCinderellaAuth } from '@/lib/cinderella-auth';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const SHEET_NAME = 'Reps';
const HEADERS = ['ID', 'Rep Name', 'Agency', 'Role', 'Clients', 'Phone', 'Email', 'Notes'];

const SEED_DATA = [
  ['REP001', 'Bryan Lourd', 'CAA', 'Agent', 'Liev Schreiber', '', '', ''],
  ['REP002', 'Rick Yorn', 'LBI Entertainment', 'Manager', 'Liev Schreiber', '', '', ''],
  ['REP003', 'Patrick Whitesell', 'WME', 'Agent', 'Mark Wahlberg', '', '', ''],
  ['REP004', 'Stephen Levinson', 'Leverage Management', 'Manager', 'Mark Wahlberg', '', '', ''],
  ['REP005', 'Dave Becky', '3 Arts', 'Agent', 'Kevin Hart', '', '', ''],
  ['REP006', 'Scooter Braun', 'SB Projects', 'Manager', 'Kevin Hart', '', '', ''],
  ['REP007', 'Joe Machota', 'CAA', 'Agent', 'Ryan Reynolds', '', '', ''],
  ['REP008', 'George Dewey', 'Maximum Effort', 'Manager', 'Ryan Reynolds', '', '', ''],
  ['REP009', 'Jimmy Miller', 'Mosaic', 'Agent/Manager', 'Will Ferrell', '', '', ''],
  ['REP010', 'Brad Slater', 'WME', 'Agent', 'Adam Sandler', '', '', ''],
  ['REP011', 'Jeff Kwatinetz', 'Prospect Park', 'Agent', 'Ice Cube', '', '', ''],
  ['REP012', 'Nick Adler', 'WME', 'Manager', 'Snoop Dogg', '', '', ''],
  ['REP013', 'Perry Rogers', 'PRP Management', 'Manager', 'Shaquille O\'Neal', '', '', ''],
  ['REP014', 'Rich Paul', 'Klutch Sports', 'Agent', 'LeBron James', '', '', ''],
  ['REP015', 'Maverick Carter', 'SpringHill', 'Business Manager', 'LeBron James', '', '', ''],
  ['REP016', 'David Falk', 'FAME', 'Agent', 'Michael Jordan', '', '', ''],
  ['REP017', 'Curtis Polk', 'Jordan Brand', 'Business Manager', 'Michael Jordan', '', '', ''],
  ['REP018', 'David Grutman', 'Groot Hospitality', 'Manager', 'Travis Scott', '', '', ''],
  ['REP019', 'David Stromberg', 'Cactus Jack', 'Manager', 'Travis Scott', '', '', ''],
  ['REP020', 'Future the Prince (Adel Nur)', 'OVO', 'Manager', 'Drake', '', '', ''],
];

function rowToRep(row: string[]): any {
  return {
    id: row[0] || '',
    name: row[1] || '',
    agency: row[2] || '',
    role: row[3] || '',
    clients: row[4] || '',
    phone: row[5] || '',
    email: row[6] || '',
    notes: row[7] || '',
  };
}

function repToRow(rep: any): string[] {
  return [
    rep.id || String(Date.now()),
    rep.name || '',
    rep.agency || '',
    rep.role || '',
    rep.clients || '',
    rep.phone || '',
    rep.email || '',
    rep.notes || '',
  ];
}

async function ensureSheetExists(sheets: any) {
  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const sheetNames = meta.data.sheets.map((s: any) => s.properties.title);
    if (!sheetNames.includes(SHEET_NAME)) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: SHEET_NAME } } }] },
      });
      // Write headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [HEADERS] },
      });
      // Seed with initial data
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2`,
        valueInputOption: 'RAW',
        requestBody: { values: SEED_DATA },
      });
    }
  } catch (e) {
    console.error('ensureRepsSheetExists error:', e);
  }
}

export async function GET() {
  try {
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    await ensureSheetExists(sheets);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return NextResponse.json([]);

    const data = rows.slice(1)
      .filter((row: string[]) => row[1] && row[1].trim() !== '')
      .map((row: string[]) => rowToRep(row));

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    await ensureSheetExists(sheets);

    const newId = `R${Date.now()}`;
    const row = repToRow({ ...body, id: newId });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
      valueInputOption: 'RAW',
      requestBody: { values: [row] },
    });

    return NextResponse.json({ ok: true, id: newId });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:H`,
    });

    const rows = res.data.values || [];
    const rowIdx = rows.findIndex((row: string[], i: number) => i > 0 && row[0] === body.id);
    if (rowIdx === -1) return NextResponse.json({ error: 'Rep not found' }, { status: 404 });

    const existing = rows[rowIdx];
    const updated = repToRow({ ...rowToRep(existing), ...body });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowIdx + 1}:H${rowIdx + 1}`,
      valueInputOption: 'RAW',
      requestBody: { values: [updated] },
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:A`,
    });

    const rows = res.data.values || [];
    const rowIdx = rows.findIndex((row: string[], i: number) => i > 0 && row[0] === id);
    if (rowIdx === -1) return NextResponse.json({ error: 'Rep not found' }, { status: 404 });

    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowIdx + 1}:H${rowIdx + 1}`,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
