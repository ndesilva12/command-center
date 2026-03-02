import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getCinderellaAuth } from '@/lib/cinderella-auth';

const SHEET_ID = '1434MZVRl65IRlNNk6XlKY7_mCbZzDqWANOqjS5AU22Y';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { row, column, value } = body;

    if (!row || !column || value === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: row, column, value' },
        { status: 400 }
      );
    }

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Map column names to sheet columns
    const columnMap: Record<string, string> = {
      team: 'A',
      spread: 'B',
      model: 'C',
      net: 'D',
      rankDiff: 'E',
      avgRank: 'F',
      offRank: 'G',
      defRank: 'H',
      netRating: 'I',
      oppNetRating: 'J',
      final: 'K',
      finalScore: 'L',
      margin: 'M',
      ats: 'N',
      date: 'O',
    };

    const col = columnMap[column];
    if (!col) {
      return NextResponse.json(
        { error: `Unknown column: ${column}` },
        { status: 400 }
      );
    }

    const range = `Analysis!${col}${row}`;
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SHEET_ID,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[value]],
      },
    });

    return NextResponse.json({
      success: true,
      updated: { row, column, value, range },
    });
  } catch (error) {
    console.error('CBB Update API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
