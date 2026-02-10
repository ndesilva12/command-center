import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    // Fetch page content
    const page = await notion.pages.retrieve({ page_id: id });

    // Fetch page blocks (content)
    const blocks = await notion.blocks.children.list({
      block_id: id,
      page_size: 100,
    });

    return NextResponse.json({
      page,
      blocks: blocks.results,
    });
  } catch (error) {
    console.error('Notion page error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch page' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    // Update page properties
    const response = await notion.pages.update({
      page_id: id,
      properties: body.properties,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Notion update error:', error);
    return NextResponse.json(
      { error: 'Failed to update page' },
      { status: 500 }
    );
  }
}
