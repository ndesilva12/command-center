import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const OPENCLAW_GATEWAY = 'http://3.141.47.151:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';

export async function POST(request: NextRequest) {
  try {
    const { url, targetPages } = await request.json();
    
    if (!url || !targetPages) {
      return NextResponse.json(
        { error: 'URL and target pages are required' },
        { status: 400 }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Validate target pages
    if (targetPages < 1 || targetPages > 100) {
      return NextResponse.json(
        { error: 'Target pages must be between 1 and 100' },
        { status: 400 }
      );
    }
    
    // Create summary document
    const summaryRef = await adminDb.collection('summaries').add({
      url,
      targetPages,
      status: 'queued',
      title: new URL(url).hostname,
      createdAt: new Date().toISOString(),
    });

    const summaryId = summaryRef.id;
    
    // Build intelligent summarization prompt
    const prompt = `Summarize content from: "${url}"
Target: ${targetPages} pages (~${targetPages * 500} words)

CONTENT EXTRACTION STRATEGY:

1. DETECT SOURCE TYPE:
   - YouTube: youtube.com, youtu.be, youtube.com/shorts
   - Podcast: spotify.com/episode, apple.com/podcast, .rss, podcast platforms
   - PDF: .pdf extension, application/pdf
   - Web page: HTML content
   - Plain text: text/plain

2. EXTRACT CONTENT:
   
   **YouTube Videos:**
   - Use web_fetch to get the page
   - Look for transcript/captions in page HTML or use yt-dlp if available
   - Extract video title
   - ERROR if no transcript: "YouTube transcript not available"
   
   **Podcasts:**
   - Try RSS feed parsing first (if .rss or feed URL)
   - Fallback: web_fetch and scrape for .transcript, #transcript, .show-notes
   - Extract episode title and description
   - ERROR if no content: "Podcast transcript not available"
   
   **PDFs:**
   - Use web_fetch to download
   - Extract text (you may need to use exec with pdftotext or similar)
   - Get document title from metadata if available
   
   **Web Pages:**
   - Use web_fetch to get HTML
   - Extract main content (article, main, .content selectors)
   - Remove scripts, styles, navigation
   - Get page title
   
   **Plain Text:**
   - Use web_fetch to get content directly

3. ESTIMATE PAGES:
   - ~500 words per page
   - ~5 chars per word
   - ~2500 chars per page
   
4. SUMMARIZE (if needed):
   - If original content ≤ ${targetPages} pages: return as-is (no summarization needed)
   - If original > ${targetPages} pages: use AI to condense
   
   **AI Summarization Prompt:**
   "You are a professional content summarizer. Condense the following content into approximately ${targetPages} pages (${targetPages * 500} words).
   
   ORIGINAL CONTENT:
   Title: {extracted_title}
   
   {extracted_content}
   
   INSTRUCTIONS:
   - Create a ${targetPages}-page summary (target: ${targetPages * 500} words)
   - Preserve key insights, arguments, data, and conclusions
   - Maintain logical flow and structure
   - Use clear, concise language
   - Include section headings if helpful
   - Prioritize accuracy over brevity
   
   OUTPUT FORMAT:
   - Well-structured prose
   - Paragraph breaks for readability
   - No meta-commentary
   - Just deliver the condensed content
   
   Begin summary:"

5. SAVE TO FIRESTORE:
   
   After generating summary, IMMEDIATELY save to Firestore using exec:
   
   node /home/ubuntu/command-center/scripts/update-firestore-doc.js summaries ${summaryId} '{
     "status": "completed",
     "title": "{extracted_title}",
     "sourceType": "{youtube|podcast|pdf|webpage|text}",
     "content": "{summary_text}",
     "originalPages": {original_page_count},
     "summaryPages": ${targetPages},
     "compressionRatio": {ratio},
     "completedAt": "{ISO-8601 timestamp}"
   }'
   
   If extraction/summarization FAILS, save error:
   
   node /home/ubuntu/command-center/scripts/update-firestore-doc.js summaries ${summaryId} '{
     "status": "failed",
     "error": "{error_message}",
     "failedAt": "{ISO-8601 timestamp}"
   }'

CRITICAL STEPS:
1. Detect source type from URL
2. Extract content (use web_fetch, exec tools as needed)
3. Estimate original page count
4. Summarize if needed (or return as-is if short enough)
5. Calculate compression ratio
6. Save to Firestore using exec command above

OUTPUT: Just confirm completion. The summary is saved to Firestore.`;

    // Spawn intelligent sub-agent for summarization
    const response = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tool: 'sessions_spawn',
        args: {
          task: prompt,
          label: `summarizer-${url.slice(0, 40)}`,
          cleanup: 'keep',
          runTimeoutSeconds: 300  // 5 minutes for long content
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenClaw gateway error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const spawnResult = data?.result?.details || data?.result;
    
    if (spawnResult?.status === 'accepted') {
      const runId = spawnResult.runId;
      
      // Fire-and-forget: Return immediately with summary ID
      // Sub-agent will save results to Firestore when complete
      return NextResponse.json({
        success: true,
        id: summaryId,
        runId,
        message: 'Summarization started - results will appear when complete'
      });
    }
    
    console.error('Unexpected spawn response:', JSON.stringify(data, null, 2));
    return NextResponse.json(
      { error: 'Failed to start summarization', details: data },
      { status: 500 }
    );
    
  } catch (error) {
    console.error('Error creating summary:', error);
    return NextResponse.json(
      { error: 'Failed to create summary request' },
      { status: 500 }
    );
  }
}
