# LocationNotes và Places Table Merge

## Tổng quan

Đã hợp nhất hai bảng `location_notes` và `places` thành một bảng duy nhất `places` để loại bỏ sự nhầm lẫn và trùng lặp chức năng.

## Thay đổi Database Schema

### Place Model (Đã cập nhật)

Bảng `places` giờ đây bao gồm tất cả các trường từ `location_notes`:

- Thêm: `rating`, `note`, `visibility`, `visitDate`, `updatedAt`
- Các trường này lưu thông tin cá nhân của user về địa điểm

### LocationNote Model (Đã xóa)

- Bảng `location_notes` đã bị xóa khỏi schema
- Dữ liệu sẽ được migrate vào bảng `places`

### Recommendation Model (Đã cập nhật)

- Thay đổi từ `locationNoteId` → `placeId`
- Foreign key giờ trỏ trực tiếp đến bảng `places`

## Migration Script

File: `prisma/migrations/merge_location_notes_to_places.sql`

Script này thực hiện:

1. Thêm các cột mới vào bảng `places`
2. Migrate dữ liệu từ `location_notes` sang `places`
3. Cập nhật bảng `recommendations` để tham chiếu `places`
4. Tạo indexes mới
5. (Optional) Drop bảng `location_notes` cũ

## Thay đổi API

### `/api/location-notes` (Đã cập nhật)

- **GET**: Trả về places với notes thay vì location_notes
- **POST**: Tạo/cập nhật place với note fields
- Giữ nguyên endpoint để backward compatibility

### `/api/location-notes/[id]` (Đã cập nhật)

- **GET**: Lấy place theo ID
- **PATCH**: Cập nhật place
- **DELETE**: Xóa place

### `/api/feed` (Đã cập nhật)

- Fetch places thay vì location_notes
- Vẫn trả về type "location_note" cho compatibility

### `/api/upload-image` (Đã cập nhật)

- Chấp nhận `placeId` thay vì `noteId`
- Vẫn hỗ trợ `noteId` cho backward compatibility

## Thay đổi Type Definitions

### `src/lib/types.ts`

- `Place` interface: Thêm các trường note (`rating`, `note`, `visibility`, `visitDate`, `updatedAt`, `creator`)
- `LocationNote`: Giờ là type alias của `Place` (để backward compatibility)
- `Recommendation`: Thay đổi từ `locationNote` → `place`

## Thay đổi Components

### Đã cập nhật:

- `friend-location-popup.tsx`: Sử dụng Place thay vì LocationNote
- Các component khác: LocationNote giờ chỉ là alias của Place

## Backward Compatibility

- API endpoint `/api/location-notes` vẫn hoạt động
- Type `LocationNote` vẫn tồn tại như type alias
- Upload image vẫn chấp nhận cả `noteId` và `placeId`

## Cách chạy Migration

1. Backup database trước:

```bash
pg_dump $DATABASE_URL > backup.sql
```

2. Chạy migration script:

```bash
psql $DATABASE_URL < prisma/migrations/merge_location_notes_to_places.sql
```

3. Generate Prisma client mới:

```bash
npx prisma generate
```

4. (Optional) Verify dữ liệu đã migrate đúng rồi mới uncomment dòng DROP TABLE

## Lợi ích

1. **Đơn giản hóa**: Chỉ còn một bảng thay vì hai bảng chồng chéo
2. **Rõ ràng**: Không còn nhầm lẫn giữa Place và LocationNote
3. **Hiệu quả**: Ít joins, queries đơn giản hơn
4. **Dễ bảo trì**: Logic rõ ràng, dễ hiểu hơn

## Breaking Changes

Không có breaking changes lớn vì:

- API endpoints giữ nguyên
- Type definitions có backward compatibility
- Components tự động hoạt động với type alias
