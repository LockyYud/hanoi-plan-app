# Friend Invitation System - Hệ thống mời bạn qua Link

## 📋 Concept

Thay vì tìm kiếm và gửi friend request trong app, user sẽ:

1. Tạo một **invitation link** duy nhất
2. Share link qua SMS, WhatsApp, Messenger, etc.
3. Người nhận click link → Đăng nhập/Đăng ký → Tự động kết bạn

## 🗄️ Database Schema

```prisma
model FriendInvitation {
  id          String   @id @default(cuid())
  userId      String   @map("user_id")
  inviteCode  String   @unique @map("invite_code") // Unique short code (6-8 chars)
  inviteUrl   String   @unique @map("invite_url")   // Full URL
  usageCount  Int      @default(0) @map("usage_count") // Số lần được sử dụng
  maxUsage    Int?     @default(null) @map("max_usage") // null = unlimited
  expiresAt   DateTime? @map("expires_at") // null = never expires
  isActive    Boolean  @default(true) @map("is_active")
  createdAt   DateTime @default(now()) @map("created_at")

  // Relations
  user        User     @relation("UserInvitations", fields: [userId], references: [id], onDelete: Cascade)
  acceptedBy  FriendInvitationAcceptance[]

  @@index([userId])
  @@index([inviteCode])
  @@map("friend_invitations")
}

model FriendInvitationAcceptance {
  id           String           @id @default(cuid())
  invitationId String           @map("invitation_id")
  acceptedById String           @map("accepted_by_id")
  friendshipId String           @unique @map("friendship_id")
  createdAt    DateTime         @default(now()) @map("created_at")

  // Relations
  invitation   FriendInvitation @relation(fields: [invitationId], references: [id], onDelete: Cascade)
  acceptedBy   User             @relation("AcceptedInvitations", fields: [acceptedById], references: [id], onDelete: Cascade)
  friendship   Friendship       @relation(fields: [friendshipId], references: [id], onDelete: Cascade)

  @@unique([invitationId, acceptedById])
  @@map("friend_invitation_acceptances")
}

// Update Friendship model
model Friendship {
  // ... existing fields ...
  invitation   FriendInvitationAcceptance?
}
```

## 🔌 API Endpoints

### 1. Create/Get Invitation Link

```typescript
GET /api/friends/invite
Response: {
  inviteCode: "ABC123XY",
  inviteUrl: "https://pinory.app/invite/ABC123XY",
  usageCount: 5,
  createdAt: "2025-01-01T00:00:00Z"
}
```

### 2. Accept Invitation

```typescript
POST /api/friends/invite/accept
Body: { inviteCode: "ABC123XY" }
Response: {
  success: true,
  friendship: { ... },
  friend: { id, name, email, avatarUrl }
}
```

### 3. Revoke/Deactivate Invitation

```typescript
DELETE / api / friends / invite;
Response: {
    success: true;
}
```

### 4. Get Invitation Stats

```typescript
GET /api/friends/invite/stats
Response: {
  totalInvites: 15,
  acceptedCount: 12,
  pendingCount: 3,
  recentAcceptances: [...]
}
```

## 🎨 UI/UX Flow

### Sidebar - Friends Tab

```
┌─────────────────────────────────────┐
│ 👥 Bạn bè (24)        [🔗 Mời bạn] │
├─────────────────────────────────────┤
│ 📬 Friend Requests (0)              │
├─────────────────────────────────────┤
│ [Friend List...]                    │
└─────────────────────────────────────┘
```

### Invite Dialog

```
┌───────────────────────────────────────────┐
│ ✕  Mời bạn bè tham gia Pinory             │
├───────────────────────────────────────────┤
│                                           │
│  Chia sẻ link dưới đây để mời bạn bè:    │
│                                           │
│  ┌─────────────────────────────────┐     │
│  │ pinory.app/invite/ABC123XY   📋 │     │
│  └─────────────────────────────────┘     │
│                                           │
│  Hoặc share qua:                          │
│  [📱 SMS] [💬 Messenger] [📧 Email]      │
│                                           │
├───────────────────────────────────────────┤
│  📊 Thống kê lời mời                      │
│  • 12 người đã tham gia qua link của bạn  │
│  • 3 người đã xem nhưng chưa tham gia     │
│                                           │
│  [❌ Vô hiệu hóa link]                    │
└───────────────────────────────────────────┘
```

### Landing Page - Accept Invitation

When someone visits: `pinory.app/invite/ABC123XY`

**If NOT logged in:**

```
┌───────────────────────────────────────────┐
│  👋 Alice đã mời bạn tham gia Pinory!     │
│                                           │
│  [Avatar of Alice]                        │
│  Alice Nguyen                             │
│  alice@example.com                        │
│  Đã có 45 ghi chú địa điểm                │
│                                           │
│  Pinory giúp bạn lưu trữ và chia sẻ      │
│  những địa điểm yêu thích tại Hà Nội      │
│                                           │
│  [🚀 Đăng nhập để kết bạn với Alice]     │
│  [📱 Đăng ký mới]                         │
└───────────────────────────────────────────┘
```

**If logged in:**

```
┌───────────────────────────────────────────┐
│  ✅ Alice đã mời bạn kết bạn!             │
│                                           │
│  [Avatar]                                 │
│  Alice Nguyen                             │
│  45 ghi chú địa điểm                      │
│                                           │
│  [✓ Chấp nhận và kết bạn]                 │
│  [Xem trang chủ]                          │
└───────────────────────────────────────────┘
```

## 💻 Implementation

### Step 1: Generate Invite Code

```typescript
function generateInviteCode(): string {
    // 8 characters: uppercase + numbers
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}
```

### Step 2: Create Invitation API

```typescript
// src/app/api/friends/invite/route.ts
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user already has an active invitation
    let invitation = await prisma.friendInvitation.findFirst({
        where: {
            userId: session.user.id,
            isActive: true,
        },
    });

    // Create new invitation if not exists
    if (!invitation) {
        const inviteCode = generateInviteCode();
        invitation = await prisma.friendInvitation.create({
            data: {
                userId: session.user.id,
                inviteCode,
                inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/invite/${inviteCode}`,
            },
        });
    }

    return NextResponse.json({
        inviteCode: invitation.inviteCode,
        inviteUrl: invitation.inviteUrl,
        usageCount: invitation.usageCount,
        createdAt: invitation.createdAt,
    });
}
```

### Step 3: Accept Invitation Page

```typescript
// src/app/invite/[code]/page.tsx
export default async function InvitePage({ params }: { params: { code: string } }) {
  const session = await getServerSession(authOptions);
  const invitation = await prisma.friendInvitation.findUnique({
    where: { inviteCode: params.code },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true
        }
      }
    }
  });

  if (!invitation || !invitation.isActive) {
    return <InviteExpiredPage />;
  }

  if (!session) {
    // Show login/signup page with invitation context
    return <InviteLoginPage inviter={invitation.user} inviteCode={params.code} />;
  }

  // User is logged in, show accept button
  return <AcceptInvitePage inviter={invitation.user} inviteCode={params.code} />;
}
```

### Step 4: Accept Invitation API

```typescript
// src/app/api/friends/invite/accept/route.ts
export async function POST(req: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { inviteCode } = await req.json();

    const invitation = await prisma.friendInvitation.findUnique({
        where: { inviteCode },
        include: { user: true },
    });

    if (!invitation || !invitation.isActive) {
        return NextResponse.json(
            { error: "Invalid or expired invitation" },
            { status: 400 }
        );
    }

    // Cannot accept own invitation
    if (invitation.userId === session.user.id) {
        return NextResponse.json(
            { error: "Cannot accept your own invitation" },
            { status: 400 }
        );
    }

    // Check if already friends
    const existingFriendship = await prisma.friendship.findFirst({
        where: {
            OR: [
                {
                    requesterId: invitation.userId,
                    addresseeId: session.user.id,
                },
                {
                    requesterId: session.user.id,
                    addresseeId: invitation.userId,
                },
            ],
        },
    });

    if (existingFriendship) {
        return NextResponse.json({ error: "Already friends" }, { status: 400 });
    }

    // Create friendship and acceptance record
    const friendship = await prisma.friendship.create({
        data: {
            requesterId: invitation.userId,
            addresseeId: session.user.id,
            status: "accepted", // Auto-accept via invitation
        },
    });

    await prisma.friendInvitationAcceptance.create({
        data: {
            invitationId: invitation.id,
            acceptedById: session.user.id,
            friendshipId: friendship.id,
        },
    });

    // Update usage count
    await prisma.friendInvitation.update({
        where: { id: invitation.id },
        data: { usageCount: { increment: 1 } },
    });

    return NextResponse.json({
        success: true,
        friendship,
        friend: invitation.user,
    });
}
```

## 📱 Share Options

### Web Share API

```typescript
async function shareInvite(inviteUrl: string) {
    if (navigator.share) {
        await navigator.share({
            title: "Tham gia Pinory cùng tôi!",
            text: "Khám phá và chia sẻ những địa điểm tuyệt vời tại Hà Nội",
            url: inviteUrl,
        });
    } else {
        // Fallback: Copy to clipboard
        await navigator.clipboard.writeText(inviteUrl);
        toast.success("Đã copy link!");
    }
}
```

### Direct Share Links

```typescript
const shareLinks = {
    sms: `sms:?body=${encodeURIComponent(`Tham gia Pinory cùng tôi! ${inviteUrl}`)}`,
    messenger: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(inviteUrl)}&app_id=${FB_APP_ID}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Tham gia Pinory! ${inviteUrl}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(inviteUrl)}`,
    email: `mailto:?subject=${encodeURIComponent("Tham gia Pinory!")}&body=${encodeURIComponent(inviteUrl)}`,
};
```

## 🎁 Gamification (Optional)

### Referral Rewards

- **Người mời**: Nhận badge "Connector" khi có 5 bạn tham gia
- **Người được mời**: Nhận welcome bonus (premium features?)
- **Leaderboard**: Top inviters of the month

### Achievements

- 🌟 **Social Butterfly**: 10 bạn qua link
- 🚀 **Growth Hacker**: 50 bạn qua link
- 👑 **Influencer**: 100 bạn qua link

## ✅ Advantages vs Traditional Friend Request

| Feature                 | Friend Request        | Invitation Link  |
| ----------------------- | --------------------- | ---------------- |
| Cần cả 2 users trong DB | ✅ Yes                | ❌ No            |
| Share qua ngoài app     | ❌ No                 | ✅ Yes           |
| Viral potential         | Low                   | High             |
| UX complexity           | High (search, filter) | Low (just share) |
| Conversion rate         | Lower                 | Higher           |
| Tracking                | Hard                  | Easy (codes)     |

## 🔄 Migration Path

1. **Phase 1**: Implement invitation system
2. **Phase 2**: Keep both systems (search + invite)
3. **Phase 3**: Promote invitation link as primary method
4. **Phase 4** (Optional): Deprecate search if invitation works well

---

Giải pháp này simple hơn, viral hơn, và không cần lo vấn đề user chưa tồn tại trong DB! 🚀
