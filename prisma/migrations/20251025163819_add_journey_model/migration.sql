-- CreateTable
CREATE TABLE "public"."journeys" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "user_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "cover_image" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "journeys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."journey_stops" (
    "id" TEXT NOT NULL,
    "journey_id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "journey_stops_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "journeys_user_id_idx" ON "public"."journeys"("user_id");

-- CreateIndex
CREATE INDEX "journeys_created_at_idx" ON "public"."journeys"("created_at");

-- CreateIndex
CREATE INDEX "journey_stops_journey_id_idx" ON "public"."journey_stops"("journey_id");

-- CreateIndex
CREATE UNIQUE INDEX "journey_stops_journey_id_sequence_key" ON "public"."journey_stops"("journey_id", "sequence");

-- AddForeignKey
ALTER TABLE "public"."journeys" ADD CONSTRAINT "journeys_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journey_stops" ADD CONSTRAINT "journey_stops_journey_id_fkey" FOREIGN KEY ("journey_id") REFERENCES "public"."journeys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."journey_stops" ADD CONSTRAINT "journey_stops_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE CASCADE ON UPDATE CASCADE;
