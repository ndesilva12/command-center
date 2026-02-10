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
  { id: 'recommendations', name: 'Recommendations', href: '/tools/recommendations', description: 'Track suggestions' },
  { id: 'read', name: 'Read', href: '/tools/read', description: 'RSS feed reader' },
  { id: 'bookmarks', name: 'Bookmarks', href: '/tools/bookmarks', description: 'Raindrop.io bookmarks' },
  { id: 'market', name: 'Market', href: '/tools/market', description: 'Stocks and crypto prices' },
  { id: 'notes', name: 'Notes', href: '/tools/notes', description: 'Quick notes' },
  { id: 'files', name: 'Files', href: '/tools/files', description: 'Google Drive files' },
  { id: 'spotify', name: 'Spotify', href: '/tools/spotify', description: 'Music streaming' },
  { id: 'trending', name: 'Trending', href: '/tools/trending', description: 'Trending topics' },
  { id: 'rosters', name: 'Rosters', href: '/tools/rosters', description: 'Team rosters' },
  { id: 'meals', name: 'Meals', href: '/tools/meals', description: 'Weekly meal planning' },
];

export const INTELLIGENCE_TOOLS: ToolDefinition[] = [
  { id: 'curate', name: 'Curate', href: '/tools/curate', description: 'Content curation' },
  { id: 'l3d', name: 'L3D', href: '/tools/l3d', description: 'Research assistant' },
  { id: 'deep-search', name: 'Deep Search', href: '/tools/deep-search', description: 'Deep web search' },
  { id: 'dark-search', name: 'Dark Search', href: '/tools/dark-search', description: 'Dark web search' },
  { id: 'image-lookup', name: 'Image Lookup', href: '/tools/image-lookup', description: 'Reverse image search' },
  { id: 'contact-finder', name: 'Contact Finder', href: '/tools/contact-finder', description: 'Find contact info' },
  { id: 'relationships', name: 'Relationships', href: '/tools/relationships', description: 'Contact insights' },
  { id: 'mission', name: 'Mission', href: '/tools/mission', description: 'Task management' },
  { id: 'investors', name: 'Investors', href: '/tools/investors', description: 'Fundraising pipeline' },
  { id: 'business-info', name: 'Business Info', href: '/tools/business-info', description: 'Company research' },
  { id: 'corporate', name: 'Corporate', href: '/tools/corporate', description: 'Corporate insights' },
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
