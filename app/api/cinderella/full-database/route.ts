import { getCinderellaAuth } from '@/lib/cinderella-auth';
import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const SHEET_NAME = 'Full Database';

export const maxDuration = 30;

export async function GET(req: NextRequest) {
  try {
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:AF`,
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json([]);
    }

    const headers = rows[0];
    const data = rows.slice(1)
      .filter(row => row[2]) // Player name exists (column C)
      .map((row, index) => {
        const obj: Record<string, string> = { _rowIndex: String(index + 2) };
        headers.forEach((header: string, i: number) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });

    return NextResponse.json({
      players: data,
      total: data.length,
      headers: headers,
    }, {
      headers: {
        'X-Synced-At': new Date().toISOString(),
        'Cache-Control': 'no-store',
      }
    });
  } catch (error: any) {
    console.error('Full Database API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
