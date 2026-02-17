const fs = require('fs');

// Parse the barttorvik CSV to extract Net Adj Rtg for the "est." players
const csvData = fs.readFileSync('/tmp/barttorvik-2026.csv', 'utf8');

// Parse CSV (values are comma separated with quotes)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

const lines = csvData.trim().split('\n');
console.log('Total CSV lines:', lines.length);

// Parse first line to understand structure (no header, check first few fields)
const sample = parseCSVLine(lines[0]);
console.log('First line columns count:', sample.length);
console.log('First line sample:', sample.slice(0, 15));

// Based on typical BartTorvik structure, let's identify columns by parsing known players
// Look for AJ Dybantsa
const ajLine = lines.find(l => l.includes('AJ Dybantsa'));
if (ajLine) {
  const aj = parseCSVLine(ajLine);
  console.log('\nAJ Dybantsa full row:');
  aj.forEach((v, i) => console.log(`  [${i}]: ${v}`));
}

// Look for Cameron Boozer
const cbLine = lines.find(l => l.includes('Cameron Boozer'));
if (cbLine) {
  const cb = parseCSVLine(cbLine);
  console.log('\nCameron Boozer columns (35-55):');
  cb.slice(35, 55).forEach((v, i) => console.log(`  [${i+35}]: ${v}`));
}
