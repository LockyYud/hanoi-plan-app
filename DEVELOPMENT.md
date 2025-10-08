# Hanoi Plan App - Development Guide

## Project Overview

The Hanoi Plan App is a modern web application built with Next.js 14 that helps individuals and friend groups plan hangouts in Hà Nội. The app provides an interactive map interface, place management, group planning features, and intelligent itinerary generation.

## Architecture

### Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL with PostGIS
- **Authentication**: NextAuth.js with email OTP and Google OAuth
- **Maps**: Mapbox GL JS with custom controls and markers
- **State Management**: Zustand for client state, React Query for server state
- **Styling**: Tailwind CSS with CSS variables for theming

### Key Features Implemented

#### ✅ Completed Features

1. **Project Setup & Infrastructure**
    - Next.js 14 project with TypeScript
    - Tailwind CSS + shadcn/ui component system
    - PostgreSQL database with PostGIS for geospatial queries
    - Prisma ORM with comprehensive schema
    - Docker containerization setup

2. **Authentication System**
    - NextAuth.js integration
    - Email OTP authentication
    - Google OAuth support
    - Session management
    - Protected routes

3. **Interactive Map**
    - Mapbox GL JS integration
    - Custom place markers
    - Map controls and navigation
    - Responsive design
    - Real-time place popups

4. **Place Management**
    - CRUD operations for places
    - Favorites system with ratings
    - Tag-based categorization
    - Image upload support
    - Advanced filtering and search

5. **Database Schema**
    - Users, Places, Groups, Itineraries
    - Favorites, Votes, Media, Shares
    - PostGIS for location queries
    - Proper relationships and indexes

6. **PWA Support**
    - Manifest configuration
    - Service worker ready
    - Installable app
    - Offline capabilities

#### 🚧 Partially Implemented

7. **API Layer**
    - Places API with filtering
    - Favorites management
    - Authentication endpoints
    - Error handling and validation

#### 📋 Pending Features

8. **Group Planning System**
    - Group creation and management
    - Member invitations
    - Preference setting
    - Voting mechanism

9. **Routing Engine**
    - OSRM integration
    - Smart itinerary generation
    - Travel time optimization
    - Budget constraints

10. **Itinerary Editor**
    - Drag-and-drop reordering
    - Route visualization
    - Real-time updates
    - Collaborative editing

11. **Sharing & Export**
    - Public sharing links
    - Static image export
    - Calendar (.ics) export
    - Social media integration

## Development Setup

### Prerequisites

- Node.js 20.x or higher
- PostgreSQL with PostGIS extension
- Mapbox account and access token

### Quick Start

```bash
# Clone and setup
cd hanoi-plan-app
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your configuration

# Setup database
npm run db:migrate
npm run db:seed

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/hanoi_plan_db"

# Authentication
NEXTAUTH_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Mapbox (required)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN="your-mapbox-token"
```

## Project Structure

```
src/
├── app/                 # Next.js App Router
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Home page
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   ├── map/           # Map components
│   ├── places/        # Place components
│   └── layout/        # Layout components
├── lib/               # Utilities and configurations
│   ├── auth.ts        # NextAuth config
│   ├── prisma.ts      # Prisma client
│   ├── store.ts       # Zustand stores
│   ├── types.ts       # TypeScript types
│   └── utils.ts       # Utility functions
prisma/
├── schema.prisma      # Database schema
└── seed.ts           # Sample data
```

## Key Components

### Map System

- **MapContainer**: Main map component with Mapbox integration
- **PlaceMarker**: Interactive place popups
- **MapControls**: Custom map controls and search

### Place Management

- **PlaceForm**: Add/edit place form
- **PlaceCard**: Place display component
- **PlaceFilter**: Advanced filtering interface

### State Management

- **usePlaceStore**: Places and favorites
- **useMapStore**: Map state and viewport
- **useGroupStore**: Group planning data
- **useUIStore**: UI state and preferences

## Database Schema

### Core Models

- **User**: Authentication and profile
- **Place**: Location data with PostGIS
- **Group**: Planning sessions
- **Itinerary**: Generated routes
- **Favorite**: User preferences
- **Vote**: Group decisions

### Relationships

- Users have many Places, Favorites, Groups
- Places belong to Users, have many Tags, Votes
- Groups have many Members, Votes, Itineraries
- Itineraries have many Stops

## API Design

### RESTful Endpoints

```
GET    /api/places              # List places with filters
POST   /api/places              # Create new place
PUT    /api/places/[id]         # Update place
DELETE /api/places/[id]         # Delete place

GET    /api/favorites           # User's favorites
POST   /api/favorites           # Add to favorites
DELETE /api/favorites           # Remove favorite

GET    /api/groups              # User's groups
POST   /api/groups              # Create group
POST   /api/groups/[id]/join    # Join group
```

## Development Guidelines

### Code Style

- Use TypeScript for all components
- Follow ESLint and Prettier rules
- Use meaningful component names
- Add JSDoc for complex functions

### Component Structure

```tsx
// Component props interface
interface ComponentProps {
    // Required props
    data: string;
    // Optional props with defaults
    variant?: "default" | "secondary";
}

// Component with proper typing
export function Component({ data, variant = "default" }: ComponentProps) {
    // Component logic
    return <div>{data}</div>;
}
```

### State Management

- Use Zustand for client-side state
- React Query for server state
- Local state for component-specific data

### Database Queries

- Use Prisma with proper type safety
- Include necessary relations
- Implement proper error handling

## Performance Considerations

### Frontend

- Code splitting with Next.js
- Image optimization
- Map marker clustering
- Lazy loading components

### Backend

- Database indexing for geospatial queries
- API response caching
- Pagination for large datasets
- Connection pooling

### Map Performance

- Marker clustering for many places
- Viewport-based loading
- Debounced search queries
- Cached map tiles

## Testing Strategy

### Unit Tests

- Component rendering
- Utility functions
- State management
- Database operations

### Integration Tests

- API endpoints
- Authentication flow
- Map interactions
- Form submissions

### E2E Tests

- User workflows
- Place creation
- Group planning
- Route generation

## Deployment

### Environment Setup

1. Production database with PostGIS
2. Environment variables configuration
3. Static file hosting (images)
4. SSL certificate setup

### Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Configure environment variables in dashboard
```

### Docker Deployment

```bash
# Using docker-compose
docker-compose up -d

# Or build manually
docker build -t hanoi-plan .
docker run -p 3000:3000 hanoi-plan
```

## Monitoring & Analytics

### Performance Monitoring

- Core Web Vitals tracking
- API response times
- Database query performance
- Map load times

### User Analytics

- Place creation metrics
- Group planning success rate
- User engagement
- Feature adoption

### Error Tracking

- Client-side error reporting
- API error monitoring
- Database connection issues
- Authentication failures

## Future Enhancements

### Phase 2 Features

- Real-time collaboration
- Advanced routing algorithms
- Machine learning recommendations
- Multi-city support

### Technical Improvements

- GraphQL API layer
- Advanced caching strategies
- Microservices architecture
- Mobile app development

## Contributing

### Development Workflow

1. Create feature branch
2. Implement changes
3. Add tests
4. Update documentation
5. Submit pull request

### Code Review Process

- Automated testing
- Code quality checks
- Security review
- Performance impact assessment

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://prisma.io/docs)
- [Mapbox GL JS](https://docs.mapbox.com/mapbox-gl-js)
- [shadcn/ui Components](https://ui.shadcn.com)
- [PostGIS Documentation](https://postgis.net/docs)
