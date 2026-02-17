import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs';

interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache: { roster?: CacheEntry } = {};
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

function parseRisk(riskStr: string): 'low' | 'moderate' | 'high' {
  const s = (riskStr || '').toLowerCase();
  if (s.includes('low') && !s.includes('moderate') && !s.includes('high')) return 'low';
  if (s.includes('high')) return 'high';
  return 'moderate';
}

export async function GET() {
  try {
    const now = Date.now();
    if (cache.roster && now - cache.roster.timestamp < CACHE_TTL_MS) {
      return NextResponse.json(cache.roster.data, { headers: { 'X-Cache': 'HIT' } });
    }

    const auth = getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: 'Roster Builder!A1:K90',
    });

    const rows = response.data.values || [];

    interface RosterPlayer {
      pos: string;
      name: string;
      school: string;
      yr: string;
      height: string;
      tier: string;
      onOff: string;
      keyStat: string;
      portalRisk: string;
      portalRiskLevel: 'low' | 'moderate' | 'high';
      role: string;
      notes: string;
      isStarter: boolean;
      benchSlot?: string;
    }

    interface RosterConfig {
      name: string;
      label: string;
      scenario: string;
      starters: RosterPlayer[];
      bench: RosterPlayer[];
      championshipProb: string;
      portalReality: string;
    }

    const configs: RosterConfig[] = [];
    let currentConfig: RosterConfig | null = null;
    let inBench = false;

    const configNames = ['CONFIG A', 'CONFIG B', 'CONFIG C'];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      if (!row || row.length === 0) continue;
      const first = (row[0] || '').toString();

      // Detect config headers
      if (first.includes('CONFIG A') || first.includes('CONFIG B') || first.includes('CONFIG C')) {
        if (currentConfig) configs.push(currentConfig);
        const configLetter = first.includes('CONFIG A') ? 'A' : first.includes('CONFIG B') ? 'B' : 'C';
        const labelMatch = first.match(/═+\s*(CONFIG [ABC][^═]+)/);
        const label = labelMatch ? labelMatch[1].trim() : `Config ${configLetter}`;
        const scenario = (rows[i + 1] || [])[0] || '';
        currentConfig = {
          name: `Config ${configLetter}`,
          label,
          scenario,
          starters: [],
          bench: [],
          championshipProb: '',
          portalReality: '',
        };
        inBench = false;
        continue;
      }

      if (!currentConfig) continue;

      // Championship prob and portal reality
      if (first.startsWith('Config') && first.includes('Championship Probability')) {
        currentConfig.championshipProb = (row[1] || '').toString();
        continue;
      }
      if (first.startsWith('Config') && first.includes('Portal Reality')) {
        currentConfig.portalReality = (row[1] || '').toString();
        continue;
      }

      // Bench section header
      if (first === 'BENCH') {
        inBench = true;
        continue;
      }

      // Skip column header rows
      if (first === 'POS' || first === 'Scenario:') continue;

      // Player rows: PG, SG, SF, PF, C, or 6th, 7th, 8th, 9th
      const isStarterPos = ['PG', 'SG', 'SF', 'PF', 'C'].includes(first);
      const isBenchSlot = ['6th', '7th', '8th', '9th'].includes(first);

      if (isStarterPos || isBenchSlot) {
        const player: RosterPlayer = {
          pos: isStarterPos ? first : (row[3] === 'G' || row[3] === 'F' ? row[3] : 'G'),
          name: (row[1] || '').toString(),
          school: (row[2] || '').toString(),
          yr: (row[3] || '').toString(),
          height: (row[4] || '').toString(),
          tier: (row[5] || '').toString(),
          onOff: (row[6] || '').toString(),
          keyStat: (row[7] || '').toString(),
          portalRisk: (row[8] || '').toString(),
          portalRiskLevel: parseRisk((row[8] || '').toString()),
          role: (row[9] || '').toString(),
          notes: (row[10] || '').toString(),
          isStarter: isStarterPos,
          benchSlot: isBenchSlot ? first : undefined,
        };

        if (inBench || isBenchSlot) {
          currentConfig.bench.push(player);
        } else {
          currentConfig.starters.push(player);
        }
      }
    }

    if (currentConfig) configs.push(currentConfig);

    // Strike order
    const strikeOrderResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs',
      range: 'Roster Builder!A76:K84',
    });

    const strikeRows = strikeOrderResponse.data.values || [];
    interface StrikeTarget {
      priority: string;
      player: string;
      school: string;
      reason: string;
      nilEst: string;
      timeline: string;
      riskLevel: string;
    }
    const strikeOrder: StrikeTarget[] = strikeRows
      .filter(r => r[0] && r[0].toString().startsWith('#'))
      .map(r => ({
        priority: r[0] || '',
        player: r[1] || '',
        school: r[2] || '',
        reason: r[3] || '',
        nilEst: r[4] || '',
        timeline: r[5] || '',
        riskLevel: r[6] || '',
      }));

    const result = { configs, strikeOrder };
    cache.roster = { data: result, timestamp: now };
    return NextResponse.json(result, { headers: { 'X-Cache': 'MISS' } });
  } catch (error: any) {
    console.error('Roster API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
