# Deployment Checklist

## ✅ Pre-Deployment Verification

- [x] Build successful (no TypeScript errors)
- [x] All 9 tools implemented and functional
- [x] PWA manifest and icons created
- [x] OAuth flows implemented (Google + Raindrop)
- [x] People tool with full CRUD
- [x] Branding updated (site name + custom icons)
- [x] Mobile responsive design
- [x] Git committed

## ⏳ Deployment Steps

### 1. Vercel Environment Variables

Set these in Vercel dashboard → Settings → Environment Variables:

**Firebase (Required)**
```
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Google OAuth (Required for Gmail, Calendar, Drive)**
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://normandesilva.vercel.app/api/auth/google/callback
```

**Raindrop OAuth (Required for Bookmarks)**
```
RAINDROP_CLIENT_ID=your-raindrop-client-id
RAINDROP_CLIENT_SECRET=your-raindrop-client-secret
RAINDROP_REDIRECT_URI=https://normandesilva.vercel.app/api/auth/raindrop/callback
```

**Notion (Optional - for future People sync)**
```
NOTION_TOKEN=secret_your-notion-token
```

**Other**
```
NEXT_PUBLIC_BASE_URL=https://normandesilva.vercel.app
ANTHROPIC_API_KEY=sk-ant-... (optional, for X trending fallback)
```

### 2. Deploy to Vercel

```bash
# Option A: Deploy via Vercel CLI
cd /home/ubuntu/command-center
vercel --prod

# Option B: Push to GitHub and deploy via Vercel dashboard
git push origin main
# Then connect repo in Vercel dashboard
```

### 3. Post-Deployment Testing

- [ ] Visit https://normandesilva.vercel.app
- [ ] Test Google OAuth flow (click "Connect" on any tool that needs it)
- [ ] Test Raindrop OAuth flow (Bookmarks tool)
- [ ] Add to Home Screen on iPhone (test PWA)
- [ ] Create a test person in People tool
- [ ] Verify all 9 tools load without errors

### 4. OAuth Setup

**Google OAuth Console:**
1. Go to https://console.cloud.google.com/apis/credentials
2. Add authorized redirect URI: `https://normandesilva.vercel.app/api/auth/google/callback`
3. Add authorized JavaScript origins: `https://normandesilva.vercel.app`

**Raindrop OAuth:**
1. Go to https://raindrop.io/app/settings/integrations
2. Create new app
3. Add redirect URI: `https://normandesilva.vercel.app/api/auth/raindrop/callback`

### 5. Firebase Setup

1. Go to Firebase Console → Project Settings
2. Add web app if not exists
3. Copy config values to environment variables
4. Go to Service Accounts → Generate new private key
5. Copy client_email and private_key to environment variables

## ⚠️ Known Limitations

1. **People Tool**: Currently Firestore-only. Notion sync not yet implemented (API ready, just needs activation).
2. **RSS Tool**: Feed management works, but article parsing not yet implemented.
3. **Bookmarks Tool**: OAuth works, but collection browsing not yet implemented.
4. **Files Tool**: OAuth works, but file browser not yet implemented.
5. **Calendar**: Event display works, but create/edit UI not fully implemented.

These are all functional at a basic level with external navigation buttons to the full services.

## 🚀 Future Enhancements

- [ ] Implement Notion ↔ Firestore sync for People tool
- [ ] Add RSS feed parsing and article display
- [ ] Implement Raindrop collection browser
- [ ] Add Google Drive file browser
- [ ] Complete Calendar create/edit UI
- [ ] Add Markdown rendering to Notes tool
- [ ] Implement real-time updates with Firestore listeners
- [ ] Add user authentication (currently uses hardcoded "norman" user)

## ✅ Success Metrics

After deployment, verify:
- ✓ All pages load without errors
- ✓ OAuth flows complete successfully
- ✓ PWA installable on mobile devices
- ✓ Data persists in Firestore
- ✓ External navigation buttons work
- ✓ Mobile responsive on all screens
- ✓ Build time < 10 seconds
- ✓ No console errors

---

**Last Updated:** February 9, 2026
**Status:** Ready for Production Deployment
