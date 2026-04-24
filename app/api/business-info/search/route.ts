import { NextRequest, NextResponse } from 'next/server';
import { BusinessSearchResult } from '@/lib/types/business';
import {
  getCachedBusinessSearchResults,
  cacheBusinessSearchResults,
} from '@/lib/business-cache';

const XAI_API_KEY = process.env.XAI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function searchBusinessesWithAI(
  query: string,
  city: string,
  state: string
): Promise<BusinessSearchResult[]> {
  const prompt = `Search for local businesses matching "${query}" in ${city}, ${state}.

Find up to 5 potential business matches. For each business, provide:
1. The exact registered business name
2. Full street address
3. City
4. State
5. Type of business (e.g., Restaurant, Retail, Professional Services)
6. Confidence score (0-100) of how well this matches the search

Return ONLY valid JSON with this exact structure (no markdown, no backticks):
{
  "results": [
    {
      "name": "Business Name LLC",
      "address": "123 Main Street",
      "city": "City Name",
      "state": "ST",
      "type": "Business Type",
      "confidence": 95
    }
  ]
}

IMPORTANT:
- Only include businesses that actually exist
- Be specific with addresses
- If no businesses are found, return an empty results array
- Order by confidence score (highest first)`;

  // Try Grok first (has live search)
  if (XAI_API_KEY) {
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-3-mini-fast',
          messages: [{ role: 'user', content: prompt }],
          search: true,
          temperature: 0.1,
          max_tokens: 4096,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content || '';
        return parseBusinessResults(responseText);
      }
      console.error('Grok API error:', response.status);
    } catch (err) {
      console.error('Grok API failed:', err);
    }
  }

  // Fallback to OpenAI
  if (OPENAI_API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 4096,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content || '';
        return parseBusinessResults(responseText);
      }
      console.error('OpenAI API error:', response.status);
    } catch (err) {
      console.error('OpenAI API failed:', err);
    }
  }

  throw new Error('No AI API available');
}

function parseBusinessResults(responseText: string): BusinessSearchResult[] {
  let cleanedResponse = responseText;
  if (responseText.includes('```')) {
    cleanedResponse = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();
  }

  const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error('No JSON found in response:', responseText.substring(0, 500));
    return [];
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return parsed.results || [];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const city = searchParams.get('city');
  const state = searchParams.get('state');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  if (!city || !state) {
    return NextResponse.json(
      { error: 'City and state are required for local business search' },
      { status: 400 }
    );
  }

  if (!XAI_API_KEY && !OPENAI_API_KEY) {
    return NextResponse.json(
      { error: 'AI API not configured' },
      { status: 503 }
    );
  }

  try {
    // Check cache first
    const cachedResults = await getCachedBusinessSearchResults(query, city, state);
    if (cachedResults) {
      return NextResponse.json({
        results: cachedResults,
        cached: true,
      });
    }

    // Search with AI
    const results = await searchBusinessesWithAI(query, city, state);

    // Cache the results
    await cacheBusinessSearchResults(query, city, state, results);

    return NextResponse.json({
      results,
      cached: false,
    });
  } catch (error) {
    console.error('Error searching businesses:', error);
    return NextResponse.json(
      { error: 'Failed to search businesses', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
