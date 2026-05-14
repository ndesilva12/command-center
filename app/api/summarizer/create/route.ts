import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAdminDb } from '@/lib/firebase-admin';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Convert congress.gov URL to govinfo.gov PDF URL
function getGovInfoPdfUrl(congressUrl: string): string | null {
  // Example: https://www.congress.gov/bill/119th-congress/house-bill/4312/text
  // Converts to: https://www.govinfo.gov/content/pkg/BILLS-119hr4312ih/pdf/BILLS-119hr4312ih.pdf
  const match = congressUrl.match(/congress\.gov\/bill\/(\d+)(?:th|st|nd|rd)-congress\/(house|senate)-bill\/(\d+)/i);
  if (match) {
    const congress = match[1];
    const chamber = match[2].toLowerCase() === 'house' ? 'hr' : 's';
    const billNum = match[3];
    // Try "ih" (introduced in house) or "is" (introduced in senate) version
    const version = chamber === 'hr' ? 'ih' : 'is';
    const pkg = `BILLS-${congress}${chamber}${billNum}${version}`;
    return `https://www.govinfo.gov/content/pkg/${pkg}/pdf/${pkg}.pdf`;
  }
  return null;
}

// Extract text from PDF using pdf-parse or fallback
async function extractPdfText(pdfUrl: string): Promise<string> {
  try {
    // Use jina.ai for PDF extraction (it handles PDFs well)
    const jinaUrl = `https://r.jina.ai/${pdfUrl}`;
    const response = await fetch(jinaUrl, {
      headers: { 'Accept': 'text/plain' }
    });
    
    if (response.ok) {
      const text = await response.text();
      if (text.length > 100 && !text.includes('CAPTCHA')) {
        return text.substring(0, 50000);
      }
    }
    
    // If jina fails, try fetching PDF directly and do basic extraction
    const pdfResponse = await fetch(pdfUrl);
    if (pdfResponse.ok) {
      // Return a note that we got the PDF but need client-side processing
      return `[PDF available at: ${pdfUrl}] - Content extraction requires PDF parsing library. Please use the PDF URL directly or install pdf-parse.`;
    }
    
    throw new Error('Could not extract PDF text');
  } catch (error) {
    throw new Error(`PDF extraction failed: ${error}`);
  }
}

async function fetchContent(url: string): Promise<string> {
  // Special handling for congress.gov URLs - convert to govinfo.gov PDF
  if (url.includes('congress.gov/bill/')) {
    const pdfUrl = getGovInfoPdfUrl(url);
    if (pdfUrl) {
      try {
        const pdfText = await extractPdfText(pdfUrl);
        if (pdfText.length > 100) {
          return pdfText;
        }
      } catch (e) {
        console.log('GovInfo PDF extraction failed, trying other methods:', e);
      }
    }
  }

  // Full browser-like headers to avoid bot detection
  const browserHeaders = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Sec-Ch-Ua': '"Chromium";v="122", "Not(A:Brand";v="24", "Google Chrome";v="122"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"macOS"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'none',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  };

  try {
    // Try direct fetch first
    let response = await fetch(url, { headers: browserHeaders });
    
    // If blocked (403/503) or Cloudflare challenge, try fallback methods
    if (!response.ok || response.status === 403 || response.status === 503) {
      const text = await response.text();
      
      // Check for Cloudflare challenge
      if (text.includes('Just a moment') || text.includes('Checking your browser') || text.includes('cf-browser-verification')) {
        // Try alternative: use a readable extraction service
        // First, try the r.jina.ai reader API (free, no auth needed)
        const jinaUrl = `https://r.jina.ai/${url}`;
        const jinaResponse = await fetch(jinaUrl, {
          headers: { 'Accept': 'text/plain' }
        });
        
        if (jinaResponse.ok) {
          const jinaText = await jinaResponse.text();
          if (jinaText.length > 100) {
            return jinaText.substring(0, 50000);
          }
        }
        
        // If jina fails, try urlbox/web archive as last resort for .gov sites
        if (url.includes('.gov')) {
          // For congress.gov, try the XML version if available
          const xmlUrl = url.replace('/text', '/text/xml');
          const xmlResponse = await fetch(xmlUrl, { headers: browserHeaders });
          if (xmlResponse.ok) {
            const xmlText = await xmlResponse.text();
            // Extract text from XML
            const cleanText = xmlText
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim();
            if (cleanText.length > 100) {
              return cleanText.substring(0, 50000);
            }
          }
        }
        
        throw new Error('Site has bot protection (Cloudflare). Try a different URL format or PDF version.');
      }
      
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const html = await response.text();
    
    // Check if we got a challenge page anyway
    if (html.includes('Just a moment') || html.includes('Checking your browser')) {
      // Try jina.ai fallback
      const jinaUrl = `https://r.jina.ai/${url}`;
      const jinaResponse = await fetch(jinaUrl, {
        headers: { 'Accept': 'text/plain' }
      });
      
      if (jinaResponse.ok) {
        const jinaText = await jinaResponse.text();
        if (jinaText.length > 100) {
          return jinaText.substring(0, 50000);
        }
      }
      
      throw new Error('Site has bot protection. Try a different URL or PDF version.');
    }
    
    // Basic HTML to text conversion
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return text.substring(0, 50000); // Limit to ~50k chars
  } catch (error) {
    // If all else fails, try jina.ai as final attempt
    try {
      const jinaUrl = `https://r.jina.ai/${url}`;
      const jinaResponse = await fetch(jinaUrl, {
        headers: { 'Accept': 'text/plain' }
      });
      
      if (jinaResponse.ok) {
        const jinaText = await jinaResponse.text();
        if (jinaText.length > 100) {
          return jinaText.substring(0, 50000);
        }
      }
    } catch {
      // Jina fallback also failed
    }
    
    throw new Error(`Failed to fetch content: ${error instanceof Error ? error.message : error}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url, targetPages } = await request.json();
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const pages = targetPages || 2;
    const targetWords = pages * 500;

    // Fetch the content
    let content: string;
    try {
      content = await fetchContent(url);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : 'Failed to fetch content' },
        { status: 400 }
      );
    }

    if (content.length < 100) {
      return NextResponse.json({ error: 'Not enough content to summarize' }, { status: 400 });
    }

    // Use Claude to summarize
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    
    const prompt = `Summarize this content in approximately ${targetWords} words (~${pages} pages).

CONTENT:
${content.substring(0, 30000)}

Create a comprehensive summary that:
1. Captures all key points and arguments
2. Maintains the logical flow
3. Preserves important details, quotes, and data
4. Is well-structured with clear sections

Return ONLY valid JSON:
{
  "title": "Document title",
  "summary": "The full summary text with markdown formatting",
  "key_points": ["Main takeaways"],
  "word_count": 1000,
  "original_length": "Approximate original word count",
  "compression_ratio": "10:1"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No text response from Claude');
    }

    let result: any = {};
    try {
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // If JSON parsing fails, use the raw text as summary
      result = {
        title: new URL(url).hostname,
        summary: textContent.text,
        key_points: [],
        word_count: textContent.text.split(/\s+/).length
      };
    }

    // Save to Firestore
    const db = getAdminDb();
    const docData = {
      url,
      title: result.title || new URL(url).hostname,
      targetPages: pages,
      status: 'completed',
      content: result.summary || '',
      summary: result.summary || '',
      key_points: result.key_points || [],
      word_count: result.word_count || 0,
      timestamp: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    try {
      await db.collection('summarizer_history').add(docData);
    } catch (saveError) {
      console.error('Failed to save to Firestore:', saveError);
      // Continue anyway - return result even if save fails
    }

    return NextResponse.json({
      success: true,
      url,
      targetPages: pages,
      timestamp: new Date().toISOString(),
      ...result
    });

  } catch (error) {
    console.error('Summarizer API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
// Force redeploy Mon Apr 13 10:09:43 EDT 2026
