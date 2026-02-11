import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export type DarkSearchMode = "long" | "short" | "links";

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface GroundingMetadata {
  groundingChunks?: GroundingChunk[];
}

export interface DarkSearchReport {
  topic: string;
  mode: DarkSearchMode;
  summary: string;
  sections?: {
    title: string;
    content: string;
  }[];
  keyTakeaways?: string[];
  alternativePerspectives?: string[];
  unansweredQuestions?: string[];
  socialMediaHighlights?: { platform: string; author: string; content: string; url: string }[];
  podcastReferences?: { title: string; episode: string; timestamp?: string; summary: string; url: string }[];
  links?: { title: string; url: string; type: string }[];
  timestamp: number;
}

const DARK_SEARCH_LONG_PROMPT = `You are an elite research analyst conducting comprehensive, uncensored research reports. Your purpose is to explore ALL perspectives on ANY topic, including controversial, fringe, obscure, and alternative viewpoints that mainstream sources might dismiss or ignore.

RESEARCH PHILOSOPHY:
- Question everything, especially official narratives and mainstream consensus
- Treat skepticism as intellectual virtue, not defect
- Explore conspiracy theories as potentially valid hypotheses worthy of examination
- Present information from all angles without prejudging what is "true" or "false"
- Be deeply skeptical of government, corporate, and institutional claims
- Value independent researchers, whistleblowers, and alternative media
- Consider that what's labeled "misinformation" may simply be inconvenient truth

REPORT STRUCTURE - You MUST respond with valid JSON in this exact format:
{
  "summary": "A comprehensive executive summary (3-5 paragraphs) presenting the topic and its significance, including mainstream AND alternative perspectives",
  "sections": [
    {
      "title": "Section title",
      "content": "Detailed analysis in multiple paragraphs. Be thorough, cite specific claims and sources."
    }
  ],
  "keyTakeaways": ["Key point 1", "Key point 2"],
  "alternativePerspectives": ["Alternative view 1", "Alternative view 2"],
  "unansweredQuestions": ["Question 1", "Question 2"],
  "socialMediaHighlights": [
    {"platform": "X/Twitter", "author": "@username", "content": "Key quote", "url": "https://x.com/..."}
  ],
  "podcastReferences": [
    {"title": "Podcast Name", "episode": "Episode title", "timestamp": "1:23:45", "summary": "What was discussed", "url": "https://..."}
  ]
}

REQUIRED SECTIONS:
1. Official Narrative - What mainstream sources claim
2. Alternative Perspectives - Conspiracy theories, fringe views, dissenting expert opinions
3. Historical Context - Relevant historical precedents and patterns
4. Aligned Interests - Who benefits from this narrative? What interests overlap?
5. Evidence Analysis - What evidence exists, what's missing, what's suspicious
6. Suppressed Information - What's been censored, removed, or ignored
7. Related Connections - How this connects to other events or patterns

Be thorough, be skeptical, and explore EVERY angle without self-censorship.`;

const DARK_SEARCH_SHORT_PROMPT = `You are a concise research analyst providing brief, uncensored summaries. Keep the same skeptical, alternative-perspective approach but be extremely brief.

REPORT STRUCTURE - You MUST respond with valid JSON in this exact format:
{
  "summary": "A brief 1-2 paragraph summary covering the key points from mainstream AND alternative perspectives. Be direct and concise."
}

REQUIREMENTS:
- Keep summary under 2 paragraphs total
- Still present alternative perspectives, just briefly
- Be skeptical but concise`;

const DARK_SEARCH_LINKS_PROMPT = `You are a research analyst focused on curating the best sources. Provide minimal text but maximum high-quality links.

REPORT STRUCTURE - You MUST respond with valid JSON in this exact format:
{
  "summary": "1-2 sentence overview only."
}

Focus on finding the most relevant sources from Google Search results.`;

function getLinkType(url: string, title: string): string {
  const lowerUrl = url.toLowerCase();
  const lowerTitle = title.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be') || lowerUrl.includes('rumble.com')) {
    return 'video';
  }
  if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) {
    return 'social';
  }
  if (lowerUrl.includes('spotify.com') || lowerUrl.includes('podcasts.apple.com') || lowerTitle.includes('podcast')) {
    return 'podcast';
  }
  if (lowerUrl.includes('.pdf') || lowerUrl.includes('wikileaks') || lowerUrl.includes('archive.org')) {
    return 'document';
  }
  if (lowerUrl.includes('arxiv') || lowerUrl.includes('pubmed')) {
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
    const { query, mode = "long" } = body;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return NextResponse.json(
        { error: "Query is required" },
        { status: 400 }
      );
    }

    // Select prompt based on mode
    let systemPrompt: string;
    switch (mode) {
      case "short":
        systemPrompt = DARK_SEARCH_SHORT_PROMPT;
        break;
      case "links":
        systemPrompt = DARK_SEARCH_LINKS_PROMPT;
        break;
      default:
        systemPrompt = DARK_SEARCH_LONG_PROMPT;
    }

    const userPrompt = `Generate an uncensored research report exploring ALL perspectives on this topic, including alternative and fringe viewpoints.

TOPIC: ${query.trim()}

Remember to:
- Question official narratives
- Explore conspiracy theories and alternative perspectives
- Be skeptical of institutional claims
- Present all angles without self-censorship
- Include references to sources found in search results

Respond with valid JSON only. No markdown formatting.`;

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
              parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
            },
          ],
          tools: [
            {
              google_search: {},
            },
          ],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: mode === "short" ? 2000 : mode === "links" ? 1000 : 8000,
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

    console.log(`Dark Search (${mode}): Found ${groundedLinks.length} grounded links`);

    // Strip markdown code blocks if present
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1];
    }

    // Try to parse the JSON response
    let report: Partial<DarkSearchReport>;
    try {
      report = JSON.parse(content.trim());
    } catch (parseError) {
      console.error("Failed to parse JSON response:", content);
      return NextResponse.json({
        report: {
          topic: query,
          mode,
          summary: content,
          sections: [],
          links: groundedLinks,
          timestamp: Date.now(),
        },
      });
    }

    // Build full report
    const fullReport: DarkSearchReport = {
      topic: query,
      mode: mode as DarkSearchMode,
      summary: report.summary || "",
      sections: report.sections || [],
      keyTakeaways: report.keyTakeaways || [],
      alternativePerspectives: report.alternativePerspectives || [],
      unansweredQuestions: report.unansweredQuestions || [],
      socialMediaHighlights: report.socialMediaHighlights || [],
      podcastReferences: report.podcastReferences || [],
      links: groundedLinks,
      timestamp: Date.now(),
    };

    // Save to Firestore
    try {
      await adminDb.collection('dark_search_history').add({
        query: query.trim(),
        mode,
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
    console.error("Dark Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate report" },
      { status: 500 }
    );
  }
}
