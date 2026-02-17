import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';

interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache: { rankings?: CacheEntry } = {};
const CACHE_TTL_MS = 15 * 60 * 1000;

function getAuth() {
  const token = JSON.parse(
    fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json', 'utf8')
  );
  const auth = new OAuth2Client(token.client_id, token.client_secret);
  auth.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
  });
  return auth;
}

export async function GET() {
  try {
    const now = Date.now();
    if (cache.rankings && now - cache.rankings.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cache.rankings.data, {
        headers: { 'X-Cache': 'HIT' }
      });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: "Norman's Rankings!A1:H70",
    });

    const rows = response.data.values || [];

    // Parse the rankings sheet
    // Row 4 (index 3) has real headers: MASTER TIER, NAME, SCHOOL, POS, YR, BEST BATCH RANK, EXERCISE, SCOUT NOTES
    // Section headers: "── GUARDS ──", "── FORWARDS / BIGS ──"
    
    interface PlayerRanking {
      tier: string;
      name: string;
      school: string;
      pos: string;
      yr: string;
      bestBatchRank: string;
      exercise: string;
      scoutNotes: string;
      section: string;
      isRedFlag: boolean;
    }

    const players: PlayerRanking[] = [];
    let currentSection = 'Guards';

    for (const row of rows) {
      if (!row || row.length === 0) continue;
      const first = row[0] || '';

      // Section header
      if (first.includes('GUARDS') && first.includes('──')) {
        currentSection = 'Guards';
        continue;
      }
      if (first.includes('FORWARDS') && first.includes('──')) {
        currentSection = 'Forwards';
        continue;
      }
      if (first.includes('LEGEND') && first.includes('──')) break;

      // Skip header rows and blank/meta rows
      if (first === 'MASTER TIER' || first.startsWith('CINDERELLA') || first.startsWith('Compiled')) continue;
      if (!first || first === '') continue;

      // Valid player rows start with T1, T2, T3, T4, T4-RF, NR
      const validTiers = ['T1', 'T2', 'T3', 'T4-RF', 'T4', 'NR'];
      if (!validTiers.some(t => first === t || first.startsWith(t + ' '))) continue;

      players.push({
        tier: row[0] || '',
        name: row[1] || '',
        school: row[2] || '',
        pos: row[3] || '',
        yr: row[4] || '',
        bestBatchRank: row[5] || '',
        exercise: row[6] || '',
        scoutNotes: row[7] || '',
        section: currentSection,
        isRedFlag: (row[0] || '').includes('RF'),
      });
    }

    const result = {
      guards: players.filter(p => p.section === 'Guards'),
      forwards: players.filter(p => p.section === 'Forwards'),
    };

    cache.rankings = { data: result, timestamp: now };
    return NextResponse.json(result, { headers: { 'X-Cache': 'MISS' } });
  } catch (error: any) {
    console.error('Rankings API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
