-- CreateTable
CREATE TABLE "public"."friend_invitations" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "invite_code" TEXT NOT NULL,
    "invite_url" TEXT NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "max_usage" INTEGER,
    "expires_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."friend_invitation_acceptances" (
    "id" TEXT NOT NULL,
    "invitation_id" TEXT NOT NULL,
    "accepted_by_id" TEXT NOT NULL,
    "friendship_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "friend_invitation_acceptances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "friend_invitations_invite_code_key" ON "public"."friend_invitations"("invite_code");

-- CreateIndex
CREATE INDEX "friend_invitations_user_id_idx" ON "public"."friend_invitations"("user_id");

-- CreateIndex
CREATE INDEX "friend_invitations_invite_code_idx" ON "public"."friend_invitations"("invite_code");

-- CreateIndex
CREATE INDEX "friend_invitations_is_active_idx" ON "public"."friend_invitations"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "friend_invitation_acceptances_friendship_id_key" ON "public"."friend_invitation_acceptances"("friendship_id");

-- CreateIndex
CREATE INDEX "friend_invitation_acceptances_invitation_id_idx" ON "public"."friend_invitation_acceptances"("invitation_id");

-- CreateIndex
CREATE INDEX "friend_invitation_acceptances_accepted_by_id_idx" ON "public"."friend_invitation_acceptances"("accepted_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "friend_invitation_acceptances_invitation_id_accepted_by_id_key" ON "public"."friend_invitation_acceptances"("invitation_id", "accepted_by_id");

-- AddForeignKey
ALTER TABLE "public"."friend_invitations" ADD CONSTRAINT "friend_invitations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friend_invitation_acceptances" ADD CONSTRAINT "friend_invitation_acceptances_invitation_id_fkey" FOREIGN KEY ("invitation_id") REFERENCES "public"."friend_invitations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friend_invitation_acceptances" ADD CONSTRAINT "friend_invitation_acceptances_accepted_by_id_fkey" FOREIGN KEY ("accepted_by_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."friend_invitation_acceptances" ADD CONSTRAINT "friend_invitation_acceptances_friendship_id_fkey" FOREIGN KEY ("friendship_id") REFERENCES "public"."friendships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
