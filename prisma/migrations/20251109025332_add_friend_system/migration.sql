-- CreateEnum
CREATE TYPE "public"."ShareVisibility" AS ENUM ('private', 'friends', 'selected_friends', 'public');

-- CreateEnum
CREATE TYPE "public"."FriendshipStatus" AS ENUM ('pending', 'accepted', 'blocked');

-- CreateEnum
CREATE TYPE "public"."ReactionType" AS ENUM ('love', 'like', 'wow', 'smile', 'fire');

-- CreateEnum
CREATE TYPE "public"."RecommendationStatus" AS ENUM ('pending', 'accepted', 'dismissed');

-- AlterTable
ALTER TABLE "public"."journeys" ADD COLUMN     "visibility" "public"."ShareVisibility" NOT NULL DEFAULT 'private';

-- CreateTable
CREATE TABLE "public"."location_notes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "rating" INTEGER,
    "note" TEXT,
    "visibility" "public"."ShareVisibility" NOT NULL DEFAULT 'private',
    "visit_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "location_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."friendships" (
    "id" TEXT NOT NULL,
    "requester_id" TEXT NOT NULL,
    "addressee_id" TEXT NOT NULL,
    "status" "public"."FriendshipStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."friend_shares" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "visibility" "public"."ShareVisibility" NOT NULL DEFAULT 'private',
    "shared_with" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."reactions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "content_id" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "type" "public"."ReactionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recommendations" (
    "id" TEXT NOT NULL,
    "from_user_id" TEXT NOT NULL,
    "to_user_id" TEXT NOT NULL,
    "location_note_id" TEXT NOT NULL,
    "message" TEXT,
    "status" "public"."RecommendationStatus" NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "location_notes_user_id_visibility_idx" ON "public"."location_notes"("user_id", "visibility");

-- CreateIndex
CREATE INDEX "location_notes_place_id_idx" ON "public"."location_notes"("place_id");

-- CreateIndex
CREATE UNIQUE INDEX "location_notes_user_id_place_id_key" ON "public"."location_notes"("user_id", "place_id");

-- CreateIndex
CREATE INDEX "friendships_requester_id_status_idx" ON "public"."friendships"("requester_id", "status");

-- CreateIndex
CREATE INDEX "friendships_addressee_id_status_idx" ON "public"."friendships"("addressee_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "friendships_requester_id_addressee_id_key" ON "public"."friendships"("requester_id", "addressee_id");

-- CreateIndex
CREATE INDEX "friend_shares_user_id_content_type_idx" ON "public"."friend_shares"("user_id", "content_type");

-- CreateIndex
CREATE INDEX "friend_shares_content_id_content_type_idx" ON "public"."friend_shares"("content_id", "content_type");

-- CreateIndex
CREATE UNIQUE INDEX "friend_shares_user_id_content_id_content_type_key" ON "public"."friend_shares"("user_id", "content_id", "content_type");

-- CreateIndex
CREATE INDEX "reactions_content_id_content_type_idx" ON "public"."reactions"("content_id", "content_type");

-- CreateIndex
CREATE UNIQUE INDEX "reactions_user_id_content_id_content_type_key" ON "public"."reactions"("user_id", "content_id", "content_type");

-- CreateIndex
CREATE INDEX "recommendations_to_user_id_status_idx" ON "public"."recommendations"("to_user_id", "status");

-- CreateIndex
CREATE INDEX "recommendations_from_user_id_idx" ON "public"."recommendations"("from_user_id");

-- CreateIndex
CREATE INDEX "journeys_user_id_visibility_idx" ON "public"."journeys"("user_id", "visibility");

-- AddForeignKey
ALTER TABLE "public"."location_notes" ADD CONSTRAINT "location_notes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."location_notes" ADD CONSTRAINT "location_notes_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friendships" ADD CONSTRAINT "friendships_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friendships" ADD CONSTRAINT "friendships_addressee_id_fkey" FOREIGN KEY ("addressee_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friend_shares" ADD CONSTRAINT "friend_shares_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."reactions" ADD CONSTRAINT "reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recommendations" ADD CONSTRAINT "recommendations_from_user_id_fkey" FOREIGN KEY ("from_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recommendations" ADD CONSTRAINT "recommendations_to_user_id_fkey" FOREIGN KEY ("to_user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."recommendations" ADD CONSTRAINT "recommendations_location_note_id_fkey" FOREIGN KEY ("location_note_id") REFERENCES "public"."location_notes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
