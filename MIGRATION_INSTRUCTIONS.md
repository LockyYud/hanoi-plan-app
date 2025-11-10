# Migration Instructions: Merge LocationNotes into Places

## ⚠️ QUAN TRỌNG - ĐỌC KỸ TRƯỚC KHI THỰC HIỆN

Hệ thống đã được refactor để hợp nhất bảng `location_notes` vào bảng `places`. Dưới đây là các bước để migrate database.

## Bước 1: Backup Database (BẮT BUỘC)

```bash
# Nếu dùng PostgreSQL
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Hoặc nếu dùng Neon, export qua dashboard
```

## Bước 2: Kiểm tra Schema hiện tại

```bash
npx prisma db pull
```

## Bước 3: Chạy Migration SQL

### Option A: Migration tự động (Khuyến nghị cho development)

```bash
# Generate migration file
npx prisma migrate dev --name merge_location_notes_to_places
```

### Option B: Migration thủ công (Khuyến nghị cho production)

Chạy file SQL đã được tạo sẵn:

```bash
psql $DATABASE_URL < prisma/migrations/merge_location_notes_to_places.sql
```

Hoặc copy nội dung file và chạy trực tiếp trong database console.

## Bước 4: Verify Migration

```sql
-- Kiểm tra cấu trúc bảng places
\d places

-- Kiểm tra dữ liệu đã migrate
SELECT id, name, rating, note, visibility, visit_date
FROM places
WHERE rating IS NOT NULL OR note IS NOT NULL
LIMIT 10;

-- Kiểm tra recommendations
SELECT id, place_id FROM recommendations LIMIT 10;
```

## Bước 5: Generate Prisma Client

```bash
npx prisma generate
```

## Bước 6: Test Application

```bash
# Start development server
npm run dev

# Test các chức năng:
# - Tạo location note mới
# - Xem location notes của friends
# - Upload image
# - Recommendations
```

## Rollback Plan (Nếu có vấn đề)

```bash
# Restore từ backup
psql $DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql

# Revert git changes
git checkout prisma/schema.prisma
git checkout src/

# Regenerate Prisma client
npx prisma generate
```

## Các Thay Đổi Chính

### Database

- ✅ Bảng `places` có thêm: `rating`, `note`, `visibility`, `visit_date`, `updated_at`
- ✅ Bảng `recommendations` đổi từ `location_note_id` → `place_id`
- ✅ Bảng `location_notes` sẽ được drop (sau khi verify)

### API

- ✅ `/api/location-notes` vẫn hoạt động (backward compatible)
- ✅ Upload image chấp nhận cả `placeId` và `noteId`

### Frontend

- ✅ LocationNote type giờ là alias của Place
- ✅ Components tự động hoạt động với type mới

## Lưu Ý

1. **Không drop bảng `location_notes` ngay lập tức**
    - Giữ lại bảng cũ 1-2 tuần để verify
    - Uncomment dòng `DROP TABLE` trong migration script khi đã chắc chắn

2. **Lỗi TypeScript**
    - Một số lỗi về Prisma types sẽ biến mất sau khi chạy `npx prisma generate`
    - Nếu vẫn còn lỗi, restart TypeScript server trong VS Code

3. **Production Deployment**
    - Test kỹ trên staging trước
    - Chạy migration trong maintenance window
    - Có kế hoạch rollback

## Câu Hỏi Thường Gặp

### Q: Migration có ảnh hưởng đến data hiện có?

A: Không, data sẽ được preserve. Migration script chỉ thêm cột và copy data.

### Q: Phải downtime không?

A: Không cần downtime. Migration có thể chạy trong khi app đang chạy.

### Q: Làm sao biết migration thành công?

A: Chạy các query verify ở Bước 4, và test các chức năng cơ bản.

### Q: Frontend components có cần update?

A: Không, đa số components vẫn hoạt động do backward compatibility.

## Support

Nếu gặp vấn đề trong quá trình migration:

1. Check file `LOCATION_NOTES_PLACES_MERGE.md` để hiểu chi tiết về thay đổi
2. Xem migration script: `prisma/migrations/merge_location_notes_to_places.sql`
3. Rollback theo hướng dẫn trên và báo cáo issue
