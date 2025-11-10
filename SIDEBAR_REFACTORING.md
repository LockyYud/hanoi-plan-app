# Sidebar Components Refactoring

## 📁 Cấu trúc mới

Sidebar đã được tách thành các component nhỏ hơn để dễ bảo trì:

```
src/components/layout/
├── sidebar.tsx                 # Main sidebar component (coordinator)
└── sidebar-tabs/              # Tab components
    ├── index.ts               # Export all tabs
    ├── places-tab.tsx         # Địa điểm tab
    ├── journeys-tab.tsx       # Hành trình tab
    ├── friends-tab.tsx        # Bạn bè tab
    ├── feed-tab.tsx          # Hoạt động tab
    └── profile-tab.tsx        # Cá nhân tab
```

## 🎯 Lợi ích

### 1. **Code dễ đọc hơn**

- Mỗi tab là một file riêng (~200-600 dòng thay vì 2000+ dòng)
- Logic rõ ràng, dễ tìm kiếm

### 2. **Dễ bảo trì**

- Sửa một tab không ảnh hưởng đến tab khác
- Giảm conflict khi nhiều người cùng làm việc

### 3. **Tái sử dụng**

- Các tab component có thể export và dùng ở nơi khác
- Props interface rõ ràng, dễ test

### 4. **Performance**

- Lazy loading có thể áp dụng dễ dàng
- Code splitting tự nhiên hơn

## 📋 Component Details

### `sidebar.tsx` (Main)

**Trách nhiệm:**

- Quản lý state chung (session, filters, places, journeys, etc.)
- Điều phối giữa các tab
- Render tab navigation và layout
- Handle các action chung (directions, CRUD operations)

**Không làm:**

- Render nội dung chi tiết của từng tab
- Logic UI phức tạp của từng tab

### `places-tab.tsx`

**Props:**

- `session`, `places`, `filter`, `categories`
- `isLoadingPlaces`, `isGettingDirections`
- Callback functions: `setFilter`, `setSelectedPlace`, etc.

**Features:**

- Search & filter UI
- Category badges
- Place cards với images
- Direction & view actions

### `journeys-tab.tsx`

**Props:**

- `journeys`, `loadingJourneys`
- `setShowCreateJourney`, `setEditingJourney`, `fetchJourneys`

**Features:**

- Journey cards list
- Create/Edit/Delete actions
- Show journey on map

### `friends-tab.tsx`

**Props:**

- `friends`, `friendRequests`, `processingRequest`
- Friend action callbacks

**Features:**

- Friend requests list với accept/reject
- Friends list với avatar
- Invite button

### `feed-tab.tsx`

**Props:**

- `activityFeed`

**Features:**

- Activity feed list
- User avatars và actions
- Timestamp formatting

### `profile-tab.tsx`

**Props:**

- `session`, `status`, `places`, `filteredPlaces`

**Features:**

- User profile card với stats
- Login/Logout buttons
- Stats (notes count, images count)

## 🔄 Migration Guide

### Trước (Old structure):

```tsx
// sidebar.tsx - 2000+ lines
export function Sidebar() {
  // ... all state
  // ... all handlers
  // ... all tab content inline
  return (
    <div>
      {activeTab === "places" && <div>{/* 400+ lines of places UI */}</div>}
      {activeTab === "journeys" && <div>{/* 300+ lines of journeys UI */}</div>}
      {/* ... more tabs */}
    </div>
  );
}
```

### Sau (New structure):

```tsx
// sidebar.tsx - ~750 lines
export function Sidebar() {
  // ... state & handlers
  return (
    <div>
      {activeTab === "places" && <PlacesTab {...placesProps} />}
      {activeTab === "journeys" && <JourneysTab {...journeysProps} />}
      {/* ... clean! */}
    </div>
  );
}

// sidebar-tabs/places-tab.tsx - ~550 lines
export function PlacesTab(props) {
  // ... places-specific logic & UI
}
```

## 🚀 Cách thêm tab mới

1. Tạo file mới trong `sidebar-tabs/`:

```tsx
// sidebar-tabs/new-tab.tsx
export function NewTab({ prop1, prop2 }: NewTabProps) {
  return <div>New content</div>;
}
```

2. Export trong `sidebar-tabs/index.ts`:

```tsx
export { NewTab } from "./new-tab";
```

3. Import và sử dụng trong `sidebar.tsx`:

```tsx
import { NewTab } from "./sidebar-tabs";

// ...trong render:
{
  activeTab === "new" && <NewTab prop1={val1} prop2={val2} />;
}
```

## 📝 Notes

- **ExtendedPlace type**: Exported từ `places-tab.tsx` để dùng chung
- **Shared state**: Vẫn được quản lý ở `sidebar.tsx` chính
- **Callbacks**: Pass down từ parent để maintain single source of truth
- **Styling**: Giữ nguyên, không thay đổi UI

## 🔍 Testing

```bash
# Chạy app và test từng tab:
npm run dev

# Checklist:
- [ ] Places tab: search, filter, category badges hoạt động
- [ ] Journeys tab: create, edit, delete, show on map
- [ ] Friends tab: friend requests, accept/reject
- [ ] Feed tab: hiển thị activity feed
- [ ] Profile tab: login/logout, stats
```

## 📚 Related Files

- `src/lib/store.ts` - Zustand stores (usePlaceStore, useFriendStore, etc.)
- `src/lib/types.ts` - Type definitions (Journey, Place, etc.)
- `src/components/journey/journey-card.tsx` - Journey card component
- `src/components/friends/invite-dialog.tsx` - Friend invite dialog
