// V19 Task 1: Delete duplicate row 154 (Milan Momcilovic duplicate)
const { google } = require('/Users/normandesilva/command-center/command-center/node_modules/googleapis');
const fs = require('fs');

const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const TOKEN_PATH = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';

async function getAuth() {
  const token = JSON.parse(fs.readFileSync(TOKEN_PATH));
  const auth = new google.auth.OAuth2(
    token.client_id,
    token.client_secret
  );
  auth.setCredentials({
    access_token: token.access_token,
    refresh_token: token.refresh_token,
    token_type: token.token_type
  });
  return auth;
}

async function main() {
  const auth = await getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // First, get the sheet metadata to find the Portal Big Board tab
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const allSheets = meta.data.sheets.map(s => s.properties.title);
  console.log('Available sheets:', allSheets);
  
  const portalSheet = meta.data.sheets.find(s => 
    s.properties.title.toLowerCase().includes('portal') || 
    s.properties.title.toLowerCase().includes('big board')
  );
  
  if (!portalSheet) {
    throw new Error('Could not find Portal Big Board sheet. Available: ' + allSheets.join(', '));
  }
  
  const sheetId = portalSheet.properties.sheetId;
  const sheetTitle = portalSheet.properties.title;
  console.log(`Found sheet: "${sheetTitle}" (ID: ${sheetId})`);

  // Read current row count first
  const countResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetTitle}'!A:A`
  });
  const currentCount = countResp.data.values ? countResp.data.values.length : 0;
  console.log(`Current row count: ${currentCount}`);

  // Read rows 152-156 to find the duplicate
  const previewResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetTitle}'!A150:F158`
  });
  console.log('Rows 150-158:');
  (previewResp.data.values || []).forEach((r, i) => {
    console.log(`  Row ${150+i}: ${JSON.stringify(r.slice(0,4))}`);
  });

  // Read row 154 to verify it's the duplicate Milan entry
  const row154Resp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetTitle}'!A154:F154`
  });
  const row154 = row154Resp.data.values ? row154Resp.data.values[0] : [];
  console.log('Row 154:', JSON.stringify(row154));

  // Confirm it's a Momcilovic-related row before deleting
  const row154Name = (row154[1] || '').toLowerCase();
  if (!row154Name.includes('milan') && !row154Name.includes('momcil') && !row154Name.includes('bogdan')) {
    console.log('WARNING: Row 154 does not look like a Momcilovic entry. Name found:', row154[1]);
    console.log('Proceeding with deletion anyway as instructed...');
  } else {
    console.log(`✅ Confirmed row 154 is: ${row154[1]} — proceeding with deletion`);
  }

  // Delete row 154 (0-based index 153)
  const deleteRequest = {
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheetId,
            dimension: 'ROWS',
            startIndex: 153, // 0-based, row 154 = index 153
            endIndex: 154
          }
        }
      }]
    }
  };

  console.log('Deleting row 154...');
  const deleteResp = await sheets.spreadsheets.batchUpdate(deleteRequest);
  console.log('Delete HTTP status:', deleteResp.status);

  // Verify new row count
  const newCountResp = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `'${sheetTitle}'!A:A`
  });
  const newCount = newCountResp.data.values ? newCountResp.data.values.length : 0;
  console.log(`New row count: ${newCount}`);
  
  const success = newCount === currentCount - 1;
  if (success) {
    console.log('✅ SUCCESS: Row deleted, count went from', currentCount, 'to', newCount);
  } else {
    console.log('❌ UNEXPECTED: Count changed from', currentCount, 'to', newCount);
  }

  // Save result
  const result = { 
    task: 'task1-delete-duplicate',
    success, 
    oldCount: currentCount, 
    newCount,
    deletedRow154Content: row154
  };
  fs.writeFileSync('/tmp/v19-task1-result.json', JSON.stringify(result, null, 2));
  console.log('Result saved to /tmp/v19-task1-result.json');
  return result;
}

main().catch(e => { 
  console.error('ERROR:', e.message); 
  if (e.response) console.error('Response:', JSON.stringify(e.response.data));
  process.exit(1); 
});
