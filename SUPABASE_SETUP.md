# 🗄️ Supabase Database Setup Guide

## ❌ Current Issue: Database Connection Failed

The app cannot connect to Supabase database. Here's how to fix it:

## 🔧 Steps to Fix:

### 1. **Get Correct Supabase Database URL**

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Settings** → **Database**
4. Copy the **Connection string** under "Connection parameters"
5. It should look like: `postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres`

### 2. **Update .env.local File**

Replace the `DATABASE_URL` in your `.env.local` file with the correct URL:

```bash
# ✅ CORRECT FORMAT:
DATABASE_URL="postgresql://postgres:[your-password]@[your-project-ref].supabase.co:5432/postgres"

# ❌ WRONG - Different hosts detected:
# .env.local has: giwubaowvfoiavdjacdo
# Environment has: mleqjequmkjzejqdllwq
```

### 3. **Handle Special Characters in Password**

If your password contains special characters, URL encode them:

- `!` → `%21`
- `@` → `%40`
- `#` → `%23`
- `&` → `%26`

Example:

```bash
# Password: Dmd388999!
# Encoded:  Dmd388999%21
DATABASE_URL="postgresql://postgres:Dmd388999%21@db.xxx.supabase.co:5432/postgres"
```

### 4. **Test Connection**

After updating `.env.local`:

```bash
# Load new environment variables
source .env.local

# Test database connection
npx prisma db push

# If successful, generate Prisma client
npx prisma generate
```

### 5. **Restart Development Server**

```bash
# Kill current server (Ctrl+C)
# Then restart
npm run dev
```

## 🔍 Troubleshooting:

### Common Issues:

1. **P1001 - Can't reach database server**
    - ✅ Check project is not paused in Supabase dashboard
    - ✅ Verify correct project reference URL
    - ✅ Check password is correctly encoded

2. **Authentication failed**
    - ✅ Double-check password
    - ✅ Ensure special characters are URL encoded

3. **Database doesn't exist**
    - ✅ Make sure you're using the `postgres` database (default)
    - ✅ Check if you need to create a custom database

### Commands to Test:

```bash
# Test if Supabase is reachable
ping db.[your-project-ref].supabase.co

# Test database connection with psql (if installed)
psql postgresql://postgres:[password]@[project-ref].supabase.co:5432/postgres

# Check Prisma connection
npx prisma studio
```

## 📝 Next Steps After Connection Works:

1. **Run migrations**: `npx prisma db push`
2. **Seed data**: `npm run db:seed`
3. **Start app**: `npm run dev`

## 🆘 Still Having Issues?

1. Check Supabase project status in dashboard
2. Verify billing/usage limits not exceeded
3. Try creating a new database password
4. Contact Supabase support if project-level issues

---

**Once database connection is fixed, the app will work properly with authentication and data persistence! 🚀**
