import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import Anthropic from '@anthropic-ai/sdk';

const TOWNS = [
  'Wellesley', 'Needham', 'Natick', 'Dover', 'Medfield', 'Millis', 'Medway',
  'Franklin', 'Bellingham', 'Mansfield', 'Norton', 'Taunton', 'Raynham',
  'Bridgewater', 'Middleboro', 'Lakeville', 'Rochester', 'Marion',
  'Mattapoisett', 'Fairhaven', 'New Bedford', 'Dartmouth'
];

const LEAD_TYPES = [
  'roofing', 'plumbing', 'hvac', 'electrical', 'landscaping', 'cleaning',
  'painting', 'contractor', 'legal', 'realtor', 'moving', 'auto'
];

const INTENT_KEYWORDS = [
  'looking for', 'need a', 'anyone know', 'recommend', 'recommendation',
  'who do you use', 'help me find', 'suggestions for', 'best', 'affordable'
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { towns = TOWNS, types = LEAD_TYPES } = body;

    // Use Anthropic to analyze search results
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Build search queries
    const queries: string[] = [];
    for (const town of towns.slice(0, 5)) { // Limit to 5 towns per run to avoid rate limits
      for (const type of types.slice(0, 3)) { // Limit to 3 types
        queries.push(`${town} MA ${type} recommendation`);
        queries.push(`${town} Massachusetts need ${type}`);
      }
    }

    // Search using Brave API
    const braveApiKey = process.env.BRAVE_API_KEY;
    if (!braveApiKey) {
      return NextResponse.json({ error: 'Brave API key not configured' }, { status: 500 });
    }

    const allResults: any[] = [];

    for (const query of queries.slice(0, 10)) { // Limit queries
      try {
        const searchUrl = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=5&freshness=pw`; // past week
        const res = await fetch(searchUrl, {
          headers: { 'X-Subscription-Token': braveApiKey }
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.web?.results) {
            allResults.push(...data.web.results.map((r: any) => ({
              title: r.title,
              description: r.description,
              url: r.url,
              query
            })));
          }
        }
        
        // Rate limit protection
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        console.error('Search error:', err);
      }
    }

    // Deduplicate by URL
    const uniqueResults = allResults.filter((r, i, arr) => 
      arr.findIndex(x => x.url === r.url) === i
    );

    // Use Claude to extract actual leads from results
    const analysisPrompt = `Analyze these search results and extract ONLY posts where someone is actively looking for a local service (roofing, plumbing, HVAC, electrical, landscaping, cleaning, painting, contractor, legal, realtor, moving, auto).

Requirements:
- Must be a real person seeking help (not a business ad)
- Must mention a specific town in MA (${towns.join(', ')})
- Must show clear intent to hire/buy

Search Results:
${JSON.stringify(uniqueResults.slice(0, 30), null, 2)}

Return JSON array of leads found:
[
  {
    "type": "roofing|plumbing|hvac|etc",
    "text": "the actual post/question text",
    "author": "username if visible",
    "town": "town name",
    "url": "source url",
    "source": "reddit|twitter|facebook|forum"
  }
]

If no valid leads found, return empty array []. Only return the JSON, no other text.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: analysisPrompt }]
    });

    let extractedLeads: any[] = [];
    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      try {
        const jsonMatch = textContent.text.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          extractedLeads = JSON.parse(jsonMatch[0]);
        }
      } catch (err) {
        console.error('Failed to parse Claude response:', err);
      }
    }

    // Save new leads to Firestore
    let newLeadsCount = 0;
    for (const lead of extractedLeads) {
      // Check if lead already exists (by URL)
      const existing = await adminDb.collection('local_leads')
        .where('url', '==', lead.url)
        .limit(1)
        .get();

      if (existing.empty) {
        await adminDb.collection('local_leads').add({
          type: lead.type,
          text: lead.text,
          author: lead.author || 'unknown',
          town: lead.town,
          location: `${lead.town}, MA`,
          url: lead.url,
          source: lead.source || 'web',
          status: 'new',
          discoveredAt: new Date().toISOString()
        });
        newLeadsCount++;
      }
    }

    return NextResponse.json({
      success: true,
      newLeads: newLeadsCount,
      totalSearched: uniqueResults.length,
      queriesRun: queries.length
    });

  } catch (error) {
    console.error('Discovery error:', error);
    return NextResponse.json({ error: 'Discovery failed' }, { status: 500 });
  }
}
