import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const databaseId = searchParams.get('databaseId');

    if (databaseId) {
      // Fetch specific database entries using type assertion
      const response = await (notion.databases as any).query({
        database_id: databaseId,
        sorts: [
          {
            timestamp: 'last_edited_time',
            direction: 'descending',
          },
        ],
      });

      return NextResponse.json({
        results: response.results,
        has_more: response.has_more,
        next_cursor: response.next_cursor,
      });
    } else {
      // Search for all pages
      const response = await notion.search({
        filter: {
          property: 'object',
          value: 'page',
        },
        sort: {
          direction: 'descending',
          timestamp: 'last_edited_time',
        },
        page_size: 50,
      });

      return NextResponse.json({
        results: response.results,
      });
    }
  } catch (error) {
    console.error('Notion API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion data' },
      { status: 500 }
    );
  }
}
