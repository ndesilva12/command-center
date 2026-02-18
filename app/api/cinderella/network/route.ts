import { getCinderellaAuth } from '@/lib/cinderella-auth';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const SHEET_NAME = 'Network';
const HEADERS = ['ID', 'Name', 'Role', 'Organization', 'Relationship', 'Strength', 'HowKnow', 'Phone', 'Email', 'Twitter', 'Notes', 'Connections', 'DateAdded', 'LastUpdated'];

function rowToPerson(row: string[], id?: string): any {
  return {
    id:           id || row[0] || '',
    name:         row[1]  || '',
    role:         row[2]  || 'Other',
    organization: row[3]  || '',
    relationship: row[4]  || '1st',
    strength:     row[5]  || 'Medium',
    howKnow:      row[6]  || '',
    phone:        row[7]  || '',
    email:        row[8]  || '',
    twitter:      row[9]  || '',
    notes:        row[10] || '',
    connections:  row[11] || '',
    dateAdded:    row[12] || '',
    lastUpdated:  row[13] || '',
  };
}

function personToRow(person: any): string[] {
  const now = new Date().toISOString().split('T')[0];
  return [
    person.id || String(Date.now()),
    person.name || '',
    person.role || 'Other',
    person.organization || '',
    person.relationship || '1st',
    person.strength || 'Medium',
    person.howKnow || '',
    person.phone || '',
    person.email || '',
    person.twitter || '',
    person.notes || '',
    person.connections || '',
    person.dateAdded || now,
    now,
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
      // Seed with initial contacts
      const seed = [
        ['OBI001', 'Obi Toppin', 'NBA Player', 'Indiana Pacers', '1st', 'Medium', 'Knicks circle connection', '', '', '@ObiToppin1', 'Norman knows through Knicks network', '', new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]],
        ['GROVER001', 'Tim Grover', 'Coach', 'ATTACK Athletics', '1st', 'Strong', 'Locked in Cinderella partner', '', '', '@attackathletics', 'Key partner for Cinderella project — training and brand', 'Obi Toppin', new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]],
        ['DUSTY001', 'Dusty May', 'Coach', 'University of Michigan', '1st', 'Medium', 'Lendeborg connection', '', '', '', 'Michigan HC — connection via Lendeborg', '', new Date().toISOString().split('T')[0], new Date().toISOString().split('T')[0]],
      ];
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${SHEET_NAME}!A2`,
        valueInputOption: 'RAW',
        requestBody: { values: seed },
      });
    }
  } catch (e) {
    console.error('ensureSheetExists error:', e);
  }
}

export async function GET() {
  try {
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    await ensureSheetExists(sheets);

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:N`,
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return NextResponse.json([]);

    const data = rows.slice(1)
      .filter(row => row[1] && row[1].trim() !== '')
      .map(row => rowToPerson(row, row[0]));

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

    const newId = `P${Date.now()}`;
    const row = personToRow({ ...body, id: newId, dateAdded: new Date().toISOString().split('T')[0] });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:N`,
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
      range: `${SHEET_NAME}!A:N`,
    });

    const rows = res.data.values || [];
    const rowIdx = rows.findIndex((row, i) => i > 0 && row[0] === body.id);
    if (rowIdx === -1) return NextResponse.json({ error: 'Person not found' }, { status: 404 });

    const existing = rows[rowIdx];
    const updated = personToRow({ ...rowToPerson(existing), ...body });

    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowIdx + 1}:N${rowIdx + 1}`,
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
    const rowIdx = rows.findIndex((row, i) => i > 0 && row[0] === id);
    if (rowIdx === -1) return NextResponse.json({ error: 'Person not found' }, { status: 404 });

    // Clear the row
    await sheets.spreadsheets.values.clear({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A${rowIdx + 1}:N${rowIdx + 1}`,
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
