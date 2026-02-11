import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageBase64 } = await request.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: 'Either imageUrl or imageBase64 is required' },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      return NextResponse.json(
        { error: 'AI API not configured' },
        { status: 503 }
      );
    }

    // Prepare image data for Gemini
    let imageData: any;
    if (imageBase64) {
      // Remove data URL prefix if present
      const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
      imageData = {
        inlineData: {
          data: base64Data,
          mimeType: imageBase64.match(/^data:image\/([a-z]+);base64,/)?.[0].includes('png') ? 'image/png' : 'image/jpeg',
        },
      };
    } else {
      // For URLs, we need to fetch and convert to base64
      const imageResponse = await fetch(imageUrl);
      const arrayBuffer = await imageResponse.arrayBuffer();
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const contentType = imageResponse.headers.get('content-type') || 'image/jpeg';
      
      imageData = {
        inlineData: {
          data: base64,
          mimeType: contentType,
        },
      };
    }

    // Analyze image with Gemini Vision
    const analysisPrompt = `Analyze this image in detail. Provide:

1. **Image Description**: What is shown in the image? Be specific and detailed.
2. **Type/Category**: What type of image is this? (photo, screenshot, artwork, diagram, etc.)
3. **Notable Elements**: Key objects, people, text, or features visible
4. **Context Clues**: Any text, logos, locations, or identifying information
5. **Potential Sources**: Based on the content, where might this image come from? (website, social media, stock photo, etc.)
6. **Similar Images**: What keywords or search terms would find similar images?

Return ONLY valid JSON with this exact structure (no markdown, no backticks):
{
  "description": "Detailed description of what's in the image",
  "type": "Type of image (photo/screenshot/artwork/etc)",
  "elements": ["element1", "element2", "element3"],
  "contextClues": ["clue1", "clue2", "clue3"],
  "potentialSources": ["source1", "source2"],
  "searchKeywords": ["keyword1", "keyword2", "keyword3"]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: analysisPrompt },
                imageData,
              ],
            },
          ],
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
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
      console.error('No JSON found in response:', responseText.substring(0, 500));
      throw new Error('Failed to parse image analysis');
    }

    const analysis = JSON.parse(jsonMatch[0]);

    // Also perform web search for context if we have good keywords
    let webContext = null;
    if (analysis.searchKeywords && analysis.searchKeywords.length > 0) {
      const searchQuery = analysis.searchKeywords.slice(0, 3).join(' ');
      const searchPrompt = `Search the web for information related to: ${searchQuery}
      
Based on an image containing: ${analysis.description}

Find relevant information about:
- What this image depicts
- Possible sources or origins
- Related topics or context

Return a brief summary of findings.`;

      const searchResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: searchPrompt }] }],
            generationConfig: {
              temperature: 0.3,
              maxOutputTokens: 2048,
            },
            tools: [{ google_search: {} }],
          }),
        }
      );

      if (searchResponse.ok) {
        const searchData: GeminiResponse = await searchResponse.json();
        if (searchData.candidates && searchData.candidates.length > 0) {
          webContext = searchData.candidates[0].content.parts[0].text;
        }
      }
    }

    return NextResponse.json({
      analysis,
      webContext,
      searchUrl: {
        google: imageUrl ? `https://lens.google.com/uploadbyurl?url=${encodeURIComponent(imageUrl)}` : null,
        bing: imageUrl ? `https://www.bing.com/images/search?view=detailv2&iss=sbi&form=SBIVSP&sbisrc=UrlPaste&q=imgurl:${encodeURIComponent(imageUrl)}` : null,
      },
    });
  } catch (error) {
    console.error('Error analyzing image:', error);
    return NextResponse.json(
      { error: 'Failed to analyze image', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
