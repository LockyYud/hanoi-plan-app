-- CreateEnum
CREATE TYPE "public"."MediaType" AS ENUM ('image', 'video');

-- AlterTable
ALTER TABLE "public"."media" ADD COLUMN     "is_active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "type" "public"."MediaType" NOT NULL DEFAULT 'image';

-- CreateIndex
CREATE INDEX "media_place_id_is_active_idx" ON "public"."media"("place_id", "is_active");

-- CreateIndex
CREATE INDEX "media_created_at_idx" ON "public"."media"("created_at");
