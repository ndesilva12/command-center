import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

const OPENCLAW_GATEWAY = 'http://3.141.47.151:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, sources, count } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json(
        { error: 'Topic is required' },
        { status: 400 }
      );
    }

    const requestedCount = count || 12;
    const sourcesFilter = sources && Array.isArray(sources) && sources.length > 0 ? sources : null;

    // Build intelligent curation prompt
    const prompt = `Curate ${requestedCount} high-quality content items on: "${topic}"

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
- Skepticism of centralized power

DIVERSITY REQUIREMENTS:
${sourcesFilter ? `
EXCLUSIVE FILTER MODE: User requested ONLY these sources: ${sourcesFilter.join(', ')}
- Deliver 100% content from requested source types
- Example: If sources=['x'], return ONLY X posts (no videos, articles, Reddit)
` : `
MIX OF SOURCES (no filter - get diverse mix):
- 3-4 X posts minimum (site:x.com OR site:twitter.com)
- 3-4 videos minimum (site:youtube.com OR site:tiktok.com)
- 2-3 Reddit threads max (site:reddit.com)
- Rest: Articles, podcasts, PDFs, Substack, blogs
- Each tweet/video is UNIQUE - don't dedupe by account/channel
`}

SEARCH STRATEGY:
- Use web_search tool with site-specific queries
- X posts: "site:x.com ${topic}" OR "site:twitter.com ${topic}"
- Videos: "site:youtube.com ${topic}"
- Reddit: "site:reddit.com ${topic}"
- Articles: general search + "site:mises.org OR site:cato.org OR site:reason.com"
- MAX 4-5 searches total
- Collect ~${requestedCount * 2} results, filter down to best ${requestedCount}

SCORING CRITERIA (prioritize):
1. **Intellectual Rigor**: Evidence-based, first-principles thinking
2. **Worldview Alignment**: Ron Paul lens (but include well-argued opposing views)
3. **Depth**: Substantive analysis > hot takes
4. **Source Quality**: Think tanks, academics, investigative journalism
5. **Diversity**: Mix of known sources + discovery

IMPORTANT: "Strength through competition and struggle, not atrophy by protectionism"
- DON'T filter out opposing views
- DO prefer rigorous critiques over lazy agreement
- Challenging ideas score HIGHER than echo chamber content

CATEGORIZATION (split into 4 categories):
- **Popular**: Trending, viral, high engagement
- **Technology**: Tech, innovation, digital topics
- **Politics**: Government, policy, economics, liberty
- **Culture**: Society, philosophy, values, lifestyle

OUTPUT FORMAT (JSON):
{
  "topic": "${topic}",
  "timestamp": "ISO-8601",
  "items": [
    {
      "title": "...",
      "url": "...",
      "excerpt": "...",
      "source_type": "x|video|reddit|article|podcast|pdf",
      "category": "popular|technology|politics|culture",
      "score": 8.5,
      "why": "Brief explanation of quality/relevance"
    }
  ],
  "total": ${requestedCount},
  "diversity": {
    "x_posts": 4,
    "videos": 3,
    "reddit": 2,
    "articles": 3
  }
}

CRITICAL CONSTRAINTS:
- Total items MUST be multiple of 4: ${requestedCount}
- Categories MUST have equal distribution (${requestedCount / 4} each)
- Apply diversity requirements strictly
- MAX 3-4 searches (not 4-5)
- OUTPUT JSON IMMEDIATELY after curating

CRITICAL - FIRESTORE SAVE:
After outputting the JSON above, IMMEDIATELY save to Firestore using exec tool:

Run this command:
node -e "const admin = require('firebase-admin'); const serviceAccount = require('/home/ubuntu/command-center/firebase-service-account.json'); if (!admin.apps.length) { admin.initializeApp({ credential: admin.credential.cert(serviceAccount) }); } const db = admin.firestore(); const result = <YOUR_JSON_RESULT>; db.collection('curate_history').add({ ...result, timestamp: new Date().toISOString(), saved_by: 'sub-agent' }).then(() => { console.log('Saved to Firestore'); process.exit(0); }).catch(err => { console.error('Save error:', err); process.exit(1); });"

Replace <YOUR_JSON_RESULT> with your actual JSON result object.

This ensures results persist even if the API route times out.

Think step by step:
1. What does "${topic}" mean?
2. What are 4-5 site-specific search queries?
3. Search and collect ~${requestedCount * 2} results
4. Score with Ron Paul lens + intellectual rigor
5. Filter to best ${requestedCount}
6. Split into 4 categories (${requestedCount / 4} each)
7. OUTPUT JSON
8. SAVE TO FIRESTORE using exec command above`;

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
          label: `curate-${topic.slice(0, 30)}`,
          cleanup: 'keep',
          runTimeoutSeconds: 90  // 90s for multi-source curation
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
        message: 'Curation started - results will appear in history when complete',
        topic: topic.trim()
      });
    }
    
    console.error('Unexpected spawn response:', JSON.stringify(data, null, 2));
    return NextResponse.json(
      { error: 'Failed to start curation', details: data },
      { status: 500 }
    );
    
  } catch (error) {
    console.error('Curate API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
