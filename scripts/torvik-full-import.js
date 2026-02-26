#!/usr/bin/env node
/**
 * Bart Torvik Full Import Script
 * Uses puppeteer to scrape all player stats and updates Google Sheet
 */

const puppeteer = require('puppeteer-core');
const { google } = require('googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const SHEET_NAME = 'Full Database';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const TORVIK_URL = 'https://barttorvik.com/playerstat.php?link=y&year=2026&start=20251101&end=20260501';

// New columns to add (after PORPAG in AF)
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

async function scrapeTorvikData() {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({ 
    headless: true,
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  console.log('Navigating to Torvik...');
  await page.goto(TORVIK_URL, { waitUntil: 'networkidle2', timeout: 60000 });
  
  // Wait for table to load
  await page.waitForSelector('table tbody tr');
  
  // Click "Show 100 more" until all data is loaded
  let prevCount = 0;
  let attempts = 0;
  while (attempts < 30) {
    const currentCount = await page.evaluate(() => {
      return document.querySelectorAll('table')[1]?.querySelectorAll('tbody tr').length || 0;
    });
    
    console.log(`Loaded ${currentCount} rows...`);
    
    if (currentCount === prevCount) {
      break;
    }
    prevCount = currentCount;
    
    // Try to click "Show 100 more"
    const clicked = await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('th, td')).find(el => 
        el.textContent.includes('Show 100 more')
      );
      if (btn) {
        btn.click();
        return true;
      }
      return false;
    });
    
    if (!clicked) break;
    
    await new Promise(r => setTimeout(r, 1000));
    attempts++;
  }
  
  console.log('Extracting data...');
  const data = await page.evaluate(() => {
    const table = document.querySelectorAll('table')[1];
    if (!table) return [];
    
    const rows = table.querySelectorAll('tbody tr');
    const results = [];
    
    rows.forEach(row => {
      const cells = Array.from(row.querySelectorAll('td'));
      if (cells.length < 20) return;
      
      // Get player and team from links
      const playerLink = row.querySelector('a[href*="playerstat.php"]');
      const teamLink = row.querySelector('a[href*="team.php"]');
      if (!playerLink || !teamLink) return;
      
      const player = playerLink.textContent.trim();
      const team = teamLink.textContent.trim();
      
      // Find column indices based on header
      // Standard visible columns: Rk | Yr | Ht | Player | Team | Conf | Min% | PRPG! | BPM | ORtg | Usg | eFG | TS | OR | DR | Ast | TO | Blk | Stl | FTR | 2P | 3P/100 | 3P
      // But there are hidden columns, so we use the visible layout
      
      // Map cells by position (after getting player/team)
      const cellTexts = cells.map(c => c.textContent.trim());
      
      // Find the indices by searching for known patterns
      let minPctIdx = -1, porpagIdx = -1, bpmIdx = -1, ortgIdx = -1, usgIdx = -1;
      let efgIdx = -1, tsIdx = -1, orIdx = -1, drIdx = -1, astIdx = -1, toIdx = -1;
      let blkIdx = -1, stlIdx = -1, ftrIdx = -1;
      
      // The columns after player/team/conf typically follow this pattern
      // Looking at the cell text patterns...
      // Cell 6 = Min%, Cell 7 = PORPAG, Cell 8 = BPM, Cell 9 = ORtg, etc.
      
      // Based on observed data structure
      minPctIdx = 6;
      porpagIdx = 7;
      bpmIdx = 8;
      ortgIdx = 9;
      usgIdx = 10;
      efgIdx = 11;
      tsIdx = 12;
      orIdx = 13;
      drIdx = 14;
      astIdx = 15;
      toIdx = 16;
      blkIdx = 17;
      stlIdx = 18;
      ftrIdx = 19;
      
      results.push({
        player,
        team,
        minPct: cellTexts[minPctIdx] || '',
        porpag: cellTexts[porpagIdx] || '',
        bpm: cellTexts[bpmIdx] || '',
        ortg: cellTexts[ortgIdx] || '',
        usg: cellTexts[usgIdx] || '',
        efg: cellTexts[efgIdx] || '',
        ts: cellTexts[tsIdx] || '',
        orPct: cellTexts[orIdx] || '',
        drPct: cellTexts[drIdx] || '',
        astPct: cellTexts[astIdx] || '',
        toPct: cellTexts[toIdx] || '',
        blkPct: cellTexts[blkIdx] || '',
        stlPct: cellTexts[stlIdx] || '',
        ftr: cellTexts[ftrIdx] || ''
      });
    });
    
    return results;
  });
  
  await browser.close();
  console.log(`Scraped ${data.length} players from Torvik`);
  return data;
}

async function getExistingPlayers(sheets) {
  console.log('Fetching existing players from sheet...');
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!A:AP`,
  });
  
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  console.log(`Found ${rows.length - 1} players in sheet`);
  
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
  if (existingHeaders.includes('BPM')) {
    console.log('New columns already exist');
    return existingHeaders.indexOf('BPM');
  }
  
  console.log('Adding new column headers at AG:AP...');
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${SHEET_NAME}!AG1:AP1`,
    valueInputOption: 'RAW',
    requestBody: { values: [NEW_COLUMNS] }
  });
  
  console.log('Added headers:', NEW_COLUMNS.join(', '));
  return 32; // AG = column 32 (0-indexed)
}

// Team name normalization map
const TEAM_ALIASES = {
  'ohio st.': 'ohio state',
  'michigan st.': 'michigan state',
  'texas tech': 'texas tech',
  'iowa st.': 'iowa state',
  "saint mary's": "saint mary's",
  'n.c. state': 'nc state',
  'san jose st.': 'san jose state',
};

function normalizeTeam(team) {
  const lower = team.toLowerCase().trim();
  return TEAM_ALIASES[lower] || lower;
}

async function updateSheet(sheets, playerMap, torvikData) {
  console.log(`Matching ${torvikData.length} Torvik players...`);
  
  const updates = [];
  let matched = 0;
  let unmatched = [];
  
  for (const tp of torvikData) {
    // Try exact match first
    let key = `${tp.player.toLowerCase().trim()}|${tp.team.toLowerCase().trim()}`;
    let existing = playerMap.get(key);
    
    // Try normalized team name
    if (!existing) {
      const normTeam = normalizeTeam(tp.team);
      for (const [k, v] of playerMap.entries()) {
        if (k.startsWith(tp.player.toLowerCase().trim() + '|') && 
            k.includes(normTeam)) {
          existing = v;
          break;
        }
      }
    }
    
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
  
  if (updates.length > 0) {
    console.log(`Writing ${updates.length} updates in batches...`);
    for (let i = 0; i < updates.length; i += 100) {
      const batch = updates.slice(i, i + 100);
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { valueInputOption: 'RAW', data: batch }
      });
      console.log(`  Batch ${Math.floor(i/100) + 1}: rows ${i+1}-${Math.min(i+100, updates.length)}`);
    }
  }
  
  // Save unmatched to file for review
  if (unmatched.length > 0) {
    fs.writeFileSync('/tmp/torvik-unmatched.txt', unmatched.join('\n'));
    console.log(`Unmatched players saved to /tmp/torvik-unmatched.txt`);
  }
  
  return { matched, unmatched: unmatched.length };
}

async function main() {
  try {
    // Scrape Torvik data
    const torvikData = await scrapeTorvikData();
    
    if (torvikData.length === 0) {
      console.error('No data scraped from Torvik!');
      process.exit(1);
    }
    
    // Save scraped data for backup
    fs.writeFileSync('/tmp/torvik-data.json', JSON.stringify(torvikData, null, 2));
    console.log('Scraped data saved to /tmp/torvik-data.json');
    
    // Setup sheets
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    
    // Get existing players
    const { headers, playerMap } = await getExistingPlayers(sheets);
    
    // Add headers if needed
    await addNewHeaders(sheets, headers);
    
    // Update sheet
    const result = await updateSheet(sheets, playerMap, torvikData);
    
    console.log('\n✅ Import complete!');
    console.log(`   Matched: ${result.matched}`);
    console.log(`   Unmatched: ${result.unmatched}`);
    
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
