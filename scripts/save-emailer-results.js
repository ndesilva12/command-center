#!/usr/bin/env node
/**
 * Parse emailer output and save to Firestore.
 * Usage: node save-emailer-results.js <sender> <subject> <dryRun> <outputFile>
 */
const fs = require('fs');
const { execSync } = require('child_process');

const [,, sender, subject, dryRun, outputFile] = process.argv;

if (!sender || !subject || !outputFile) {
  console.error('Usage: node save-emailer-results.js <sender> <subject> <dryRun> <outputFile>');
  process.exit(1);
}

const lines = fs.readFileSync(outputFile, 'utf8').trim().split('\n');
const recipients = [];
let summary = null;

for (const line of lines) {
  try {
    const d = JSON.parse(line);
    if (d.summary) {
      summary = d.summary;
    } else if (d.index) {
      recipients.push({
        name: d.name || '',
        email: d.email || '',
        status: d.status || 'UNKNOWN',
        trackingId: d.trackingId || '',
        detail: d.detail || '',
        subject: d.subject || '',
      });
    }
  } catch {}
}

const doc = {
  sender,
  subject,
  recipientCount: recipients.length,
  dryRun: dryRun === 'true',
  timestamp: new Date().toISOString(),
  recipients,
  sent: summary ? summary.sent : 0,
  failed: summary ? summary.failed : 0,
  dry_run_count: summary ? (summary.dry_run || 0) : 0,
};

// Write to temp file, then save via save-to-firestore.js
const tmpPath = '/tmp/emailer_doc.json';
fs.writeFileSync(tmpPath, JSON.stringify(doc));

try {
  execSync(`node ${__dirname}/save-to-firestore.js emailer_history '${fs.readFileSync(tmpPath, 'utf8').replace(/'/g, "'\\''")}'`, {
    stdio: 'inherit',
    cwd: __dirname + '/..',
  });
  console.log(`✅ Saved emailer history: ${recipients.length} recipients, ${summary?.sent || 0} sent, ${summary?.failed || 0} failed`);
} catch (err) {
  console.error('Failed to save to Firestore:', err.message);
}

// Cleanup
try { fs.unlinkSync(tmpPath); } catch {}
