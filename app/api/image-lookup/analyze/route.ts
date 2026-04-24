import { NextRequest, NextResponse } from 'next/server';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const XAI_API_KEY = process.env.XAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { imageUrl, imageBase64 } = await request.json();

    if (!imageUrl && !imageBase64) {
      return NextResponse.json(
        { error: 'Either imageUrl or imageBase64 is required' },
        { status: 400 }
      );
    }

    if (!OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API not configured (required for image analysis)' },
        { status: 503 }
      );
    }

    // Prepare image for OpenAI Vision
    let imageContent: any;
    if (imageBase64) {
      // Use base64 directly
      imageContent = {
        type: "image_url",
        image_url: {
          url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
        },
      };
    } else {
      // Use URL directly
      imageContent = {
        type: "image_url",
        image_url: {
          url: imageUrl,
        },
      };
    }

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

    // Use OpenAI GPT-4o for vision
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: analysisPrompt },
              imageContent,
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const responseText = data.choices?.[0]?.message?.content || '';

    if (!responseText) {
      throw new Error('No response from OpenAI');
    }

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

    // Perform web search for context using Grok (has live search)
    let webContext = null;
    if (XAI_API_KEY && analysis.searchKeywords && analysis.searchKeywords.length > 0) {
      const searchQuery = analysis.searchKeywords.slice(0, 3).join(' ');
      const searchPrompt = `Search the web for information related to: ${searchQuery}
      
Based on an image containing: ${analysis.description}

Find relevant information about:
- What this image depicts
- Possible sources or origins
- Related topics or context

Return a brief summary of findings.`;

      try {
        const searchResponse = await fetch('https://api.x.ai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${XAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: 'grok-3-mini-fast',
            messages: [{ role: 'user', content: searchPrompt }],
            search: true,
            temperature: 0.3,
            max_tokens: 2048,
          }),
        });

        if (searchResponse.ok) {
          const searchData = await searchResponse.json();
          webContext = searchData.choices?.[0]?.message?.content || null;
        }
      } catch (err) {
        console.error('Web context search failed:', err);
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
