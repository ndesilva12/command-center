import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_GATEWAY = 'http://3.141.47.151:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';

export async function POST(request: NextRequest) {
  try {
    const { topic, save = true } = await request.json();

    if (!topic || typeof topic !== 'string') {
      return NextResponse.json(
        { error: 'Topic or question is required' },
        { status: 400 }
      );
    }

    // Ask Jimmy (OpenClaw main session) to generate the one-pager
    const prompt = `Generate a comprehensive ONE-PAGER on: "${topic}"

The one-pager MUST include these exact sections in Markdown:

1. **EXECUTIVE SUMMARY** (2-3 sentences)
2. **KEY DATA TABLE** (one table with the most important metrics/data)
3. **VISUAL DESCRIPTION** (describe an ideal chart/graph for this topic)
4. **KEY POINTS** (8-12 bullet points)
5. **CONTEXT & IMPLICATIONS** (2-3 sentences on why this matters)
6. **FURTHER READING** (search Brave for 3-5 best links with descriptions)

${save ? 'IMPORTANT: Save the result to Firestore collection "one_pagers_history" with fields: topic, timestamp, content, links.' : ''}

Format as clean Markdown. Be concise, fact-dense, and actionable. Focus on what someone needs to know to understand this topic.

Worldview: Individual liberty, Austrian economics, first-principles thinking, evidence-based analysis.`;

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
        timeoutSeconds: 120
      })
    });

    if (!response.ok) {
      throw new Error(`OpenClaw API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Return the generated content
    return NextResponse.json({
      topic,
      timestamp: new Date().toISOString(),
      content: data.response || data.message || 'Generated content',
      links: []
    });
    
  } catch (error: any) {
    console.error('One-pager error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate one-pager' },
      { status: 500 }
    );
  }
}
