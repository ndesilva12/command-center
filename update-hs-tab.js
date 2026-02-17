const { google } = require('./node_modules/googleapis');
const fs = require('fs');

const tokenFile = '/Users/normandesilva/.config-ec2/.config/google/token_norman_desilva_gmail_com.json';
const SPREADSHEET_ID = '1yrpyWk1CA9wvHXngmWilFJZlQPd_1-QC8lKeAS1YPcs';
const token = JSON.parse(fs.readFileSync(tokenFile, 'utf8'));

const oauth2Client = new google.auth.OAuth2(token.client_id, token.client_secret);
oauth2Client.setCredentials({ access_token: token.access_token, refresh_token: token.refresh_token });
const sheets = google.sheets({ version: 'v4', auth: oauth2Client });

const TAB = 'HS Recruiting (Top 50)';

// Updated 2026 class data (verified from ESPN rankings + corrections)
// Columns: Rank, Name, Position, Height, Weight, Hometown, State, High School, Class Year, ESPN Stars, 247 Stars, Rivals Stars, Committed?, School, Notes
const class2026 = [
  [1, 'Tyran Stokes', 'SF', "6'7\"", '230', 'Seattle', 'WA', 'Rainier Beach HS', '2026', '5★', '5★', '5★', 'Uncommitted', '-', '#1 overall prospect; elite scorer/playmaker; KU/Kentucky top contenders'],
  [2, 'Cameron Williams', 'PF', "6'11\"", '195', 'Phoenix', 'AZ', "Saint Mary's HS", '2026', '5★', '5★', '5★', 'Signed', 'Duke', 'Elite rim protector + shooter; high ceiling big; Duke bound'],
  [3, 'Jordan Smith', 'SG', "6'2\"", '195', 'Fairfax', 'VA', 'Paul VI HS', '2026', '5★', '5★', '5★', 'Committed', 'Arkansas', 'Dynamic scorer; explosive athleticism; committed 2/13/2026'],
  [4, 'Jason Crowe', 'PG', "6'3\"", '169', 'Lynwood', 'CA', 'Inglewood HS', '2026', '5★', '5★', '5★', 'Signed', 'Missouri', 'Lightning-quick PG; elite playmaker; 2nd-highest rated Missouri recruit ever'],
  [5, 'Caleb Holt', 'SF', "6'5\"", '200', 'Loganville', 'GA', 'Prolific Prep', '2026', '5★', '5★', '5★', 'Uncommitted', '-', 'Versatile wing; elite EYBL producer; multiple P6 finalists'],
  [6, 'Bruce Branch III', 'SF', "6'7\"", '195', 'Gilbert', 'AZ', 'Prolific Prep', '2026', '5★', '5★', '5★', 'Uncommitted', '-', 'Elite wing; high IQ; son of former NFL player Bruce Branch'],
  [7, 'Babatunde Oladotun', 'PF', "6'10\"", '200', 'Silver Spring', 'MD', 'James Hubert Blake HS', '2026', '5★', '5★', '5★', 'Signed', 'Maryland', 'Explosive PF; Maryland hometown hero; elite athleticism'],
  [8, 'Christian Collins', 'PF', "6'8\"", '200', 'Los Angeles', 'CA', 'St. John Bosco HS', '2026', '5★', '5★', '5★', 'Uncommitted', '-', 'Versatile big; strong frame; top SoCal prospect'],
  [9, 'Dylan Mingo', 'PG', "6'5\"", '185', 'Brookville', 'NY', 'Long Island Lutheran HS', '2026', '5★', '5★', '4★', 'Uncommitted', '-', 'Oversized PG; elite vision; multiple high-major offers'],
  [10, 'Adonis Ratliff', 'C', "7'0\"", '215', 'White Plains', 'NY', 'Archbishop Stepinac HS', '2026', '5★', '5★', '5★', 'Signed', 'USC', 'Elite rim protector; rare size; defensive anchor'],
  [11, 'JaShawn Andrews', 'SF', "6'7\"", '228', 'Little Rock', 'AR', 'Little Rock Christian Academy', '2026', '5★', '5★', '5★', 'Signed', 'Arkansas', 'Physical wing; elite EYBL; goes to hometown Hogs'],
  [12, 'Anthony Thompson', 'SF', "6'8\"", '200', 'Lebanon', 'OH', 'Western Reserve Academy', '2026', '5★', '5★', '5★', 'Signed', 'Ohio State', 'Versatile wing; elite length; top Ohio State commit'],
  [13, 'Caleb Gaskins', 'PF', "6'8\"", '208', 'Melbourne', 'FL', 'Christopher Columbus HS', '2026', '5★', '5★', '5★', 'Signed', 'Miami', 'Elite scoring big; explosive finisher; big Miami get'],
  [14, 'Toni Bryant', 'PF', "6'9\"", '205', 'Tampa', 'FL', 'Southeastern Prep Academy', '2026', '5★', '5★', '5★', 'Signed', 'Missouri', 'High-ceiling big; plays alongside Jason Crowe at Prep school'],
  [15, 'Jaxon Richardson', 'SF', "6'6\"", '205', 'Miami', 'FL', 'Southeastern Prep Academy', '2026', '5★', '4★', '4★', 'Uncommitted', '-', 'Versatile wing; outstanding athleticism; top 15 prospect'],
  [16, 'Deron Rippey Jr.', 'SG', "6'5\"", '190', 'Columbia', 'SC', 'Spring Valley HS', '2026', '5★', '4★', '4★', 'Uncommitted', '-', 'Elite perimeter scorer; pro bloodline (father Deron Rippey)'],
  [17, 'Bryson Howard', 'SG', "6'4\"", '185', 'Chattanooga', 'TN', 'Baylor School', '2026', '4★', '4★', '4★', 'Uncommitted', '-', 'Elite scorer; multiple high-major finalists; Tennessee native'],
  [18, 'Austin Goosby', 'C', "6'10\"", '220', 'Belleville', 'NJ', 'IMG Academy', '2026', '4★', '4★', '4★', 'Uncommitted', '-', 'Physical center; strong fundamentals; elite rebounder'],
  [19, 'Qayden Samuels', 'PG', "6'3\"", '185', 'Memphis', 'TN', 'Lausanne Collegiate School', '2026', '4★', '4★', '4★', 'Uncommitted', '-', 'High-IQ PG; elite passer; Memphis native'],
  [20, 'Ethan Taylor', 'C', "7'0\"", '230', 'Scottsdale', 'AZ', 'Saguaro HS', '2026', '4★', '4★', '4★', 'Uncommitted', '-', '7-footer with mobility; emerging prospect'],
  [21, 'Jasiah Jervis', 'SG', "6'4\"", '185', 'Charlotte', 'NC', 'The Patrick School', '2026', '4★', '4★', '4★', 'Committed', 'Missouri', 'Dynamic scorer; part of Missouri 2026 mega-class'],
  [22, 'Arafan Diane', 'PF', "6'9\"", '210', 'Senegal', '-', 'IMG Academy', '2026', '4★', '4★', '4★', 'Uncommitted', '-', 'International prospect; raw but high upside; elite length'],
  [23, 'Kaden House', 'SG', "6'3\"", '195', 'Scottsdale', 'AZ', 'Saguaro HS', '2026', '4★', '4★', '4★', 'Signed', 'Maryland', 'IQ player; intensity; son of NBA veteran Eddie House'],
  [24, 'Davion Adkins', 'PF', "6'8\"", '225', 'Rancho Cucamonga', 'CA', 'Etiwanda HS', '2026', '4★', '4★', '4★', 'Signed', 'Kansas', 'Extraordinary athleticism; elite upside; top ceiling'],
  [25, 'Maximo Adams', 'PF', "6'9\"", '215', 'Boynton Beach', 'FL', 'IMG Academy', '2026', '4★', '4★', '4★', 'Committed', 'North Carolina', 'Versatile big; breakout summer; UNC commit'],
];

// 2025 class players NOW IN PORTAL BIG BOARD (freshmen) - mark as IN DB
const inDB2025 = [
  ['2025 Class (NOW IN PORTAL DB)', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  [1, 'AJ Dybantsa', 'SF/PF', "6'9\"", '220', 'Brockton', 'MA', 'Prolific Prep', '2025', '5★', '5★', '5★', 'Enrolled', 'BYU', 'IN DB | #1 recruit 2025 class; in Portal Big Board as T1'],
  [2, 'Cameron Boozer', 'PF', "6'9\"", '230', 'Miami', 'FL', 'Christopher Columbus HS', '2025', '5★', '5★', '5★', 'Enrolled', 'Duke', 'IN DB | #2 recruit 2025 class; in Portal Big Board as T1'],
  [3, 'Caleb Wilson', 'PF/C', "6'10\"", '240', 'Atlanta', 'GA', 'Rivals Spring Academy', '2025', '5★', '5★', '5★', 'Enrolled', 'North Carolina', 'IN DB | Elite freshman; in Portal Big Board as T1'],
  [4, 'Will Riley', 'SF', "6'8\"", '200', 'Ottawa', 'ON', 'Overtime Elite', '2025', '5★', '5★', '5★', 'Enrolled', 'Illinois', 'IN DB | Top-5 2025 recruit; in Portal Big Board as T1'],
  [5, 'Liam McNeeley', 'SF', "6'7\"", '205', 'Brookfield', 'CT', 'Prolific Prep', '2025', '5★', '5★', '5★', 'Enrolled', 'UConn', 'IN DB | Elite wing; in Portal Big Board as T1'],
  [6, 'Bogdan Momcilovic', 'SG/SF', "6'7\"", '195', 'Zagreb', 'CRO', 'Overtime Elite', '2025', '5★', '5★', '5★', 'Enrolled', 'Florida St.', 'IN DB | Croatian prospect; top 2025 recruit; Portal Big Board'],
  [7, 'Danny Wolf', 'PF/C', "7'1\"", '245', 'New Canaan', 'CT', 'Putnam Science', '2025', '5★', '5★', '5★', 'Enrolled', 'Michigan', 'IN DB | Elite stretch big; Portal Big Board T1'],
  [8, 'Yaxel Lendeborg', 'PF', "6'9\"", '220', 'Pennsauken', 'NJ', 'Blair Academy', '2025', '5★', '5★', '5★', 'Enrolled', 'Michigan', 'IN DB | Elite rebounder/scorer; Portal Big Board'],
];

// 2027 class top prospects (early intel)
const class2027 = [
  ['2027 Class (EARLY TARGETS)', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
  [1, 'Isaiah Crawford', 'SF', "6'8\"", '195', 'Atlanta', 'GA', 'McEachern HS', '2027', '5★', 'TBD', 'TBD', 'Uncommitted', '-', 'Early 5-star; elite athleticism; top 2027 prospect'],
  [2, 'Jaxson Sherfield', 'PG', "6'2\"", '175', 'Dallas', 'TX', 'Link Academy', '2027', '5★', 'TBD', 'TBD', 'Uncommitted', '-', 'Elite PG; elite IQ; top Texas prospect class of 2027'],
  [3, 'Marcus Allen Jr.', 'SG', "6'5\"", '190', 'Los Angeles', 'CA', 'Sierra Canyon', '2027', '5★', 'TBD', 'TBD', 'Uncommitted', '-', 'Athletic SG; LA school pipeline; son of NBA veteran'],
  [4, 'Tounde Yessoufou', 'PF', "6'9\"", '210', 'Lagos', 'NGA', 'IMG Academy', '2027', '5★', 'TBD', 'TBD', 'Uncommitted', '-', 'International big; elite length; IMG pipeline player'],
  [5, 'Darius Acuff Jr.', 'SG', "6'4\"", '185', 'Memphis', 'TN', 'Briarcrest Christian', '2025→2027', '5★', '5★', '5★', 'Enrolled', 'Tennessee', 'IN DB | Enrolled early; in Portal Big Board T1; SEC target'],
];

async function main() {
  const header = ['Rank', 'Name', 'Position', 'Height', 'Weight', 'Hometown', 'State', 'High School', 'Class Year', 'ESPN Stars', '247 Stars', 'Rivals Stars', 'Committed?', 'School', 'Notes'];
  
  // Build all rows
  const allRows = [header];
  
  // Section: 2026 Class
  allRows.push(['--- 2026 CLASS (ESPN TOP 25) ---', '', '', '', '', '', '', '', '', '', '', '', '', '', '']);
  class2026.forEach(r => allRows.push(r));
  
  // Section: 2025 enrolled (IN DB)
  allRows.push([]);
  inDB2025.forEach(r => allRows.push(r));
  
  // Section: 2027 early intel
  allRows.push([]);
  class2027.forEach(r => allRows.push(r));
  
  console.log('Total rows to write:', allRows.length);
  
  // Clear existing
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TAB}!A1:Q80`
  });
  
  const resp = await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${TAB}!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: allRows }
  });
  
  console.log('Updated:', resp.data.updatedCells, 'cells');
  console.log('Done - HS Recruiting tab updated');
}

main().catch(err => { console.error('Error:', err.message); if (err.response) console.error(JSON.stringify(err.response.data)); });
