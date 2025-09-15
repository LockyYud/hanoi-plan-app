# 🚀 Neon PostgreSQL Setup Guide

## ✅ Quick Steps:

### 1. Create Neon Account

- Go to: https://neon.tech
- Sign up with email or GitHub
- Verify email if needed

### 2. Create Database Project

- Click "Create a project"
- Name: `hanoi-plan-app`
- Region: Choose closest to you
- PostgreSQL version: 16 (latest)
- Click "Create Project"

### 3. Get Connection String

- After project created → Dashboard
- Click "Connect" button
- Choose "Prisma" tab
- Copy the connection string (format below)

### 4. Update .env.local

Replace DATABASE_URL with your Neon connection string:

```bash
# Replace this line in .env.local:
DATABASE_URL="postgresql://[username]:[password]@[endpoint]/[database]?sslmode=require"
```

### 5. Run Migration

After updating .env.local:

```bash
# Reload environment
source .env.local

# Test connection
npm run db:test

# Push schema to Neon
npx prisma db push

# Generate Prisma client
npx prisma generate

# Seed sample data (optional)
npm run db:seed
```

## 🎯 Expected Connection String Format:

```
postgresql://username:password@ep-cool-name-123456.us-east-1.aws.neon.tech/neondb?sslmode=require
```

## 🔧 Troubleshooting:

- If connection fails, check the endpoint URL is correct
- Ensure sslmode=require is included
- Verify username/password are correct

## ✨ Benefits of Neon:

- ✅ Serverless - auto-scales to zero
- ✅ Free tier - 0.5GB storage
- ✅ Fast cold starts
- ✅ Built-in connection pooling
- ✅ Branching for dev/staging

Once connected, your app will have a reliable PostgreSQL database! 🚀


