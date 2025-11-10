# Setup Friend Invitation System

## ✅ Đã implement xong:

### 1. **Backend APIs**

- ✅ `GET /api/friends/invite` - Tạo/lấy invitation link
- ✅ `POST /api/friends/invite/accept` - Chấp nhận invitation
- ✅ `DELETE /api/friends/invite` - Vô hiệu hóa invitation

### 2. **Frontend Components**

- ✅ `InviteDialog` - Dialog để share invitation link
- ✅ Sidebar: Nút "Mời bạn" thay vì "Thêm bạn"
- ✅ Copy to clipboard, Web Share API
- ✅ Share buttons: SMS, Messenger, Email, Telegram

### 3. **Database Schema**

- ✅ `FriendInvitation` model - Lưu invitation links
- ✅ `FriendInvitationAcceptance` model - Track ai đã accept
- ✅ Relations với User và Friendship models

---

## 🚀 Để chạy hệ thống mới:

### Step 1: Chạy Prisma Migration

```bash
npx prisma migrate dev --name add_friend_invitation_system
```

Lệnh này sẽ:

- Tạo migration file từ schema changes
- Tạo tables mới trong database:
    - `friend_invitations`
    - `friend_invitation_acceptances`
- Update relations

### Step 2: Generate Prisma Client

```bash
npx prisma generate
```

### Step 3: Restart Dev Server

```bash
npm run dev
```

---

## 🧪 Test Flow:

### 1. **Tạo Invitation Link**

1. Login vào app
2. Click vào tab **"Bạn bè"** trong sidebar
3. Click nút **"Mời bạn"** (purple button)
4. Dialog sẽ mở và tự động tạo invitation link
5. Xem invite code (8 ký tự) và URL

**Expected Result:**

- Hiển thị invitation URL: `http://localhost:3000/invite/ABC123XY`
- Stats: "0 Đã tham gia", "0 Lần dùng"
- Các nút share: Share, SMS, Messenger, Telegram, Email

### 2. **Copy & Share Link**

1. Click nút **Copy** (📋) bên cạnh URL
2. Toast hiển thị "Đã copy link!"
3. Hoặc click **"Share"** để dùng Web Share API
4. Hoặc click **"SMS", "Messenger"**, etc để share qua app khác

### 3. **Accept Invitation** (TODO: Cần implement page)

**Sẽ implement tiếp:**

- `/invite/[code]` page để accept invitation
- Landing page đẹp cho người chưa đăng nhập
- Accept button cho người đã đăng nhập

---

## 📁 Files đã tạo/sửa:

### Backend

```
src/app/api/friends/invite/
  ├── route.ts                    # GET, DELETE invitation
  └── accept/
      └── route.ts                # POST accept invitation
```

### Frontend

```
src/components/friends/
  ├── invite-dialog.tsx           # Dialog để share link
  └── add-friend-dialog.tsx       # (Deprecated - giữ lại backup)

src/components/layout/
  └── sidebar.tsx                 # Updated để dùng InviteDialog
```

### Database

```
prisma/
  └── schema.prisma               # Added FriendInvitation models
```

### Documentation

```
FRIEND_INVITATION_SYSTEM.md      # System design document
SETUP_FRIEND_INVITATION.md       # This file
```

---

## 🔧 Environment Variables

Đảm bảo có biến môi trường này trong `.env`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
# Or in production:
# NEXT_PUBLIC_APP_URL=https://pinory.app
```

---

## 🎯 Next Steps (TODO):

### Phase 1: Invitation Accept Page (High Priority)

- [ ] Create `/app/invite/[code]/page.tsx`
- [ ] Landing page cho chưa đăng nhập
    - Show inviter info (avatar, name, stats)
    - CTA: "Đăng nhập để kết bạn"
- [ ] Accept page cho đã đăng nhập
    - Show inviter info
    - Button: "Chấp nhận và kết bạn"
    - Auto redirect sau khi accept
- [ ] Error states: expired, invalid code, etc.

### Phase 2: Improve UX

- [ ] QR Code generation cho invitation link
- [ ] Share image/card cho social media
- [ ] Deep linking cho mobile apps
- [ ] Notification khi có người accept invitation

### Phase 3: Analytics

- [ ] Track invitation views (page visits)
- [ ] Track conversion rate (views → accepts)
- [ ] Leaderboard: top inviters
- [ ] User dashboard: "Bạn bè đã mời"

### Phase 4: Gamification (Optional)

- [ ] Badges: "Connector" (5 friends), "Influencer" (50 friends)
- [ ] Rewards: Premium features unlock
- [ ] Referral contests

---

## 🐛 Debugging

Nếu gặp lỗi khi test:

### 1. Migration Fails

```bash
# Reset database (⚠️ Mất data!)
npx prisma migrate reset

# Or apply manually
npx prisma db push
```

### 2. "FriendInvitation is not defined"

```bash
# Regenerate Prisma Client
npx prisma generate

# Restart dev server
npm run dev
```

### 3. "Cannot find table friend_invitations"

- Kiểm tra migration đã chạy chưa: `npx prisma migrate status`
- Xem database: `npx prisma studio`

### 4. User not found error

- Đảm bảo user đã login và có trong database
- Check: `await prisma.user.findUnique({ where: { id: session.user.id } })`

---

## 📊 Database Schema Diagram

```
┌─────────────────┐
│      User       │
│─────────────────│
│ id (PK)         │◄─────┐
│ email           │      │
│ name            │      │
│ ...             │      │
└─────────────────┘      │
         ▲               │
         │               │
         │ userId        │ userId
         │               │
┌─────────────────────┐  │
│ FriendInvitation    │  │
│─────────────────────│  │
│ id (PK)             │  │
│ userId (FK) ────────┼──┘
│ inviteCode (UNIQUE) │
│ inviteUrl           │
│ usageCount          │
│ isActive            │
│ ...                 │
└─────────────────────┘
         │
         │ invitationId
         │
         ▼
┌──────────────────────────────┐
│ FriendInvitationAcceptance   │
│──────────────────────────────│
│ id (PK)                      │
│ invitationId (FK) ───────────┘
│ acceptedById (FK) ───────────┐
│ friendshipId (FK) ───────┐   │
└──────────────────────────│───┘
                           │   │
                           ▼   │
                    ┌─────────────┐
                    │ Friendship  │
                    │─────────────│
                    │ id (PK)     │
                    │ requesterId │
                    │ addresseeId │◄───┘
                    │ status      │
                    └─────────────┘
```

---

## ✨ Ưu điểm so với Friend Request cũ:

| Feature               | Old (Friend Request)  | New (Invitation Link) |
| --------------------- | --------------------- | --------------------- |
| User phải có trong DB | ✅ Required           | ❌ Not required       |
| Share ngoài app       | ❌ No                 | ✅ Yes (SMS, social)  |
| Viral potential       | Low                   | High                  |
| UX complexity         | High (search UI)      | Low (just copy/share) |
| Conversion rate       | Lower                 | Higher                |
| Error rate            | High (user not found) | Low                   |
| Trackable             | Hard                  | Easy (invite codes)   |

---

## 🎉 Kết luận

System mới đơn giản hơn, viral hơn, và không bị lỗi "user not found"!

User chỉ cần:

1. Click "Mời bạn"
2. Share link
3. Đợi bạn bè click và tự động kết bạn

**No more searching, no more errors!** 🚀
