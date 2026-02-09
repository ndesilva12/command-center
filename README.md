# Command Center

Norman C. de Silva's personal AI-powered productivity dashboard.

## Live Site
https://normandesilva.vercel.app

## Recent Updates (Feb 2026)

### ✅ Security & Architecture
- **No API tokens used** - all AI calls routed through OpenClaw gateway (uses Norman's Anthropic subscription)
- All Anthropic API calls replaced with OpenClaw gateway endpoints

### ✅ Visual Updates
- **Homepage**: Logo replaces "Command Center" heading
- **Header**: "Norman C. de Silva" text replaces logo
- Blue gradient styling (#00aaff) throughout

### ✅ Features
- Multi-source search (14+ sources)
- Trending tags (Google + X trends)
- OAuth connections for Google & Raindrop (Settings page)
- 25+ integrated productivity tools
- PWA-ready for iPhone installation

## Tech Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS 4
- Framer Motion
- Firebase/Firestore
- Vercel deployment

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## OAuth Setup
1. Visit Settings page
2. Click "Connect Google Account"
3. Authorize access
4. Repeat for Raindrop bookmarks integration

---

Built with Claude Code + Jimmy (OpenClaw AI assistant)
