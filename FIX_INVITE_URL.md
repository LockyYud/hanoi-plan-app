# Fix: Friend Invitation URLs Showing Localhost in Production

## 🐛 Problem

Invitation links (both friend invites and group invites) were showing `http://localhost:3000` even when deployed to production because the `NEXT_PUBLIC_APP_URL` environment variable was not set.

## ✅ Solution

### 1. Code Changes

Updated multiple API endpoints to automatically detect the correct URL from request headers when `NEXT_PUBLIC_APP_URL` is not set:

**Files Updated:**

- `/src/app/api/friends/invite/route.ts` - Friend invitations
- `/src/app/api/groups/[id]/invite/route.ts` - Group invitations
- `/src/app/layout.tsx` - Metadata base URL

**Logic:**

```typescript
// Get app URL from env or construct from request
let appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
if (!appUrl) {
  // Fallback: construct from request headers
  const host = request.headers.get("host");
  const protocol =
    request.headers.get("x-forwarded-proto") ||
    (host?.includes("localhost") ? "http" : "https");
  appUrl = `${protocol}://${host}`;
}
```

This means the app will now work even without the environment variable, but **it's still recommended to set it explicitly**.

### 2. Set Environment Variable on Vercel (Recommended)

1. Go to your Vercel dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add new variable:
   - **Name**: `NEXT_PUBLIC_APP_URL`
   - **Value**: `https://your-domain.vercel.app` (your actual production URL)
   - **Environment**: Production (or all environments)
5. **Redeploy** your application

### 3. For Local Development

Create a `.env.local` file (copy from `.env.example`):

```bash
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 📝 Why Both Solutions?

- **Environment Variable** (Recommended):
  - More explicit and easier to change
  - Works across all environments (dev, staging, prod)
  - No need to redeploy code to change URL

- **Automatic Detection** (Fallback):
  - Works immediately even if env var is not set
  - Handles proxy/CDN scenarios correctly
  - Safety net for configuration issues

## 🔍 How to Verify

1. After redeploying, open your app in production
2. Click "Invite Friends" button
3. Check the invite URL - it should show your production domain
4. Test the invite link by opening it in an incognito window

## 📚 Related Files

- `/src/app/api/friends/invite/route.ts` - Friend invite API endpoint
- `/src/app/api/groups/[id]/invite/route.ts` - Group invite API endpoint
- `/src/components/friends/invite-dialog.tsx` - UI component
- `/src/app/layout.tsx` - Metadata base URL
- `.env.example` - Environment variable template
- `README-DEPLOYMENT.md` - Updated deployment guide
- `prisma/migrations/fix-localhost-urls.sql` - SQL script to fix existing URLs

## 🚀 Next Steps

After fixing:

1. Test existing invite links (they might still have localhost URLs)
2. Consider adding a "Regenerate Link" feature if needed
3. Update any cached invite URLs in the database
