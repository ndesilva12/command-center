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
    const prompt = `Find 10 white papers, academic papers, and research on: "${topic}"

CRITICAL CONTEXT UNDERSTANDING:
- "Austrian Economics" refers to the Mises/Hayek/Rothbard SCHOOL OF THOUGHT, not Austria the country
- "Iran-Contra" refers to the 1980s Reagan scandal (arms-for-hostages), not Iranian economics
- Understand the topic's actual meaning before searching
- Apply intelligence and context, not just keyword matching

SPLIT YOUR RESULTS:

1. WORLDVIEW-ALIGNED (5 papers):
   - **Think like Dr. Ron Paul politically** (this is the primary worldview reference)
   - Libertarian/anarcho-capitalist perspective (Cato Institute, Reason Foundation, Mises Institute)
   - Austrian economics analysis (Mises, Hayek, Rothbard, Friedman)
   - Anti-war, anti-Fed, constitutional skepticism of government power
   - First-principles thinking, individual liberty focus
   
2. GENERAL/POPULAR (5 papers):
   - Mainstream academic research
   - Most cited or influential papers
   - Standard peer-reviewed journals
   - Establishment/conventional perspectives

SEARCH STRATEGY:
- Use web_search tool with intelligent queries (2-4 searches MAX)
- For "Iran-Contra": search "Iran-Contra affair", "Boland Amendment", "Oliver North", NOT "Iranian economy"
- For "Austrian Economics": search "Mises", "Hayek", "praxeology", NOT "Austria GDP"
- Think about what the topic ACTUALLY means
- Validate relevance before including
- OUTPUT JSON IMMEDIATELY after collecting 10 good papers (don't over-research)

OUTPUT FORMAT (JSON):
{
  "topic": "${topic}",
  "timestamp": "ISO-8601",
  "papers": {
    "worldview_aligned": [
      {"title": "...", "url": "...", "description": "...", "source": "..."}
    ],
    "general_popular": [
      {"title": "...", "url": "...", "description": "...", "source": "..."}
    ]
  },
  "total": 10
}

IMPORTANT: Just output the JSON. Do NOT try to save to Firestore yourself.
The API will handle saving after you return results.

Think step by step:
1. What does "${topic}" actually mean?
2. What are 2-3 intelligent search queries for this topic?
3. Search, collect ~15-20 results total
4. Filter for quality and relevance (pick best 10)
5. Split into worldview-aligned (5) vs. general (5)
6. OUTPUT THE JSON IMMEDIATELY (don't do more research)

CRITICAL: Output results after 2-4 searches. Don't exhaust token budget on research.
Focus on QUALITY and RELEVANCE over quantity.`;

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
          runTimeoutSeconds: 180  // 3 minutes for research + output
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
      
      // Poll for completion (max 3 minutes)
      const maxWaitTime = 180000; // 3 minutes  
      const pollInterval = 3000; // 3 seconds
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
