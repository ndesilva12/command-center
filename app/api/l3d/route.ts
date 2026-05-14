import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAdminDb } from '@/lib/firebase-admin';

// Extend timeout for AI-powered search
export const maxDuration = 60;

const SEARXNG_URL = process.env.SEARXNG_URL || 'http://localhost:8888';
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || 'BSAN41sbCIBbhckWBTYmYAk_44Kug7g';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

async function webSearch(query: string, count: number = 10): Promise<SearchResult[]> {
  // Try SearXNG first
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
  
  // Fall back to Brave
  try {
    const response = await fetch(
      `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=${count}&freshness=pm`,
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
    const { topic, days = 30 } = body;

    if (!topic || !topic.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Execute searches
    const searches = [
      `${topic} recent news ${days} days`,
      `${topic} analysis commentary`,
      `${topic} site:reddit.com OR site:x.com discussion`,
    ];

    // Execute searches in batches with small delay to balance speed vs rate limits
    const searchResults: SearchResult[][] = [];
    for (let i = 0; i < searches.length; i += 2) {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      const batch = searches.slice(i, i + 2);
      const batchResults = await Promise.all(batch.map(q => webSearch(q, 8)));
      searchResults.push(...batchResults);
    }
    
    // Flatten and dedupe
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

    if (allResults.length === 0) {
      return NextResponse.json({
        success: true,
        topic: topic.trim(),
        days,
        categories: {},
        key_takeaways: ['No recent results found for this topic'],
        total_items: 0
      });
    }

    // Use Claude to analyze
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    
    const prompt = `Analyze these search results about "${topic}" from the last ${days} days.

WORLDVIEW: Ron Paul libertarian lens - individualism, free markets, limited government, Austrian economics, skepticism of centralized power.

RESULTS:
${allResults.map((r, i) => `[${i + 1}] ${r.title}\nURL: ${r.url}\n${r.description}`).join('\n\n')}

Categorize into 4 buckets and extract key takeaways.

Return ONLY valid JSON:
{
  "categories": {
    "major_developments": [{"title": "...", "url": "...", "summary": "...", "worldview_note": "Ron Paul perspective"}],
    "analysis_commentary": [...],
    "discussions": [...],
    "data_research": [...]
  },
  "key_takeaways": ["3-5 insights with libertarian analysis"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let result: any = { categories: {}, key_takeaways: [] };
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
      days,
      timestamp: new Date().toISOString(),
      ...result,
      total_items: allResults.length,
      status: 'completed'
    };

    // Save to Firestore
    try {
      const adminDb = getAdminDb();
      await adminDb.collection('l3d_history').add(response);
    } catch (dbError) {
      console.error('Failed to save to Firestore:', dbError);
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('L3D API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
