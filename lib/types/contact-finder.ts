// Contact Finder Types

export type SearchType = "individual" | "target";

export interface ContactMethod {
  type: "email" | "phone" | "x" | "instagram" | "facebook" | "linkedin" | "website" | "form" | "other";
  value: string;
  confidence: "high" | "medium" | "low" | "speculative";
  source?: string;
  notes?: string;
}

export interface ContactResult {
  name: string;
  title?: string;
  organization?: string;
  contacts: ContactMethod[];
  personalizationHooks?: string[];
  reasoning?: string;
  additionalNotes?: string;
}

export interface SearchResult {
  query: string;
  searchType: SearchType;
  results: ContactResult[];
  summary: string;
  createdAt: string;
}

export const DISCLAIMER = `⚠️ IMPORTANT DISCLAIMER

All contact information is:
- Speculative and derived from publicly available sources only
- For legitimate contact purposes
- Subject to verification
- May be outdated or incorrect

Always respect privacy and applicable laws when using this information.`;
