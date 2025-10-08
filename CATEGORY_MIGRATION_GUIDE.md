# Migration Guide: Chuyển đổi từ CategoryType enum sang Category table

## Bước 1: Generate Prisma client mới

```bash
npx prisma generate
```

## Bước 2: Tạo migration

```bash
npx prisma migrate dev --name "convert-category-enum-to-table"
```

## Bước 3: Chạy migration script (nếu cần thiết)

Nếu bạn có data existing, chạy script migration:

```bash
psql $DATABASE_URL -f prisma/migrations/migrate-to-category-table.sql
```

## Bước 4: Seed default categories

```bash
npx tsx prisma/seed-categories.ts
```

## Bước 5: Update code sử dụng categories

### Query categories cho user:

```typescript
import { getUserCategories } from "./prisma/seed-categories";

// Lấy tất cả categories (system + user custom)
const categories = await getUserCategories(userId);
```

### Tạo custom category cho user:

```typescript
const newCategory = await prisma.category.create({
  data: {
    name: "Shopping",
    slug: "shopping",
    icon: "🛍️",
    color: "#FF69B4",
    userId: userId,
  },
});
```

### Query places với category:

```typescript
const places = await prisma.place.findMany({
  include: {
    category: true, // Include category info
  },
  where: {
    category: {
      userId: {
        in: [userId, null], // User categories hoặc system defaults
      },
      isActive: true,
    },
  },
});
```

## Bước 6: Update UI components

Cập nhật các components sử dụng categories để hiển thị:

- Category name, icon, color
- Phân biệt system vs custom categories
- Cho phép user tạo/edit custom categories

## Lưu ý quan trọng:

1. **Backup database** trước khi chạy migration
2. Test thoroughly trên development environment trước
3. User mới sẽ có empty categories list, cần tạo copy từ system defaults
4. Consider adding validation để prevent duplicate category names per user
