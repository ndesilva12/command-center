import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const OPENCLAW_GATEWAY = 'http://3.141.47.151:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';

export async function POST(request: NextRequest) {
  try {
    const { topic, save = true } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    // Spawn intelligent sub-agent for research
    const prompt = `Find 6 white papers on: "${topic}"

CRITICAL CONTEXT:
- "Austrian Economics" = Mises/Hayek school, NOT Austria country
- "Iran-Contra" = Reagan scandal, NOT Iranian economics
- Understand topic meaning before searching

SPLIT (3 + 3):

1. WORLDVIEW-ALIGNED (3):
   - Libertarian/individualist perspective
   - Austrian economics (Mises, Hayek, Cato, Reason)
   
2. GENERAL (3):
   - Mainstream/academic
   - Most cited/influential

STRICT RESEARCH LIMITS:
- **MAXIMUM 2 searches total**
- Pick ONE search for worldview sources, ONE for general
- Use ONLY web_search (no web_fetch)
- Each search returns ~10 results - pick best 3 from each
- **OUTPUT JSON IMMEDIATELY after 2 searches**

EXAMPLE:
Search 1: "${topic} site:mises.org OR site:cato.org OR site:reason.com" → pick 3
Search 2: "${topic} academic paper OR research" → pick 3
OUTPUT JSON NOW

OUTPUT FORMAT:
{
  "topic": "${topic}",
  "timestamp": "ISO-8601",
  "papers": {
    "worldview_aligned": [{"title":"","url":"","description":"","source":""}],
    "general_popular": [{"title":"","url":"","description":"","source":""}]
  },
  "total": 6
}

CRITICAL - FIRESTORE SAVE:
After outputting the JSON above, IMMEDIATELY save to Firestore:

1. Output your complete JSON result
2. Use exec to run: node /home/ubuntu/command-center/scripts/save-to-firestore.js white_papers_history '{"topic":"${topic}","papers":...}'

Replace the JSON string with your actual result. Make sure to escape quotes properly.

Example:
exec: node /home/ubuntu/command-center/scripts/save-to-firestore.js white_papers_history '{"topic":"Bitcoin","timestamp":"2024-01-01T00:00:00Z","papers":{"worldview_aligned":[...],"general_popular":[...]},"total":6}'

This ensures results persist even if the API route times out.

DO:
1. Understand what "${topic}" means
2. Search ONCE for worldview (Mises/Cato/Reason)
3. Search ONCE for general/academic
4. Pick 3 from each
5. OUTPUT JSON
6. SAVE TO FIRESTORE using exec command above`;

    // Call OpenClaw gateway to spawn sub-agent
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
          label: `white-papers-${topic.slice(0, 30)}`,
          cleanup: 'keep',
          runTimeoutSeconds: 90  // 90s for 2 searches + output
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenClaw gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    
    // sessions_spawn returns immediately with status: "accepted"
    // Result is in data.result.details when called via /tools/invoke
    const spawnResult = data?.result?.details || data?.result;
    
    if (spawnResult?.status === 'accepted') {
      const runId = spawnResult.runId;
      
      // Fire-and-forget: Return immediately with runId
      // Sub-agent will save results to Firestore when complete
      return NextResponse.json({
        success: true,
        runId,
        message: 'Research started - results will appear in history when complete',
        topic
      });
    }
    
    // Unexpected response - log for debugging
    console.error('Unexpected spawn response:', JSON.stringify(data, null, 2));
    return NextResponse.json(
      { error: 'Failed to start research', details: data },
      { status: 500 }
    );
    
  } catch (error: any) {
    console.error('White papers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find white papers' },
      { status: 500 }
    );
  }
}
