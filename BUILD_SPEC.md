# Command Center - Build Specification

## Overview
Rebuild of Norman's dashboard (normancdesilva.vercel.app) as a fresh "Command Center" with cleaner architecture and better integration with OpenClaw/Jimmy.

## Reference Repository
Study: `/home/ubuntu/normancdesilva/` for styling, patterns, and component structure.

## Design Requirements

### Visual Style
- **Dark theme** with glassmorphism (copy from normancdesilva globals.css)
- **Sacramento font** for logo/branding
- **Lucide icons** for all tools
- **Mobile-first** responsive design
- **Smooth animations** with Framer Motion
- **Glass cards** with backdrop blur

### Layout
- **Top Nav**: Logo (left), search (center), settings (right)
- **Bottom Nav** (mobile): Quick access to key tools
- **Grid of tool cards**: Category-based organization
- **Sidebar** (optional): Recent activity, quick links

## Tool Categories

### Intelligence Tools (Placeholders for now)
- Curate
- L3D  
- Deep Search
- Dark Search
- Image Lookup
- Contact Finder
- Relationships
- Mission
- Investors
- Business Info
- Corporate

### Productivity Tools

**Already functional in normancdesilva (copy patterns):**
- Emails
- Calendar
- Contacts
- People
- News
- RSS
- Bookmarks
- Market
- Files
- Trending

**New tools to add:**
- Notes
- Spotify
- Rosters
- Recommendations

## Tech Stack
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Lucide React
- Notion API (@notionhq/client)
- Google APIs (googleapis)

## File Structure
```
/app
  /page.tsx               # Main dashboard grid
  /layout.tsx             # Root layout with providers
  /globals.css            # Design system (copy from normancdesilva)
  /api
    /jimmy                # OpenClaw integration endpoints
    /notion               # Notion data endpoints
    /google               # Google services endpoints
  /tools
    /[tool-slug]
      /page.tsx           # Individual tool pages

/components
  /navigation
    /TopNav.tsx
    /BottomNav.tsx
  /tools
    /ToolCard.tsx         # Grid card for each tool
  /providers
    /Providers.tsx        # Context providers
  /ui                     # Reusable UI components

/contexts
  /AuthContext.tsx
  /SettingsContext.tsx
  /LayoutContext.tsx

/types
  /tool.ts
  /person.ts
  /email.ts
  etc.

/lib
  /notion.ts              # Notion client utilities
  /google.ts              # Google API utilities
  /jimmy.ts               # OpenClaw/Jimmy integration
```

## Implementation Plan

### Phase 1: Foundation (Start here)
1. Copy globals.css from normancdesilva
2. Set up layout.tsx with providers
3. Create TopNav and BottomNav components
4. Build ToolCard component
5. Create main dashboard grid (page.tsx)

### Phase 2: Tool Placeholders
1. Add all Intelligence tool placeholders (empty pages with "Coming Soon")
2. Add Productivity tool placeholders

### Phase 3: Integration Hooks
1. Create /api/jimmy endpoints (health, query, etc.)
2. Create /api/notion endpoints (people, tasks, etc.)
3. Create /api/google endpoints (calendar, email, etc.)

### Phase 4: Implement Core Tools (Priority Order)
1. People (integrate with Notion people database)
2. Calendar (Google Calendar integration)
3. Emails (Gmail integration)
4. Notes (simple Notion-backed notes)
5. Bookmarks (Raindrop.io or Notion)

## API Integration Strategy

### Jimmy/OpenClaw Integration
All complex operations should call Jimmy via internal API endpoints:

```typescript
// /api/jimmy/query/route.ts
export async function POST(req: Request) {
  const { query } = await req.json();
  // Call OpenClaw gateway at localhost:18789
  // Return response
}
```

### Notion Integration
Use existing Notion API key from environment:
```
NOTION_API_KEY=<from_environment>
NOTION_PEOPLE_DB_ID=2fbbedd4-1419-81de-af93-da2dee6e098a
```

### Google Integration
Use existing OAuth tokens at `/home/ubuntu/.config/google/token_*.json`

## Important Notes

1. **Copy design patterns** from normancdesilva - don't reinvent the wheel
2. **Keep it simple** - start with placeholders, build functionality iteratively
3. **Mobile-first** - test on mobile viewport throughout
4. **OpenClaw-first** - when in doubt, let Jimmy handle complex logic via API
5. **Long-term thinking** - build for maintainability and extensibility

## Environment Variables Needed
Norman will set these up on Vercel:
- `NOTION_API_KEY`
- `NOTION_PEOPLE_DB_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `OPENCLAW_GATEWAY_URL` (probably http://3.128.31.231:18789 or similar)
- `OPENCLAW_TOKEN`

## Testing
- Run locally: `npm run dev`
- Test on mobile viewport
- Verify API endpoints work
- Check responsive layout

## Deployment
Norman will handle Vercel setup and environment variables.

---

**Start with Phase 1: Foundation**
Get the look and feel right first, then build functionality incrementally.
