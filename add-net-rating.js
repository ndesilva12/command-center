/**
 * Extract BartTorvik advanced stats and add to Portal Big Board
 * Fields: ORTG, DRTG, Net Rating, BPM-proxy, VORP-proxy
 */

const {google} = require('./node_modules/googleapis');
const fs = require('fs');

const token = JSON.parse(fs.readFileSync('/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json'));
const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
auth.setCredentials(token);
const sheets = google.sheets({version: 'v4', auth});
const SHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';

// Parse BartTorvik CSV
function parseLine(line) {
  const result = [];
  let inQuotes = false;
  let current = '';
  for (let c of line) {
    if (c === '"') { inQuotes = !inQuotes; }
    else if (c === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += c; }
  }
  result.push(current.trim());
  return result;
}

function loadBartTorvik() {
  const csv = fs.readFileSync('/tmp/barttorvik-2026.csv', 'utf8');
  const lines = csv.split('\n').filter(l => l.trim());
  
  const lookup = {};
  for (const line of lines) {
    const fields = parseLine(line);
    const name = (fields[0] || '').toLowerCase().trim();
    if (!name) continue;
    
    // Key fields based on analysis:
    // Field 46: ORTG (adjusted offensive efficiency)
    // Field 47: DRTG (adjusted defensive efficiency)  
    // Field 48: Net adj. rating
    // Field 50: Impact metric 1
    // Field 51: Impact metric 2
    // Field 52: Net impact
    // Field 53: VORP-like metric
    
    const ortg = parseFloat(fields[46]) || 0;
    const drtg = parseFloat(fields[47]) || 0;
    const netRating = parseFloat(fields[52]) || 0;  // BPM-like net impact
    const vorp = parseFloat(fields[53]) || 0;
    const minPct = parseFloat(fields[4]) || 0; // Min %
    
    lookup[name] = { 
      ortg, 
      drtg, 
      netAdj: ortg - drtg, // Net adjusted efficiency
      netRating, 
      vorp,
      minPct,
      team: fields[1] || ''
    };
  }
  
  return lookup;
}

async function run() {
  console.log('Loading BartTorvik data...');
  const btData = loadBartTorvik();
  console.log('BartTorvik players loaded:', Object.keys(btData).length);
  
  // Read Portal Big Board
  const pbResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!A1:Z130'
  });
  const pbRows = pbResp.data.values || [];
  console.log('Portal Big Board rows:', pbRows.length);
  
  // Check column headers
  const headers = pbRows[0];
  console.log('Current headers (last 5):', headers.slice(-5).join(' | '));
  
  // Add "Net Adj.Rtg" header at Z1
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: 'Portal Big Board!Z1',
    valueInputOption: 'RAW',
    requestBody: { values: [['Net Adj.Rtg']] }
  });
  
  // Fill in Net Adjusted Rating for each player
  const netValues = [];
  let found = 0, notFound = 0;
  
  const matchResults = [];
  
  for (let i = 1; i < pbRows.length; i++) {
    const row = pbRows[i];
    const playerName = (row[1] || '').toLowerCase().trim();
    const tier = row[0] || '';
    
    if (!playerName || tier.includes('NEW TARGETS') || tier.includes('WATCHLIST') || tier.includes('HOOPSHQ')) {
      netValues.push(['']);
      continue;
    }
    
    // Try exact match
    let btStats = btData[playerName];
    
    // Try last name + first initial match
    if (!btStats) {
      const nameParts = playerName.split(' ');
      const lastName = nameParts[nameParts.length - 1];
      const firstName = nameParts[0];
      
      // Search by last name
      const candidates = Object.keys(btData).filter(k => k.includes(lastName));
      if (candidates.length === 1) {
        btStats = btData[candidates[0]];
      } else if (candidates.length > 1) {
        // Try to match by first initial
        const bestMatch = candidates.find(k => k.split(' ')[0] === firstName || k.charAt(0) === firstName.charAt(0));
        if (bestMatch) btStats = btData[bestMatch];
      }
    }
    
    // Try partial match (first word of first name, last name)
    if (!btStats) {
      const nameParts = playerName.split(' ');
      const lastName = nameParts[nameParts.length - 1];
      const match = Object.keys(btData).find(k => {
        const kParts = k.split(' ');
        const kLast = kParts[kParts.length - 1];
        return kLast === lastName && kParts[0].charAt(0) === nameParts[0].charAt(0);
      });
      if (match) btStats = btData[match];
    }
    
    if (btStats) {
      const netAdj = btStats.netAdj.toFixed(1);
      netValues.push([netAdj]);
      found++;
      matchResults.push({ name: row[1], btName: Object.keys(btData).find(k => btData[k] === btStats), netAdj, ortg: btStats.ortg.toFixed(1), drtg: btStats.drtg.toFixed(1) });
    } else {
      netValues.push(['']);
      notFound++;
    }
  }
  
  // Update all Net Adjusted Ratings
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Portal Big Board!Z2:Z${pbRows.length}`,
    valueInputOption: 'RAW',
    requestBody: { values: netValues }
  });
  
  console.log(`\n✓ Added Net Adjusted Rating for ${found}/${found+notFound} Portal Big Board players`);
  console.log('Not found:', notFound);
  
  // Show top players by Net Adjusted Rating
  const topByNet = matchResults
    .filter(r => r.netAdj > 0)
    .sort((a, b) => parseFloat(b.netAdj) - parseFloat(a.netAdj));
  
  console.log('\nTop Portal Big Board players by Net Adjusted Rating (ORTG-DRTG):');
  topByNet.slice(0, 15).forEach((p, i) => {
    console.log(`  ${i+1}. ${p.netAdj} | ${p.name} | ORTG: ${p.ortg}, DRTG: ${p.drtg}`);
  });
  
  // Save progress
  const progress = JSON.parse(fs.readFileSync('/tmp/enrichment-progress-20260217.json') || '{}');
  progress.netRating = {
    timestamp: new Date().toISOString(),
    found,
    notFound,
    topPlayers: topByNet.slice(0, 5).map(p => ({ name: p.name, netAdj: p.netAdj }))
  };
  fs.writeFileSync('/tmp/enrichment-progress-20260217.json', JSON.stringify(progress, null, 2));
}

run().catch(e => {
  console.error('ERROR:', e.message);
  console.error(e.stack);
});
