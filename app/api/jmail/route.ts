import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_GATEWAY = process.env.OPENCLAW_GATEWAY || 'http://localhost:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';
const DB_PATH = '/Users/normandesilva/.openclaw/workspace/jmail/epstein_emails.db';

export async function GET() {
  return NextResponse.json({ status: 'JMail API ready' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, mode } = body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (mode === 'keyword') {
      // Execute SQLite query via OpenClaw gateway
      const escapedQuery = query.trim().replace(/'/g, "''");
      const sql = `SELECT emails.sender_name, emails.sender_email, emails.subject, emails.sent_at, substr(emails.content_markdown, 1, 500) as preview FROM emails_fts JOIN emails ON emails_fts.rowid = emails.rowid WHERE emails_fts MATCH '${escapedQuery}' ORDER BY rank LIMIT 50`;
      
      const command = `cd /Users/normandesilva/.openclaw/workspace/jmail && node -e "const db = require('better-sqlite3')('epstein_emails.db', {readonly:true}); const results = db.prepare(\\\`${sql}\\\`).all(); console.log(JSON.stringify(results));"`;

      const response = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'exec',
          args: {
            command: command,
            timeout: 30
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Gateway error: ${response.status}`, details: errorText },
          { status: 500 }
        );
      }

      const data = await response.json();
      
      if (data.error) {
        return NextResponse.json(
          { error: 'Query execution failed', details: data.error },
          { status: 500 }
        );
      }

      // Parse the stdout from exec
      let results = [];
      try {
        const stdout = data.result?.stdout || '';
        results = JSON.parse(stdout);
      } catch (e) {
        console.error('Failed to parse results:', e);
      }

      return NextResponse.json({
        results,
        count: results.length
      });

    } else if (mode === 'jimmy') {
      // Send to main session for natural language analysis
      const prompt = `JMail archive query from Command Center:

"${query}"

Database: ${DB_PATH}
Use the jmail database to answer this query. Provide a concise analysis.`;

      const response = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'sessions_send',
          args: {
            sessionKey: 'agent:main:main',
            message: prompt
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        return NextResponse.json(
          { error: `Gateway error: ${response.status}`, details: errorText },
          { status: 500 }
        );
      }

      return NextResponse.json({
        jimmy_response: "Query sent to Jimmy. Check Telegram for analysis.",
        query_sent: true
      });

    } else {
      return NextResponse.json(
        { error: 'Invalid mode. Must be "keyword" or "jimmy"' },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('JMail API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
