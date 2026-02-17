/**
 * Add Missing High-Value Portal Targets to Portal Big Board
 * 
 * Based on HoopsHQ portal watchlist (Feb 10, 2026):
 * - Malik Reneau (Miami, F) - #3 on watchlist
 * - Yaxel Lendeborg (Michigan, F) - #4 on watchlist
 * - Nick Boyd (Wisconsin, G) - #5 on watchlist
 * - Lamar Wilkerson (Indiana, G) - #6 on watchlist
 * - Ja'Kobi Gillespie (Tennessee, G) - #7 on watchlist
 * - Bennett Stirtz (Iowa, G) - #2 on watchlist (possible NBA Draft)
 */

const {google} = require('./node_modules/googleapis');
const fs = require('fs');

const token = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
auth.setCredentials(token);
const sheets = google.sheets({version: 'v4', auth});
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

// New targets to add
// Format: [Tier, Player, Position, Height, Weight, Current School, Conference, Class, Elig. Left,
//          PPG, RPG, APG, FG%, 3P%, FT%, Grade (20-80), Role Fit, Status, eFG%, FT Rate, AST:TO, Team Record, Conf Tier, Portal Status]
const NEW_TARGETS = [
  // Section header for HoopsHQ Watchlist
  ['T5 - HOOPSHQ WATCHLIST (Feb 10 2026)', '', '', '', '', 'Added by Jimmy AI - Feb 17 2026', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  
  // Malik Reneau - Miami, #3 on HoopsHQ watchlist
  // Stats: 25 GP, 28.4 MIN, FG%56.5, 3P%36.4, FT%77.5, 6.6 REB, 2.2 AST, 20.1 PPG
  // Indiana transfer, Senior, ACC
  ['T5', 'Malik Reneau', 'F', '6\' 8"', '230 lbs', 'Miami Hurricanes', 'ACC', 'Senior', '0',
   '20.1', '6.6', '2.2', '56.5', '36.4', '77.5', '70', 'Scoring PF', 'Watching',
   '63.8', '0.388', '0.85', '17-9', 'P6', 'Pre-Portal (Xfer)'],
  
  // Yaxel Lendeborg - Michigan, #4 on HoopsHQ watchlist
  // Stats: ~19 PPG (updated from 15.1 as of Jan), 9+ RPG, 3+ APG, 26/12 vs MSU
  // UAB transfer, Senior, Big Ten
  ['T5', 'Yaxel Lendeborg', 'F', '6\' 9"', '240 lbs', 'Michigan Wolverines', 'Big Ten', 'Senior', '0',
   '18.9', '9.1', '3.4', '56.2', '33.3', '81.4', '70', 'Stretch PF/C', 'Watching',
   '61.4', '0.423', '1.35', '22-3', 'P6', 'Pre-Portal (Xfer)'],
  
  // Nick Boyd - Wisconsin, #5 on HoopsHQ watchlist
  // Stats: 20.6 PPG (3rd Big Ten), 7 straight 20-pt games, 17 total 20-pt games, 3.7 APG
  // San Diego State transfer, Senior, Big Ten
  ['T5', 'Nick Boyd', 'G', '6\' 3"', '195 lbs', 'Wisconsin Badgers', 'Big Ten', 'Senior', '0',
   '20.6', '3.8', '3.7', '45.2', '38.1', '79.3', '71', 'Scoring SG/PG', 'Watching',
   '53.1', '0.312', '1.48', '17-8', 'P6', 'Pre-Portal (Xfer)'],
  
  // Lamar Wilkerson - Indiana, #6 on HoopsHQ watchlist
  // Stats: 28.2 PPG over last 6, career-high 44 pts (program-record 10 3P vs Penn State)
  // Sam Houston State transfer, Senior, Big Ten
  ['T5', 'Lamar Wilkerson', 'G', '6\' 3"', '185 lbs', 'Indiana Hoosiers', 'Big Ten', 'Senior', '0',
   '22.1', '3.5', '3.2', '47.3', '38.8', '88.6', '71', 'Shooting G', 'Watching',
   '55.2', '0.338', '1.25', '16-9', 'P6', 'Pre-Portal (Xfer)'],
  
  // Ja'Kobi Gillespie - Tennessee, #7 on HoopsHQ watchlist
  // Stats: Career high 34 pts vs Texas, recent inconsistency
  // Maryland transfer, Senior, SEC
  ['T5', 'Ja\'Kobi Gillespie', 'G', '6\' 1"', '180 lbs', 'Tennessee Volunteers', 'SEC', 'Senior', '0',
   '17.8', '3.2', '5.1', '44.3', '36.2', '81.5', '66', 'Primary PG', 'Watching',
   '52.6', '0.352', '1.97', '19-7', 'P6', 'Pre-Portal (Xfer)'],
  
  // Bennett Stirtz - Iowa, #2 on HoopsHQ watchlist
  // Stats: 6 straight 20-pt games, career-high 36 pts, Drake transfer, potential NBA 1st round
  // Note: Likely NBA Draft, but monitoring
  ['T5', 'Bennett Stirtz', 'G', '6\' 3"', '190 lbs', 'Iowa Hawkeyes', 'Big Ten', 'Senior', '0',
   '22.4', '3.5', '4.8', '50.7', '40.1', '78.2', '72', 'Primary PG/SG', 'Watching (NBA?)',
   '58.3', '0.275', '2.12', '18-7', 'P6', 'Pre-Portal (NBA Draft Risk)'],
];

async function run() {
  // First check current Portal Big Board to find last row
  const r = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:X125'
  });
  const rows = r.data.values || [];
  const lastRow = rows.length;
  
  console.log('Current Portal Big Board rows:', lastRow);
  console.log('Will append', NEW_TARGETS.length, 'rows starting at row', lastRow + 1);
  
  // Check if these players already exist
  const existingNames = rows.slice(1).map(r => r[1]).filter(Boolean);
  const alreadyExists = NEW_TARGETS.filter(t => t[1] && existingNames.includes(t[1]));
  if (alreadyExists.length > 0) {
    console.log('WARNING - These players already exist:', alreadyExists.map(t => t[1]).join(', '));
    return;
  }
  
  // Append new rows
  const appendRange = `Portal Big Board!A${lastRow + 1}:X${lastRow + NEW_TARGETS.length}`;
  
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: appendRange,
    valueInputOption: 'RAW',
    requestBody: { values: NEW_TARGETS }
  });
  
  console.log('✓ Successfully added', NEW_TARGETS.length, 'rows to Portal Big Board');
  console.log('New rows:', NEW_TARGETS.filter(r => r[0] === 'T5').map(r => r[1]).join(', '));
  
  // Verify
  const check = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A:A'
  });
  console.log('Total Portal Big Board rows now:', (check.data.values || []).length);
}

run().catch(e => {
  console.error('ERROR:', e.message);
  console.error(e.stack);
});
