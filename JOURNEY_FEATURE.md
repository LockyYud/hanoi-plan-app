# Chức năng Hành trình (Journey)

## Tổng quan

Chức năng "Hành trình" cho phép người dùng tạo các hành trình có tổ chức từ các địa điểm đã note, tách biệt với việc đơn giản note địa điểm. Điều này giúp:

- **Tách biệt mục đích**: Note địa điểm vs. Tạo hành trình có kế hoạch
- **Linh hoạt**: Một địa điểm có thể thuộc nhiều hành trình khác nhau
- **Chủ động**: Người dùng quyết định khi nào muốn tạo hành trình từ các note

## Kiến trúc

### Database Models

#### Journey

```prisma
model Journey {
  id          String    @id @default(cuid())
  title       String
  description String?
  userId      String
  startDate   DateTime?
  endDate     DateTime?
  coverImage  String?
  isPublic    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user  User          @relation(...)
  stops JourneyStop[]
}
```

#### JourneyStop

```prisma
model JourneyStop {
  id        String   @id @default(cuid())
  journeyId String
  placeId   String
  sequence  Int      // Thứ tự trong hành trình
  note      String?  // Ghi chú riêng cho stop này

  journey Journey @relation(...)
  place   Place   @relation(...)

  @@unique([journeyId, sequence])
}
```

### Sự khác biệt: Location Notes vs Journeys

| Đặc điểm    | Location Notes        | Journeys                   |
| ----------- | --------------------- | -------------------------- |
| Mục đích    | Note nhanh địa điểm   | Tạo hành trình có kế hoạch |
| Cấu trúc    | Độc lập, không thứ tự | Có thứ tự, liên kết        |
| Quan hệ     | 1 note = 1 place      | 1 journey = n places       |
| Thời gian   | Timestamp tự động     | Có start/end date          |
| Sử dụng lại | Không                 | Có - 1 place → n journeys  |

## Tính năng

### 1. Tạo Hành trình

#### Thông tin cơ bản

- **Tên hành trình** (required): "Hà Nội - Tuần 1"
- **Mô tả** (optional): Mô tả ngắn về hành trình
- **Ngày bắt đầu/kết thúc** (optional): Khoảng thời gian

#### Chọn địa điểm

- Hiển thị tất cả location notes đã tạo
- Click để thêm/bỏ địa điểm
- Visual feedback: Highlight địa điểm đã chọn

#### Sắp xếp thứ tự

- Drag & drop để sắp xếp lại
- Nút up/down cho mỗi điểm
- Hiển thị số thứ tự rõ ràng

### 2. Xem danh sách Hành trình

#### Journey Card

- Cover image (từ điểm đầu tiên hoặc tự chọn)
- Tên và mô tả
- Số lượng địa điểm
- Khoảng thời gian (nếu có)
- Action buttons:
    - **Xem trên map**: Hiển thị route trên bản đồ
    - **Xem chi tiết**: Mở dialog chi tiết
    - **Chỉnh sửa**: Mở dialog chỉnh sửa
    - **Xóa**: Xóa hành trình

### 3. Hiển thị trên Map

#### Route Visualization

- Tái sử dụng `RouteDisplay` component từ Memory Lane
- Polyline nối các điểm theo thứ tự trong journey
- Markers có số thứ tự
- Màu sắc phân biệt:
    - Điểm đầu: Xanh lá
    - Điểm giữa: Cam
    - Điểm cuối: Đỏ

#### Journey Info Panel

- Tên hành trình
- Tổng số điểm
- Tổng quãng đường
- Thời gian (nếu có)

### 4. Tab trong Sidebar

#### Cấu trúc mới

```
📍 Địa điểm      (Location Notes - note nhanh)
🗺️  Hành trình    (Journeys - có kế hoạch) ← NEW
👤 Cá nhân       (Profile)
```

#### Journey Tab

- Danh sách journey cards
- Nút "Tạo hành trình mới"
- Empty state khi chưa có journey
- Loading states

## Flow sử dụng

### Scenario 1: Note địa điểm đơn giản

```
1. Click vào map → Popup hiện
2. "Thêm ghi chú" → LocationNoteForm
3. Nhập nhanh → Lưu
→ Xuất hiện trong tab "Địa điểm"
```

### Scenario 2: Tạo hành trình từ notes

```
1. Đã có nhiều location notes
2. Vào tab "Hành trình"
3. Click "Tạo hành trình mới"
4. Chọn địa điểm từ danh sách notes
5. Sắp xếp thứ tự
6. Thêm thông tin (tên, mô tả, ngày tháng)
7. Lưu
→ Journey mới xuất hiện trong tab
```

### Scenario 3: Xem hành trình trên map

```
1. Trong tab "Hành trình"
2. Click "Xem trên map" ở journey card
3. Map tự động:
   - Vẽ route nối các điểm
   - Fit bounds để hiển thị toàn bộ
   - Hiển thị info panel
→ Người dùng có thể zoom, pan, click markers
```

## API Endpoints

### GET /api/journeys

Lấy tất cả journeys của user hiện tại

**Response:**

```json
[
  {
    "id": "...",
    "title": "Hà Nội - Tuần 1",
    "description": "Khám phá phố cổ",
    "startDate": "2025-01-20",
    "endDate": "2025-01-27",
    "stops": [
      {
        "id": "...",
        "sequence": 0,
        "place": {
          "id": "...",
          "name": "...",
          "address": "...",
          "lat": 21.028,
          "lng": 105.854,
          "media": [...]
        }
      }
    ]
  }
]
```

### POST /api/journeys

Tạo journey mới

**Request:**

```json
{
    "title": "Hà Nội - Tuần 1",
    "description": "Khám phá phố cổ",
    "startDate": "2025-01-20",
    "endDate": "2025-01-27",
    "placeIds": ["place1", "place2", "place3"]
}
```

### PUT /api/journeys

Cập nhật journey

**Request:**

```json
{
    "id": "journey_id",
    "title": "...",
    "description": "...",
    "placeIds": ["place1", "place3", "place2"] // new order
}
```

### DELETE /api/journeys?id=...

Xóa journey

## Components

### Mới tạo

- `src/components/journey/journey-card.tsx`
- `src/components/journey/create-journey-dialog.tsx`
- `src/app/api/journeys/route.ts`

### Tái sử dụng

- `RouteDisplay` (từ Memory Lane)
- `LocationNote` type và API

### Cập nhật

- `sidebar.tsx`: Thêm tab "Hành trình"
- `types.ts`: Thêm Journey và JourneyStop types
- `schema.prisma`: Thêm Journey và JourneyStop models

## Migration

### 1. Database Migration

```bash
npx prisma migrate dev --name add_journey_model
```

### 2. Generate Prisma Client

```bash
npx prisma generate
```

## UX Benefits

### Trước (chỉ có Memory Lane)

- ❌ Khó phân biệt note thường và hành trình
- ❌ Phải filter theo thời gian mới thấy route
- ❌ Không quản lý được nhiều hành trình
- ❌ Không linh hoạt sắp xếp

### Sau (có Journey riêng)

- ✅ Rõ ràng: Note vs Journey
- ✅ Chủ động: Tạo journey khi muốn
- ✅ Linh hoạt: Nhiều journey từ cùng notes
- ✅ Có tổ chức: Quản lý danh sách journeys
- ✅ Tái sử dụng: 1 note → nhiều journeys

## Future Enhancements

1. **Share Journey**: Chia sẻ journey với link public
2. **Journey Templates**: Lưu journey làm template
3. **Collaborative Journey**: Nhiều người cùng tạo
4. **Journey Statistics**: Chi tiết hơn về hành trình
5. **Export Journey**: Xuất ra GPX/KML
6. **Journey Photos**: Gallery ảnh từ tất cả stops
7. **Journey Budget**: Theo dõi chi phí
8. **Journey Notes**: Nhật ký hành trình
9. **Journey Comparison**: So sánh các journeys
10. **Journey Recommendations**: Gợi ý dựa trên preferences

## Best Practices

### Khi nào dùng Location Notes?

- Note nhanh địa điểm thú vị
- Lưu địa chỉ để ghé sau
- Đánh dấu nơi đã đến
- Chưa rõ sẽ tạo hành trình nào

### Khi nào tạo Journey?

- Có kế hoạch cụ thể
- Muốn tạo lộ trình rõ ràng
- Cần quản lý nhiều hành trình
- Muốn chia sẻ với người khác
- Lưu lại kỷ niệm có tổ chức

## Notes

- Journey không thay thế Memory Lane, mà bổ sung
- Memory Lane vẫn hữu ích để xem lại theo thời gian
- Journey cho phép chủ động hơn trong việc tổ chức
- Một địa điểm có thể vừa là location note, vừa trong nhiều journeys

