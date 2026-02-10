import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET() {
  try {
    // Fetch databases
    const response = await notion.search({
      filter: {
        property: 'object',
        value: 'database',
      },
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
    });

    return NextResponse.json({
      databases: response.results,
    });
  } catch (error) {
    console.error('Notion databases error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch databases' },
      { status: 500 }
    );
  }
}
