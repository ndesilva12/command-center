# Multi-User Authentication System

This document explains the authentication and authorization system implemented in Command Center.

## Overview

The system provides:
- **Firebase Authentication** for user login/logout
- **Firestore-based user management** with role-based access control
- **Per-tool permissions** for granular access control
- **Admin dashboard** for user management
- **Protected routes** with automatic redirects

## Architecture

### 1. Firebase Setup (`lib/firebase.ts`)
- Initializes Firebase Auth and Firestore
- Exports `auth` and `db` instances for use throughout the app

### 2. Authentication Hook (`hooks/useAuth.ts`)
- Manages user authentication state
- Loads user data from Firestore
- Provides helper functions:
  - `isAdmin` - Check if user is admin
  - `hasPermission(toolId)` - Check if user can access a tool
- Updates `lastLogin` timestamp on each login

### 3. User Data Structure

**Firestore Collection:** `/users/{uid}`

```typescript
{
  email: string;              // User's email address
  displayName: string;        // Display name
  role: "admin" | "user";    // Admin has full access
  permissions: string[];      // Array of tool IDs user can access
  createdAt: number;         // Timestamp when user was created
  lastLogin: number;         // Timestamp of last login
}
```

**Example:**
```json
{
  "email": "kim@example.com",
  "displayName": "Kim",
  "role": "user",
  "permissions": ["meals", "meal-plan", "shopping-list"],
  "createdAt": 1707566400000,
  "lastLogin": 1707652800000
}
```

### 4. Protected Routes (`components/auth/ProtectedRoute.tsx`)

Wrapper component for protecting pages:

```tsx
<ProtectedRoute 
  requireAuth={true}           // Require user to be logged in
  requiredPermission="meals"   // Require specific tool permission
  adminOnly={false}            // Admin-only access
>
  {/* Your page content */}
</ProtectedRoute>
```

**Features:**
- Automatic redirect to `/login` if not authenticated
- Automatic redirect to `/` if missing required permission
- Shows loading state while checking auth
- Prevents unauthorized access to routes

### 5. Login Page (`app/login/page.tsx`)
- Simple email/password form
- Uses Firebase `signInWithEmailAndPassword`
- Redirects to home after successful login
- Auto-redirects if already logged in

### 6. Admin Dashboard (`app/admin/page.tsx`)

**Admin-only features:**
- List all users with their roles and permissions
- Create new users with email/password
- Edit user permissions (checkboxes for each tool)
- Delete users
- View user metadata (created date, last login)

**Access:** Only users with `role: "admin"` can access `/admin`

### 7. Navigation Updates

**TopNav Component:**
- Shows "Admin" link for admin users
- Shows "Logout" button for authenticated users
- Uses `useAuth` hook to check authentication state

### 8. Homepage Filtering

**Main Page (`app/page.tsx`):**
- Wrapped with `ProtectedRoute` (requires login)
- Filters tools based on user permissions
- Admins see all tools
- Regular users only see tools in their `permissions` array

## Setup Instructions

### Step 1: Firebase Configuration

1. Create a Firebase project at https://console.firebase.google.com
2. Enable **Authentication** → **Email/Password** provider
3. Create a **Firestore Database** in production mode
4. Get your Firebase config from Project Settings

### Step 2: Environment Variables

Create `.env.local` in the project root:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### Step 3: Create Admin User

**Via Firebase Console:**

1. Go to Authentication → Users → Add User
2. Email: `norman.desilva@gmail.com`
3. Set a password
4. Copy the generated UID
5. Go to Firestore → Create collection `users`
6. Create document with ID = UID from step 4:

```json
{
  "email": "norman.desilva@gmail.com",
  "displayName": "Norman C. de Silva",
  "role": "admin",
  "permissions": [],
  "createdAt": 1707566400000,
  "lastLogin": 1707566400000
}
```

### Step 4: Create Regular User (Example: Kim)

**Via Admin Dashboard:**

1. Login as admin
2. Go to `/admin`
3. Click "Create User"
4. Fill in:
   - Email: kim@example.com
   - Password: (secure password)
   - Display Name: Kim
   - Role: User
   - Permissions: Check "Meal Plan", "Shopping List", "Meals"
5. Click "Create User"

## Tool Permission IDs

When setting permissions, use these tool IDs:

**Productivity:**
- `emails` - Email management
- `calendar` - Calendar & events
- `contacts` - Contact database
- `people` - People management
- `recommendations` - Recommendations tracker
- `news` - News aggregation
- `rss` - RSS feed reader
- `bookmarks` - Bookmark manager
- `market` - Market data
- `notes` - Note taking
- `files` - File storage
- `spotify` - Spotify integration
- `trending` - Trending topics
- `rosters` - Team rosters
- `meals` - Meal collection
- `meal-plan` - Weekly meal planning
- `shopping-list` - Shopping list

**Intelligence:**
- `curate` - Curated intelligence
- `l3d` - Last 30 days research
- `deep-search` - Deep web search
- `dark-search` - Dark web search
- `image-lookup` - Reverse image search
- `contact-finder` - Contact finder
- `relationships` - Relationship insights
- `mission` - Mission/task management
- `investors` - Investor pipeline
- `business-info` - Business research
- `corporate` - Corporate insights

## How to Protect New Tools

When adding a new tool page:

```tsx
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";

export default function MyToolPage() {
  return (
    <ProtectedRoute requiredPermission="my-tool">
      {/* Your page content */}
    </ProtectedRoute>
  );
}
```

Don't forget to:
1. Add the tool ID to `ALL_TOOLS` array in `/app/admin/page.tsx`
2. Add it to the main tools list in `/app/page.tsx`

## Security Notes

⚠️ **Important:**
- Never commit `.env.local` to git (it's in `.gitignore`)
- Use strong passwords for all users
- Admin role has unrestricted access to everything
- Regular users can only access tools in their `permissions` array
- Firebase security rules should be configured to restrict Firestore access

## Firestore Security Rules

Add these rules in Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read their own user document
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      
      // Only admins can write user documents
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Add other collection rules here
  }
}
```

## Troubleshooting

**"Loading..." screen stuck:**
- Check browser console for errors
- Verify `.env.local` has all required variables
- Check Firebase project is configured correctly

**Can't login:**
- Verify user exists in Firebase Authentication
- Check password is correct
- Ensure Firestore user document exists

**Permission denied:**
- Check user's `permissions` array in Firestore
- Verify tool ID matches exactly
- Admins automatically have all permissions

**Admin dashboard not visible:**
- Verify user's `role` is set to `"admin"` in Firestore
- Check TopNav shows "Admin" link

## Future Enhancements

Potential improvements:
- Password reset functionality
- Email verification
- User profile editing
- Activity logs
- Session timeout
- Two-factor authentication
- User groups/teams
- Permission templates
