-- Migration script để chuyển đổi từ CategoryType enum sang Category table
-- Chạy script này sau khi đã apply schema changes

BEGIN;

-- 1. Tạo system default categories từ enum cũ
INSERT INTO "categories" (id, name, slug, "is_default", "user_id", "is_active", "created_at") VALUES
  (gen_random_uuid(), 'Cafe', 'cafe', true, null, true, now()),
  (gen_random_uuid(), 'Food', 'food', true, null, true, now()),
  (gen_random_uuid(), 'Bar', 'bar', true, null, true, now()),
  (gen_random_uuid(), 'Rooftop', 'rooftop', true, null, true, now()),
  (gen_random_uuid(), 'Activity', 'activity', true, null, true, now()),
  (gen_random_uuid(), 'Landmark', 'landmark', true, null, true, now());

-- 2. Thêm temporary column để migrate data
ALTER TABLE "places" ADD COLUMN "category_id_temp" VARCHAR;

-- 3. Update places để map category enum sang categoryId
UPDATE "places" SET "category_id_temp" = (
  SELECT id FROM "categories" 
  WHERE slug = "places".category::text 
  AND "user_id" IS NULL
);

-- 4. Copy data từ temp column sang categoryId column
UPDATE "places" SET "category_id" = "category_id_temp";

-- 5. Remove temporary column
ALTER TABLE "places" DROP COLUMN "category_id_temp";

-- 6. Drop old category column và enum (sau khi đã update schema)
-- ALTER TABLE "places" DROP COLUMN "category";
-- DROP TYPE "CategoryType";

COMMIT;