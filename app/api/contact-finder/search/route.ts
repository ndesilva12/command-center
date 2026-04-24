import { NextRequest, NextResponse } from 'next/server';
import { SearchType, ContactResult } from '@/lib/types/contact-finder';

const XAI_API_KEY = process.env.XAI_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

function getIndividualSearchPrompt(query: string): string {
  return `You are an expert OSINT researcher finding publicly available contact information.

TARGET: ${query}

Find contact methods for this individual. Search for:
1. Professional email addresses (verify company domain first)
2. Phone numbers (business listings, contact pages)
3. Social media (LinkedIn, X/Twitter, Instagram, Facebook)
4. Personal/professional websites
5. Contact forms

CRITICAL RULES:
- ONLY include REAL URLs found in search results - DO NOT construct or guess social media URLs
- For emails: First verify the company/organization, then look for email format evidence
- If you find a colleague's email (e.g., john@company.com), use that format for your target
- Mark all speculative findings clearly with confidence levels

Return ONLY valid JSON (no markdown, no backticks):
{
  "results": [
    {
      "name": "Full Name",
      "title": "Job Title",
      "organization": "Company/Org Name",
      "contacts": [
        {
          "type": "email",
          "value": "email@example.com",
          "confidence": "medium",
          "source": "Speculated from company domain",
          "notes": "Company uses firstname@domain.com format (verified from colleague email)"
        },
        {
          "type": "linkedin",
          "value": "https://linkedin.com/in/real-profile-found",
          "confidence": "high",
          "source": "Found in Google search results"
        }
      ],
      "personalizationHooks": ["Key interests or topics to mention"],
      "reasoning": "How you found this information"
    }
  ],
  "summary": "Brief summary of search results and confidence"
}

Confidence levels:
- HIGH: Verified, found in search results
- MEDIUM: Strong evidence, likely correct
- LOW: Weak evidence, less certain
- SPECULATIVE: Educated guess based on patterns`;
}

function getTargetSearchPrompt(query: string): string {
  return `You are an expert OSINT researcher finding publicly available contact information.

TARGET ORGANIZATION: ${query}

Find key people and their contact methods at this organization. Focus on:
1. Leadership team (CEO, founders, executives)
2. Department heads (Marketing, Sales, Operations)
3. Public-facing team members

For EACH person found, provide:
- Name and title
- Contact methods (email, phone, social media, website)
- All with appropriate confidence levels

CRITICAL RULES:
- ONLY include REAL URLs found in search results
- First verify the organization website
- Look for "About", "Team", "Leadership" pages
- Check LinkedIn company page for employees
- Find email format from any real emails you discover
- Mark all speculative findings with confidence levels

Return ONLY valid JSON (no markdown, no backticks):
{
  "results": [
    {
      "name": "Person Name",
      "title": "Job Title",
      "organization": "${query}",
      "contacts": [
        {
          "type": "email",
          "value": "email@company.com",
          "confidence": "medium",
          "source": "Speculated from company email format",
          "notes": "Company uses firstname@domain.com format"
        }
      ],
      "personalizationHooks": ["Topics relevant to this person"],
      "reasoning": "How you found this person"
    }
  ],
  "summary": "Summary of people found and overall findings"
}`;
}

async function searchWithAI(prompt: string): Promise<{ results: any[]; summary: string }> {
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
          max_tokens: 8192,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content || '';
        return parseContactResults(responseText);
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
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.1,
          max_tokens: 8192,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content || '';
        return parseContactResults(responseText);
      }
      console.error('OpenAI API error:', response.status);
    } catch (err) {
      console.error('OpenAI API failed:', err);
    }
  }

  throw new Error('No AI API available');
}

function parseContactResults(responseText: string): { results: any[]; summary: string } {
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
    throw new Error('Failed to parse contact search results');
  }

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    results: parsed.results || [],
    summary: parsed.summary || 'Search completed',
  };
}

export async function POST(request: NextRequest) {
  try {
    const { query, searchType } = await request.json();

    if (!query?.trim()) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    if (!['individual', 'target'].includes(searchType)) {
      return NextResponse.json(
        { error: 'Invalid search type. Must be "individual" or "target"' },
        { status: 400 }
      );
    }

    if (!XAI_API_KEY && !OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'AI API not configured' },
        { status: 503 }
      );
    }

    const prompt = searchType === 'individual'
      ? getIndividualSearchPrompt(query)
      : getTargetSearchPrompt(query);

    const { results, summary } = await searchWithAI(prompt);

    return NextResponse.json({
      query,
      searchType,
      results,
      summary,
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error in contact finder:', error);
    return NextResponse.json(
      { error: 'Failed to search for contacts', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
