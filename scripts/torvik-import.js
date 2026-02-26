#!/usr/bin/env node
/**
 * Bart Torvik Data Import Script
 * Scrapes player stats from barttorvik.com and updates the Cinderella Google Sheet
 */

const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const SHEET_NAME = 'Full Database';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';

// New columns to add (starting at AG)
const NEW_COLUMNS = ['BPM', 'ORtg', 'Usage', 'TS%', 'OR%', 'DR%', 'Ast%', 'TO%', 'Blk%', 'Stl%'];

async function getAuth() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
  const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
  auth.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
  });
  return auth;
}

async function getExistingPlayers(sheets) {
  console.log('Fetching existing players from sheet...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:AF`,
  });
  
  const rows = res.data.values || [];
  const headers = rows[0];
  console.log(`Found ${rows.length - 1} players in sheet`);
  console.log('Current headers:', headers.join(', '));
  
  // Build a map of player name + team -> row index
  const playerMap = new Map();
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const player = row[2]; // Column C = Player
    const team = row[1];   // Column B = Team
    if (player && team) {
      const key = `${player.toLowerCase().trim()}|${team.toLowerCase().trim()}`;
      playerMap.set(key, { rowIndex: i + 1, row });
    }
  }
  
  return { headers, playerMap, rowCount: rows.length };
}

async function addNewHeaders(sheets, existingHeaders) {
  // Check if new columns already exist
  if (existingHeaders.includes('BPM')) {
    console.log('New columns already exist, skipping header addition');
    return existingHeaders.length;
  }
  
  console.log('Adding new column headers...');
  const startCol = existingHeaders.length; // AG = 32 (0-indexed)
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!AG1:AP1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [NEW_COLUMNS]
    }
  });
  
  console.log('Added headers:', NEW_COLUMNS.join(', '));
  return startCol;
}

// Torvik data - paste this from browser scrape
const TORVIK_DATA = [
  // Will be populated from browser scrape
];

async function updatePlayersWithTorvik(sheets, playerMap, torvikData) {
  console.log(`Matching ${torvikData.length} Torvik players to sheet...`);
  
  const updates = [];
  let matched = 0;
  let unmatched = [];
  
  for (const tp of torvikData) {
    const key = `${tp.player.toLowerCase().trim()}|${tp.team.toLowerCase().trim()}`;
    const existing = playerMap.get(key);
    
    if (existing) {
      matched++;
      updates.push({
        range: `${SHEET_NAME}!AG${existing.rowIndex}:AP${existing.rowIndex}`,
        values: [[
          tp.bpm || '',
          tp.ortg || '',
          tp.usg || '',
          tp.ts || '',
          tp.orPct || '',
          tp.drPct || '',
          tp.astPct || '',
          tp.toPct || '',
          tp.blkPct || '',
          tp.stlPct || ''
        ]]
      });
    } else {
      unmatched.push(`${tp.player} (${tp.team})`);
    }
  }
  
  console.log(`Matched: ${matched}, Unmatched: ${unmatched.length}`);
  if (unmatched.length > 0 && unmatched.length <= 20) {
    console.log('Unmatched players:', unmatched.join(', '));
  }
  
  // Batch update
  if (updates.length > 0) {
    console.log(`Updating ${updates.length} rows...`);
    
    // Split into batches of 100
    for (let i = 0; i < updates.length; i += 100) {
      const batch = updates.slice(i, i + 100);
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: {
          valueInputOption: 'RAW',
          data: batch
        }
      });
      console.log(`Updated rows ${i + 1} to ${Math.min(i + 100, updates.length)}`);
    }
  }
  
  return { matched, unmatched: unmatched.length };
}

async function main() {
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get existing players
    const { headers, playerMap, rowCount } = await getExistingPlayers(sheets);
    
    // Add new headers if needed
    await addNewHeaders(sheets, headers);
    
    // Check if we have Torvik data
    if (TORVIK_DATA.length === 0) {
      console.log('\nNo Torvik data loaded. Run browser scrape first.');
      console.log('Paste the scraped data into TORVIK_DATA array.');
      return;
    }
    
    // Update players
    const result = await updatePlayersWithTorvik(sheets, playerMap, TORVIK_DATA);
    
    console.log('\n✅ Done!');
    console.log(`   Matched: ${result.matched}`);
    console.log(`   Unmatched: ${result.unmatched}`);
    
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
