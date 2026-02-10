import { NextResponse } from 'next/server';
import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

// Root page ID from user's workspace
const ROOT_PAGE_ID = '2eabedd4141980339ff6dd66cc0fc0b3';

interface TreeNode {
  id: string;
  type: 'page' | 'database';
  title: string;
  icon?: any;
  url?: string;
  children?: TreeNode[];
  hasChildren: boolean;
}

async function getPageTitle(page: any): Promise<string> {
  if (page.properties) {
    const titleProp = Object.values(page.properties).find((prop: any) => prop.type === 'title') as any;
    if (titleProp && titleProp.title && titleProp.title[0]) {
      return titleProp.title[0].plain_text;
    }
  }
  return 'Untitled';
}

async function fetchPageChildren(pageId: string): Promise<TreeNode[]> {
  try {
    const blocks = await notion.blocks.children.list({
      block_id: pageId,
      page_size: 100,
    });

    const children: TreeNode[] = [];

    for (const block of blocks.results) {
      const typedBlock = block as any;

      if (typedBlock.type === 'child_page') {
        const childPage = await notion.pages.retrieve({ page_id: typedBlock.id });
        const title = await getPageTitle(childPage);

        // Check if this page has children
        const grandchildren = await notion.blocks.children.list({
          block_id: typedBlock.id,
          page_size: 1,
        });

        children.push({
          id: typedBlock.id,
          type: 'page',
          title,
          icon: (childPage as any).icon,
          url: (childPage as any).url,
          hasChildren: grandchildren.results.length > 0,
        });
      } else if (typedBlock.type === 'child_database') {
        const database = await notion.databases.retrieve({ database_id: typedBlock.id });
        const title = await getPageTitle(database);

        children.push({
          id: typedBlock.id,
          type: 'database',
          title,
          icon: (database as any).icon,
          url: (database as any).url,
          hasChildren: false, // Databases don't have nested children in this context
        });
      }
    }

    return children;
  } catch (error) {
    console.error('Error fetching page children:', error);
    return [];
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageId = searchParams.get('pageId') || ROOT_PAGE_ID;

    // Fetch the page details
    const page = await notion.pages.retrieve({ page_id: pageId });
    const title = await getPageTitle(page);

    // Fetch children
    const children = await fetchPageChildren(pageId);

    const tree: TreeNode = {
      id: pageId,
      type: 'page',
      title,
      icon: (page as any).icon,
      url: (page as any).url,
      children,
      hasChildren: children.length > 0,
    };

    return NextResponse.json(tree);
  } catch (error) {
    console.error('Notion tree API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Notion tree' },
      { status: 500 }
    );
  }
}
