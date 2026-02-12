import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_GATEWAY = 'http://localhost:18789';
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

    // Ask Jimmy (OpenClaw main session) to find white papers
    const prompt = `Find the 10 MOST RELEVANT white papers, academic papers, dissertations, or in-depth research on: "${topic}"

Split into TWO categories:

**1. WORLDVIEW-ALIGNED (5 papers):**
Papers that align with: individualism, Austrian economics, libertarian thought, anarcho-capitalism, first-principles thinking, skepticism of collectivism/government intervention.

**2. GENERAL/POPULAR (5 papers):**
The most cited, mainstream, or academically significant papers on this topic (regardless of ideological alignment).

For EACH paper provide:
- Title
- URL (must be actual white paper/PDF/research, not just articles)
- Brief description (1-2 sentences)

Use Brave Search API (key: BSAN41sbCIBbhckWBTYmYAk_44Kug7g) with queries like:
- "${topic} white paper filetype:pdf"
- "${topic} academic paper"
- "${topic} research dissertation"
- "${topic} austrian economics" (for worldview-aligned)
- "${topic} mises.org OR libertarianism" (for worldview-aligned)

${save ? 'IMPORTANT: Save the result to Firestore collection "white_papers_history" with fields: topic, timestamp, papers (with worldview_aligned and general_popular arrays), total.' : ''}

Return as JSON with structure:
{
  "topic": "${topic}",
  "timestamp": "ISO-8601",
  "papers": {
    "worldview_aligned": [{title, url, description}],
    "general_popular": [{title, url, description}]
  },
  "total": 10
}`;

    // Call OpenClaw sessions/send API
    const response = await fetch(`${OPENCLAW_GATEWAY}/api/v1/sessions/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionKey: 'main',
        message: prompt,
        timeoutSeconds: 90
      })
    });

    if (!response.ok) {
      throw new Error(`OpenClaw API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Try to parse JSON from response
    let result;
    try {
      // Look for JSON in the response
      const jsonMatch = (data.response || data.message || '').match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (e) {
      // Fallback structure
      result = {
        topic,
        timestamp: new Date().toISOString(),
        papers: {
          worldview_aligned: [],
          general_popular: []
        },
        total: 0,
        raw_response: data.response || data.message
      };
    }
    
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('White papers error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to find white papers' },
      { status: 500 }
    );
  }
}
