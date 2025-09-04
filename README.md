# Hanoi Plan App

A lightweight web application that helps individuals and friend groups plan hangouts in Hà Nội. Users can save favorite places, add private notes/photos, and when a group forms, the app merges everyone's preferences and constraints to suggest optimal itineraries on an interactive map.

## Features

- 🗺️ **Interactive Map**: Mapbox GL JS integration with place markers and clustering
- 📍 **Place Management**: Save and organize favorite places with tags, ratings, and notes
- 👥 **Group Planning**: Create groups, set preferences, and vote on places
- 🛣️ **Smart Routing**: AI-powered itinerary generation with travel optimization
- 📱 **PWA Support**: Installable app with offline capabilities
- 🔐 **Authentication**: Secure login with email OTP and Google OAuth
- 🌟 **Modern UI**: Beautiful interface built with shadcn/ui and Tailwind CSS

## Tech Stack

### Frontend

- **Next.js 14** with App Router and TypeScript
- **Tailwind CSS** + **shadcn/ui** for styling
- **Mapbox GL JS** for interactive maps
- **Zustand** for state management
- **React Query** for data fetching
- **React Hook Form** + **Zod** for form handling

### Backend

- **Next.js API Routes** with TypeScript
- **Prisma** ORM with PostgreSQL
- **NextAuth.js** for authentication
- **PostGIS** for geospatial data

### Database Schema

- Users, Places, Groups, Itineraries
- Favorites, Votes, Media, Shares
- PostGIS for location-based queries

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL with PostGIS extension
- Mapbox account for maps
- Google OAuth credentials (optional)

### Installation

1. **Clone and setup the project:**

    ```bash
    cd hanoi-plan-app
    npm install
    ```

2. **Set up environment variables:**

    ```bash
    cp .env.example .env.local
    ```

    Fill in your environment variables:

    ```env
    # Database
    DATABASE_URL="postgresql://username:password@localhost:5432/hanoi_plan_db"

    # NextAuth
    NEXTAUTH_SECRET="your-nextauth-secret-key-here"
    NEXTAUTH_URL="http://localhost:3000"

    # Google OAuth (optional)
    GOOGLE_CLIENT_ID="your-google-client-id"
    GOOGLE_CLIENT_SECRET="your-google-client-secret"

    # Mapbox (required for maps)
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="your-mapbox-access-token"
    ```

3. **Set up the database:**

    ```bash
    # Create PostgreSQL database with PostGIS
    createdb hanoi_plan_db
    psql -d hanoi_plan_db -c "CREATE EXTENSION postgis;"

    # Run Prisma migrations
    npx prisma migrate dev
    npx prisma generate
    ```

4. **Start the development server:**

    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) in your browser.

### Database Setup (Detailed)

1. **Install PostgreSQL and PostGIS:**

    ```bash
    # Ubuntu/Debian
    sudo apt update
    sudo apt install postgresql postgresql-contrib postgis

    # macOS with Homebrew
    brew install postgresql postgis

    # Start PostgreSQL service
    sudo systemctl start postgresql  # Linux
    brew services start postgresql   # macOS
    ```

2. **Create database and user:**

    ```bash
    sudo -u postgres psql
    ```

    ```sql
    CREATE DATABASE hanoi_plan_db;
    CREATE USER hanoi_user WITH PASSWORD 'your_password';
    GRANT ALL PRIVILEGES ON DATABASE hanoi_plan_db TO hanoi_user;
    \q
    ```

3. **Enable PostGIS:**
    ```bash
    psql -U hanoi_user -d hanoi_plan_db
    ```
    ```sql
    CREATE EXTENSION postgis;
    CREATE EXTENSION postgis_topology;
    \q
    ```

### Mapbox Setup

1. **Create a Mapbox account** at [mapbox.com](https://mapbox.com)
2. **Get your access token** from your account dashboard
3. **Add it to your `.env.local`** file as `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN`

### Google OAuth Setup (Optional)

1. **Go to** [Google Cloud Console](https://console.cloud.google.com)
2. **Create a new project** or select existing one
3. **Enable Google+ API**
4. **Create OAuth 2.0 credentials:**
    - Application type: Web application
    - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
5. **Add credentials to `.env.local`**

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── auth/              # Authentication pages
│   ├── groups/            # Group planning pages
│   ├── places/            # Place management pages
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── map/              # Map-related components
│   ├── places/           # Place components
│   ├── groups/           # Group components
│   └── layout/           # Layout components
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── prisma.ts         # Prisma client
│   ├── store.ts          # Zustand stores
│   ├── types.ts          # TypeScript types
│   └── utils.ts          # Utility functions
└── styles/               # Global styles
```

## Key Features Implementation

### 1. Place Management

- CRUD operations for places
- Favorites system with ratings and comments
- Tag-based categorization
- Media uploads (photos)
- Geospatial search and filtering

### 2. Group Planning

- Create and join groups
- Set time windows and budget constraints
- Vote on places
- Member management

### 3. Smart Routing

- Preference merging algorithm
- Travel time optimization
- Opening hours consideration
- Budget constraints
- Fairness scoring

### 4. Interactive Map

- Real-time place markers
- Clustering for performance
- Custom place popups
- Route visualization
- Map controls and filters

## Development Guidelines

### Code Style

- Use TypeScript for type safety
- Follow ESLint and Prettier rules
- Use meaningful component and function names
- Add JSDoc comments for complex functions

### State Management

- Use Zustand for client-side state
- React Query for server state
- Local state for component-specific data

### Database Queries

- Use Prisma for type-safe database access
- Include necessary relations in queries
- Implement proper indexing for performance
- Use PostGIS functions for geospatial queries

### API Design

- RESTful endpoints with proper HTTP methods
- Consistent error handling
- Input validation with Zod
- Authentication middleware

## Deployment

### Environment Setup

1. Set up PostgreSQL with PostGIS on your server
2. Configure environment variables for production
3. Set up image storage (Cloudflare R2 or AWS S3)
4. Configure domain and SSL

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
```

### Docker Deployment

```bash
# Build and run with Docker
docker-compose up -d
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## API Documentation

### Places API

- `GET /api/places` - Get places with filtering
- `POST /api/places` - Create a new place
- `PUT /api/places/[id]` - Update a place
- `DELETE /api/places/[id]` - Delete a place

### Favorites API

- `GET /api/favorites` - Get user's favorite places
- `POST /api/favorites` - Add place to favorites
- `PUT /api/favorites` - Update favorite rating/comment
- `DELETE /api/favorites` - Remove from favorites

### Groups API

- `GET /api/groups` - Get user's groups
- `POST /api/groups` - Create a new group
- `POST /api/groups/[id]/join` - Join a group
- `POST /api/groups/[id]/votes` - Vote on places

### Itineraries API

- `GET /api/itineraries` - Get group itineraries
- `POST /api/itineraries/generate` - Generate new itinerary
- `PUT /api/itineraries/[id]` - Update itinerary
- `POST /api/itineraries/[id]/finalize` - Finalize itinerary

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@hanoiplan.com or create an issue in the repository.
