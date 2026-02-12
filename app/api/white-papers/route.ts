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
   - Ron Paul lens (libertarian, anti-war, anti-Fed)
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

DO NOT:
- Do more than 2 searches
- Fetch full articles
- Over-research
- Save to Firestore yourself

DO:
1. Understand what "${topic}" means
2. Search ONCE for worldview (Mises/Cato/Reason)
3. Search ONCE for general/academic
4. Pick 3 from each
5. OUTPUT JSON NOW`;

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
      const childSessionKey = spawnResult.childSessionKey;
      
      // Poll for completion (max 90s)
      const maxWaitTime = 90000; // 90 seconds
      const pollInterval = 2000; // 2 seconds
      const startTime = Date.now();
      
      while (Date.now() - startTime < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        // Check session history for results
        const historyResponse = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tool: 'sessions_history',
            args: {
              sessionKey: childSessionKey,
              limit: 5,
              includeTools: false
            }
          })
        });
        
        if (historyResponse.ok) {
          const historyData = await historyResponse.json();
          // Handle /tools/invoke wrapper structure
          const historyResult = historyData?.result?.details || historyData?.result || {};
          const messages = historyResult?.messages || [];
          
          // Find the last assistant message
          const lastAssistant = messages.reverse().find((m: any) => m.role === 'assistant');
          
          if (lastAssistant && lastAssistant.content) {
            // Try to extract JSON from the response
            const content = Array.isArray(lastAssistant.content) 
              ? lastAssistant.content.map((c: any) => c.text || c).join('\n')
              : lastAssistant.content;
            
            const jsonMatch = content.match(/\{[\s\S]*"papers"[\s\S]*\}/);
            
            if (jsonMatch) {
              try {
                const result = JSON.parse(jsonMatch[0]);
                
                // Save to Firestore if requested
                if (save) {
                  try {
                    const db = getAdminDb();
                    await db.collection('white_papers_history').add({
                      ...result,
                      timestamp: new Date().toISOString()
                    });
                  } catch (saveError) {
                    console.error('Failed to save to Firestore:', saveError);
                    // Continue anyway - return results even if save fails
                  }
                }
                
                return NextResponse.json(result);
              } catch (e) {
                // Continue polling if JSON parse fails
              }
            }
          }
        }
      }
      
      // Timeout
      return NextResponse.json(
        { error: 'Research timed out - topic may be too complex or spawn failed' },
        { status: 504 }
      );
    }
    
    // Unexpected response - log for debugging
    console.error('Unexpected spawn response:', JSON.stringify(data, null, 2));
    return NextResponse.json(
      { error: 'Unexpected spawn response', details: data },
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
