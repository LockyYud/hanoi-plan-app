# NextAuth Database Strategy Analysis

## 🔍 Phân tích vấn đề hiện tại

### Database Strategy là gì?

NextAuth có 2 session strategies:

1. **JWT Strategy** (mặc định)
   - Session data được lưu trong JWT tokens (cookies)
   - Chỉ cần NEXTAUTH_SECRET, không cần database
   - Nhanh, stateless, phù hợp serverless

2. **Database Strategy**
   - Session data được lưu trong database
   - Cần database adapter (PrismaAdapter)
   - Secure hơn, có thể revoke sessions
   - Cần database connection liên tục

### Code hiện tại đang làm gì?

```typescript
// auth.ts - Line 8-9
const hasRequiredEnvVars = process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL;
const hasDatabaseConnection = prisma !== null;

// Line 12-13: Chỉ enable PrismaAdapter khi có đủ điều kiện
...(hasRequiredEnvVars && hasDatabaseConnection ? { adapter: PrismaAdapter(prisma) } : {}),

// Line 24-25: Strategy được quyết định động
session: {
    strategy: (hasRequiredEnvVars && hasDatabaseConnection) ? "database" : "jwt",
},
```

## 🚨 Vấn đề trên Vercel

### 1. Database Connection Issues

Từ logs console cho thấy:
- `session: null status: unauthenticated` 
- Nhưng API calls (location notes) thành công

**Nguyên nhân**: Prisma connection có thể không stable trên Vercel serverless

### 2. Prisma Client trong Serverless Environment

```typescript
// prisma.ts - Line 12-19
if (process.env.DATABASE_URL &&
    process.env.DATABASE_URL !== 'file:./dev.db' &&
    process.env.DATABASE_URL.includes('://')) {
    
    globalForPrisma.prisma = new PrismaClient({...});
}
```

**Vấn đề**:
- Vercel functions cold start
- Connection pooling issues
- Database timeout

### 3. Session Persistence Problems

**Database Strategy Flow**:
1. User đăng nhập Google ✅
2. NextAuth gọi signIn callback ✅ 
3. PrismaAdapter tạo user/account records ❌ (có thể fail silent)
4. NextAuth cố gắng tạo session record ❌
5. Session callback không nhận được `user` object ❌
6. Client-side `useSession()` returns null ❌

## 🔧 Giải pháp

### Option 1: Force JWT Strategy (Recommend)

```typescript
export const authOptions: NextAuthOptions = {
    // Comment out database adapter
    // adapter: PrismaAdapter(prisma),
    
    session: {
        strategy: "jwt", // Force JWT
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
                token.sub = user.id;
            }
            return token;
        },
    },
}
```

### Option 2: Fix Database Strategy

1. **Kiểm tra Prisma connection**:
```typescript
// Thêm vào auth.ts
async function checkDatabaseConnection() {
    try {
        await prisma?.$queryRaw`SELECT 1`;
        return true;
    } catch {
        return false;
    }
}
```

2. **Add connection retry logic**
3. **Enable proper error logging**

## 🎯 Khuyến nghị

**Dùng JWT Strategy** vì:
- ✅ Reliable trên Vercel serverless
- ✅ Không cần persistent database connection  
- ✅ Faster performance
- ✅ Stateless, phù hợp với serverless architecture

**Chỉ dùng Database Strategy khi**:
- Cần revoke sessions
- Cần audit trail chi tiết
- Có stable database connection
- Không phải serverless environment

## 🔥 Fix ngay lập tức

```typescript
// Temporary fix - force JWT strategy
session: {
    strategy: "jwt",
},
```

Sau đó có thể implement hybrid approach: JWT cho session, database cho user data persistence.
