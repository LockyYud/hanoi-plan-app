# 🔐 Google OAuth Setup - Chi Tiết Từng Bước

## 🎯 Mục Tiêu

Setup Google OAuth để users có thể sign in với Google account và save location notes.

## 📋 Checklist

### ✅ Step 1: Tạo Google Cloud Project

1. **🌐 Go to:** https://console.cloud.google.com/
2. **🔑 Sign in** với Google account của bạn
3. **📁 Click:** "Select a project" dropdown → "New Project"
4. **📝 Fill in:**
    - **Project name:** `hanoi-plan-app` (hoặc tên bạn muốn)
    - **Organization:** Để trống (nếu không có)
5. **✨ Click:** "Create"
6. **⏳ Wait:** Project được tạo (30 seconds)

### ✅ Step 2: Enable Required APIs

1. **🌐 Go to:** https://console.cloud.google.com/apis/library
2. **🔍 Search:** "People API"
3. **📊 Click:** "Google People API" → **"Enable"**
4. **🔍 Search:** "Google+ API" (nếu có)
5. **📊 Click:** "Google+ API" → **"Enable"** (optional)

### ✅ Step 3: Configure OAuth Consent Screen

1. **🌐 Go to:** https://console.cloud.google.com/apis/credentials/consent
2. **🎯 Choose:** "External" (cho phép bất kỳ user nào) → **"Create"**
3. **📝 Fill in App Information:**
    ```
    App name: Hanoi Plan App
    User support email: your-email@gmail.com
    App logo: (optional - skip)
    App domain: (optional - skip)
    Authorized domains: (optional - skip)
    Developer contact info: your-email@gmail.com
    ```
4. **▶️ Click:** "Save and Continue"

5. **📱 Scopes Page:**
    - **Skip này** - click "Save and Continue" (default scopes là đủ)

6. **👥 Test Users Page:**
    - **➕ Add Users:** Thêm email của bạn để test
    - **▶️ Click:** "Save and Continue"

7. **📋 Summary Page:**
    - **✅ Review** info → "Back to Dashboard"

### ✅ Step 4: Create OAuth 2.0 Credentials

1. **🌐 Go to:** https://console.cloud.google.com/apis/credentials
2. **➕ Click:** "Create Credentials" → "OAuth 2.0 Client IDs"
3. **📝 Fill in:**

    ```
    Application type: Web application
    Name: Hanoi Plan Web App

    Authorized JavaScript origins:
    - http://localhost:3000

    Authorized redirect URIs:
    - http://localhost:3000/api/auth/callback/google
    ```

4. **✨ Click:** "Create"

### ✅ Step 5: Copy Credentials

Sau khi tạo, bạn sẽ thấy popup với:

```
Client ID: 123456789-abcdef.apps.googleusercontent.com
Client Secret: GOCSPX-abcdef123456
```

**🔥 IMPORTANT:** Copy cả hai values này!

## 🛠️ Step 6: Update App Configuration

### Option A: Dùng Helper Script (Recommended)

```bash
npm run setup:oauth
```

Rồi paste Client ID và Client Secret khi prompted.

### Option B: Manual Update

Edit `.env.local`:

```bash
# Replace these lines:
GOOGLE_CLIENT_ID="your-real-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-real-client-secret"
```

## 🧪 Step 7: Test Authentication

1. **🔄 Restart dev server:**

    ```bash
    # Kill current server (Ctrl+C)
    npm run dev
    ```

2. **🌐 Visit:** http://localhost:3000

3. **🔑 Test sign-in:**
    - Should see Google sign-in option
    - Click → redirects to Google
    - Sign in → redirects back to app
    - Should be authenticated

## 🔍 Troubleshooting

### Common Issues:

#### ❌ "Error 400: redirect_uri_mismatch"

**Fix:** Check redirect URI exactly matches:

```
http://localhost:3000/api/auth/callback/google
```

#### ❌ "Error 403: access_denied"

**Fix:** Add your email to Test Users in OAuth consent screen

#### ❌ "OAuth app not verified"

**Fix:** This is normal for development. Click "Advanced" → "Go to Hanoi Plan App (unsafe)"

#### ❌ "API key not valid"

**Fix:** Make sure People API is enabled

### Debug Commands:

```bash
# Check current OAuth config
grep GOOGLE_ .env.local

# Test health endpoint
curl http://localhost:3000/api/health

# Check NextAuth debug logs
# Look for [next-auth] logs in terminal
```

## 🎉 Success Indicators

✅ **Google sign-in button appears**  
✅ **Can click and redirect to Google**  
✅ **After signing in, redirects back to app**  
✅ **User appears authenticated in UI**  
✅ **Can save location notes**

## 📱 Production Deployment (Later)

For production, you'll need to:

1. **Verify OAuth app** in Google Console
2. **Add production domain** to authorized origins
3. **Update redirect URIs** for production URL

---

**🚀 Once OAuth is working, your location notes will save to database with user authentication!**
