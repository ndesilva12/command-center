# Quick Start: Authentication System

## 🚀 Get Started in 5 Minutes

### 1. Configure Firebase

Edit `.env.local` with your Firebase credentials:

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=command-center-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=command-center-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=command-center-xxxxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### 2. Create Norman's Admin Account

**In Firebase Console:**

1. **Authentication** → **Users** → **Add User**
   - Email: `norman.desilva@gmail.com`
   - Password: (set a secure password)
   - Copy the UID

2. **Firestore** → **Start Collection**
   - Collection ID: `users`
   - Document ID: (paste the UID from step 1)
   - Fields:
     ```
     email: "norman.desilva@gmail.com"
     displayName: "Norman C. de Silva"
     role: "admin"
     permissions: []
     createdAt: 1707566400000
     lastLogin: 1707566400000
     ```

### 3. Test Login

```bash
npm run dev
```

Go to `http://localhost:3000/login` and sign in with Norman's credentials.

### 4. Create Kim's Account

1. Login as Norman
2. Go to `/admin`
3. Click "Create User"
4. Fill in:
   - Email: kim@example.com (or actual email)
   - Password: (secure password)
   - Display Name: Kim
   - Role: User
   - Permissions: ✅ Meal Plan, ✅ Shopping List, ✅ Meals
5. Click "Create User"

### 5. Test Kim's Access

1. Logout (button in TopNav)
2. Login as Kim
3. Verify only meal-related tools are visible on homepage
4. Verify Kim can access:
   - `/tools/meals`
   - `/tools/meal-plan`
   - `/tools/shopping-list`
5. Verify Kim CANNOT access `/admin`

## ✅ You're Done!

**Norman's Account:**
- Role: Admin
- Access: Everything (all tools + admin dashboard)

**Kim's Account:**
- Role: User
- Access: Meal planning tools only

## 📚 Full Documentation

See `AUTH_SYSTEM.md` for complete documentation.

## 🔐 Security Checklist

- [ ] Firebase credentials are in `.env.local` (not `.env.local.example`)
- [ ] `.env.local` is in `.gitignore` (already done)
- [ ] Norman's account uses a strong password
- [ ] Kim's account uses a strong password
- [ ] Firestore security rules are configured (see AUTH_SYSTEM.md)

## 🎯 Next Steps

1. Add more users via `/admin`
2. Customize permissions per user
3. Protect additional tool pages with `<ProtectedRoute>`
4. Configure Firestore security rules
