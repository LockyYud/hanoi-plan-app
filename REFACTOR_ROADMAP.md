# 🗺️ Map Container Refactoring Roadmap

**File gốc:** `src/components/map/map-container.tsx` (1000+ dòng)  
**Mục tiêu:** Tách thành < 200 dòng với architecture rõ ràng

---

## 📋 TỔNG QUAN ROADMAP

**Thời gian ước tính:** 3 weeks  
**Độ ưu tiên:** 🔴 Critical  
**Breaking changes:** ❌ Không (backward compatible)

### Metrics hiện tại:

- ❌ Lines of code: 1000+
- ❌ Responsibilities: 12+
- ❌ useState hooks: ~20
- ❌ useEffect hooks: ~20
- ❌ API calls: 3+

### Metrics mục tiêu:

- ✅ Lines of code: < 200
- ✅ Responsibilities: 1 (orchestration)
- ✅ useState hooks: < 5
- ✅ useEffect hooks: < 3
- ✅ API calls: 0 (moved to hooks)

---

## 🏗️ CẤU TRÚC THƯ MỤC SAU KHI REFACTOR

```
src/components/map/
├── map-container.tsx                 # Main orchestrator (< 200 lines)
│
├── hooks/                            # Custom hooks (logic layer)
│   ├── index.ts                      # Export tất cả hooks
│   ├── useMapInitialization.ts       # Map setup & error handling
│   ├── useMapBounds.ts               # Bounds & zoom tracking
│   ├── useMapInteractions.ts         # Click events & interactions
│   ├── useLocationNotes.ts           # CRUD location notes
│   ├── useUserLocation.ts            # User location marker
│   ├── useFriendLocations.ts         # Friend markers logic
│   ├── useMapMarkers.ts              # Marker rendering & clustering
│   └── useRouteDisplay.ts            # Route & Memory Lane
│
├── layers/                           # UI layers (presentational)
│   ├── MapMarkerLayer.tsx            # Render all markers
│   ├── MapPopupLayer.tsx             # Manage all popups
│   ├── MapDialogLayer.tsx            # Manage all dialogs
│   └── MapControlsLayer.tsx          # Controls & FAB
│
├── utils/                            # Utilities (pure functions)
│   ├── mapMarkerUtils.ts             # Marker creation/destruction
│   ├── mapGeocoding.ts               # Reverse geocoding
│   ├── mapClustering.ts              # Supercluster configuration
│   └── mapConstants.ts               # Constants & styles
│
├── types/                            # TypeScript types
│   └── map.types.ts                  # Shared types
│
└── __tests__/                        # Tests
    ├── hooks/
    │   ├── useMapInitialization.test.ts
    │   ├── useLocationNotes.test.ts
    │   └── useMapMarkers.test.ts
    └── utils/
        └── mapMarkerUtils.test.ts
```

---

## 📅 PHASE 0: PREPARATION & SETUP

**Thời gian:** 1 day  
**Priority:** 🔴 Critical

### ✅ Checklist:

- [ ] **0.1** Tạo backup branch

  ```bash
  git checkout -b backup/map-container-before-refactor
  git push origin backup/map-container-before-refactor
  ```

- [ ] **0.2** Tạo refactor branch

  ```bash
  git checkout main
  git checkout -b refactor/map-container-modular
  ```

- [ ] **0.3** Tạo cấu trúc thư mục

  ```bash
  mkdir -p src/components/map/{hooks,layers,utils,types,__tests__/{hooks,utils}}
  touch src/components/map/hooks/index.ts
  touch src/components/map/types/map.types.ts
  ```

- [ ] **0.4** Setup testing environment (nếu chưa có)

  ```bash
  npm install -D @testing-library/react @testing-library/hooks vitest
  ```

- [ ] **0.5** Document current functionality
  - [ ] Screenshot tất cả features đang hoạt động
  - [ ] List tất cả user flows cần test
  - [ ] Note các edge cases quan trọng

- [ ] **0.6** Commit initial structure
  ```bash
  git add .
  git commit -m "chore: create folder structure for map-container refactor"
  ```

---

## 🎣 PHASE 1: TÁCH CUSTOM HOOKS (LOGIC LAYER)

**Thời gian:** 1.5 weeks  
**Priority:** 🔴 Critical

> **Strategy:** Tách từng hook độc lập, test ngay lập tức, không ảnh hưởng code hiện tại

---

### 🎯 PHASE 1.1: useMapInitialization

**File:** `src/components/map/hooks/useMapInitialization.ts`  
**Lines gốc:** ~150 lines  
**Complexity:** 🟡 Medium

#### Responsibilities:

- Khởi tạo Mapbox map instance
- Validate Mapbox token
- Error handling & error states
- Map event listeners (load, moveend, error)
- Cleanup on unmount

#### API Design:

```typescript
interface UseMapInitializationReturn {
  mapRef: React.RefObject<mapboxgl.Map>;
  containerRef: React.RefObject<HTMLDivElement>;
  mapLoaded: boolean;
  mapError: string | null;
  hasMapboxToken: boolean;
}

function useMapInitialization(
  initialCenter: [number, number],
  initialZoom: number
): UseMapInitializationReturn;
```

#### Checklist:

- [ ] **1.1.1** Tạo file `hooks/useMapInitialization.ts`
- [ ] **1.1.2** Copy logic khởi tạo map từ useEffect đầu tiên
- [ ] **1.1.3** Extract token validation logic
- [ ] **1.1.4** Extract error handling logic
- [ ] **1.1.5** Add TypeScript types
- [ ] **1.1.6** Test hook riêng biệt
- [ ] **1.1.7** Update MapContainer để sử dụng hook
- [ ] **1.1.8** Verify không có regression
- [ ] **1.1.9** Commit
  ```bash
  git add .
  git commit -m "refactor: extract useMapInitialization hook"
  ```

#### Code Example:

```typescript
// hooks/useMapInitialization.ts
import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";

export function useMapInitialization(
  initialCenter: [number, number],
  initialZoom: number
) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const hasMapboxToken = Boolean(
    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN &&
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN !== "your-mapbox-token-here"
  );

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    if (!hasMapboxToken) {
      setMapError("Mapbox token không hợp lệ");
      return;
    }

    try {
      mapRef.current = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: false,
      });

      mapRef.current.on("load", () => setMapLoaded(true));
      mapRef.current.on("error", (error) => {
        console.error("Map error:", error);
        setMapError("Lỗi tải bản đồ");
      });
    } catch (error) {
      console.error("Map initialization error:", error);
      setMapError("Không thể khởi tạo bản đồ");
    }

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [hasMapboxToken, initialCenter, initialZoom]);

  return {
    mapRef,
    containerRef,
    mapLoaded,
    mapError,
    hasMapboxToken,
  };
}
```

---

### 📐 PHASE 1.2: useMapBounds

**File:** `src/components/map/hooks/useMapBounds.ts`  
**Lines gốc:** ~60 lines  
**Complexity:** 🟢 Easy

#### Responsibilities:

- Track current map bounds
- Track current zoom level
- Throttle bounds updates (optimization)
- Update store when bounds change

#### API Design:

```typescript
interface UseMapBoundsReturn {
  mapBounds: mapboxgl.LngLatBounds | null;
  currentZoom: number;
}

function useMapBounds(
  mapRef: React.RefObject<mapboxgl.Map>,
  mapLoaded: boolean,
  throttleMs?: number
): UseMapBoundsReturn;
```

#### Checklist:

- [ ] **1.2.1** Tạo file `hooks/useMapBounds.ts`
- [ ] **1.2.2** Extract bounds tracking logic từ moveend event
- [ ] **1.2.3** Implement throttling mechanism
- [ ] **1.2.4** Add store integration (setBounds)
- [ ] **1.2.5** Add TypeScript types
- [ ] **1.2.6** Test với map movements
- [ ] **1.2.7** Update MapContainer
- [ ] **1.2.8** Verify clustering still works
- [ ] **1.2.9** Commit
  ```bash
  git commit -m "refactor: extract useMapBounds hook"
  ```

---

### 🖱️ PHASE 1.3: useMapInteractions

**File:** `src/components/map/hooks/useMapInteractions.ts`  
**Lines gốc:** ~100 lines  
**Complexity:** 🟡 Medium

#### Responsibilities:

- Handle map click events
- Create/remove clicked location marker (blue dot)
- Reverse geocoding for clicked location
- Focus location from external events
- Show directions event handling

#### API Design:

```typescript
interface UseMapInteractionsReturn {
  clickedLocation: { lng: number; lat: number; address?: string } | null;
  setClickedLocation: (location: any) => void;
  clickedLocationMarker: React.RefObject<mapboxgl.Marker>;
  handleFocusLocation: (location: { lat: number; lng: number }) => void;
}

function useMapInteractions(
  mapRef: React.RefObject<mapboxgl.Map>,
  mapLoaded: boolean,
  onLocationSelected?: (location: any) => void
): UseMapInteractionsReturn;
```

#### Checklist:

- [ ] **1.3.1** Tạo file `hooks/useMapInteractions.ts`
- [ ] **1.3.2** Extract map click handler
- [ ] **1.3.3** Extract reverse geocoding logic → move to utils
- [ ] **1.3.4** Extract clicked marker creation
- [ ] **1.3.5** Extract focus location event listener
- [ ] **1.3.6** Extract show directions event listener
- [ ] **1.3.7** Add TypeScript types
- [ ] **1.3.8** Test all interaction flows
- [ ] **1.3.9** Update MapContainer
- [ ] **1.3.10** Commit
  ```bash
  git commit -m "refactor: extract useMapInteractions hook"
  ```

---

### 📝 PHASE 1.4: useLocationNotes

**File:** `src/components/map/hooks/useLocationNotes.ts`  
**Lines gốc:** ~200 lines  
**Complexity:** 🔴 High

#### Responsibilities:

- Load location notes from API
- Add new location note (CRUD)
- Edit location note (CRUD)
- Delete location note (CRUD)
- Local state management
- API error handling
- Session/auth integration

#### API Design:

```typescript
interface UseLocationNotesReturn {
  locationNotes: Pinory[];
  loading: boolean;
  error: string | null;
  loadLocationNotes: () => Promise<void>;
  addLocationNote: (noteData: any) => Promise<void>;
  updateLocationNote: (noteData: any) => Promise<void>;
  deleteLocationNote: (noteId: string) => Promise<void>;
}

function useLocationNotes(
  session: Session | null,
  mapLoaded: boolean
): UseLocationNotesReturn;
```

#### Checklist:

- [ ] **1.4.1** Tạo file `hooks/useLocationNotes.ts`
- [ ] **1.4.2** Extract loadLocationNotes function
- [ ] **1.4.3** Extract handleAddLocationNote function
- [ ] **1.4.4** Extract handleEditLocationNote function
- [ ] **1.4.5** Extract delete logic from inline handlers
- [ ] **1.4.6** Add loading & error states
- [ ] **1.4.7** Add TypeScript types
- [ ] **1.4.8** Test CRUD operations
- [ ] **1.4.9** Update MapContainer
- [ ] **1.4.10** Verify API calls work correctly
- [ ] **1.4.11** Commit
  ```bash
  git commit -m "refactor: extract useLocationNotes hook with CRUD"
  ```

---

### 📍 PHASE 1.5: useUserLocation

**File:** `src/components/map/hooks/useUserLocation.ts`  
**Lines gốc:** ~80 lines  
**Complexity:** 🟡 Medium

#### Responsibilities:

- Get current user location
- Create/update user location marker
- Handle location errors
- Google Maps style marker rendering
- Update marker on location change

#### API Design:

```typescript
interface UseUserLocationReturn {
  userLocation: { lng: number; lat: number } | null;
  userLocationMarker: React.RefObject<mapboxgl.Marker>;
  updateUserLocation: () => Promise<void>;
  error: string | null;
}

function useUserLocation(
  mapRef: React.RefObject<mapboxgl.Map>,
  mapLoaded: boolean,
  session: Session | null
): UseUserLocationReturn;
```

#### Checklist:

- [ ] **1.5.1** Tạo file `hooks/useUserLocation.ts`
- [ ] **1.5.2** Extract getCurrentLocation logic
- [ ] **1.5.3** Extract user marker creation (Google Maps style)
- [ ] **1.5.4** Extract marker update logic
- [ ] **1.5.5** Add error handling
- [ ] **1.5.6** Add TypeScript types
- [ ] **1.5.7** Test location tracking
- [ ] **1.5.8** Update MapContainer
- [ ] **1.5.9** Verify marker appears correctly
- [ ] **1.5.10** Commit
  ```bash
  git commit -m "refactor: extract useUserLocation hook"
  ```

---

### 👥 PHASE 1.6: useFriendLocations

**File:** `src/components/map/hooks/useFriendLocations.ts`  
**Lines gốc:** ~150 lines  
**Complexity:** 🟡 Medium

#### Responsibilities:

- Fetch friend pinories from store
- Create/remove friend markers
- Handle friend marker clicks
- Integrate with FriendStore
- Handle selected friend filter

#### API Design:

```typescript
interface UseFriendLocationsReturn {
  friendMarkers: Map<string, mapboxgl.Marker>;
  selectedFriendPinory: Pinory | null;
  setSelectedFriendPinory: (pinory: Pinory | null) => void;
  showFriendDetailsDialog: boolean;
  setShowFriendDetailsDialog: (show: boolean) => void;
}

function useFriendLocations(
  mapRef: React.RefObject<mapboxgl.Map>,
  mapLoaded: boolean,
  showFriendsLayer: boolean,
  selectedFriendId: string | null
): UseFriendLocationsReturn;
```

#### Checklist:

- [ ] **1.6.1** Tạo file `hooks/useFriendLocations.ts`
- [ ] **1.6.2** Extract friend pinories fetch logic
- [ ] **1.6.3** Extract friend marker rendering
- [ ] **1.6.4** Extract friend marker click handler
- [ ] **1.6.5** Extract cleanup logic
- [ ] **1.6.6** Add TypeScript types
- [ ] **1.6.7** Test friend layer toggle
- [ ] **1.6.8** Update MapContainer
- [ ] **1.6.9** Verify friend markers work
- [ ] **1.6.10** Commit
  ```bash
  git commit -m "refactor: extract useFriendLocations hook"
  ```

---

### 🗺️ PHASE 1.7: useMapMarkers

**File:** `src/components/map/hooks/useMapMarkers.ts`  
**Lines gốc:** ~250 lines  
**Complexity:** 🔴 High

#### Responsibilities:

- Supercluster initialization & management
- Convert location notes to GeoJSON
- Get clusters for viewport
- Render cluster markers
- Render individual markers
- Handle marker clicks
- Optimize marker lifecycle (avoid re-renders)
- Cleanup markers

#### API Design:

```typescript
interface UseMapMarkersReturn {
  clusters: Array<any>;
  markersRef: React.RefObject<Map<string, mapboxgl.Marker>>;
}

function useMapMarkers(
  mapRef: React.RefObject<mapboxgl.Map>,
  mapLoaded: boolean,
  locationNotes: Pinory[],
  mapBounds: mapboxgl.LngLatBounds | null,
  currentZoom: number,
  selectedPinory: Pinory | null,
  onMarkerClick: (pinory: Pinory) => void
): UseMapMarkersReturn;
```

#### Checklist:

- [ ] **1.7.1** Tạo file `hooks/useMapMarkers.ts`
- [ ] **1.7.2** Extract GeoJSON conversion (points useMemo)
- [ ] **1.7.3** Extract Supercluster initialization
- [ ] **1.7.4** Extract clusters calculation
- [ ] **1.7.5** Extract marker rendering logic
- [ ] **1.7.6** Extract marker update logic (selection state)
- [ ] **1.7.7** Extract marker cleanup
- [ ] **1.7.8** Move clustering utils to utils/mapClustering.ts
- [ ] **1.7.9** Add TypeScript types
- [ ] **1.7.10** Test clustering at different zoom levels
- [ ] **1.7.11** Update MapContainer
- [ ] **1.7.12** Verify markers render correctly
- [ ] **1.7.13** Profile performance with React DevTools
- [ ] **1.7.14** Commit
  ```bash
  git commit -m "refactor: extract useMapMarkers hook with clustering"
  ```

---

### 🛣️ PHASE 1.8: useRouteDisplay

**File:** `src/components/map/hooks/useRouteDisplay.ts`  
**Lines gốc:** ~80 lines  
**Complexity:** 🟡 Medium

#### Responsibilities:

- Display route on map
- Handle Memory Lane logic
- Render route lines
- Show route popup/info
- Cleanup route when closed

#### API Design:

```typescript
interface UseRouteDisplayReturn {
  showRoute: boolean;
  routeNotes: Pinory[];
  routeSortBy: string;
  setRouteInfo: (notes: Pinory[], sortBy: string) => void;
  clearRoute: () => void;
}

function useRouteDisplay(
  mapRef: React.RefObject<mapboxgl.Map>,
  mapLoaded: boolean
): UseRouteDisplayReturn;
```

#### Checklist:

- [ ] **1.8.1** Tạo file `hooks/useRouteDisplay.ts`
- [ ] **1.8.2** Extract route display logic
- [ ] **1.8.3** Extract route clearing logic
- [ ] **1.8.4** Integrate with MemoryLaneStore
- [ ] **1.8.5** Add TypeScript types
- [ ] **1.8.6** Test route rendering
- [ ] **1.8.7** Update MapContainer
- [ ] **1.8.8** Verify Memory Lane works
- [ ] **1.8.9** Commit
  ```bash
  git commit -m "refactor: extract useRouteDisplay hook"
  ```

---

### ✅ PHASE 1 COMPLETION CHECKLIST

- [ ] **All hooks created and exported from `hooks/index.ts`**
- [ ] **All hooks have TypeScript types**
- [ ] **MapContainer uses all new hooks**
- [ ] **All existing features still work**
- [ ] **No console errors**
- [ ] **Performance acceptable (no significant slowdown)**
- [ ] **Code review & cleanup**
- [ ] **Commit & push phase 1**
  ```bash
  git add .
  git commit -m "refactor(map): complete phase 1 - all hooks extracted"
  git push origin refactor/map-container-modular
  ```

---

## 🔧 PHASE 2: TÁCH UTILITIES & UI LAYERS

**Thời gian:** 3-4 days  
**Priority:** 🟡 High

---

### 🛠️ PHASE 2.1: Tách Utilities

**Priority:** 🟡 High

#### 2.1.1: mapMarkerUtils.ts

**File:** `src/components/map/utils/mapMarkerUtils.ts`

**Responsibilities:**

- Create/destroy React map pin elements
- Marker element helpers
- Marker lifecycle management

**Checklist:**

- [ ] **2.1.1.1** Tạo file `utils/mapMarkerUtils.ts`
- [ ] **2.1.1.2** Move createMapPinElement
- [ ] **2.1.1.3** Move destroyMapPinElement
- [ ] **2.1.1.4** Move ReactMapPinElement type
- [ ] **2.1.1.5** Add exports
- [ ] **2.1.1.6** Update imports in hooks
- [ ] **2.1.1.7** Test marker creation/destruction
- [ ] **2.1.1.8** Commit

#### 2.1.2: mapGeocoding.ts

**File:** `src/components/map/utils/mapGeocoding.ts`

**Responsibilities:**

- Reverse geocoding (coordinates → address)
- Forward geocoding (address → coordinates)
- Handle API errors

**Checklist:**

- [ ] **2.1.2.1** Tạo file `utils/mapGeocoding.ts`
- [ ] **2.1.2.2** Extract reverse geocoding logic
- [ ] **2.1.2.3** Add error handling
- [ ] **2.1.2.4** Add TypeScript types
- [ ] **2.1.2.5** Update useMapInteractions to use util
- [ ] **2.1.2.6** Test geocoding
- [ ] **2.1.2.7** Commit

#### 2.1.3: mapClustering.ts

**File:** `src/components/map/utils/mapClustering.ts`

**Responsibilities:**

- Supercluster configuration
- Clustering algorithms
- Cluster expansion logic

**Checklist:**

- [ ] **2.1.3.1** Tạo file `utils/mapClustering.ts`
- [ ] **2.1.3.2** Extract Supercluster config
- [ ] **2.1.3.3** Extract cluster expansion function
- [ ] **2.1.3.4** Add TypeScript types
- [ ] **2.1.3.5** Update useMapMarkers to use util
- [ ] **2.1.3.6** Test clustering
- [ ] **2.1.3.7** Commit

#### 2.1.4: mapConstants.ts

**File:** `src/components/map/utils/mapConstants.ts`

**Responsibilities:**

- Map style constants
- Marker styles
- Animation durations
- Default configurations

**Checklist:**

- [ ] **2.1.4.1** Tạo file `utils/mapConstants.ts`
- [ ] **2.1.4.2** Extract all magic numbers
- [ ] **2.1.4.3** Extract style constants
- [ ] **2.1.4.4** Add JSDoc comments
- [ ] **2.1.4.5** Update imports in hooks
- [ ] **2.1.4.6** Commit

**Commit for Phase 2.1:**

```bash
git add .
git commit -m "refactor: extract map utilities"
```

---

### 🎨 PHASE 2.2: MapMarkerLayer

**File:** `src/components/map/layers/MapMarkerLayer.tsx`  
**Lines:** ~100 lines  
**Complexity:** 🟡 Medium

#### Responsibilities:

- Render all location note markers
- Render cluster markers
- Render friend markers
- Handle marker visibility

#### Component Structure:

```typescript
interface MapMarkerLayerProps {
  mapRef: React.RefObject<mapboxgl.Map>;
  clusters: Array<any>;
  markersRef: React.RefObject<Map<string, mapboxgl.Marker>>;
  friendMarkers: Map<string, mapboxgl.Marker>;
  selectedPinory: Pinory | null;
  onMarkerClick: (pinory: Pinory) => void;
}

export function MapMarkerLayer(props: MapMarkerLayerProps) {
  // Render logic
  return null; // No visual return, markers added to map directly
}
```

#### Checklist:

- [ ] **2.2.1** Tạo file `layers/MapMarkerLayer.tsx`
- [ ] **2.2.2** Move marker rendering logic from useMapMarkers
- [ ] **2.2.3** Add props interface
- [ ] **2.2.4** Handle all marker types (cluster, note, friend)
- [ ] **2.2.5** Test marker rendering
- [ ] **2.2.6** Update MapContainer to use layer
- [ ] **2.2.7** Verify no visual regression
- [ ] **2.2.8** Commit
  ```bash
  git commit -m "refactor: create MapMarkerLayer component"
  ```

---

### 💬 PHASE 2.3: MapPopupLayer

**File:** `src/components/map/layers/MapPopupLayer.tsx`  
**Lines:** ~150 lines  
**Complexity:** 🟡 Medium

#### Responsibilities:

- Manage PinoryPopup (selected note)
- Manage PinoryPopup (clicked location)
- Manage DirectionPopup
- Manage FriendLocationPopup
- Coordinate popup visibility (only 1 active)

#### Component Structure:

```typescript
interface MapPopupLayerProps {
  selectedPinory: Pinory | null;
  clickedLocation: { lng: number; lat: number; address?: string } | null;
  selectedFriendPinory: Pinory | null;
  directionInfo: any;
  showDirectionPopup: boolean;
  mapRef: React.RefObject<mapboxgl.Map>;
  onClosePopup: (type: string) => void;
  onViewDetails: (type: string) => void;
  onAddNote: () => void;
  onDelete: () => void;
}

export function MapPopupLayer(props: MapPopupLayerProps) {
  return (
    <>
      {props.selectedPinory && <PinoryPopup {...} />}
      {props.clickedLocation && <PinoryPopup {...} />}
      {props.showDirectionPopup && <DirectionPopup {...} />}
      {props.selectedFriendPinory && <FriendLocationPopup {...} />}
    </>
  );
}
```

#### Checklist:

- [ ] **2.3.1** Tạo file `layers/MapPopupLayer.tsx`
- [ ] **2.3.2** Move all popup JSX from MapContainer
- [ ] **2.3.3** Add props interface
- [ ] **2.3.4** Handle popup coordination logic
- [ ] **2.3.5** Test all popup types
- [ ] **2.3.6** Update MapContainer to use layer
- [ ] **2.3.7** Verify popups work correctly
- [ ] **2.3.8** Commit
  ```bash
  git commit -m "refactor: create MapPopupLayer component"
  ```

---

### 🔲 PHASE 2.4: MapDialogLayer

**File:** `src/components/map/layers/MapDialogLayer.tsx`  
**Lines:** ~200 lines  
**Complexity:** 🟡 Medium

#### Responsibilities:

- Manage LocationNoteForm (add)
- Manage LocationNoteForm (edit)
- Manage NoteDetailsView
- Manage FriendLocationDetailsView
- Manage CreateJourneyDialog
- Manage MemoryLaneView
- Manage RouteDisplay

#### Component Structure:

```typescript
interface MapDialogLayerProps {
  // Location form props
  showLocationForm: boolean;
  showEditForm: boolean;
  clickedLocation: any;
  editingNote: Pinory | null;

  // Details dialog props
  showDetailsDialog: boolean;
  selectedPinory: Pinory | null;

  // Friend dialog props
  showFriendDetailsDialog: boolean;
  selectedFriendPinory: Pinory | null;

  // Journey dialog props
  showJourneyDialog: boolean;

  // Memory Lane props
  showMemoryLane: boolean;
  showRoute: boolean;
  routeNotes: Pinory[];

  // Event handlers
  onCloseDialog: (type: string) => void;
  onSubmitForm: (data: any) => void;
  // ... more handlers
}

export function MapDialogLayer(props: MapDialogLayerProps) {
  return (
    <>
      {props.showLocationForm && <LocationNoteForm {...} />}
      {props.showEditForm && <LocationNoteForm {...} />}
      {props.showDetailsDialog && <NoteDetailsView {...} />}
      {props.showFriendDetailsDialog && <FriendLocationDetailsView {...} />}
      {props.showJourneyDialog && <CreateJourneyDialog {...} />}
      {props.showMemoryLane && <MemoryLaneView {...} />}
      {props.showRoute && <RouteDisplay {...} />}
    </>
  );
}
```

#### Checklist:

- [ ] **2.4.1** Tạo file `layers/MapDialogLayer.tsx`
- [ ] **2.4.2** Move all dialog JSX from MapContainer
- [ ] **2.4.3** Add props interface
- [ ] **2.4.4** Group related dialogs
- [ ] **2.4.5** Test all dialogs
- [ ] **2.4.6** Update MapContainer to use layer
- [ ] **2.4.7** Verify all dialogs work
- [ ] **2.4.8** Commit
  ```bash
  git commit -m "refactor: create MapDialogLayer component"
  ```

---

### 🎛️ PHASE 2.5: MapControlsLayer

**File:** `src/components/map/layers/MapControlsLayer.tsx`  
**Lines:** ~50 lines  
**Complexity:** 🟢 Easy

#### Responsibilities:

- Render MapControls
- Render FloatingActionButton
- Render FriendsLayerControl
- Handle control interactions

#### Component Structure:

```typescript
interface MapControlsLayerProps {
  mapRef: React.RefObject<mapboxgl.Map>;
  onCreateNote: (location: any) => void;
  onCreateJourney: () => void;
}

export function MapControlsLayer(props: MapControlsLayerProps) {
  return (
    <>
      <MapControls mapRef={props.mapRef} />
      <FriendsLayerControl />
      <FloatingActionButton
        onCreateNote={props.onCreateNote}
        onCreateJourney={props.onCreateJourney}
      />
    </>
  );
}
```

#### Checklist:

- [ ] **2.5.1** Tạo file `layers/MapControlsLayer.tsx`
- [ ] **2.5.2** Move controls JSX from MapContainer
- [ ] **2.5.3** Add props interface
- [ ] **2.5.4** Test controls functionality
- [ ] **2.5.5** Update MapContainer to use layer
- [ ] **2.5.6** Verify controls work
- [ ] **2.5.7** Commit
  ```bash
  git commit -m "refactor: create MapControlsLayer component"
  ```

---

### ✅ PHASE 2 COMPLETION CHECKLIST

- [ ] **All utilities extracted and tested**
- [ ] **All layers created and working**
- [ ] **MapContainer uses all new layers**
- [ ] **No duplicate code**
- [ ] **All features still functional**
- [ ] **Code review & cleanup**
- [ ] **Commit & push phase 2**
  ```bash
  git add .
  git commit -m "refactor(map): complete phase 2 - utilities & layers"
  git push origin refactor/map-container-modular
  ```

---

## 🔄 PHASE 3: REFACTOR MAPCONTAINER & OPTIMIZATION

**Thời gian:** 3-4 days  
**Priority:** 🔴 Critical

---

### 🎯 PHASE 3.1: Refactor MapContainer

**Target:** < 200 lines  
**Complexity:** 🟡 Medium

#### Responsibilities (After refactor):

- Compose all hooks
- Render all layers
- Coordinate between layers
- Handle top-level state coordination

#### Final Structure:

```typescript
export function MapContainer({ className }: MapContainerProps) {
  const { data: session } = useSession();

  // Stores
  const { center, zoom, setCenter, setZoom, setBounds } = useMapStore();
  const { showMemoryLane, setShowMemoryLane } = useUIStore();
  const { selectedPinory, setSelectedPinory } = usePinoryStore();
  const { showFriendsLayer, selectedFriendId } = useFriendStore();

  // Custom hooks (all logic extracted)
  const map = useMapInitialization(center, zoom);
  const bounds = useMapBounds(map.mapRef, map.mapLoaded);
  const interactions = useMapInteractions(map.mapRef, map.mapLoaded);
  const locationNotes = useLocationNotes(session, map.mapLoaded);
  const userLocation = useUserLocation(map.mapRef, map.mapLoaded, session);
  const friendLocations = useFriendLocations(
    map.mapRef,
    map.mapLoaded,
    showFriendsLayer,
    selectedFriendId
  );
  const markers = useMapMarkers(
    map.mapRef,
    map.mapLoaded,
    locationNotes.locationNotes,
    bounds.mapBounds,
    bounds.currentZoom,
    selectedPinory,
    handleMarkerClick
  );
  const route = useRouteDisplay(map.mapRef, map.mapLoaded);

  // Event handlers (minimal)
  const handleMarkerClick = useCallback((pinory: Pinory) => {
    setSelectedPinory(pinory);
  }, [setSelectedPinory]);

  // Render (composition only)
  return (
    <div className={cn("relative", className)}>
      <div ref={map.containerRef} className="w-full h-full" />

      <MapMarkerLayer
        mapRef={map.mapRef}
        clusters={markers.clusters}
        markersRef={markers.markersRef}
        friendMarkers={friendLocations.friendMarkers}
        selectedPinory={selectedPinory}
        onMarkerClick={handleMarkerClick}
      />

      <MapPopupLayer {...popupProps} />
      <MapDialogLayer {...dialogProps} />
      <MapControlsLayer {...controlProps} />
    </div>
  );
}
```

#### Checklist:

- [ ] **3.1.1** Backup current MapContainer
- [ ] **3.1.2** Start rewriting MapContainer from scratch
- [ ] **3.1.3** Import all hooks
- [ ] **3.1.4** Replace state with hook returns
- [ ] **3.1.5** Remove all extracted logic
- [ ] **3.1.6** Compose layers with proper props
- [ ] **3.1.7** Keep only coordination logic
- [ ] **3.1.8** Remove unused imports
- [ ] **3.1.9** Verify line count < 200
- [ ] **3.1.10** Test all features end-to-end
- [ ] **3.1.11** Fix any bugs
- [ ] **3.1.12** Commit
  ```bash
  git commit -m "refactor: rewrite MapContainer with modular architecture"
  ```

---

### 🧪 PHASE 3.2: Write Unit Tests

**Priority:** 🟡 High

#### Test Coverage Goals:

- Hooks: 80%+
- Utils: 90%+
- Components: 60%+

#### Checklist:

- [ ] **3.2.1** Setup test environment (Vitest + Testing Library)
- [ ] **3.2.2** Write tests for `useMapInitialization`
  - [ ] Map initialization success
  - [ ] Token validation error
  - [ ] Map load event
  - [ ] Cleanup on unmount
- [ ] **3.2.3** Write tests for `useLocationNotes`
  - [ ] Load notes successfully
  - [ ] Add note
  - [ ] Edit note
  - [ ] Delete note
  - [ ] API error handling
- [ ] **3.2.4** Write tests for `useMapMarkers`
  - [ ] Clustering logic
  - [ ] Marker creation
  - [ ] Marker updates
  - [ ] Marker cleanup
- [ ] **3.2.5** Write tests for utilities
  - [ ] mapMarkerUtils
  - [ ] mapGeocoding
  - [ ] mapClustering
- [ ] **3.2.6** Run tests and fix failures
- [ ] **3.2.7** Achieve target coverage
- [ ] **3.2.8** Commit
  ```bash
  git commit -m "test: add unit tests for map hooks and utilities"
  ```

---

### ⚡ PHASE 3.3: Performance Optimization

**Priority:** 🟡 High

#### Goals:

- Reduce unnecessary re-renders
- Optimize marker lifecycle
- Optimize clustering
- Reduce bundle size

#### Checklist:

- [ ] **3.3.1** Install React DevTools Profiler
- [ ] **3.3.2** Profile current performance baseline
- [ ] **3.3.3** Identify expensive re-renders
- [ ] **3.3.4** Add React.memo to layers where needed
  ```typescript
  export const MapMarkerLayer = React.memo(MapMarkerLayerComponent);
  ```
- [ ] **3.3.5** Memoize expensive callbacks with useCallback
- [ ] **3.3.6** Memoize expensive computations with useMemo
- [ ] **3.3.7** Optimize marker rendering (virtual markers?)
- [ ] **3.3.8** Optimize clustering (web worker?)
- [ ] **3.3.9** Profile after optimizations
- [ ] **3.3.10** Document performance improvements
- [ ] **3.3.11** Commit
  ```bash
  git commit -m "perf: optimize map rendering and clustering"
  ```

---

### 📚 PHASE 3.4: Documentation & Cleanup

**Priority:** 🟢 Medium

#### Checklist:

- [ ] **3.4.1** Write JSDoc for all hooks
  ```typescript
  /**
   * Initialize and manage Mapbox map instance
   * @param initialCenter - Initial map center coordinates [lng, lat]
   * @param initialZoom - Initial zoom level
   * @returns Map refs, loading state, and error state
   */
  export function useMapInitialization(...)
  ```
- [ ] **3.4.2** Write JSDoc for all utilities
- [ ] **3.4.3** Update main README.md with architecture
- [ ] **3.4.4** Create ARCHITECTURE.md for map component
- [ ] **3.4.5** Document all hooks in separate docs/map-hooks.md
- [ ] **3.4.6** Remove all commented code
- [ ] **3.4.7** Remove console.logs (except errors)
- [ ] **3.4.8** Fix all TypeScript errors/warnings
- [ ] **3.4.9** Run linter and fix issues
- [ ] **3.4.10** Run formatter (Prettier)
- [ ] **3.4.11** Final code review
- [ ] **3.4.12** Commit
  ```bash
  git commit -m "docs: add comprehensive documentation for map components"
  ```

---

### ✅ PHASE 3 COMPLETION CHECKLIST

- [ ] **MapContainer < 200 lines**
- [ ] **All tests passing**
- [ ] **Performance acceptable**
- [ ] **Documentation complete**
- [ ] **No TypeScript errors**
- [ ] **No console warnings**
- [ ] **Code reviewed**
- [ ] **Create PR**
  ```bash
  git push origin refactor/map-container-modular
  # Create PR on GitHub
  ```

---

## 🎉 FINAL REVIEW & DEPLOYMENT

**Priority:** 🔴 Critical

### Final Checklist:

- [ ] **F.1** Run full test suite

  ```bash
  npm run test
  ```

- [ ] **F.2** Run E2E tests (if available)

  ```bash
  npm run test:e2e
  ```

- [ ] **F.3** Build for production

  ```bash
  npm run build
  ```

- [ ] **F.4** Check bundle size

  ```bash
  npm run analyze
  ```

- [ ] **F.5** Manual testing - All features
  - [ ] Map initialization
  - [ ] Location notes CRUD
  - [ ] Clustering at different zooms
  - [ ] User location tracking
  - [ ] Friend locations
  - [ ] Popups (all types)
  - [ ] Dialogs (all types)
  - [ ] Memory Lane
  - [ ] Route display
  - [ ] Search integration
  - [ ] Mobile responsive

- [ ] **F.6** Performance testing
  - [ ] Lighthouse score
  - [ ] Core Web Vitals
  - [ ] Memory leaks check

- [ ] **F.7** Cross-browser testing
  - [ ] Chrome
  - [ ] Firefox
  - [ ] Safari
  - [ ] Edge

- [ ] **F.8** Code review by team

- [ ] **F.9** Merge PR

  ```bash
  git checkout main
  git merge refactor/map-container-modular
  git push origin main
  ```

- [ ] **F.10** Deploy to staging

- [ ] **F.11** Smoke test on staging

- [ ] **F.12** Deploy to production

- [ ] **F.13** Monitor for errors (Sentry/LogRocket)

- [ ] **F.14** Close related issues

- [ ] **F.15** Update project board

- [ ] **F.16** Celebrate! 🎉

---

## 📊 SUCCESS METRICS

### Before Refactor:

- ❌ Lines: 1000+
- ❌ Complexity: Very High
- ❌ Maintainability: Low
- ❌ Testability: Very Low
- ❌ Reusability: None
- ❌ Performance: Moderate

### After Refactor:

- ✅ Lines: < 200
- ✅ Complexity: Low
- ✅ Maintainability: High
- ✅ Testability: High
- ✅ Reusability: High
- ✅ Performance: Optimized

---

## 🚨 ROLLBACK PLAN

Nếu có vấn đề nghiêm trọng:

1. **Revert merge commit:**

   ```bash
   git revert -m 1 <merge-commit-hash>
   git push origin main
   ```

2. **Deploy previous version**

3. **Investigate issue in refactor branch**

4. **Fix và re-deploy**

---

## 📞 SUPPORT & QUESTIONS

- **Technical Lead:** [Your Name]
- **Code Review:** [Team Members]
- **Slack Channel:** #map-refactor
- **Documentation:** docs/map-architecture.md

---

**Last Updated:** November 19, 2025  
**Status:** Ready to Start  
**Estimated Completion:** December 10, 2025
