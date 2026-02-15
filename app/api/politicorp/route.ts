import { NextRequest, NextResponse } from 'next/server';

const OPENCLAW_GATEWAY = 'http://3.141.47.151:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { company } = body;

    if (!company || typeof company !== 'string' || !company.trim()) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      );
    }

    const companyName = company.trim();

    const prompt = `Research the political leanings of "${companyName}" and produce a comprehensive political analysis.

RESEARCH STEPS:
1. Search for "${companyName} political donations FEC"
2. Search for "${companyName} lobbying OpenSecrets"
3. Search for "${companyName} CEO political statements"
4. Search for "${companyName} PAC contributions"
5. Search for "${companyName} policy positions ESG DEI"
6. Search for "${companyName} government contracts"
7. Search for "${companyName} controversy political"

Use web_search for each query. Then use web_fetch on the 8-12 most informative URLs.

POLITICAL COMPASS SCORING:
- economicScore: -100 (left/regulated) to +100 (right/free market)
- governmentScore: -100 (libertarian) to +100 (authoritarian)
- overallLeaning: Far Left|Left|Center-Left|Center|Center-Right|Right|Far Right
- confidenceScore: 0-100 based on evidence quality

OUTPUT: Build a complete JSON object with ALL of these fields:
{
  "companyName": "${companyName}",
  "ticker": "string or null",
  "industry": "string",
  "description": "Brief company description",
  "overallLeaning": "one of the 7 options",
  "confidenceScore": number 0-100,
  "economicScore": number -100 to 100,
  "governmentScore": number -100 to 100,
  "positions": [{"topic":"","stance":"","description":""}],
  "subsidiaries": [{"name":"","industry":"","description":""}],
  "affiliates": [{"name":"","relationship":"","description":""}],
  "newsItems": [{"headline":"","source":"","date":"","summary":"","sentiment":"positive|negative|neutral"}],
  "donations": [{"recipient":"","amount":"","date":"","party":"Democrat|Republican|Other|PAC"}],
  "publicStatements": [{"speaker":"","role":"","statement":"","date":"","topic":""}],
  "revenueAllocation": [{"category":"","percentage":0,"description":""}],
  "lobbyingActivities": [{"issue":"","amount":"","year":"","description":""}],
  "timestamp": "${new Date().toISOString()}",
  "status": "completed"
}

CRITICAL - SAVE TO FIRESTORE:
After building the JSON, save it using exec:

exec: cd /home/ubuntu/command-center && node scripts/save-to-firestore.js politicorp_history 'YOUR_JSON_HERE'

Then also save a jimmy deliverable:
exec: cd /home/ubuntu/command-center && node scripts/save-to-firestore.js jimmy_deliverables '{"title":"Politicorp: ${companyName}","date":"${new Date().toISOString()}","status":"completed","preview":"Political analysis of ${companyName}","content":"YOUR_MARKDOWN_SUMMARY","createdBy":"cc_jimmy_command","commandText":"politicorp ${companyName}"}'

Make sure to properly escape all JSON strings. Both saves are REQUIRED.`;

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
          label: `politicorp-${companyName.slice(0, 30)}`,
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
        message: 'Analysis started - results will appear when complete',
        company: companyName
      });
    }

    console.error('Unexpected spawn response:', JSON.stringify(data, null, 2));
    return NextResponse.json(
      { error: 'Failed to start analysis', details: data },
      { status: 500 }
    );

  } catch (error) {
    console.error('Politicorp API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
