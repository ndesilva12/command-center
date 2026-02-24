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

interface CuratedItem {
  title: string;
  url: string;
  excerpt: string;
  source_type: string;
  category: string;
  score: number;
  why: string;
}

// Try SearXNG first (local/self-hosted), fall back to Brave (cloud)
async function webSearch(query: string, count: number = 10): Promise<SearchResult[]> {
  // Try SearXNG first
  try {
    const searxngResults = await searxngSearch(query, count);
    if (searxngResults.length > 0) {
      return searxngResults;
    }
  } catch (e) {
    console.log('SearXNG unavailable, falling back to Brave');
  }
  
  // Fall back to Brave
  return braveSearch(query, count);
}

async function searxngSearch(query: string, count: number = 10): Promise<SearchResult[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000); // 3s timeout
  
  try {
    const response = await fetch(
      `${SEARXNG_URL}/search?q=${encodeURIComponent(query)}&format=json&categories=general`,
      { signal: controller.signal }
    );
    clearTimeout(timeout);

    if (!response.ok) return [];

    const data = await response.json();
    return (data.results || []).slice(0, count).map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.content || '',
    }));
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

async function braveSearch(query: string, count: number = 10): Promise<SearchResult[]> {
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

    if (!response.ok) {
      console.error('Brave search failed:', response.status);
      return [];
    }

    const data = await response.json();
    return (data.web?.results || []).map((r: any) => ({
      title: r.title,
      url: r.url,
      description: r.description || '',
    }));
  } catch (error) {
    console.error('Brave search error:', error);
    return [];
  }
}

function detectSourceType(url: string): string {
  const u = url.toLowerCase();
  if (u.includes('youtube.com') || u.includes('youtu.be') || u.includes('vimeo.com')) return 'video';
  if (u.includes('twitter.com') || u.includes('x.com')) return 'x';
  if (u.includes('reddit.com')) return 'reddit';
  if (u.includes('substack.com')) return 'substack';
  if (u.includes('podcasts.apple.com') || u.includes('spotify.com/episode') || u.includes('anchor.fm')) return 'podcast';
  if (u.endsWith('.pdf')) return 'pdf';
  return 'article';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, sources, count } = body;

    if (!topic || typeof topic !== 'string' || !topic.trim()) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    const requestedCount = count || 12;
    const sourcesFilter = sources && Array.isArray(sources) && sources.length > 0 ? sources : null;

    // Build search queries based on topic and source filters
    const searches: { query: string; type: string }[] = [];
    
    if (!sourcesFilter || sourcesFilter.includes('x')) {
      searches.push({ query: `${topic} site:x.com OR site:twitter.com`, type: 'x' });
    }
    if (!sourcesFilter || sourcesFilter.includes('video')) {
      searches.push({ query: `${topic} site:youtube.com`, type: 'video' });
    }
    if (!sourcesFilter || sourcesFilter.includes('reddit')) {
      searches.push({ query: `${topic} site:reddit.com`, type: 'reddit' });
    }
    if (!sourcesFilter || sourcesFilter.includes('article')) {
      searches.push({ query: `${topic} analysis OR perspective OR opinion`, type: 'article' });
      searches.push({ query: `${topic} site:mises.org OR site:cato.org OR site:reason.com OR site:zerohedge.com`, type: 'article' });
    }
    if (!sourcesFilter || sourcesFilter.includes('substack')) {
      searches.push({ query: `${topic} site:substack.com`, type: 'substack' });
    }

    // Execute searches in parallel
    const searchPromises = searches.map(s => webSearch(s.query, 8));
    const searchResults = await Promise.all(searchPromises);
    
    // Flatten and dedupe by URL
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
        items: [],
        total: 0,
        message: 'No results found for this topic'
      });
    }

    // Use Claude to analyze and curate
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    
    const curatePrompt = `You are a content curator for someone with these values:
- Individualism and personal liberty
- Free markets and Austrian economics
- Limited government, skepticism of centralized power
- First-principles thinking
- "Strength through competition, not atrophy by protectionism"
- Include well-argued opposing views (intellectual rigor > echo chamber)

TOPIC: "${topic}"

Here are ${allResults.length} search results to evaluate:

${allResults.map((r, i) => `[${i + 1}] ${r.title}
URL: ${r.url}
${r.description}`).join('\n\n')}

Select the BEST ${requestedCount} items. Score each 1-10 on:
- Intellectual rigor and depth
- Relevance to topic
- Source quality
- Worldview alignment (but include strong opposing views)

Categorize each as: popular, technology, politics, or culture
Aim for ${Math.ceil(requestedCount / 4)} per category.

Return ONLY valid JSON (no markdown, no explanation):
{
  "items": [
    {
      "title": "...",
      "url": "...",
      "excerpt": "Brief description",
      "source_type": "x|video|reddit|article|substack|podcast|pdf",
      "category": "popular|technology|politics|culture",
      "score": 8.5,
      "why": "One sentence on why this is valuable"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: curatePrompt }],
    });

    // Extract text content
    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    // Parse JSON response
    let curatedItems: CuratedItem[] = [];
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        curatedItems = parsed.items || [];
      }
    } catch (parseError) {
      console.error('Failed to parse Claude response:', textContent.text);
      // Fallback: return raw search results
      curatedItems = allResults.slice(0, requestedCount).map((r, i) => ({
        title: r.title,
        url: r.url,
        excerpt: r.description,
        source_type: detectSourceType(r.url),
        category: ['popular', 'technology', 'politics', 'culture'][i % 4],
        score: 7,
        why: 'Relevant to topic'
      }));
    }

    // Ensure source_type is set correctly
    curatedItems = curatedItems.map(item => ({
      ...item,
      source_type: item.source_type || detectSourceType(item.url)
    }));

    const result = {
      success: true,
      topic: topic.trim(),
      timestamp: new Date().toISOString(),
      items: curatedItems,
      total: curatedItems.length,
      diversity: {
        x_posts: curatedItems.filter(i => i.source_type === 'x').length,
        videos: curatedItems.filter(i => i.source_type === 'video').length,
        reddit: curatedItems.filter(i => i.source_type === 'reddit').length,
        articles: curatedItems.filter(i => i.source_type === 'article').length,
        substack: curatedItems.filter(i => i.source_type === 'substack').length,
      }
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Curate API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
