import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export interface DeepSearchReport {
  topic: string;
  briefOverview: string;
  sections: {
    title: string;
    content: string;
    links?: { title: string; url: string; type: string }[];
  }[];
  hiddenMechanics: string[];
  counterintuitiveInsights: string[];
  expertDebates: string[];
  underreportedAngles: string[];
  socialMediaHighlights: { platform: string; author: string; content: string; url: string }[];
  podcastReferences: { title: string; episode: string; timestamp?: string; summary: string; url: string }[];
  links?: { title: string; url: string; type: string }[];
  timestamp: number;
}

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
  webSearchQueries?: string[];
}

const DEEP_SEARCH_SYSTEM_PROMPT = `You are an elite research analyst writing for EXPERTS who are already deeply familiar with the topic. Your audience has PhD-level understanding of the basics - they don't need introductions or fundamentals explained.

CRITICAL INSTRUCTION: The reader already knows the basics. They want to learn the 10% of information that 90% of people don't know.

RESEARCH PHILOSOPHY:
- Assume the reader is already an expert on the fundamentals
- Focus on nuances, edge cases, and overlooked details that even educated people miss
- Reveal how things ACTUALLY work behind the scenes vs. the simplified public narrative
- Explore the interesting fringes and edges of the topic
- Uncover the mechanics, incentives, and dynamics that insiders understand
- Share counterintuitive findings that challenge conventional wisdom
- Discuss ongoing debates among genuine experts in the field
- Highlight what's changed recently that most people haven't caught up with

CONTENT RATIO:
- 10% brief context (2-3 sentences maximum for basics)
- 90% advanced nuances, insider knowledge, and expert-level insights

REPORT STRUCTURE - You MUST respond with valid JSON in this exact format:
{
  "briefOverview": "2-3 sentences ONLY covering basics for context. Then immediately pivot to what makes this topic fascinating at a deeper level.",
  "sections": [
    {
      "title": "Section title focusing on a specific nuance or advanced aspect",
      "content": "Deep, nuanced analysis. Be specific. Name names, cite specifics, explain mechanisms. This is for experts."
    }
  ],
  "hiddenMechanics": ["How X actually works behind the scenes that most don't realize", "The real mechanism/incentive/dynamic at play"],
  "counterintuitiveInsights": ["Finding that challenges conventional wisdom", "What experts know that contradicts popular belief"],
  "expertDebates": ["Current disagreement among experts on X", "Unresolved question that specialists argue about"],
  "underreportedAngles": ["Aspect that deserves more attention", "Connection most people miss"],
  "socialMediaHighlights": [
    {"platform": "X/Twitter", "author": "@username or name", "content": "The key insight, insider knowledge, or expert observation from this post", "url": "https://x.com/..."}
  ],
  "podcastReferences": [
    {"title": "Podcast Name", "episode": "Episode title or number", "timestamp": "1:23:45 (optional)", "summary": "What expert insight or nuanced discussion occurred - focus on what most people don't know", "url": "https://..."}
  ]
}

SECTION TOPICS TO COVER (adapt to the topic):
1. The Nuanced Reality - What the simplified narrative misses
2. Hidden Mechanics - How it actually works behind the scenes
3. Edge Cases & Exceptions - Where the conventional rules break down
4. Historical Context Most Miss - The backstory that changes understanding
5. Current Expert Debates - What specialists actually argue about
6. Recent Developments - What's changed that most haven't caught up with
7. The Interesting Fringes - Unusual aspects, edge phenomena, weird cases
8. Insider Perspectives - What practitioners/insiders know that outsiders don't

CRITICAL - USE SEARCH RESULTS:
- You have access to Google Search. Use the search results provided to include REAL URLs.
- Reference the actual URLs from search results in your content.
- Include a mix of academic and expert sources found in search results.

SOCIAL MEDIA HIGHLIGHTS (CRITICAL):
- Include 3-5 tweets/posts from genuine experts, industry insiders, or practitioners
- Prioritize posts that share insider knowledge, nuanced takes, or counterintuitive observations
- Look for threads that go deep on specific mechanisms or dynamics
- Include posts from academics, industry veterans, practitioners who share what they've learned
- These should reveal insights that only insiders know

PODCAST REFERENCES (CRITICAL):
- Include 2-4 podcast episodes featuring expert guests or deep dives
- Reference episodes from: Lex Fridman, EconTalk, Invest Like the Best, The Knowledge Project, Conversations with Tyler, Acquired, All-In Podcast, How I Built This, industry-specific podcasts
- Provide episode name and timestamp if discussing a specific insight
- Summarize the key nuanced insight or insider knowledge shared
- Podcasts often contain the most candid expert discussions not found elsewhere

Write for someone who will be BORED by basics and DELIGHTED by nuance. Every sentence should teach them something they didn't know or make them see something familiar in a new light.`;

function getLinkType(url: string, title: string): string {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'video';
  }
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return 'social';
  }
  if (lowerUrl.includes('spotify.com') || lowerUrl.includes('podcasts.apple.com') || lowerTitle.includes('podcast')) {
    return 'podcast';
  }
  if (lowerUrl.includes('.pdf') || lowerUrl.includes('arxiv') || lowerUrl.includes('doi.org')) {
    return 'document';
  }
  if (lowerUrl.includes('jstor') || lowerUrl.includes('pubmed') || lowerUrl.includes('scholar.google')) {
    return 'academic';
  }
  return 'article';
}

export async function POST(request: NextRequest) {
  if (!GEMINI_API_KEY) {
    return NextResponse.json(
      { error: "Gemini API key not configured" },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    const userPrompt = `Generate an expert-level deep research report on the following topic. The reader is ALREADY an expert on the basics - they want the nuances, hidden mechanics, and insights that even educated people typically miss.

TOPIC: ${query.trim()}

Remember:
1. SKIP lengthy introductions - 2-3 sentences of context maximum
2. 90% of content should be advanced nuances and insider knowledge
3. Focus on how things ACTUALLY work vs. the simplified narrative
4. Include counterintuitive findings and ongoing expert debates
5. Every section should teach something most educated people don't know
6. Be specific - name names, cite mechanisms, explain dynamics
7. Include references to academic sources, expert content, and primary documents from search results
8. CRITICAL: Include 3-5 social media highlights from experts/insiders sharing nuanced insights
9. CRITICAL: Include 2-4 podcast references where experts discuss this topic in depth

Respond with valid JSON only. No markdown formatting around the JSON.`;

    // Call Gemini API with grounding
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${DEEP_SEARCH_SYSTEM_PROMPT}\n\n${userPrompt}` }],
            },
          ],
          tools: [
            {
              google_search: {},
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8000,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return NextResponse.json(
        { error: `AI service error: ${response.status}` },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Extract content and grounding metadata
    const candidate = data.candidates?.[0];
    let content = candidate?.content?.parts?.[0]?.text || "";
    const groundingMetadata: GroundingMetadata = candidate?.groundingMetadata || {};

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI" },
        { status: 500 }
      );
    }

    // Extract real URLs from grounding metadata
    const groundedLinks: { title: string; url: string; type: string }[] = [];
    if (groundingMetadata.groundingChunks) {
      for (const chunk of groundingMetadata.groundingChunks) {
        if (chunk.web?.uri && chunk.web?.title) {
          groundedLinks.push({
            title: chunk.web.title,
            url: chunk.web.uri,
            type: getLinkType(chunk.web.uri, chunk.web.title),
          });
        }
      }
    }

    console.log(`Deep Search: Found ${groundedLinks.length} grounded links from Google Search`);

    // Strip markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    }

    // Try to parse the JSON response
    let report: Partial<DeepSearchReport>;
    try {
      report = JSON.parse(content.trim());
    } catch (parseError) {
      console.error("Failed to parse JSON response:", content);
      return NextResponse.json({
        report: {
          topic: query,
          briefOverview: content,
          sections: [],
          hiddenMechanics: [],
          counterintuitiveInsights: [],
          expertDebates: [],
          underreportedAngles: [],
          socialMediaHighlights: [],
          podcastReferences: [],
          links: groundedLinks,
          timestamp: Date.now(),
        },
      });
    }

    // Build full report with grounded links
    const fullReport: DeepSearchReport = {
      topic: query,
      briefOverview: report.briefOverview || "",
      sections: report.sections || [],
      hiddenMechanics: report.hiddenMechanics || [],
      counterintuitiveInsights: report.counterintuitiveInsights || [],
      expertDebates: report.expertDebates || [],
      underreportedAngles: report.underreportedAngles || [],
      socialMediaHighlights: report.socialMediaHighlights || [],
      podcastReferences: report.podcastReferences || [],
      links: groundedLinks, // Use verified grounded links
      timestamp: Date.now(),
    };

    // Save to Firestore
    try {
      await adminDb.collection('deep_search_history').add({
        query: query.trim(),
        status: 'completed',
        timestamp: Timestamp.now(),
        completed_at: Timestamp.now(),
        results: fullReport,
        error: null,
      });
    } catch (saveError) {
      console.error('Failed to save to history:', saveError);
    }

    return NextResponse.json({ report: fullReport });
  } catch (error) {
    console.error("Deep Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
