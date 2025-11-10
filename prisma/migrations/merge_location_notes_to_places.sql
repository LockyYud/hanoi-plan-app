-- Migration to merge LocationNote into Place
-- This script merges location_notes table into places table

-- Step 1: Add new columns to places table
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "rating" INTEGER;
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "note" TEXT;
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "visibility" TEXT NOT NULL DEFAULT 'private';
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "visit_date" TIMESTAMP(3);
ALTER TABLE "places" ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Update recommendations table to reference places instead of location_notes
-- First, add the new column
ALTER TABLE "recommendations" ADD COLUMN IF NOT EXISTS "place_id" TEXT;

-- Step 3: Migrate data - update recommendations to point to places via location_notes
UPDATE "recommendations" r
SET "place_id" = ln."place_id"
FROM "location_notes" ln
WHERE r."location_note_id" = ln.id AND r."place_id" IS NULL;

-- Step 4: Make place_id NOT NULL and add foreign key
ALTER TABLE "recommendations" ALTER COLUMN "place_id" SET NOT NULL;
ALTER TABLE "recommendations" DROP CONSTRAINT IF EXISTS "recommendations_location_note_id_fkey";
ALTER TABLE "recommendations" ADD CONSTRAINT "recommendations_place_id_fkey" 
  FOREIGN KEY ("place_id") REFERENCES "places"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Step 5: Drop old column from recommendations
ALTER TABLE "recommendations" DROP COLUMN IF EXISTS "location_note_id";

-- Step 6: For places that have location notes, update them with note data
-- Note: This only works if there's a 1-1 relationship between user and place
-- If multiple users have notes on the same place, this will need manual intervention
-- For now, we'll copy the first user's note to the place
WITH first_notes AS (
  SELECT DISTINCT ON (place_id) 
    place_id, 
    rating, 
    note, 
    visibility, 
    visit_date
  FROM location_notes
  ORDER BY place_id, created_at DESC
)
UPDATE places p
SET 
  rating = fn.rating,
  note = fn.note,
  visibility = fn.visibility::text,
  visit_date = fn.visit_date
FROM first_notes fn
WHERE p.id = fn.place_id AND p.rating IS NULL;

-- Step 7: Add indexes
CREATE INDEX IF NOT EXISTS "places_created_by_visibility_idx" ON "places"("created_by", "visibility");
CREATE INDEX IF NOT EXISTS "recommendations_place_id_idx" ON "recommendations"("place_id");

-- Step 8: Drop location_notes table
-- Note: Be careful with this step! Make sure data is backed up
-- Uncomment the following line when ready:
-- DROP TABLE IF EXISTS "location_notes";

-- Note: You may want to keep location_notes table temporarily for data verification
-- before dropping it permanently.

