import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const DB_PATH = '/Users/normandesilva/.openclaw/workspace/jmail/epstein_emails.db';
const OPENCLAW_GATEWAY = 'http://3.141.47.151:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';

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
      // Direct SQLite FTS search using CLI
      const escapedQuery = query.trim().replace(/'/g, "''");
      const sql = `SELECT emails.* FROM emails_fts JOIN emails ON emails_fts.rowid = emails.rowid WHERE emails_fts MATCH '${escapedQuery}' ORDER BY rank LIMIT 50`;
      
      try {
        const { stdout } = await execAsync(
          `sqlite3 -json "${DB_PATH}" "${sql}"`,
          { maxBuffer: 10 * 1024 * 1024 } // 10MB buffer
        );
        
        const results = JSON.parse(stdout || '[]');
        
        return NextResponse.json({
          results,
          count: results.length
        });
      } catch (error: any) {
        console.error('SQLite error:', error);
        return NextResponse.json(
          { error: 'Database query failed', details: error.message },
          { status: 500 }
        );
      }
    } else if (mode === 'jimmy') {
      // Send to main session for natural language analysis
      const prompt = `The user is searching Jeffrey Epstein's email archive (2002-2011) and asked:

"${query}"

Database: /Users/normandesilva/.openclaw/workspace/jmail/epstein_emails.db

Schema:
- emails table: id, doc_id, sender_name, sender_email, subject, sent_at, content_markdown, to_recipients, cc_recipients
- emails_fts: FTS5 virtual table on (sender_name, sender_email, subject, content_markdown, to_recipients)

Your task:
1. Understand the user's question
2. Query the database using sqlite3 CLI and FTS5 (if needed)
3. Provide a concise, insightful answer

Example query pattern:
sqlite3 -json "${DB_PATH}" "SELECT emails.* FROM emails_fts JOIN emails ON emails_fts.rowid = emails.rowid WHERE emails_fts MATCH 'search_term' ORDER BY rank LIMIT 50"

For statistical questions (e.g., "who did he email most"), you may need multiple queries or aggregations.

Respond with:
1. A brief natural language answer (2-3 sentences max)
2. Optionally, return relevant email results

Format your response with:
- First, your answer as plain text
- Then, if relevant, output a JSON block with results

Be concise and direct.`;

      const response = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          tool: 'sessions_send',
          args: {
            session: 'main',
            message: prompt
          }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenClaw gateway error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      // For now, return a placeholder indicating the request was sent
      // The main session will process this and respond
      return NextResponse.json({
        jimmy_response: "Query sent to Jimmy for analysis. Check your main session for the response.",
        results: [],
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
