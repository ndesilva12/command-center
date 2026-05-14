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
    const { topic, depth = 'standard' } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Research academic/white paper sources
    const searches = [
      `${topic} white paper pdf`,
      `${topic} research paper academic`,
      `${topic} site:arxiv.org OR site:papers.ssrn.com OR site:nber.org`,
      `${topic} policy analysis think tank`,
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

    // Use Claude to analyze and summarize
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    
    const prompt = `Find and summarize white papers/research on: "${topic}"

SEARCH RESULTS:
${allResults.map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.description}`).join('\n\n')}

WORLDVIEW: Ron Paul libertarian lens - free markets, sound money, limited government.

Return ONLY valid JSON:
{
  "papers": [
    {
      "title": "...",
      "url": "...",
      "authors": "...",
      "date": "...",
      "type": "white_paper|research|policy|report",
      "summary": "Key findings in 2-3 sentences",
      "methodology": "How they reached conclusions",
      "key_findings": ["..."],
      "worldview_analysis": "Ron Paul perspective on findings",
      "quality_score": 8.5
    }
  ],
  "synthesis": "Overall synthesis of the research landscape",
  "gaps": ["Research gaps or unanswered questions"],
  "recommendations": ["Further reading recommendations"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let result: any = { papers: [], synthesis: '', gaps: [], recommendations: [] };
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
      topic: topic.trim(),
      depth,
      timestamp: new Date().toISOString(),
      status: 'completed',
      ...result,
      total_papers: result.papers?.length || 0
    };

    // Save to Firestore
    try {
      const adminDb = getAdminDb();
      await adminDb.collection('white_papers_history').add(response);
    } catch (dbError) {
      console.error('Failed to save to Firestore:', dbError);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('White papers API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
