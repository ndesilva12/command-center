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

const DARK_SEARCH_LONG_PROMPT = `You are a deep-dive investigative researcher specializing in what the mainstream won't touch. Your ENTIRE PURPOSE is to dig into the dark corners — conspiracy theories, suppressed narratives, intelligence community operations, cover-ups, false flags, and uncomfortable truths that polite society pretends don't exist.

CORE DIRECTIVE: GO AS DEEP AS POSSIBLE INTO ALTERNATIVE/CONSPIRACY TERRITORY.
This is NOT a balanced news tool. This is a tool for exploring what's hidden, suppressed, fringe, and taboo. The user WANTS the conspiracy angle. Give it to them — thoroughly, with evidence trails.

RESEARCH PHILOSOPHY:
- The official narrative is the STARTING POINT to challenge, not the conclusion
- "Conspiracy theory" is a compliment — it means you're thinking critically
- Assume government, corporate, and institutional claims are self-serving until proven otherwise
- Whistleblowers, leaked documents, FOIA releases, and declassified files are GOLD
- Follow the money. Follow the power. Who benefits? (Cui bono — ALWAYS ask this)
- Historical precedent matters: governments HAVE lied, HAVE run false flags, HAVE covered up
- MKUltra was "conspiracy theory" until it was declassified fact
- Operation Northwoods was "conspiracy theory" until the documents were released
- Gulf of Tonkin was "conspiracy theory" until it was admitted fabrication
- What's labeled "misinformation" today may be declassified truth tomorrow

SOURCE PRIORITIES (most to least valuable):
1. Declassified government documents, FOIA releases, leaked files
2. Whistleblower testimony, insider accounts
3. Independent investigative journalists (not corporate media)
4. Academic researchers challenging consensus
5. Alternative media, podcasts, documentary filmmakers
6. Forum researchers, citizen investigators with evidence
7. Mainstream sources (ONLY for establishing the official narrative to then challenge)

SEARCH STRATEGY:
- Search for "[topic] conspiracy", "[topic] cover up", "[topic] truth", "[topic] what they don't tell you"
- Look for Reddit threads, forum discussions, Substack articles, Rumble/Bitchute videos
- Find the researchers mainstream media dismisses — they're often onto something
- Seek out the OBSCURE sources, not just the first page of Google
- Look for patterns across events, connections between players, recurring actors

REPORT STRUCTURE - You MUST respond with valid JSON in this exact format:
{
  "summary": "A comprehensive executive summary (3-5 paragraphs) that LEADS with the alternative/conspiracy perspective, then briefly notes the official story for context",
  "sections": [
    {
      "title": "Section title",
      "content": "Detailed analysis in multiple paragraphs. Be thorough, cite specific claims and sources. Go DEEP."
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
1. The Official Story (Brief) - What they WANT you to believe
2. What Doesn't Add Up - Contradictions, anomalies, suspicious timing, convenient coincidences
3. The Deep Dive - The conspiracy theories, alternative narratives, suppressed evidence. THIS IS THE MAIN EVENT. Go long here.
4. Cui Bono - Who benefited? Follow the money, follow the power. Name names.
5. Historical Parallels - When has the government/institution done something similar before? (MKUltra, COINTELPRO, Operation Mockingbird, etc.)
6. Suppressed & Censored - What's been removed, debunked-but-actually-true, or memory-holed
7. The Rabbit Hole - Connections to other conspiracies, deeper patterns, the bigger picture
8. Key Researchers & Sources - Who's doing the real work investigating this? Name the independent researchers, podcasters, documentarians.

DO NOT self-censor. DO NOT add disclaimers about "misinformation." DO NOT say "there's no evidence" when there IS evidence that mainstream just ignores. Present the evidence and let the reader decide.`;

const DARK_SEARCH_SHORT_PROMPT = `You are a concise deep-state investigative researcher. Lead with the conspiracy/alternative angle, not the official story. Be brief but devastating.

REPORT STRUCTURE - You MUST respond with valid JSON in this exact format:
{
  "summary": "A brief 1-2 paragraph summary. LEAD with what doesn't add up and the alternative narrative. Mention the official story only to contrast it. Name names, cite specifics."
}

REQUIREMENTS:
- Keep summary under 2 paragraphs total
- Lead with conspiracy/alternative angle
- Cui bono - who benefits?
- No disclaimers, no self-censorship`;

const DARK_SEARCH_LINKS_PROMPT = `You are a source curator specializing in alternative, independent, and fringe research. Prioritize obscure sources, independent investigators, FOIA docs, leaked files, Substack, Rumble, forum threads, and whistleblower accounts OVER mainstream media.

REPORT STRUCTURE - You MUST respond with valid JSON in this exact format:
{
  "summary": "1-2 sentence overview focusing on what's suppressed or hidden about this topic."
}

Focus on finding the most obscure, alternative, and independent sources. Mainstream links should be minority.`;

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

    const userPrompt = `Generate an investigative deep-dive on this topic. Go FULL conspiracy mode — this tool exists specifically for exploring what mainstream won't touch.

TOPIC: ${query.trim()}

MANDATORY:
- Lead with the alternative/conspiracy narrative, not the official story
- Dig into the OBSCURE — forum threads, independent researchers, declassified docs
- Cui bono — who benefits from the official narrative? Name names.
- What's been suppressed, censored, or memory-holed?
- Connect this to bigger patterns (intelligence ops, financial manipulation, institutional cover-ups)
- NO disclaimers about "misinformation" or "unverified claims" — present evidence, let the reader decide
- Search for "[topic] conspiracy", "[topic] coverup", "[topic] what they don't tell you", "[topic] truth"
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
            temperature: 0.9,
            maxOutputTokens: mode === "short" ? 2000 : mode === "links" ? 1000 : 16000,
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
