# Map Component Architecture

## 📁 Directory Structure

```
src/components/map/
├── hooks/                          # Business logic layer
│   ├── index.ts                    # Centralized exports
│   ├── useMapInitialization.ts     # Map setup and configuration
│   ├── useMapBounds.ts             # Viewport tracking
│   ├── useMapInteractions.ts       # User interactions
│   ├── useLocationNotes.ts         # CRUD operations
│   ├── useUserLocation.ts          # User marker
│   ├── useFriendLocations.tsx      # Friend markers
│   ├── useMapMarkers.tsx           # Clustering logic
│   └── useRouteDisplay.ts          # Route visualization
│
├── layers/                         # Presentation layer
│   ├── index.ts                    # Centralized exports
│   ├── MapControlsLayer.tsx        # Controls and FAB
│   ├── MapPopupLayer.tsx           # Popup management
│   └── MapDialogLayer.tsx          # Dialog management
│
├── utils/                          # Shared utilities
│   ├── mapGeocoding.ts             # Geocoding functions
│   └── mapClustering.ts            # Clustering helpers
│
├── types/                          # TypeScript definitions
│   └── map.types.ts                # All map-related types
│
├── map-container.tsx               # Original component (1000+ lines)
└── map-container-refactored.tsx    # New component (185 lines) ⭐
```

---

## 🎯 Architecture Overview

The map component follows a **layered architecture** with clear separation of concerns:

### 1. **Hooks Layer** (Business Logic)
Custom hooks encapsulate all stateful business logic:
- Map initialization and configuration
- User interactions and events
- Data fetching and mutations
- State management
- Side effects

### 2. **Presentation Layer** (UI Components)
UI layers are pure presentational components:
- Compose smaller UI elements
- Receive data via props
- No business logic
- Conditional rendering only

### 3. **Main Component** (Orchestration)
The main component orchestrates everything:
- Uses hooks for logic
- Passes data to layers
- Wires up callbacks
- Minimal logic

```
┌─────────────────────────────────────────┐
│      MapContainer (Orchestrator)        │
│               185 lines                 │
└─────────────────────────────────────────┘
           ↓                    ↓
    ┌──────────────┐    ┌──────────────┐
    │    Hooks     │    │   Layers     │
    │  (Logic)     │    │   (UI)       │
    └──────────────┘    └──────────────┘
           ↓                    ↓
    ┌──────────────┐    ┌──────────────┐
    │   Utils      │    │   Types      │
    │  (Helpers)   │    │ (Contracts)  │
    └──────────────┘    └──────────────┘
```

---

## 🔌 Custom Hooks API

### useMapInitialization
**Purpose**: Initialize and configure the Mapbox map instance

```typescript
const {
  mapRef,           // React ref to map instance
  containerRef,     // React ref to container div
  mapLoaded,        // Boolean: is map ready?
  mapError,         // Error message if initialization failed
  hasMapboxToken    // Boolean: is token configured?
} = useMapInitialization(center, zoom);
```

**Features**:
- Mapbox token validation
- Map controls setup (navigation, scale, geolocate)
- Error boundary handling
- Cleanup on unmount

---

### useMapBounds
**Purpose**: Track map viewport bounds and zoom level

```typescript
const {
  mapBounds,        // LngLatBounds object
  currentZoom       // Current zoom level (number)
} = useMapBounds(
  mapRef,
  mapLoaded,
  onBoundsChange    // Callback when bounds change
);
```

**Features**:
- Throttled updates (100ms) for performance
- Automatic bounds calculation
- Zoom level tracking

---

### useMapInteractions
**Purpose**: Handle user interactions with the map

```typescript
const {
  clickedLocation,          // {lat, lng, address} or null
  setClickedLocation,       // Update clicked location
  clickedLocationMarker     // Marker ref for blue dot
} = useMapInteractions(
  mapRef,
  mapLoaded,
  onLocationSelect          // Callback when location selected
);
```

**Features**:
- Click event handling
- Blue dot marker placement
- Reverse geocoding
- Event listener cleanup

---

### useLocationNotes
**Purpose**: Manage location notes (pinories) CRUD operations

```typescript
const {
  locationNotes,            // Array of Pinory objects
  isLoading,                // Loading state
  error,                    // Error message
  addLocationNote,          // (data) => Promise<void>
  updateLocationNote,       // (id, data) => Promise<void>
  deleteLocationNote,       // (id) => Promise<void>
  loadLocationNotes         // () => Promise<void>
} = useLocationNotes(session, mapLoaded);
```

**Features**:
- Full CRUD operations
- API integration
- Session-based authentication
- Loading/error states
- Optimistic updates

---

### useUserLocation
**Purpose**: Display user's current location marker

```typescript
useUserLocation(
  mapRef,
  mapLoaded,
  session       // NextAuth session for avatar
);
```

**Features**:
- Google Maps style marker
- Pulse animation
- Avatar rendering
- Auto-update on location change
- Cleanup on unmount

---

### useFriendLocations
**Purpose**: Display friend location markers

```typescript
const {
  selectedFriendPinory,         // Selected friend's pinory
  setSelectedFriendPinory,      // Update selection
  showFriendDetailsDialog,      // Dialog visibility
  setShowFriendDetailsDialog    // Toggle dialog
} = useFriendLocations(
  mapRef,
  mapLoaded,
  showFriendsLayer,     // Visibility toggle
  selectedFriendId,     // Currently selected friend
  friendPinories,       // Friend's pinories data
  fetchFriendPinories,  // Fetch function
  session
);
```

**Features**:
- Friend marker rendering
- Friend pinory fetching
- Mobile detection
- Selection state management
- Cleanup on layer hide

---

### useMapMarkers
**Purpose**: Render location note markers with clustering

```typescript
useMapMarkers({
  mapRef,
  mapLoaded,
  locationNotes,        // Array of notes to display
  mapBounds,            // Current viewport bounds
  currentZoom,          // Current zoom level
  selectedPinory,       // Currently selected note
  onMarkerClick,        // Callback when marker clicked
  clusterIndex          // Supercluster instance
});
```

**Features**:
- Supercluster integration
- Efficient marker lifecycle
- Click event delegation
- Automatic cleanup
- Cluster rendering

---

### useRouteDisplay
**Purpose**: Display routes for Memory Lane feature

```typescript
useRouteDisplay(mapRef, mapLoaded);
```

**Features**:
- Listens for Memory Lane events
- Renders route on map
- Cleanup on unmount

---

## 🎨 UI Layers API

### MapControlsLayer
**Purpose**: Render map controls and action buttons

```typescript
<MapControlsLayer
  mapRef={mapRef}
  onCreateNote={(location) => {
    // Handle note creation
  }}
  onCreateJourney={() => {
    // Handle journey creation
  }}
/>
```

**Composes**:
- `MapControls` - Main map control buttons
- `FloatingActionButton` - Quick actions
- `FriendsLayerControl` - Friend layer toggle

---

### MapPopupLayer
**Purpose**: Manage all popup types with mutual exclusivity

```typescript
<MapPopupLayer
  // Selected pinory popup
  selectedPinory={pinory}
  onCloseSelectedNote={() => {}}
  onViewNoteDetails={() => {}}
  onDeleteNote={() => {}}
  
  // Clicked location popup
  clickedLocation={location}
  showLocationForm={boolean}
  onCloseClickedLocation={() => {}}
  onAddNote={() => {}}
  
  // Direction popup
  showDirectionPopup={boolean}
  directionInfo={info}
  onCloseDirection={() => {}}
  
  // Friend location popup
  selectedFriendPinory={pinory}
  isMobile={boolean}
  onCloseFriendLocation={() => {}}
  onViewFriendDetails={() => {}}
  mapRef={mapRef}
/>
```

**Manages**:
- `PinoryPopup` - Show selected note details
- `DirectionPopup` - Show route directions
- `FriendLocationPopup` - Show friend's location
- `ClickedLocationPopup` - Show clicked point details

**Ensures**: Only one popup visible at a time

---

### MapDialogLayer
**Purpose**: Manage all dialogs and forms

```typescript
<MapDialogLayer
  // Location note form
  showLocationForm={boolean}
  clickedLocation={location}
  onCloseLocationForm={() => {}}
  onSubmitLocationForm={(data) => {}}
  
  // Edit note form
  showEditForm={boolean}
  editingNote={pinory}
  onCloseEditForm={() => {}}
  onSubmitEditForm={(data) => {}}
  
  // Note details dialog
  showDetailsDialog={boolean}
  selectedPinory={pinory}
  onCloseDetailsDialog={() => {}}
  onEditNote={() => {}}
  onDeleteNote={() => {}}
  
  // Friend details dialog
  showFriendDetailsDialog={boolean}
  selectedFriendPinory={pinory}
  onCloseFriendDetailsDialog={() => {}}
  onAddToFavorites={() => {}}
  
  // Journey creation dialog
  showJourneyDialog={boolean}
  onCloseJourneyDialog={() => {}}
  onJourneySuccess={() => {}}
  
  // Memory Lane dialog
  showMemoryLane={boolean}
  onCloseMemoryLane={() => {}}
  onShowRoute={(notes, sortBy) => {}}
  
  // Route display
  showRoute={boolean}
  routeNotes={notes}
  routeSortBy={sortBy}
  mapInstance={map}
  onCloseRoute={() => {}}
/>
```

**Manages**:
- `LocationNoteForm` - Add new location note
- `LocationNoteForm` (edit mode) - Edit existing note
- `NoteDetailsView` - View note details
- `FriendLocationDetailsView` - View friend's location
- `CreateJourneyDialog` - Create new journey
- `MemoryLaneView` - View and manage Memory Lane
- `RouteDisplay` - Display route on map

---

## 🛠️ Utilities

### mapGeocoding.ts
Geocoding helper functions using Mapbox API

```typescript
// Reverse geocoding (coordinates → address)
const address = await reverseGeocode(lng, lat);

// Forward geocoding (address → coordinates)
const coords = await forwardGeocode(address);
```

---

### mapClustering.ts
Supercluster configuration and helpers

```typescript
// Create cluster index
const index = createClusterIndex(points);

// Get clusters for current viewport
const clusters = getClusters(index, bounds, zoom);
```

---

## 📘 Usage Example

### Basic Implementation

```typescript
import { MapContainer } from '@/components/map';

export default function Page() {
  return (
    <div className="h-screen w-screen">
      <MapContainer />
    </div>
  );
}
```

### With Custom Styling

```typescript
<MapContainer className="rounded-lg shadow-xl" />
```

---

## 🔧 Configuration

### Environment Variables Required

```env
NEXT_PUBLIC_MAPBOX_TOKEN=your_mapbox_token_here
```

### Map Configuration

Default configuration in `useMapInitialization`:
- **Style**: `mapbox://styles/mapbox/streets-v12`
- **Center**: From `useMapStore` (default: Hanoi)
- **Zoom**: From `useMapStore` (default: 13)
- **Controls**: Navigation, Scale, Geolocate

---

## 🧪 Testing

### Testing Hooks

```typescript
import { renderHook } from '@testing-library/react';
import { useMapInitialization } from './hooks';

test('initializes map correctly', () => {
  const { result } = renderHook(() => 
    useMapInitialization([105.8342, 21.0285], 13)
  );
  
  expect(result.current.mapLoaded).toBe(false);
  // ... more assertions
});
```

### Testing Layers

```typescript
import { render } from '@testing-library/react';
import { MapControlsLayer } from './layers';

test('renders controls', () => {
  const { getByText } = render(
    <MapControlsLayer
      mapRef={mockMapRef}
      onCreateNote={jest.fn()}
      onCreateJourney={jest.fn()}
    />
  );
  
  expect(getByText('Add Location')).toBeInTheDocument();
});
```

---

## 📊 Performance Considerations

### Optimizations Implemented

1. **Throttled Updates**
   - Bounds updates: 100ms throttle
   - Prevents excessive re-renders

2. **Memoization**
   - Cluster points: `useMemo`
   - Callbacks: `useCallback`
   - Expensive calculations cached

3. **Efficient Clustering**
   - Supercluster for O(log n) performance
   - Only render visible markers
   - Cluster at appropriate zoom levels

4. **Marker Lifecycle**
   - Create once, update DOM directly
   - Remove markers when out of bounds
   - Reuse marker instances

5. **Event Delegation**
   - Single click handler per marker type
   - Reduces event listener overhead

---

## 🚀 Migration Guide

### From Old to New Component

```typescript
// Before
import { MapContainer } from '@/components/map/map-container';

// After
import { MapContainer } from '@/components/map/map-container-refactored';

// Or after migration:
import { MapContainer } from '@/components/map'; // Uses new version
```

### API Compatibility

The refactored component maintains **100% API compatibility** with the original:
- Same props interface
- Same functionality
- Same store integrations
- Zero breaking changes

---

## 📚 Additional Resources

- **REFACTOR_COMPLETE.md** - Complete refactor summary
- **REFACTOR_ROADMAP.md** - Original refactor plan
- **PHASE_1_SUMMARY.md** - Hook extraction details
- **PHASE_3_SUMMARY.md** - Final implementation details
- **REFACTOR_PROGRESS.md** - Progress tracking

---

## 🤝 Contributing

### Adding New Features

1. **Business Logic** → Add to appropriate hook or create new hook
2. **UI Components** → Add to appropriate layer or create new layer
3. **Shared Logic** → Add to `utils/`
4. **Types** → Add to `types/map.types.ts`

### Best Practices

- Keep hooks focused on single responsibility
- Keep layers pure (no business logic)
- Use TypeScript for all new code
- Add JSDoc comments for public APIs
- Write tests for new functionality

---

## 📝 Notes

- **Map Instance**: Always check `mapLoaded` before accessing `mapRef.current`
- **Session**: Most hooks require `session` for authentication
- **Cleanup**: All hooks handle cleanup automatically
- **Type Safety**: All exports are fully typed

---

**Architecture Version**: 2.0  
**Last Updated**: Current session  
**Maintainers**: Development Team
