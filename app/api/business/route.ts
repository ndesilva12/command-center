import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_GATEWAY = 'http://3.141.47.151:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { businessName, location } = body;

    if (!businessName || typeof businessName !== 'string' || !businessName.trim()) {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 });
    }
    if (!location || typeof location !== 'string' || !location.trim()) {
      return NextResponse.json({ error: 'Location is required' }, { status: 400 });
    }

    const biz = businessName.trim();
    const loc = location.trim();

    const prompt = `Run a full private business intelligence investigation on "${biz}" in "${loc}".

RESEARCH METHODOLOGY:
1. Use SearXNG for searches: curl -s "http://localhost:8888/search?q=QUERY&format=json&categories=general" | python3 -c "import sys,json; [print(f'{r[\\"title\\"]}\\n{r[\\"url\\"]}\\n{r.get(\\"content\\",\\"\\")[:200]}\\n') for r in json.load(sys.stdin).get('results',[])[:15]]"
   If SearXNG is down, fall back to web_search tool.

2. Search ALL these angles:
   - "${biz} ${loc}"
   - "${biz} secretary of state" (include state name)
   - "${biz} ${loc} reviews"
   - "${biz} ${loc} owner"
   - "${biz} BBB"
   - "${biz} ${loc} court records"
   - "${biz} ${loc} licenses"
   - "${biz} UCC filings"

3. Use web_fetch on the 8-12 best source URLs found

4. KEY: Find ACTUAL LINKS to state websites — Secretary of State business search, UCC filings, court records, licenses, liens

5. CONSPIRACY LENS AT 1000%: The suspiciousFindings field should go full rabbit hole — shell company indicators, unusual patterns, connected entities, anything that doesn't add up

OUTPUT: Build a JSON object with this exact schema and save to Firestore:

{
  "businessName": "${biz}",
  "location": "${loc}",
  "searchQuery": "business intel on ${biz} in ${loc}",
  "summary": "What the company is, plain English",
  "keyFacts": ["bullet points"],
  "filings": [{"source": "...", "url": "https://...", "type": "registration|ucc|lien", "details": "..."}],
  "publicRecords": [{"source": "...", "url": "...", "type": "court|license|bbb|review", "summary": "..."}],
  "officers": [{"name": "...", "title": "...", "source": "..."}],
  "relatedEntities": [{"name": "...", "relationship": "..."}],
  "suspiciousFindings": "Full conspiracy analysis...",
  "insights": "AI-generated analysis",
  "sources": [{"title": "...", "url": "..."}],
  "timestamp": "ISO-8601 now",
  "confidenceScore": 0-100,
  "status": "completed"
}

CRITICAL — SAVE TO FIRESTORE (do BOTH):
1. Save to business_history:
   cd /home/ubuntu/command-center && node scripts/save-to-firestore.js business_history '<YOUR_JSON>'

2. Save to jimmy_deliverables:
   cd /home/ubuntu/command-center && node scripts/save-to-firestore.js jimmy_deliverables '{"title":"Business Intel: ${biz}","date":"${new Date().toISOString().split('T')[0]}","status":"completed","preview":"Business intelligence report for ${biz} in ${loc}","content":"<MARKDOWN REPORT>","createdBy":"cc_jimmy_command","commandText":"business intel on ${biz} in ${loc}"}'

Make sure to escape JSON properly. Do the research thoroughly, then save.`;

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
          label: `business-${biz.slice(0, 30)}`,
          cleanup: 'keep',
          runTimeoutSeconds: 120
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
      return NextResponse.json({
        success: true,
        runId: spawnResult.runId,
        message: 'Business intel started - results will appear when complete',
        businessName: biz,
        location: loc
      });
    }

    console.error('Unexpected spawn response:', JSON.stringify(data, null, 2));
    return NextResponse.json({ error: 'Failed to start business intel', details: data }, { status: 500 });

  } catch (error) {
    console.error('Business API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
