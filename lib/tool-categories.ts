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
  { id: 'people', name: 'People', href: '/tools/people', description: 'Personal network from Notion' },
  { id: 'recommendations', name: 'Recommendations', href: '/tools/recommendations', description: 'Track suggestions' },
  { id: 'read', name: 'Read', href: '/tools/read', description: 'RSS feed reader' },
  { id: 'bookmarks', name: 'Bookmarks', href: '/tools/bookmarks', description: 'Raindrop.io bookmarks' },
  { id: 'market', name: 'Market', href: '/tools/market', description: 'Stocks and crypto prices' },
  { id: 'notes', name: 'Notes', href: '/tools/notes', description: 'Quick notes' },
  { id: 'files', name: 'Files', href: '/tools/files', description: 'Google Drive files' },
  { id: 'spotify', name: 'Spotify', href: '/tools/spotify', description: 'Control your music' },
  { id: 'trending', name: 'Trending', href: '/tools/trending', description: 'Trending topics' },
  { id: 'meals', name: 'Meals', href: '/tools/meals', description: 'Weekly meal planning' },
  { id: 'image-lookup', name: 'Image Lookup', href: '/tools/image-lookup', description: 'Reverse image search' },
  { id: 'shopping', name: 'Shopping', href: '/tools/shopping', description: 'Shopping wishlist and lists' },
  { id: 'emailer', name: 'Emailer', href: '/tools/emailer', description: 'Send personalized bulk emails' },
];

export const INTELLIGENCE_TOOLS: ToolDefinition[] = [
  { id: 'curate', name: 'Curate', href: '/tools/curate', description: 'Find intellectually stimulating content - especially content that challenges your beliefs' },
  { id: 'l3d', name: 'L3D Research', href: '/tools/l3d', description: 'Research any topic from the last 30 days across Reddit, X, and web' },
  { id: 'white-papers', name: 'White Papers', href: '/tools/white-papers', description: '10 most relevant white papers on any topic (general + worldview-aligned)' },
  { id: 'one-pager', name: 'One-Pager', href: '/tools/one-pager', description: 'Generate comprehensive single-page summaries with data, visuals, and links' },
  { id: 'deep-search', name: 'Deep Search', href: '/tools/deep-search', description: 'Deep web search' },
  { id: 'dark-search', name: 'Dark Search', href: '/tools/dark-search', description: 'Dark web search' },
  { id: 'jmail', name: 'JMail', href: '/tools/jmail', description: 'Search Jeffrey Epstein\'s emails (2002-2011)' },
  { id: 'legal', name: 'Legal', href: '/tools/legal', description: 'Legal assistant and contract review' },
  { id: 'relationships', name: 'Relationships', href: '/tools/relationships', description: 'Contact insights' },
  { id: 'politicorp', name: 'Politicorp', href: '/tools/politicorp', description: 'Corporate political analysis and compass' },
  { id: 'cbb', name: 'CBB Value Plays', href: '/tools/cbb', description: 'College basketball ATS value play analysis with pattern-based betting' },
  { id: 'roster-map', name: 'Roster Map', href: '/tools/roster-map', description: 'Visualize where college basketball players come from on a map' },
  { id: 'summarizer', name: 'Summarizer', href: '/tools/summarizer', description: 'Condense any content into custom-length summaries' },
  { id: 'business', name: 'Business Intel', href: '/tools/business', description: 'Private business intelligence and public records' },
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
