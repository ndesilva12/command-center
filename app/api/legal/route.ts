import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

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
    const { question, topic, jurisdiction } = body;
    const query = question || topic;

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Question or topic is required' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Research legal information
    const searches = [
      `${query} law legal ${jurisdiction || 'US'}`,
      `${query} statute regulation`,
      `${query} case law precedent`,
      `${query} legal rights`,
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
    
    const prompt = `Provide legal research on: "${query}"
${jurisdiction ? `Jurisdiction: ${jurisdiction}` : ''}

SEARCH RESULTS:
${allResults.map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.description}`).join('\n\n')}

IMPORTANT: This is for informational purposes only, not legal advice.

Return ONLY valid JSON:
{
  "question": "${query}",
  "jurisdiction": "${jurisdiction || 'General/US'}",
  "summary": "Plain-language summary of the legal landscape",
  "applicable_laws": [
    {"name": "...", "citation": "...", "summary": "...", "relevance": "..."}
  ],
  "key_cases": [
    {"name": "...", "citation": "...", "holding": "...", "relevance": "..."}
  ],
  "rights_and_obligations": ["Plain-language explanation of rights"],
  "common_issues": ["Typical problems or misconceptions"],
  "practical_steps": ["What someone might do"],
  "when_to_get_lawyer": "When professional help is needed",
  "resources": [
    {"name": "...", "url": "...", "type": "government|nonprofit|legal_aid"}
  ],
  "disclaimer": "This is general information, not legal advice. Consult an attorney for your specific situation."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
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

    return NextResponse.json({
      success: true,
      query: query.trim(),
      timestamp: new Date().toISOString(),
      ...result
    });

  } catch (error) {
    console.error('Legal API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
