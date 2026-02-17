import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';

// In-memory cache with 15-minute TTL
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache: { bigBoard?: CacheEntry } = {};
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 minutes

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
    // Check cache
    const now = Date.now();
    if (cache.bigBoard && now - cache.bigBoard.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cache.bigBoard.data, {
        headers: { 'X-Cache': 'HIT', 'X-Cache-Age': String(Math.floor((now - cache.bigBoard.timestamp) / 1000)) }
      });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: 'Portal Big Board!A:AB',
    });

    const rows = response.data.values || [];
    if (rows.length === 0) {
      return NextResponse.json([]);
    }

    const headers = rows[0];
    const data = rows.slice(1)
      .filter(row => row.length > 0 && row[0] && row[0].startsWith('T'))
      .map(row => {
        const obj: Record<string, string> = {};
        headers.forEach((header: string, i: number) => {
          obj[header] = row[i] || '';
        });
        return obj;
      });

    // Update cache
    cache.bigBoard = { data, timestamp: now };

    return NextResponse.json(data, {
      headers: { 'X-Cache': 'MISS' }
    });
  } catch (error: any) {
    console.error('Big Board API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
