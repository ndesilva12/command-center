import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAdminDb } from '@/lib/firebase-admin';

const SEARXNG_URL = process.env.SEARXNG_URL || 'http://localhost:8888';
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || 'BSAN41sbCIBbhckWBTYmYAk_44Kug7g';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

async function webSearch(query: string, count: number = 10): Promise<SearchResult[]> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch(
      `${SEARXNG_URL}/search?q=${encodeURIComponent(query)}&format=json&categories=general`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (response.ok) {
      const data = await response.json();
      const results = (data.results || []).slice(0, count).map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.content || '',
      }));
      if (results.length > 0) return results;
    }
  } catch (e) {
    console.log('SearXNG unavailable, using Brave');
  }
  
  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}`,
      {
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': BRAVE_API_KEY,
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      return (data.web?.results || []).map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.description || '',
      }));
    }
  } catch (error) {
    console.error('Brave search error:', error);
  }
  
  return [];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity, query } = body;
    const topic = entity || query;

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'Entity or query is required' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Research political/corporate connections
    const searches = [
      `${topic} political donations lobbying`,
      `${topic} government contracts connections`,
      `${topic} opensecrets OR followthemoney`,
      `${topic} corporate board directors connections`,
      `${topic} controversy scandal investigation`,
    ];

    const searchPromises = searches.map(q => webSearch(q, 6));
    const searchResults = await Promise.all(searchPromises);
    
    const allResults: SearchResult[] = [];
    const seenUrls = new Set<string>();
    
    for (const results of searchResults) {
      for (const r of results) {
        if (!seenUrls.has(r.url)) {
          seenUrls.add(r.url);
          allResults.push(r);
        }
      }
    }

    // Use Claude to analyze
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    
    const prompt = `Investigate political/corporate connections for: "${topic}"

WORLDVIEW: Ron Paul libertarian lens - skeptical of government-corporate collusion, crony capitalism, regulatory capture.

SEARCH RESULTS:
${allResults.map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.description}`).join('\n\n')}

Return ONLY valid JSON:
{
  "entity": "${topic}",
  "type": "corporation|politician|organization|individual",
  "political_donations": [
    {"recipient": "...", "amount": "...", "date": "...", "party": "...", "source": "..."}
  ],
  "lobbying": [
    {"issue": "...", "amount": "...", "year": "...", "details": "..."}
  ],
  "government_connections": [
    {"type": "contract|revolving_door|regulatory", "details": "...", "concern_level": "low|medium|high"}
  ],
  "board_connections": [
    {"name": "...", "other_positions": ["..."], "potential_conflicts": "..."}
  ],
  "controversies": [
    {"issue": "...", "date": "...", "summary": "...", "resolution": "..."}
  ],
  "crony_capitalism_score": 7.5,
  "analysis": "Ron Paul perspective on this entity's relationship with government power",
  "red_flags": ["Specific concerns from a liberty perspective"],
  "sources": ["List of source URLs"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let result: any = {};
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse Claude response');
    }

    const response = {
      success: true,
      query: topic.trim(),
      timestamp: new Date().toISOString(),
      status: 'completed',
      ...result
    };

    // Save to Firestore
    try {
      const adminDb = getAdminDb();
      await adminDb.collection('politicorp_history').add(response);
    } catch (dbError) {
      console.error('Failed to save to Firestore:', dbError);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Politicorp API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
