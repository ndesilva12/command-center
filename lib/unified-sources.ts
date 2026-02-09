// Unified sources - combines search sources and tools into a single system

export type UnifiedSourceId =
  // Web search sources
  | "google"
  | "images"
  | "news"
  | "trends"
  | "duck"
  | "wikipedia"
  | "x"
  | "youtube"
  | "amazon"
  | "spotify"
  // AI sources
  | "grok"
  | "gemini"
  | "claude"
  | "chatgpt";

export type SourceType = "web" | "ai";

export interface UnifiedSourceConfig {
  id: UnifiedSourceId;
  name: string;
  description: string;
  type: SourceType;
  // For web sources - the search URL template
  searchUrlTemplate?: string;
  // For AI sources - API endpoint
  apiEndpoint?: string;
}

// Ordered list of all sources as specified
export const UNIFIED_SOURCES: UnifiedSourceConfig[] = [
  // Web search sources
  {
    id: "google",
    name: "Google",
    description: "Google search",
    type: "web",
    searchUrlTemplate: "https://www.google.com/search?q={query}",
  },
  {
    id: "images",
    name: "Images",
    description: "Google Images search",
    type: "web",
    searchUrlTemplate: "https://www.google.com/search?q={query}&tbm=isch",
  },
  {
    id: "news",
    name: "News",
    description: "Google News search",
    type: "web",
    searchUrlTemplate: "https://www.google.com/search?q={query}&tbm=nws",
  },
  {
    id: "trends",
    name: "Trends",
    description: "Google Trends",
    type: "web",
    searchUrlTemplate: "https://trends.google.com/trends/explore?q={query}",
  },
  {
    id: "duck",
    name: "Duck",
    description: "DuckDuckGo private search",
    type: "web",
    searchUrlTemplate: "https://duckduckgo.com/?q={query}",
  },
  {
    id: "wikipedia",
    name: "Wikipedia",
    description: "Wikipedia search",
    type: "web",
    searchUrlTemplate: "https://en.wikipedia.org/wiki/Special:Search?search={query}",
  },
  {
    id: "x",
    name: "X",
    description: "X/Twitter search",
    type: "web",
    searchUrlTemplate: "https://x.com/search?q={query}",
  },
  {
    id: "youtube",
    name: "Youtube",
    description: "YouTube search",
    type: "web",
    searchUrlTemplate: "https://www.youtube.com/results?search_query={query}",
  },
  {
    id: "amazon",
    name: "Amazon",
    description: "Amazon product search",
    type: "web",
    searchUrlTemplate: "https://www.amazon.com/s?k={query}",
  },
  {
    id: "spotify",
    name: "Spotify",
    description: "Spotify music search",
    type: "web",
    searchUrlTemplate: "https://open.spotify.com/search/{query}",
  },
  // AI sources
  {
    id: "grok",
    name: "Grok",
    description: "xAI Grok",
    type: "ai",
    apiEndpoint: "https://grok.com",
  },
  {
    id: "gemini",
    name: "Gemini",
    description: "Google Gemini",
    type: "ai",
    apiEndpoint: "https://gemini.google.com/app",
  },
  {
    id: "claude",
    name: "Claude",
    description: "Anthropic Claude",
    type: "ai",
    apiEndpoint: "https://claude.ai/new",
  },
  {
    id: "chatgpt",
    name: "ChatGPT",
    description: "OpenAI ChatGPT",
    type: "ai",
    apiEndpoint: "https://chatgpt.com",
  },
];

// Default source
export const DEFAULT_SOURCE: UnifiedSourceId = "google";

// Get search URL for a web source
export function getSearchUrl(sourceId: UnifiedSourceId, query: string): string {
  const source = UNIFIED_SOURCES.find(s => s.id === sourceId);
  if (!source?.searchUrlTemplate) return "";
  return source.searchUrlTemplate.replace("{query}", encodeURIComponent(query));
}

// Get source config by ID
export function getSourceConfig(sourceId: UnifiedSourceId): UnifiedSourceConfig | undefined {
  return UNIFIED_SOURCES.find(s => s.id === sourceId);
}

// Get AI model URL for external links
export function getAIModelUrl(sourceId: UnifiedSourceId): string {
  const source = UNIFIED_SOURCES.find(s => s.id === sourceId);
  if (source?.type === "ai") {
    return source.apiEndpoint || "";
  }
  return "";
}
