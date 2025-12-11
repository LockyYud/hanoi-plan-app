# 📍 Pinory Share Feature

## Overview

Feature share cho phép user chia sẻ các pinory (location notes) với bạn bè hoặc công khai qua link.

## Architecture

### Database

- **Model mới**: `PinoryShare` trong `prisma/schema.prisma`
- Tracks: share slug, visibility, view count, expiry

### API Routes

1. **POST /api/pinory/share** - Tạo share link
2. **GET /api/pinory/share/[slug]** - Lấy dữ liệu từ share link

### Components

#### 1. SharePinoryDialog

- Location: `src/components/pinory/share/share-pinory-dialog.tsx`
- Dùng cho: User muốn share pinory trong app
- Features:
    - Chọn visibility (public/friends/private)
    - Copy link
    - View stats (view count)

#### 2. PublicPinoryView

- Location: `src/components/pinory/share/public-pinory-view.tsx`
- Dùng khi: Người xem không login hoặc share visibility là public
- Features:
    - Read-only view
    - CTA sign up
    - SEO-friendly

#### 3. FriendPinoryShareView

- Location: `src/components/pinory/share/friend-pinory-share-view.tsx`
- Dùng khi: User đã login và là friend của owner
- Features:
    - Get directions
    - Add to favorites
    - Full details view

### Pages

#### Universal Share Page: /p/[shareSlug]

- Location: `src/app/p/[shareSlug]/page.tsx`
- Server-side logic quyết định view type:
    - **Owner** → Redirect to map
    - **Friend** → Show FriendPinoryShareView
    - **Public/Anonymous** → Show PublicPinoryView
    - **No access** → Show error message

## Share Flow

```
User clicks "Share" button
    ↓
SharePinoryDialog opens
    ↓
User selects visibility
    ↓
Generate unique share link (/p/abc123)
    ↓
Copy/Share link
    ↓
Recipient clicks link
    ↓
Server checks: Auth? Friendship? Visibility?
    ↓
Show appropriate view
```

## Visibility Levels

| Visibility         | Who can view                      |
| ------------------ | --------------------------------- |
| `private`          | Only owner                        |
| `friends`          | Owner + friends                   |
| `selected_friends` | Owner + specific friends (future) |
| `public`           | Anyone with link                  |

## Security Features

- ✅ Share link validation (format check)
- ✅ Expiry check (default 30 days)
- ✅ Ownership verification
- ✅ Friendship verification
- ✅ Unique slug generation (nanoid)
- ✅ View count tracking

## Usage

### Creating a share

```typescript
// User opens PinoryDetailsView
// Clicks "Share" button
// Dialog opens with visibility options
// Generate link → Copy → Done
```

### Accessing a share

```
https://yourapp.com/p/abc123
    ↓
Server-side auth check
    ↓
Render appropriate component
```

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── pinory/
│   │       └── share/
│   │           ├── route.ts          # POST create share
│   │           └── [slug]/
│   │               └── route.ts      # GET fetch share
│   └── p/
│       └── [shareSlug]/
│           └── page.tsx              # Universal share page
├── components/
│   └── pinory/
│       ├── details/
│       │   └── pinory-details-view.tsx  # Updated with Share button
│       └── share/
│           ├── index.ts
│           ├── share-pinory-dialog.tsx
│           ├── public-pinory-view.tsx
│           └── friend-pinory-share-view.tsx
└── lib/
    └── share-utils.ts                # Helper functions

prisma/
└── schema.prisma                     # PinoryShare model
```

## Future Enhancements

- [ ] Social media preview (OG tags optimization)
- [ ] QR code generation
- [ ] Share analytics dashboard
- [ ] Expiry customization
- [ ] Selected friends sharing
- [ ] Share to specific friends in-app
- [ ] Share statistics (clicks, views over time)

## Testing

### Manual Testing Checklist

- [ ] Create share as logged-in user
- [ ] Copy share link
- [ ] Open link in incognito (not logged in)
- [ ] Open link as friend
- [ ] Open link as non-friend
- [ ] Check expiry handling
- [ ] Verify view count increment
- [ ] Test different visibility levels

## Notes

- Share links expire after 30 days by default
- Each pinory can have multiple shares (future: limit to 1)
- View count increments on each view (future: unique views only)
- Owner viewing own share redirects to map
