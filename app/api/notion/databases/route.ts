import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

export async function GET() {
  try {
    // Fetch all results and filter for databases
    const response = await notion.search({
      sort: {
        direction: 'descending',
        timestamp: 'last_edited_time',
      },
    });

    // Filter results to only include databases
    const databases = response.results.filter((result: any) => result.object === 'database');

    return NextResponse.json({
      databases,
    });
  } catch (error) {
    console.error('Notion databases error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch databases' },
      { status: 500 }
    );
  }
}
