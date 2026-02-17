import { getCinderellaAuth } from '@/lib/cinderella-auth';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';

// Cache disabled — always fetch fresh from Google Sheets

export interface CoachingConnection {
  targetPlayer: string;
  school: string;
  position: string;
  playersCoach: string;
  coachBackground: string;
  uicGroverBridge: string;
  bridgeRole: string;
  relationshipType: string;
  strength: number;
  priority: string;
  actionableStep: string;
  notes: string;
}

export async function GET() {
  try {
    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: 'Coaching Connections!A:L',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json([]);
    }

    // First row is headers — skip it
    const data: CoachingConnection[] = rows.slice(1)
      .filter(row => row[0] && row[0].trim() !== '') // must have a target player
      .map(row => ({
        targetPlayer:    row[0]  || '',
        school:          row[1]  || '',
        position:        row[2]  || '',
        playersCoach:    row[3]  || '',
        coachBackground: row[4]  || '',
        uicGroverBridge: row[5]  || '',
        bridgeRole:      row[6]  || '',
        relationshipType:row[7]  || '',
        strength:        parseInt(row[8] || '0', 10),
        priority:        row[9]  || '',
        actionableStep:  row[10] || '',
        notes:           row[11] || '',
      }))
      // Sort by strength descending (5 first)
      .sort((a, b) => b.strength - a.strength);

    return NextResponse.json(data, {
      headers: {
        'X-Cache': 'MISS',
        'X-Synced-At': new Date().toISOString(),
        'Cache-Control': 'no-store',
      }
    });
  } catch (error: any) {
    console.error('Coaching Connections API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
