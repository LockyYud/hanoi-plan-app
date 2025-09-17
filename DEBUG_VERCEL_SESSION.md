# Debug NextAuth Session Issue on Vercel

## Vấn đề

- Đăng nhập Google thành công nhưng sidebar vẫn hiển thị yêu cầu đăng nhập
- Chỉ xảy ra trên production (Vercel), local hoạt động bình thường

## Các thay đổi đã thực hiện

### 1. Environment Variables cần thêm vào Vercel:

```bash
NEXTAUTH_DEBUG=true
```

### 2. Debug Endpoints

- `/api/debug-auth` - Kiểm tra cấu hình NextAuth
- `/api/debug-session` - Kiểm tra session hiện tại
- `/api/debug-env` - Kiểm tra environment variables

### 3. Debugging Steps

#### Bước 1: Kiểm tra cấu hình

1. Deploy code lên Vercel
2. Truy cập `https://hanoi-plan-app-6jw5.vercel.app/api/debug-auth`
3. Kiểm tra output có đúng không:
   ```json
   {
     "hasNextAuthSecret": true,
     "hasNextAuthUrl": true,
     "hasGoogleClientId": true,
     "hasGoogleClientSecret": true,
     "googleClientIdValid": true,
     "providersCount": 1,
     "sessionStrategy": "database",
     "debug": true,
     "environment": "production"
   }
   ```

#### Bước 2: Test đăng nhập và kiểm tra session

1. Đăng nhập bằng Google
2. Truy cập `https://hanoi-plan-app-6jw5.vercel.app/api/debug-session`
3. Kiểm tra có session không:
   ```json
   {
     "hasSession": true,
     "sessionData": {
       "user": {
         "id": "...",
         "name": "...",
         "email": "..."
       }
     }
   }
   ```

#### Bước 3: Kiểm tra Console Logs

1. Mở Developer Tools trong browser
2. Kiểm tra Console tab có logs từ:
   - `🔍 Sidebar: Session changed`
   - `Session callback called`
   - `JWT callback called`
   - `SignIn callback called`

#### Bước 4: Kiểm tra Vercel Function Logs

1. Vào Vercel Dashboard > Functions tab
2. Kiểm tra logs của `/api/auth/[...nextauth]`
3. Tìm các debug messages từ callbacks

## Các vấn đề có thể gặp và giải pháp

### 1. Session Strategy Issue

- **Vấn đề**: Database strategy không hoạt động trên Vercel
- **Giải pháp**: Chuyển sang JWT strategy
- **Fix**: Trong `auth.ts`, thay đổi:
  ```typescript
  session: {
    strategy: "jwt", // thay vì "database"
  }
  ```

### 2. Database Connection Issue

- **Vấn đề**: Prisma không kết nối được database trên Vercel
- **Giải pháp**: Kiểm tra DATABASE_URL và connection pooling
- **Fix**: Thêm connection pooling trong `prisma.ts`

### 3. CORS hoặc Domain Issue

- **Vấn đề**: NextAuth không chấp nhận domain
- **Giải pháp**: Kiểm tra NEXTAUTH_URL chính xác
- **Fix**: Đảm bảo NEXTAUTH_URL=https://hanoi-plan-app-6jw5.vercel.app

### 4. Session Persistence Issue

- **Vấn đề**: Session không được lưu giữ giữa các request
- **Giải pháp**: Kiểm tra cookies settings
- **Fix**: Thêm cookies config trong NextAuth

## Recommended Quick Fix

Nếu database strategy không hoạt động, hãy thử JWT strategy:

```typescript
// In src/lib/auth.ts
export const authOptions: NextAuthOptions = {
  // Remove adapter for JWT strategy
  // adapter: PrismaAdapter(prisma),

  providers: [
    /* ... */
  ],

  session: {
    strategy: "jwt", // Use JWT instead of database
  },

  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
    jwt: async ({ user, token }) => {
      if (user) {
        token.uid = user.id;
      }
      return token;
    },
  },
};
```

## Testing Commands

```bash
# Deploy changes
git push origin main

# Test endpoints
curl https://hanoi-plan-app-6jw5.vercel.app/api/debug-auth
curl https://hanoi-plan-app-6jw5.vercel.app/api/debug-session

# Check session after login
# 1. Login via browser
# 2. Copy session cookie
# 3. Test with cookie
curl -H "Cookie: next-auth.session-token=..." https://hanoi-plan-app-6jw5.vercel.app/api/debug-session
```
