import { NextRequest, NextResponse } from 'next/server';
import { BusinessAnalysis } from '@/lib/types/business';
import {
  getCachedBusinessReport,
  cacheBusinessReport,
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

async function getBusinessDetailsWithAI(
  businessName: string,
  address: string,
  city: string,
  state: string
): Promise<BusinessAnalysis> {
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `Perform a comprehensive public records search for the local business:
Business Name: "${businessName}"
Address: ${address}
City: ${city}
State: ${state}

Search for and compile ALL available public information including:

1. BUSINESS REGISTRATION & FILINGS
2. OWNERSHIP & LEADERSHIP
3. LICENSES & PERMITS
4. PUBLIC RECORDS
5. NEWS & MEDIA
6. BASIC BUSINESS INFO

Return ONLY valid JSON with this exact structure (no markdown, no backticks):
{
  "businessName": "Exact Legal Business Name",
  "tradeName": "DBA Name if different",
  "address": "Full Street Address",
  "city": "City",
  "state": "ST",
  "zipCode": "12345",
  "phone": "(555) 123-4567",
  "website": "https://example.com",
  "email": "contact@example.com",
  "businessType": "LLC/Corporation/Sole Proprietorship/etc",
  "industry": "Industry Category",
  "yearEstablished": "2010",
  "employeeCount": "5-10",
  "annualRevenue": "Under $500K",
  "owners": [
    { "name": "Owner Name", "title": "Owner/Member/President", "ownership": "100%" }
  ],
  "registeredAgent": "Agent Name and Address",
  "filings": [
    {
      "type": "Articles of Organization",
      "date": "2010-05-15",
      "agency": "Secretary of State",
      "status": "Active",
      "documentNumber": "LLC-123456"
    }
  ],
  "licenses": [
    {
      "type": "Business License",
      "issuedBy": "City of ...",
      "issueDate": "2024-01-01",
      "expirationDate": "2024-12-31",
      "status": "Active"
    }
  ],
  "newsArticles": [
    {
      "title": "Article Title",
      "source": "Local Newspaper",
      "date": "2024-06-15",
      "summary": "Brief summary of the article..."
    }
  ],
  "summary": "A comprehensive 2-3 paragraph summary of the business, its history, operations, and any notable public records found.",
  "dataSource": "Public records, Secretary of State, local government filings"
}

IMPORTANT:
- Focus on ACTUAL public records and verifiable information
- Include as many filings, licenses, and records as can be found
- Be thorough but accurate - only include information that can be verified
- If information is not available, omit that field or use null
- Prioritize official government sources and public records`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 16384,
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
    console.error('No JSON found in response:', responseText.substring(0, 1000));
    throw new Error('Failed to parse business details');
  }

  const parsed = JSON.parse(jsonMatch[0]);

  return {
    ...parsed,
    owners: parsed.owners || [],
    filings: parsed.filings || [],
    licenses: parsed.licenses || [],
    newsArticles: parsed.newsArticles || [],
    searchedAt: new Date(),
    dataSource: parsed.dataSource || 'Public records search',
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const name = searchParams.get('name');
  const address = searchParams.get('address') || '';
  const city = searchParams.get('city');
  const state = searchParams.get('state');

  if (!name || !city || !state) {
    return NextResponse.json(
      { error: 'Business name, city, and state are required' },
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
    const cachedReport = await getCachedBusinessReport(name, city, state);
    if (cachedReport) {
      return NextResponse.json({
        data: cachedReport,
        cached: true,
      });
    }

    // Get details with AI
    const analysis = await getBusinessDetailsWithAI(name, address, city, state);

    // Cache the report
    await cacheBusinessReport(analysis);

    return NextResponse.json({
      data: analysis,
      cached: false,
    });
  } catch (error) {
    console.error('Error analyzing business:', error);
    return NextResponse.json(
      { error: 'Failed to analyze business', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
