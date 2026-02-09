/**
 * Tool Categories for Command Center
 * Defines all available tools organized by category
 */

export interface ToolDefinition {
  id: string;
  name: string;
  href: string;
  icon?: string;
  description?: string;
}

export const PRODUCTIVITY_TOOLS: ToolDefinition[] = [
  { id: 'emails', name: 'Emails', href: '/tools/emails', description: 'Gmail inbox and management' },
  { id: 'calendar', name: 'Calendar', href: '/tools/calendar', description: 'Google Calendar events' },
  { id: 'contacts', name: 'Contacts', href: '/tools/contacts', description: 'Google Contacts' },
  { id: 'people', name: 'People', href: '/tools/people', description: 'Personal network from Notion' },
  { id: 'news', name: 'News', href: '/tools/news', description: 'Latest news headlines' },
  { id: 'rss', name: 'RSS', href: '/tools/rss', description: 'RSS feed reader' },
  { id: 'bookmarks', name: 'Bookmarks', href: '/tools/bookmarks', description: 'Raindrop.io bookmarks' },
  { id: 'market', name: 'Market', href: '/tools/market', description: 'Stocks and crypto prices' },
  { id: 'notes', name: 'Notes', href: '/tools/notes', description: 'Quick notes' },
  { id: 'files', name: 'Files', href: '/tools/files', description: 'Google Drive files' },
  { id: 'trending', name: 'Trending', href: '/tools/trending', description: 'Trending topics' },
];

export const INTELLIGENCE_TOOLS: ToolDefinition[] = [
  { id: 'curate', name: 'Curate', href: '/tools/curate', description: 'Content curation' },
  { id: 'l3d', name: 'L3D', href: '/tools/l3d', description: 'Research assistant' },
  { id: 'analyze', name: 'Analyze', href: '/tools/analyze', description: 'Data analysis' },
  { id: 'insights', name: 'Insights', href: '/tools/insights', description: 'AI insights' },
];

export const ALL_TOOLS = [...PRODUCTIVITY_TOOLS, ...INTELLIGENCE_TOOLS];

export function getToolById(id: string): ToolDefinition | undefined {
  return ALL_TOOLS.find(tool => tool.id === id);
}

export function getToolCategory(toolId: string): 'productivity' | 'intelligence' | undefined {
  if (PRODUCTIVITY_TOOLS.find(t => t.id === toolId)) return 'productivity';
  if (INTELLIGENCE_TOOLS.find(t => t.id === toolId)) return 'intelligence';
  return undefined;
}

export function getToolsInCategory(toolId: string): ToolDefinition[] {
  const category = getToolCategory(toolId);
  if (category === 'productivity') return PRODUCTIVITY_TOOLS;
  if (category === 'intelligence') return INTELLIGENCE_TOOLS;
  return [];
}
