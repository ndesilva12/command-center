import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const OPENCLAW_GATEWAY = 'http://3.141.47.151:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, days = 30 } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Build intelligent L3D prompt
    const prompt = `Research the last ${days} days of developments on: "${topic}"

CRITICAL CONTEXT UNDERSTANDING:
- "Austrian Economics" = Mises/Hayek school (NOT Austria country)
- "Iran-Contra" = Reagan scandal (NOT Iranian economics)
- Understand topic meaning before searching

WORLDVIEW CONSIDERATIONS:
- Individualism and personal liberty
- Free markets and sound money
- Limited government
- Austrian economics perspective
- First-principles thinking

RESEARCH STRATEGY:
- Use web_search with freshness parameter
- Focus on last ${days} days (use freshness: "p${days}d")
- Find: news, analysis, discussions, developments
- MAX 3-4 searches total
- Mix of worldview-aligned + mainstream sources

SEARCH QUERIES (examples):
1. "${topic}" with freshness filter
2. "${topic} site:mises.org OR site:cato.org OR site:reason.com" (worldview)
3. "${topic} analysis OR commentary" (depth)
4. "${topic} site:reddit.com OR site:x.com" (discussion)

CATEGORIZATION:
- **Major Developments**: Big news, policy changes, significant events
- **Analysis & Commentary**: Think pieces, expert analysis
- **Discussions**: Reddit, X, community reactions
- **Data & Research**: Studies, reports, statistics

SCORING:
- Recency (newer = better)
- Intellectual rigor
- Ron Paul worldview alignment
- Source quality

OUTPUT FORMAT (JSON):
{
  "topic": "${topic}",
  "days": ${days},
  "timestamp": "ISO-8601",
  "categories": {
    "major_developments": [
      {
        "title": "...",
        "url": "...",
        "date": "...",
        "source": "...",
        "summary": "...",
        "worldview_note": "Ron Paul lens perspective"
      }
    ],
    "analysis_commentary": [...],
    "discussions": [...],
    "data_research": [...]
  },
  "key_takeaways": [
    "3-5 key insights from last ${days} days with worldview analysis"
  ],
  "total_items": 12
}

CRITICAL:
- MAX 3 searches (not 3-4)
- OUTPUT JSON IMMEDIATELY after research

CRITICAL - FIRESTORE SAVE:
After outputting the JSON above, IMMEDIATELY save to Firestore using exec tool:

Run this command:
node -e "const admin = require('firebase-admin'); const serviceAccount = require('/home/ubuntu/command-center/firebase-service-account.json'); if (!admin.apps.length) { admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }); } const db = admin.firestore(); const result = <YOUR_JSON_RESULT>; db.collection('l3d_history').add({ query: '${topic.trim()}', days: ${days}, timestamp: new Date().toISOString(), status: 'completed', saved_by: 'sub-agent', ...result }).then(() => { console.log('Saved to Firestore'); process.exit(0); }).catch(err => { console.error('Save error:', err); process.exit(1); });"

Replace <YOUR_JSON_RESULT> with your actual JSON result object.

This ensures results persist even if the API route times out.

Think step by step:
1. What does "${topic}" mean?
2. What are 3-4 search queries with freshness filters?
3. Search and collect ~15-20 recent items
4. Categorize into 4 buckets
5. Extract 3-5 key takeaways with Ron Paul analysis
6. OUTPUT JSON
7. SAVE TO FIRESTORE using exec command above`;

    // Spawn intelligent sub-agent
    const response = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'sessions_spawn',
        args: {
          task: prompt,
          label: `l3d-${topic.slice(0, 30)}`,
          cleanup: 'keep',
          runTimeoutSeconds: 50  // 50s for research (must finish before Vercel timeout)
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenClaw gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const spawnResult = data?.result?.details || data?.result;
    
    if (spawnResult?.status === 'accepted') {
      const runId = spawnResult.runId;
      
      // Fire-and-forget: Return immediately with runId
      // Sub-agent will save results to Firestore when complete
      return NextResponse.json({
        success: true,
        runId,
        message: 'Research started - results will appear in history when complete',
        topic: topic.trim(),
        days
      });
    }
    
    console.error('Unexpected spawn response:', JSON.stringify(data, null, 2));
    return NextResponse.json(
      { error: 'Failed to start research', details: data },
      { status: 500 }
    );
    
  } catch (error) {
    console.error('L3D API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
