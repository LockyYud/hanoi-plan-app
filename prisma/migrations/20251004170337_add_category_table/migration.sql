-- AlterTable
ALTER TABLE "public"."places" ADD COLUMN     "category_id" TEXT;

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "user_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "categories_user_id_is_active_idx" ON "public"."categories"("user_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_user_id_key" ON "public"."categories"("slug", "user_id");

-- CreateIndex
CREATE INDEX "places_category_id_idx" ON "public"."places"("category_id");

-- AddForeignKey
ALTER TABLE "public"."categories" ADD CONSTRAINT "categories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."places" ADD CONSTRAINT "places_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
