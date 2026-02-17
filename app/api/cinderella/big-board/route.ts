import { getCinderellaAuth } from '@/lib/cinderella-auth';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Cache disabled — always fetch fresh from Google Sheets
// Use ?bust=timestamp for explicit cache busting (same behavior, just fresh)

export async function GET() {
  try {
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: 'Portal Big Board!A:AF',
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
