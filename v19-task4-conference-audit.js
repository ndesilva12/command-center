// V19 Task 4: Conference Sortability Audit
// Standardize all conference names to consistent format

const { google } = require('/Users/normandesilva/command-center/command-center/node_modules/googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';

// Standard conference name mapping
const CONF_STANDARDS = {
  // Big 12
  'big 12': 'Big 12',
  'big12': 'Big 12',
  'big-12': 'Big 12',
  'b12': 'Big 12',
  'big twelve': 'Big 12',
  
  // Big Ten
  'big ten': 'Big Ten',
  'big-ten': 'Big Ten',
  'big10': 'Big Ten',
  'b10': 'Big Ten',
  'big 10': 'Big Ten',
  
  // ACC
  'acc': 'ACC',
  'atlantic coast': 'ACC',
  'atlantic coast conference': 'ACC',
  
  // SEC
  'sec': 'SEC',
  'southeastern': 'SEC',
  'southeastern conference': 'SEC',
  
  // Pac-12 / Pac-12 remnants (West Coast now different conferences)
  'pac-12': 'Pac-12',
  'pac 12': 'Pac-12',
  'pac12': 'Pac-12',
  
  // American Athletic
  'american': 'American',
  'aac': 'American',
  'american athletic': 'American',
  'american athletic conference': 'American',
  
  // Mountain West
  'mountain west': 'Mountain West',
  'mwc': 'Mountain West',
  'mtn west': 'Mountain West',
  
  // West Coast Conference
  'wcc': 'WCC',
  'west coast': 'WCC',
  'west coast conference': 'WCC',
  
  // Big East
  'big east': 'Big East',
  'bigeast': 'Big East',
  
  // A-10
  'a-10': 'A-10',
  'atlantic 10': 'A-10',
  'atlantic ten': 'A-10',
  'a10': 'A-10',
  
  // Conference USA
  'c-usa': 'C-USA',
  'cusa': 'C-USA',
  'conference usa': 'C-USA',
  'conference u.s.a.': 'C-USA',
  
  // Sun Belt
  'sun belt': 'Sun Belt',
  'sunbelt': 'Sun Belt',
  'sbc': 'Sun Belt',
  
  // MVC / Missouri Valley
  'mvc': 'MVC',
  'missouri valley': 'MVC',
  'missouri valley conference': 'MVC',
  
  // Big South
  'big south': 'Big South',
  
  // MAC
  'mac': 'MAC',
  'mid-american': 'MAC',
  'mid american': 'MAC',
  
  // Horizon League
  'horizon': 'Horizon',
  'horizon league': 'Horizon',
  
  // OVC
  'ovc': 'OVC',
  'ohio valley': 'OVC',
  
  // CUSA
  'southland': 'Southland',
  
  // Independents
  'independent': 'Independent',
  'ind': 'Independent',
  'independents': 'Independent',
};

function standardizeConf(raw) {
  if (!raw) return null;
  const lower = raw.toLowerCase().trim();
  return CONF_STANDARDS[lower] || null; // return null if no change needed
}

async function getAuth() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const auth = new google.auth.OAuth2(token.client_id, token.client_secret);
  auth.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
  return auth;
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });
  const SHEET = 'Portal Big Board';

  // Read all rows
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${SHEET}'!A1:AT160`
  });
  const rows = resp.data.values || [];
  const headers = rows[0];
  
  // Column G (index 6) = Conference
  const confColIdx = 6;
  const confColLetter = 'G';
  console.log(`Conference column (${confColLetter}): "${headers[confColIdx]}"`);

  // Collect all unique conference values
  const confValues = new Map(); // value -> [row numbers]
  for (let i = 1; i < rows.length; i++) {
    const conf = rows[i][confColIdx] || '';
    if (!confValues.has(conf)) confValues.set(conf, []);
    confValues.get(conf).push(i + 1);
  }

  console.log('\nAll unique conference values found:');
  for (const [conf, rowNums] of confValues.entries()) {
    const standardized = standardizeConf(conf);
    const needsFix = standardized !== null && standardized !== conf;
    console.log(`  "${conf}" (${rowNums.length} rows)${needsFix ? ` → "${standardized}"` : ' ✓'}`);
  }

  // Build updates for non-standard entries
  const updates = [];
  const inconsistencies = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const conf = row[confColIdx] || '';
    const standardized = standardizeConf(conf);
    
    if (standardized !== null && standardized !== conf) {
      const rowNum = i + 1;
      updates.push({
        range: `'${SHEET}'!${confColLetter}${rowNum}`,
        values: [[standardized]]
      });
      inconsistencies.push({
        row: rowNum,
        player: row[1],
        original: conf,
        standardized
      });
    }
  }

  console.log(`\nInconsistencies found: ${inconsistencies.length}`);
  inconsistencies.forEach(inc => {
    console.log(`  Row ${inc.row}: ${inc.player} | "${inc.original}" → "${inc.standardized}"`);
  });

  if (updates.length > 0) {
    const updateResp = await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        valueInputOption: 'RAW',
        data: updates
      }
    });
    console.log(`\n✅ Updated ${updateResp.data.totalUpdatedCells} conference cells`);
  } else {
    console.log('\n✅ All conference names are already standardized — no changes needed');
  }

  const result = {
    task: 'task4-conference-audit',
    success: true,
    uniqueConferences: [...confValues.keys()],
    inconsistenciesFound: inconsistencies.length,
    inconsistencies,
    updatesApplied: updates.length
  };

  fs.writeFileSync('/tmp/v19-task4-result.json', JSON.stringify(result, null, 2));
  console.log('Result saved to /tmp/v19-task4-result.json');
  return result;
}

main().catch(e => {
  console.error('ERROR:', e.message);
  if (e.response) console.error('Response:', JSON.stringify(e.response.data));
  process.exit(1);
});
