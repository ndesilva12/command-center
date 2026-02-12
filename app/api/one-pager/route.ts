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

    // Spawn intelligent sub-agent for research and synthesis
    const prompt = `Create a comprehensive one-pager on: "${topic}"

CRITICAL CONTEXT UNDERSTANDING:
- "Austrian Economics" = Mises/Hayek/Rothbard school (NOT Austria country)
- "Iran-Contra" = 1980s Reagan scandal (NOT Iranian economics)
- Understand the topic's actual meaning before researching
- Apply intelligence and context, not keyword matching

ONE-PAGER STRUCTURE:

📋 **EXECUTIVE SUMMARY** (2-3 sentences)
- What is this? Core definition
- Why does it matter?
- Key takeaway

📊 **KEY DATA** (Table format)
- 4-6 critical metrics/facts
- Numbers, dates, key figures
- Quantifiable insights

📈 **VISUAL CONCEPT** (Description for chart/diagram)
- Describe what visualization would best show the data
- E.g., "Timeline showing...", "Flow diagram of...", "Bar chart comparing..."

🎯 **KEY POINTS** (6-8 bullets)
- Most important insights
- Apply Ron Paul political lens where relevant
- First-principles thinking
- Austrian economics perspective if applicable

🔍 **CONTEXT & IMPLICATIONS**
- Historical background
- Current state
- Future implications
- Libertarian/individualist analysis

📚 **FURTHER READING** (3-5 links)
- Mix of worldview-aligned and mainstream sources
- Academic papers, think tank analyses, primary sources

RESEARCH STRATEGY:
- Use web_search for research (STRICT MAX 2 searches)
- Search 1: Overview + key facts
- Search 2: Ron Paul/libertarian analysis OR mainstream academic
- Output JSON IMMEDIATELY after 2 searches

OUTPUT FORMAT (JSON):
{
  "topic": "${topic}",
  "timestamp": "ISO-8601",
  "executive_summary": "...",
  "key_data": [
    {"metric": "...", "value": "..."},
    ...
  ],
  "visual_concept": "...",
  "key_points": ["...", ...],
  "context": "...",
  "further_reading": [
    {"title": "...", "url": "...", "source": "..."}
  ]
}

OUTPUT PRIORITY:
1. OUTPUT THE COMPLETE JSON FIRST (most important)
2. If time/tokens remain, optionally save to Firestore collection 'one_pagers_history'
3. But JSON output is mandatory - saving is secondary

Think step by step:
1. What does "${topic}" actually mean?
2. What are 2-3 intelligent search queries?
3. Search and collect key information
4. Synthesize with Ron Paul lens
5. OUTPUT THE JSON IMMEDIATELY

CRITICAL: Limit to 3 searches max. Output results promptly.`;

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
          label: `one-pager-${topic.slice(0, 30)}`,
          cleanup: 'keep',
          runTimeoutSeconds: 60  // 60s for 2 searches + synthesis
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
      
      // Poll for completion (max 60s to stay under Vercel timeout)
      const maxWaitTime = 55000; // 55 seconds (buffer for Vercel 60s limit)
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
            
            const jsonMatch = content.match(/\{[\s\S]*"executive_summary"[\s\S]*\}/);
            
            if (jsonMatch) {
              try {
                const result = JSON.parse(jsonMatch[0]);
                
                // Save to Firestore if requested
                if (save) {
                  try {
                    const db = getAdminDb();
                    await db.collection('one_pagers_history').add({
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
        { error: 'Research timed out - topic may be too complex' },
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
    console.error('One-pager error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate one-pager' },
      { status: 500 }
    );
  }
}
