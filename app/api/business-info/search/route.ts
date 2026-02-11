import { NextRequest, NextResponse } from 'next/server';
import { BusinessSearchResult } from '@/lib/types/business';
import {
  getCachedBusinessSearchResults,
  cacheBusinessSearchResults,
} from '@/lib/business-cache';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
      }[];
    };
  }[];
}

async function searchBusinessesWithAI(
  query: string,
  city: string,
  state: string
): Promise<BusinessSearchResult[]> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

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

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 4096,
        },
        tools: [{ google_search: {} }],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Gemini API error:', response.status, errorText);
    throw new Error(`Gemini API error: ${response.status}`);
  }

  const data: GeminiResponse = await response.json();

  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('No response from Gemini');
  }

  const responseText = data.candidates[0].content.parts[0].text;

  // Parse JSON response
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

  if (!GEMINI_API_KEY) {
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
