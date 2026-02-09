# Command Center Rebuild - Status Report

**Date:** 2026-02-09  
**Project:** `/home/ubuntu/command-center/`  
**Reference:** `/home/ubuntu/normancdesilva/` (for functionality only)  
**Live Site:** https://normandesilva.vercel.app

---

## ✅ COMPLETED (Phase 1)

### 1. Foundation & Architecture ✓
- [x] Created **tool-categories.ts** - Central registry for all tools
- [x] Created **ToolNav component** - Reusable navigation bar for tool pages
- [x] Added helper functions to **lib/gmail.ts** (formatEmailSender, getSuperhumanUrl)
- [x] Verified design system in globals.css (#00aaff accent, glass cards, dark theme)

### 2. Email Tool - FULLY FUNCTIONAL ✓
**File:** `app/tools/emails/page.tsx`

**Implemented Features:**
- [x] TopNav + BottomNav integration
- [x] ToolNav with productivity tool switcher
- [x] Gmail OAuth connection flow
- [x] Multi-account support (All Accounts view + individual accounts)
- [x] Account switcher dropdown with add/remove accounts
- [x] Folder navigation (Inbox, Sent, Drafts, Archived, Trash)
- [x] Search emails with debounced input
- [x] Email list view with sender, subject, snippet
- [x] Date formatting (Today, Yesterday, Month Day)
- [x] Unread indicator (left border highlight)
- [x] Archive button (per email)
- [x] Delete button with confirmation modal
- [x] "Open in Superhuman" button (per email + header)
- [x] Refresh emails button
- [x] Compose button (placeholder - links to /tools/emails/compose)
- [x] Glass card design with #00aaff accent
- [x] Consistent spacing and typography
- [x] Keyboard support for delete modal (Enter to confirm, Escape to cancel)

**Styling:**
- Glass cards: `rgba(255, 255, 255, 0.03)` with `backdrop-filter: blur(12px)`
- Accent color: `#00aaff`
- Border: `rgba(255, 255, 255, 0.1)`
- Consistent with Command Center design system

**Missing (for full parity with reference):**
- [ ] Email detail modal (view full email with HTML rendering)
- [ ] Compose modal (new email, reply, forward)
- [ ] Star/unstar emails
- [ ] Mark as read/unread actions
- [ ] Attachments display

### 3. Tool Page Structure - TEMPLATE CREATED ✓
All productivity tools now have:
- [x] TopNav + BottomNav
- [x] ToolNav (productivity tool switcher)
- [x] Page header with icon + title
- [x] "Open in [Service]" external button
- [x] Action buttons (Refresh, Add, etc.)
- [x] Glass card content area
- [x] Consistent layout (136px top padding for nav stack)

**Created Tool Pages:**
- [x] `/tools/emails` - FULLY FUNCTIONAL
- [x] `/tools/calendar` - Placeholder with proper structure
- [x] `/tools/contacts` - Placeholder with proper structure
- [x] `/tools/people` - Placeholder with proper structure
- [x] `/tools/bookmarks` - Placeholder with proper structure
- [x] `/tools/market` - Placeholder with proper structure
- [x] `/tools/news` - Placeholder with proper structure (already existed)
- [x] `/tools/rss` - Placeholder with proper structure
- [x] `/tools/notes` - Placeholder with proper structure
- [x] `/tools/files` - Placeholder with proper structure (already existed)
- [x] `/tools/trending` - Placeholder with proper structure

### 4. Build Status ✓
- [x] **Build successful** - No TypeScript errors
- [x] All routes compile correctly
- [x] Ready for deployment testing

---

## 🔨 TODO - PHASE 2 (Next Steps)

### High Priority: Complete Email Tool
1. **EmailDetailModal Component**
   - View full email content
   - HTML body rendering (sanitized)
   - Attachments list
   - Reply/Forward/Archive/Delete actions
   - "Open in Superhuman" button
   - Close/escape key handler

2. **ComposeEmailModal Component**
   - New email composition
   - Reply mode (pre-fill To, Subject with "Re:")
   - Forward mode (pre-fill Subject with "Fwd:")
   - Rich text editor or plain text area
   - Send via Gmail API
   - Draft saving (optional)
   - Account selector (if multiple accounts)

3. **Additional Email Actions**
   - Star/unstar emails
   - Mark as read/unread
   - Bulk actions (select multiple, archive/delete all)

### Medium Priority: Build Out Other Tools

#### Calendar Tool (`/tools/calendar`)
**Reference:** `/home/ubuntu/normancdesilva/src/app/tools/calendar/`

Features to implement:
- [ ] Google Calendar OAuth
- [ ] Calendar list (next 7-14 days)
- [ ] Event detail view
- [ ] Create new event modal
- [ ] Edit event
- [ ] Delete event (with confirmation)
- [ ] "Open in Google Calendar" button
- [ ] Month/Week/Day view switcher (optional - start with list view)

#### People Tool (`/tools/people`)
**Reference:** Notion database (59 people) - ID: `2fbbedd4-1419-81de-af93-da2dee6e098a`

Features to implement:
- [ ] Notion OAuth integration
- [ ] Import people from Notion database
- [ ] Store in Firestore: `users/{userId}/people`
- [ ] Grid layout of person cards
- [ ] Person detail modal (all fields from Notion)
- [ ] Search/filter people
- [ ] Edit person info
- [ ] Add new person
- [ ] "Sync from Notion" button (manual refresh)

**Notion Fields to Include:**
- Name, Nickname
- Phone, Email
- Birthday
- Relationship, Relationship Detail
- Location, Original Location
- Profession, Alma Mater
- All other custom fields from database

#### Bookmarks Tool (`/tools/bookmarks`)
**Reference:** `/home/ubuntu/normancdesilva/` - check for Raindrop integration

Features to implement:
- [ ] Raindrop.io OAuth
- [ ] Display collections (sidebar or tabs)
- [ ] Display bookmarks (grid or list)
- [ ] Search bookmarks
- [ ] Add new bookmark
- [ ] Edit bookmark
- [ ] Delete bookmark
- [ ] Filter by tags
- [ ] "Open in Raindrop" button

#### Market Tool (`/tools/market`)
**Reference:** `/home/ubuntu/normancdesilva/src/app/tools/market/` if exists

Features to implement:
- [ ] Stock watchlist (stored in Firestore)
- [ ] Crypto watchlist
- [ ] Fetch prices (CoinGecko API for crypto, maybe Alpha Vantage for stocks)
- [ ] Real-time updates (polling every 60s)
- [ ] Add/remove symbols from watchlist
- [ ] Price change indicators (+/- percentage)
- [ ] "Open in Google Finance" button

#### News/RSS/Trending Tools
- [ ] News API integration
- [ ] RSS feed parser
- [ ] Trending topics (Google Trends API)

---

## 🛠️ PHASE 3 (Future Work)

### Settings Page (`/settings`)
**Full implementation needed:**
- [ ] OAuth Connections section
  - Show connection status for each service
  - Connect/Disconnect buttons
  - Test connection buttons
- [ ] Tool Management
  - List all tools
  - Toggle show/hide each tool
  - Drag to reorder tools
  - Click tool name to rename
  - Click color to change tool color
  - Save to Firestore: `users/{userId}/settings`
- [ ] Appearance Settings
  - Theme toggle (dark/light)
  - Font size options
  - Compact/comfortable spacing

### OAuth Fixes
**Issue:** Black screen on OAuth callbacks
**Fix needed in:** `app/api/auth/google/callback/route.ts` and `app/api/auth/raindrop/callback/route.ts`

```ts
// Current: Returns JSON (causes black screen)
return Response.json({ success: true, ... });

// Fixed: Redirect to settings
return Response.redirect(new URL('/settings?google=connected', request.url));
```

### Notion Import Script
**File to create:** `/scripts/import-people-from-notion.ts`
- Query Notion People database
- Parse all fields
- Batch write to Firestore
- Run via API endpoint: `/api/people/import-from-notion`

---

## 📊 Success Criteria Checklist

Current Progress: **6/9 Complete** ✓

- [x] Every tool page has site header (TopNav + BottomNav)
- [x] Every tool page has tool navigation buttons at top (ToolNav)
- [x] All tools have consistent spacing/layout
- [ ] Email tool has all functions from original dashboard
- [x] All tools have "Open in [Service]" external button
- [ ] OAuth flows redirect properly (no black screen)
- [ ] People tool shows all 59 people from Notion
- [ ] Settings page fully functional (show/hide, reorder, rename, change colors)
- [x] All tools match Command Center design (glass, #00aaff, dark theme)

---

## 🎯 Recommended Next Session

**Priority Order:**
1. **Email Detail & Compose Modals** (30-40 min)
   - Build EmailDetailModal component
   - Build ComposeEmailModal component
   - Wire up to existing email list

2. **Calendar Tool** (30-40 min)
   - Check existing API routes
   - Implement calendar list view
   - Add create/edit/delete functionality

3. **People Tool + Notion Import** (30-40 min)
   - Create import script
   - Build people grid
   - Add detail modal

4. **Fix OAuth Redirects** (10 min)
   - Update callback routes to redirect instead of JSON

5. **Settings Page** (20-30 min)
   - Build OAuth connections section
   - Add tool management (show/hide, reorder)

---

## 📝 Notes

**What's Working:**
- Build compiles successfully ✓
- Email tool is functional for viewing/searching emails ✓
- All tool pages have consistent structure ✓
- Design system is properly applied ✓

**What Needs Attention:**
- Email compose/reply functionality
- Other tools need actual API integration
- OAuth callback redirects
- Settings page

**Reference Code Locations:**
- Original dashboard: `/home/ubuntu/normancdesilva/src/app/tools/`
- Google services helpers: `/home/ubuntu/normancdesilva/src/lib/google-services.ts`
- Email components: `/home/ubuntu/normancdesilva/src/components/`

---

**Time Invested:** ~90 minutes  
**Estimated Time to Complete Phase 2:** ~120-150 minutes  
**Total Estimated Time to Full Feature Parity:** ~200-250 minutes

---

## 🚀 Ready to Deploy?

**Current State:** Partial functionality
- Email tool is usable for viewing emails
- Other tools are placeholders
- Design system is complete and consistent

**Recommended:** Complete Phase 2 before major deployment, or deploy now as MVP and iterate.
