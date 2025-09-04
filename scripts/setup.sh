#!/bin/bash

# Hanoi Plan App Setup Script
echo "🏙️ Setting up Hanoi Plan App..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20.x or higher."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version must be 18.x or higher. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local from example..."
    cp .env.example .env.local
    echo "⚠️  Please update the environment variables in .env.local before proceeding."
    echo "   Required: DATABASE_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN"
    echo ""
    echo "   Optional: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"
    echo ""
    read -p "Press Enter to continue once you've configured .env.local..."
fi

# Check if PostgreSQL is running
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL with PostGIS extension."
    echo "   Ubuntu/Debian: sudo apt install postgresql postgresql-contrib postgis"
    echo "   macOS: brew install postgresql postgis"
    exit 1
fi

# Test database connection
echo "🔌 Testing database connection..."
if npx prisma db pull &> /dev/null; then
    echo "✅ Database connection successful"
else
    echo "❌ Cannot connect to database. Please check your DATABASE_URL in .env.local"
    echo "   Make sure PostgreSQL is running and the database exists."
    exit 1
fi

# Generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

# Run database migrations
echo "🗄️ Running database migrations..."
npx prisma migrate dev --name init

# Seed the database
echo "🌱 Seeding database with sample data..."
npm run db:seed

echo ""
echo "🎉 Setup complete! You can now start the development server:"
echo ""
echo "   npm run dev"
echo ""
echo "📝 Next steps:"
echo "   1. Visit http://localhost:3000"
echo "   2. Add your Mapbox access token to .env.local"
echo "   3. Configure Google OAuth (optional)"
echo "   4. Start exploring Hanoi! 🇻🇳"
echo ""
echo "🛠️  Useful commands:"
echo "   npm run dev          - Start development server"
echo "   npm run db:studio    - Open Prisma Studio"
echo "   npm run db:seed      - Reseed database"
echo "   npm run db:reset     - Reset database"
echo ""
