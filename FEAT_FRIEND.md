# Friend Feature - Tính năng Bạn bè

## 📋 Tổng quan

Tính năng Friend cho phép người dùng kết nối với nhau, chia sẻ location notes yêu thích, journeys và trải nghiệm du lịch. Tạo nên một cộng đồng chia sẻ và khám phá các địa điểm thú vị tại Hà Nội.

## 🎯 Mục tiêu chính

1. **Kết nối xã hội**: Cho phép người dùng kết bạn và chia sẻ nội dung với nhau
2. **Chia sẻ có kiểm soát**: Người dùng có quyền kiểm soát ai được xem nội dung của họ
3. **Khám phá**: Tìm hiểu địa điểm thông qua kinh nghiệm của bạn bè
4. **Cộng đồng**: Xây dựng cộng đồng người dùng gắn kết

---

## 👥 User Stories

### 1. Quản lý Bạn bè (Friend Management)

#### US-1.1: Gửi lời mời kết bạn

- **Là người dùng**, tôi muốn **tìm kiếm người dùng khác** để **gửi lời mời kết bạn**
- **Acceptance Criteria**:
    - Tìm kiếm bằng email hoặc tên
    - Hiển thị avatar, tên và số lượng location notes của người dùng
    - Có thể xem profile preview trước khi gửi lời mời
    - Không thể gửi lời mời nếu đã là bạn hoặc đã gửi lời mời trước đó

#### US-1.2: Chấp nhận/Từ chối lời mời kết bạn

- **Là người dùng**, tôi muốn **nhận thông báo về lời mời kết bạn** để **chấp nhận hoặc từ chối**
- **Acceptance Criteria**:
    - Badge/counter hiển thị số lời mời đang chờ
    - Xem profile của người gửi lời mời
    - Chấp nhận hoặc từ chối lời mời
    - Lời mời bị từ chối có thể gửi lại sau 30 ngày

#### US-1.3: Xóa bạn bè

- **Là người dùng**, tôi muốn **xóa bạn bè** khi **không còn muốn kết nối**
- **Acceptance Criteria**:
    - Xác nhận trước khi xóa
    - Sau khi xóa, nội dung đã chia sẻ không còn hiển thị cho nhau
    - Có thể kết bạn lại trong tương lai

#### US-1.4: Danh sách bạn bè

- **Là người dùng**, tôi muốn **xem danh sách bạn bè** để **quản lý kết nối**
- **Acceptance Criteria**:
    - Hiển thị danh sách với avatar, tên, số location notes
    - Tìm kiếm trong danh sách bạn bè
    - Sắp xếp theo: tên, ngày kết bạn, hoạt động gần nhất
    - Xem profile của bạn bè

### 2. Chia sẻ Nội dung (Content Sharing)

#### US-2.1: Chia sẻ Location Notes với bạn bè

- **Là người dùng**, tôi muốn **chia sẻ location notes yêu thích** với **bạn bè cụ thể hoặc tất cả bạn bè**
- **Acceptance Criteria**:
    - Chọn visibility cho mỗi location note: Private, Friends, Public
    - Chọn chia sẻ với: All friends, hoặc Selected friends
    - Bạn bè được chia sẻ có thể xem đầy đủ thông tin (rating, notes, photos)
    - Có thể thay đổi visibility bất cứ lúc nào

#### US-2.2: Chia sẻ Journeys với bạn bè

- **Là người dùng**, tôi muốn **chia sẻ journey/hành trình** với **bạn bè**
- **Acceptance Criteria**:
    - Setting visibility cho Journey: Private, Friends, Public
    - Chọn specific friends để chia sẻ journey
    - Journey được chia sẻ bao gồm tất cả stops và notes
    - Bạn bè có thể duplicate journey để tạo journey riêng của họ

#### US-2.3: Chia sẻ Media với bạn bè

- **Là người dùng**, tôi muốn **chia sẻ ảnh/video** với **bạn bè**
- **Acceptance Criteria**:
    - Media có visibility setting: Private, Friends, Public
    - Bạn bè có thể react trên media
    - Media được chia sẻ hiển thị trong profile và map

### 3. Xem Nội dung của Bạn bè (Friend Content Discovery)

#### US-3.1: Xem location notes của bạn bè

- **Là người dùng**, tôi muốn **xem location notes mà bạn bè đã share** để **khám phá nơi mới**
- **Acceptance Criteria**:
    - Map có layer "Friends' Location Notes" có thể toggle on/off
    - Filter xem location note của: All friends, hoặc specific friend
    - Hiển thị tên bạn bè đã share location note đó
    - Có thể thêm friend's location note vào favorite của mình

#### US-3.2: Xem Journeys của bạn bè

- **Là người dùng**, tôi muốn **xem hành trình của bạn bè** để **lấy ý tưởng cho chuyến đi**
- **Acceptance Criteria**:
    - Tab/section "Friends' Journeys"
    - Preview journey với map và stops
    - Duplicate journey để customize cho mình
    - Có thể react trên journey

---

## 🗄️ Database Schema

### 1. Friend Relationship Table

```prisma
enum FriendshipStatus {
  pending
  accepted
  blocked
}

model Friendship {
  id          String           @id @default(cuid())
  requesterId String           @map("requester_id")
  addresseeId String           @map("addressee_id")
  status      FriendshipStatus @default(pending)
  createdAt   DateTime         @default(now()) @map("created_at")
  updatedAt   DateTime         @updatedAt @map("updated_at")

  // Relations
  requester User @relation("FriendshipRequester", fields: [requesterId], references: [id], onDelete: Cascade)
  addressee User @relation("FriendshipAddressee", fields: [addresseeId], references: [id], onDelete: Cascade)

  @@unique([requesterId, addresseeId])
  @@index([requesterId, status])
  @@index([addresseeId, status])
  @@map("friendships")
}
```

### 2. Friend Content Sharing

```prisma
enum ShareVisibility {
  private
  friends
  selected_friends
  public
}

model FriendShare {
  id         String          @id @default(cuid())
  userId     String          @map("user_id")
  contentId  String          @map("content_id") // location_note_id, journey_id, media_id
  contentType String         @map("content_type") // 'location_note', 'journey', 'media'
  visibility ShareVisibility @default(private)
  sharedWith String[]        @map("shared_with") // array of user IDs for selected_friends
  createdAt  DateTime        @default(now()) @map("created_at")

  // Relations
  user User @relation("UserShares", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, contentId, contentType])
  @@index([userId, contentType])
  @@index([contentId, contentType])
  @@map("friend_shares")
}
```

### 3. Social Interactions

```prisma
enum ReactionType {
  love
  like
  wow
  smile
  fire
}

model Reaction {
  id          String       @id @default(cuid())
  userId      String       @map("user_id")
  contentId   String       @map("content_id")
  contentType String       @map("content_type")
  type        ReactionType
  createdAt   DateTime     @default(now()) @map("created_at")

  // Relations
  user User @relation("UserReactions", fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, contentId, contentType])
  @@index([contentId, contentType])
  @@map("reactions")
}

```

### 4. Recommendations

```prisma
enum RecommendationStatus {
  pending
  accepted
  dismissed
}

model Recommendation {
  id              String               @id @default(cuid())
  fromUserId      String               @map("from_user_id")
  toUserId        String               @map("to_user_id")
  locationNoteId  String               @map("location_note_id")
  message         String?              @db.Text
  status          RecommendationStatus @default(pending)
  createdAt       DateTime             @default(now()) @map("created_at")

  // Relations
  fromUser     User         @relation("SentRecommendations", fields: [fromUserId], references: [id], onDelete: Cascade)
  toUser       User         @relation("ReceivedRecommendations", fields: [toUserId], references: [id], onDelete: Cascade)
  locationNote LocationNote @relation(fields: [locationNoteId], references: [id], onDelete: Cascade)

  @@index([toUserId, status])
  @@index([fromUserId])
  @@map("recommendations")
}
```

---

## 🔌 API Endpoints

### Friend Management

```typescript
// Friend requests
POST   /api/friends/request          // Gửi lời mời kết bạn
GET    /api/friends/requests          // Lấy danh sách lời mời
POST   /api/friends/accept/:id        // Chấp nhận lời mời
POST   /api/friends/reject/:id        // Từ chối lời mời
DELETE /api/friends/:id               // Xóa bạn bè

// Friend list
GET    /api/friends                   // Lấy danh sách bạn bè
GET    /api/friends/search            // Tìm kiếm người dùng
GET    /api/friends/:id/profile       // Xem profile bạn bè
```

### Content Sharing

```typescript
// Share settings
POST   /api/share/location-note/:id   // Set visibility cho location note
POST   /api/share/journey/:id         // Set visibility cho journey
POST   /api/share/media/:id           // Set visibility cho media
GET    /api/share/settings            // Lấy default share settings

// View shared content
GET    /api/friends/location-notes    // Lấy location notes của bạn bè
GET    /api/friends/journeys          // Lấy journeys của bạn bè
GET    /api/friends/:id/content       // Lấy nội dung của 1 bạn cụ thể
```

---

## 🎨 UI/UX Components

### 1. Friends Page (`/friends`)

**Layout:**

```
┌─────────────────────────────────────┐
│ 🔍 Search Friends     [+ Add Friend]│
├─────────────────────────────────────┤
│ 📬 Friend Requests (3)              │
│   - User A wants to connect         │
│   - User B wants to connect         │
├─────────────────────────────────────┤
│ 👥 My Friends (24)                  │
│   [All] [Recent] [Active]           │
│   ┌──────────┬──────────┬─────────┐│
│   │ Avatar   │ Avatar   │ Avatar  ││
│   │ User C   │ User D   │ User E  ││
│   │ 45 notes │ 28 notes │ 67 notes││
│   └──────────┴──────────┴─────────┘│
└─────────────────────────────────────┘
```

**Features:**

- Tab switching: All Friends, Requests, Suggestions
- Friend search với autocomplete
- Badge notification cho requests
- Grid/List view toggle

### 2. Friends Map Layer

**Features:**

- Toggle "Show Friends' Location Notes" trên map
- Filter by specific friend
- Different marker color cho friend's location notes
- Popup hiển thị: "Shared by [Friend Name]"
- Action: "Add to My Favorites"

### 3. Feed Page (`/feed`)

**Layout:**

```
┌─────────────────────────────────────┐
│ Friends Activity Feed               │
│ [All] [Notes] [Journeys] [Photos]  │
├─────────────────────────────────────┤
│ 📍 User A added "Cafe X"           │
│    2 hours ago                      │
│    [Map Preview]                    │
│    ❤️ 5  👍 3  🔥 2                 │
├─────────────────────────────────────┤
│ 🗺️ User B created "Weekend Trip"   │
│    5 hours ago                      │
│    [Journey Preview]                │
│    ❤️ 12  😊 8                      │
└─────────────────────────────────────┘
```

### 4. Share Settings Dialog

**Features:**

- Quick visibility toggle: 🔒 Private | 👥 Friends | 🌍 Public
- "Share with specific friends" option
- Friend selector với search
- Default sharing preference setting

### 5. Recommendation Dialog

**Features:**

- "Recommend to Friend" button trên location note detail
- Friend selector (multi-select)
- Optional message field
- Preview of location note được recommend

---

## 🔐 Privacy & Security

### Privacy Controls

1. **Default Visibility Settings**
    - User có thể set default visibility cho: Location Notes, Journeys, Media
    - Options: Private (default), Friends, Public

2. **Granular Sharing**
    - Mỗi content item có thể override default setting
    - Selected friends sharing cho sensitive content

3. **Friend List Privacy**
    - Option ẩn friend list khỏi người khác
    - Chỉ mutual friends mới thấy friend list

4. **Block Feature**
    - Block user để prevent friend request
    - Blocked users không thấy public content

### Security Measures

1. **Rate Limiting**
    - Limit friend requests: 10/day
    - Limit recommendations: 20/day
    - Comment/reaction rate limits

2. **Spam Prevention**
    - Cannot resend rejected friend request trong 30 ngày
    - Auto-block sau 5 rejected requests liên tiếp

3. **Content Moderation**
    - Report inappropriate comments/recommendations
    - Admin review system

---

## 📱 Implementation Plan

### Phase 1: Core Friend System (Week 1-2)

- [ ] Database migrations cho Friendship table
- [ ] Friend request API endpoints
- [ ] Friends list page UI
- [ ] Friend search functionality
- [ ] Accept/Reject/Remove friend actions

### Phase 2: Content Sharing (Week 3-4)

- [ ] Visibility settings cho Location Notes
- [ ] Visibility settings cho Journeys
- [ ] Friend content API endpoints
- [ ] Friends' Location Notes map layer
- [ ] Friend share settings UI

### Phase 3: Social Features (Week 5-6)

- [ ] Reaction system
- [ ] Activity feed
- [ ] Friend profile page
- [ ] Notifications for interactions

### Phase 4: Advanced Features (Week 7-8)

- [ ] Recommendation system
- [ ] Feed filtering & sorting
- [ ] Privacy settings page
- [ ] Block/Report features
- [ ] Journey duplicate from friends

---

## 🚀 Nice-to-Have Features

### 1. Friend Suggestions (Smart Recommendations)

- Gợi ý kết bạn dựa trên:
    - Mutual friends
    - Similar taste (location notes favorited)
    - Same areas visited
    - Common journeys

### 2. Collaborative Features

- **Collaborative Journeys**: Multiple friends cùng edit 1 journey
- **Group Trips**: Extension của Group feature với friends
- **Shared Albums**: Tạo album ảnh chung với friends

### 3. Gamification

- **Badges**: "Explorer" (visited 50 locations), "Social Butterfly" (20 friends)
- **Leaderboards**: Most active explorers among friends
- **Challenges**: "Visit 10 new cafes this month" với friends

### 4. Enhanced Discovery

- **Similar Taste**: "Friends with similar taste"
- **Explore Together**: Location notes mà bạn và friend chưa ai đi
- **Friend Heatmap**: Visualize areas friends thường đi

### 5. Social Proof

- "10 of your friends have been here"
- "5 friends shared this location"
- Rating aggregation từ friends

### 6. Chat/Messaging (Optional)

- Direct messaging với friends
- Share location notes/journeys qua chat
- Group chats cho planning trips

### 7. Stories Feature

- 24-hour temporary posts
- Share quick updates về location notes
- View friends' stories on map

### 8. Travel Plans Sharing

- Share planned future trips
- Friends có thể join hoặc suggest location notes
- Calendar integration

### 9. Friend Collections

- Curate themed collections và share với friends
- "Best Coffee Spots in Hanoi" collection
- Collaborative collections

### 10. Privacy Zones

- Set "không hiển thị" zones (home, work)
- Blur exact locations nếu cần
- Time-based visibility (chia sẻ sau khi về)

---

## ⚠️ Considerations & Edge Cases

### 1. Performance

- Paginate friend lists (50 per page)
- Lazy load activity feed
- Cache friend relationships
- Index optimization cho queries

### 2. Scale

- Consider NoSQL cho activity feed nếu scale lớn
- CDN cho friend avatars
- Background jobs cho notifications

### 3. User Experience

- Empty states: "No friends yet", "No activity"
- Loading states cho all async operations
- Error handling: Network errors, permission denied
- Offline support: Cache friend list

### 4. Data Migration

- Existing content default to Private
- Migration script cập nhật visibility
- Notify users về new privacy settings

### 5. Legal/GDPR

- User consent cho data sharing
- Right to delete: Remove all friend data
- Export friend data option
- Clear privacy policy

---

## 📊 Success Metrics

### User Engagement

- % users có ít nhất 1 friend
- Average friends per user
- Daily/Weekly active friend interactions
- Friend content views vs own content

### Social Virality

- Friend requests sent/accepted rate
- Content share rate
- Comments & reactions per post
- Recommendations sent/accepted

### Retention

- Return rate sau khi add friends
- Friend-driven discovery (clicks on friend content)
- Time spent on feed vs map

---

## 🎯 Conclusion

Feature Friend sẽ transform Hanoi Plan App từ một personal planning tool thành một **social discovery platform**. Người dùng không chỉ plan cho riêng mình mà còn học hỏi và khám phá qua trải nghiệm của bạn bè, tạo nên một community gắn kết và hữu ích.

**Key Differentiators:**

- Privacy-first: Granular control over sharing
- Context-aware: Chia sẻ trong context of location notes & journeys
- Discovery-focused: Easier to find good locations qua trusted friends
- Community-building: Not just social, but helpful & practical
- Simple interactions: Focus on reactions, không có comment complexity
