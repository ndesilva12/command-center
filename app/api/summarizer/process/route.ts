import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import axios from 'axios';
import * as cheerio from 'cheerio';

const OPENCLAW_GATEWAY = 'http://3.141.47.151:18789';
const OPENCLAW_TOKEN = 'fb23d6588a51f03dbfed5d1a3476737417034393f6b9ea57';

interface SummaryRequest {
  id: string;
  url: string;
  targetPages: number;
}

/**
 * Extract content from various sources (PDFs, web pages, etc.)
 */
async function extractContent(url: string): Promise<{ content: string; title: string; sourceType: string }> {
  try {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 30000,
      maxContentLength: 50 * 1024 * 1024, // 50MB max
    });

    const contentType = response.headers['content-type'] || '';

    // Handle PDFs
    if (contentType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) {
      // Import PDFParse class from pdf-parse v2
      const { PDFParse } = await import('pdf-parse');
      const parser = new PDFParse({ data: Buffer.from(response.data) });
      
      // Extract text from PDF
      const textResult = await parser.getText();
      
      // Extract metadata
      let title = new URL(url).hostname;
      try {
        const infoResult = await parser.getInfo();
        if (infoResult.metadata?.title) {
          title = infoResult.metadata.title;
        }
      } catch (e) {
        // Ignore metadata errors
      }
      
      return {
        content: textResult.text,
        title,
        sourceType: 'pdf',
      };
    }

    // Handle web pages
    if (contentType.includes('text/html')) {
      const html = Buffer.from(response.data).toString('utf-8');
      const $ = cheerio.load(html);

      // Remove script and style elements
      $('script, style, nav, header, footer, iframe, noscript').remove();

      // Try to extract main content
      let content = '';
      const article = $('article, main, .content, .post-content, .entry-content, [role="main"]').first();
      
      if (article.length) {
        content = article.text();
      } else {
        content = $('body').text();
      }

      // Clean up whitespace
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      // Extract title
      const title = $('title').text() || 
                   $('h1').first().text() || 
                   $('meta[property="og:title"]').attr('content') || 
                   new URL(url).hostname;

      return {
        content,
        title: title.trim(),
        sourceType: 'webpage',
      };
    }

    // Plain text
    if (contentType.includes('text/plain')) {
      return {
        content: Buffer.from(response.data).toString('utf-8'),
        title: new URL(url).hostname,
        sourceType: 'text',
      };
    }

    throw new Error(`Unsupported content type: ${contentType}`);
  } catch (error: any) {
    console.error('Content extraction error:', error);
    throw new Error(`Failed to extract content: ${error.message}`);
  }
}

/**
 * Estimate pages based on character count
 * Rough estimate: ~500 words per page, ~5 chars per word = ~2500 chars per page
 */
function estimatePages(content: string): number {
  return Math.ceil(content.length / 2500);
}

/**
 * Call OpenClaw to summarize content
 */
async function summarizeWithOpenClaw(
  content: string, 
  title: string,
  targetPages: number,
  currentPages: number
): Promise<string> {
  try {
    const targetWords = targetPages * 500; // ~500 words per page
    const compressionRatio = Math.round((currentPages / targetPages) * 100);

    const prompt = `You are a professional content summarizer. Condense the following content into approximately ${targetPages} pages (${targetWords} words).

ORIGINAL CONTENT (${currentPages} pages):
Title: ${title}

${content}

INSTRUCTIONS:
- Create a ${targetPages}-page summary (target: ${targetWords} words)
- Compression ratio: ~${compressionRatio}:1
- Preserve key insights, arguments, data, and conclusions
- Maintain logical flow and structure
- Use clear, concise language
- Include section headings if helpful
- Prioritize accuracy over brevity

OUTPUT FORMAT:
- Well-structured prose
- Paragraph breaks for readability
- No meta-commentary ("This summary..." etc.)
- Just deliver the condensed content

Begin summary:`;

    const response = await axios.post(
      `${OPENCLAW_GATEWAY}/api/sessions/send`,
      {
        message: prompt,
        agentId: 'main',
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENCLAW_TOKEN}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minutes
      }
    );

    if (response.data?.reply) {
      return response.data.reply;
    }

    throw new Error('No summary generated');
  } catch (error: any) {
    console.error('OpenClaw summarization error:', error);
    throw new Error(`Summarization failed: ${error.message}`);
  }
}

/**
 * Process a summary request
 */
export async function POST(request: NextRequest) {
  try {
    const { id, url, targetPages }: SummaryRequest = await request.json();

    if (!id || !url || !targetPages) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    console.log(`[Summarizer] Processing: ${id} - ${url} (${targetPages} pages)`);

    // Update status to processing
    const docRef = adminDb.collection('summaries').doc(id);
    await docRef.update({
      status: 'processing',
      processingStartedAt: new Date().toISOString(),
    });

    try {
      // Step 1: Extract content
      console.log(`[Summarizer] Extracting content from ${url}`);
      const { content, title, sourceType } = await extractContent(url);
      const originalPages = estimatePages(content);
      
      console.log(`[Summarizer] Extracted ${content.length} chars (~${originalPages} pages) from ${sourceType}`);

      await docRef.update({
        title,
        sourceType,
        originalPages,
        extractedAt: new Date().toISOString(),
      });

      // Step 2: Check if summarization is needed
      if (originalPages <= targetPages) {
        // Content is already short enough
        console.log(`[Summarizer] Content already fits in ${targetPages} pages, no summarization needed`);
        await docRef.update({
          status: 'completed',
          content,
          summary: content,
          compressionRatio: 1,
          completedAt: new Date().toISOString(),
        });

        return NextResponse.json({ 
          success: true, 
          message: 'Content already short enough',
          summary: content,
        });
      }

      // Step 3: Summarize with OpenClaw
      console.log(`[Summarizer] Summarizing ${originalPages} pages -> ${targetPages} pages`);
      const summary = await summarizeWithOpenClaw(content, title, targetPages, originalPages);
      
      const summaryPages = estimatePages(summary);
      const compressionRatio = Math.round((originalPages / summaryPages) * 10) / 10;

      console.log(`[Summarizer] Generated summary: ${summary.length} chars (~${summaryPages} pages, ${compressionRatio}:1 ratio)`);

      // Step 4: Save completed summary
      await docRef.update({
        status: 'completed',
        content: summary,
        summary,
        originalContent: content.substring(0, 10000), // Store first 10k chars of original
        summaryPages,
        compressionRatio,
        completedAt: new Date().toISOString(),
      });

      return NextResponse.json({ 
        success: true, 
        message: 'Summary completed',
        summary,
        stats: {
          originalPages,
          summaryPages,
          compressionRatio,
        }
      });

    } catch (error: any) {
      console.error(`[Summarizer] Processing error:`, error);
      
      // Mark as failed
      await docRef.update({
        status: 'failed',
        error: error.message,
        failedAt: new Date().toISOString(),
      });

      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[Summarizer] Request error:', error);
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}
