import { getCinderellaAuth } from '@/lib/cinderella-auth';
import { NextResponse } from 'next/server';
import { google } from 'googleapis';



// In-memory cache with 15-minute TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache: { strikeList?: CacheEntry } = {};
const CACHE_TTL_MS = 15 * 60 * 1000;


export interface StrikeListPlayer {
  wave: number;
  player: string;
  school: string;
  pos: string;
  cls: string;
  grade: string;
  cinScore: string;
  flightRisk: string;
  confCheck: string;
  onOff: string;
  whyWeWantHim: string;
  coachingConnection: string;
  nilTier: string;
  contactStatus: string;
  notes: string;
}

export async function GET() {
  try {
    const now = Date.now();
    if (cache.strikeList && now - cache.strikeList.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cache.strikeList.data, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Age': String(Math.floor((now - cache.strikeList.timestamp) / 1000)),
        },
      });
    }

    const auth = await getCinderellaAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: 'Strike List!A:O',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json([]);
    }

    // Row 0 is headers — skip it
    const data: StrikeListPlayer[] = rows
      .slice(1)
      .filter((row) => row[1] && row[1].toString().trim() !== '')
      .map((row) => ({
        wave: parseInt(row[0] || '1', 10),
        player: row[1] || '',
        school: row[2] || '',
        pos: row[3] || '',
        cls: row[4] || '',
        grade: row[5] || '',
        cinScore: row[6] || '',
        flightRisk: row[7] || '',
        confCheck: row[8] || '',
        onOff: row[9] || '',
        whyWeWantHim: row[10] || '',
        coachingConnection: row[11] || '',
        nilTier: row[12] || '',
        contactStatus: row[13] || '',
        notes: row[14] || '',
      }));

    cache.strikeList = { data, timestamp: now };
    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' },
    });
  } catch (error: any) {
    console.error('Strike List API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
