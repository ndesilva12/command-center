import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import axios from 'axios';
import * as cheerio from 'cheerio';

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

async function extractYouTubeTranscript(url: string): Promise<{ content: string; title: string; sourceType: string }> {
  const videoId = extractYouTubeId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  try {
    const { YoutubeTranscript } = await import('youtube-transcript');
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    if (!transcriptData || transcriptData.length === 0) throw new Error('No transcript available');

    const content = transcriptData.map((segment: any) => segment.text).join(' ');
    let title = `YouTube Video ${videoId}`;

    try {
      const ytdl = await import('@distube/ytdl-core');
      const info = await ytdl.default.getBasicInfo(`https://www.youtube.com/watch?v=${videoId}`);
      title = info.videoDetails.title;
    } catch (e) {}

    return { content, title, sourceType: 'youtube' };
  } catch (error: any) {
    throw new Error(`YouTube transcript not available: ${error.message}`);
  }
}

async function extractContent(url: string): Promise<{ content: string; title: string; sourceType: string }> {
  const urlLower = url.toLowerCase();

  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) {
    return await extractYouTubeTranscript(url);
  }

  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 30000,
    maxContentLength: 50 * 1024 * 1024,
  });

  const contentType = response.headers['content-type'] || '';

  if (contentType.includes('application/pdf') || url.toLowerCase().endsWith('.pdf')) {
    const { PDFParse } = await import('pdf-parse');
    const parser = new PDFParse({ data: Buffer.from(response.data) });
    const textResult = await parser.getText();
    let title = new URL(url).hostname;
    try {
      const infoResult = await parser.getInfo();
      if (infoResult.metadata && 'Title' in infoResult.metadata) {
        title = (infoResult.metadata as any).Title || title;
      }
    } catch (e) {}
    return { content: textResult.text, title, sourceType: 'pdf' };
  }

  if (contentType.includes('text/html')) {
    const html = Buffer.from(response.data).toString('utf-8');
    const $ = cheerio.load(html);
    $('script, style, nav, header, footer, iframe, noscript').remove();

    let content = '';
    const article = $('article, main, .content, .post-content, .entry-content, [role="main"]').first();
    content = article.length ? article.text() : $('body').text();
    content = content.replace(/\s+/g, ' ').trim();

    const title = $('title').text() || $('h1').first().text() || new URL(url).hostname;
    return { content, title: title.trim(), sourceType: 'webpage' };
  }

  if (contentType.includes('text/plain')) {
    return {
      content: Buffer.from(response.data).toString('utf-8'),
      title: new URL(url).hostname,
      sourceType: 'text',
    };
  }

  throw new Error(`Unsupported content type: ${contentType}`);
}

function estimatePages(content: string): number {
  return Math.ceil(content.length / 2500);
}

export async function POST(request: NextRequest) {
  try {
    const { url, targetPages } = await request.json();

    if (!url || !targetPages) {
      return NextResponse.json({ error: 'URL and targetPages required' }, { status: 400 });
    }

    if (!ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'Anthropic API key not configured' }, { status: 500 });
    }

    // Extract content
    const { content, title, sourceType } = await extractContent(url);
    const originalPages = estimatePages(content);

    if (originalPages <= targetPages) {
      return NextResponse.json({
        success: true,
        title,
        sourceType,
        originalPages,
        summary: content,
        compressionRatio: 1,
      });
    }

    // Summarize with Claude
    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });
    const targetWords = targetPages * 500;

    const prompt = `Condense this content into approximately ${targetPages} pages (${targetWords} words).

TITLE: ${title}
ORIGINAL LENGTH: ~${originalPages} pages

CONTENT:
${content.substring(0, 40000)}

INSTRUCTIONS:
- Create a ${targetPages}-page summary
- Preserve key insights, arguments, data, conclusions
- Maintain logical flow and structure
- Use clear, concise language
- Include section headings if helpful

Return the summary directly (no JSON, no meta-commentary):`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-5-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    const textContent = message.content.find(c => c.type === 'text');
    if (!textContent || textContent.type !== 'text') {
      throw new Error('No response from Claude');
    }

    const summary = textContent.text;
    const summaryPages = estimatePages(summary);
    const compressionRatio = Math.round((originalPages / summaryPages) * 10) / 10;

    return NextResponse.json({
      success: true,
      title,
      sourceType,
      originalPages,
      summaryPages,
      compressionRatio,
      summary,
    });

  } catch (error: any) {
    console.error('Summarizer process error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
