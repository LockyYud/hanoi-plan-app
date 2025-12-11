import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    isShareExpired,
    determineShareAccess,
    isValidShareSlug,
} from "@/lib/share-utils";

/**
 * GET /api/pinory/share/[slug]
 * Fetch shared pinory data by share slug
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // 0. Check database connection
        if (!prisma) {
            return NextResponse.json(
                { error: "Database unavailable" },
                { status: 503 }
            );
        }

        // 1. Validate slug format
        if (!isValidShareSlug(slug)) {
            return NextResponse.json(
                { error: "Invalid share link format" },
                { status: 400 }
            );
        }

        // 2. Get session (optional - anonymous users can view public shares)
        const session = await getServerSession(authOptions);
        const viewerUserId = session?.user?.id;

        // 3. Find share record
        const share = await prisma.pinoryShare.findUnique({
            where: { shareSlug: slug },
            include: {
                place: {
                    include: {
                        media: {
                            where: { isActive: true },
                            orderBy: { createdAt: "asc" },
                        },
                        categoryModel: true,
                        creator: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });

        if (!share) {
            return NextResponse.json(
                { error: "Share link not found" },
                { status: 404 }
            );
        }

        // 4. Check if share is active (not revoked)
        if (!share.isActive) {
            return NextResponse.json(
                {
                    error: "Share link has been revoked",
                    canView: false,
                    reason: "This share link has been revoked by the owner",
                },
                { status: 410 } // 410 Gone
            );
        }

        // 5. Check if expired
        const expired = isShareExpired(share.expiresAt);

        // 6. Check friendship status if viewer is logged in
        let friendshipStatus = null;
        if (viewerUserId && viewerUserId !== share.place.createdBy) {
            const friendship = await prisma.friendship.findFirst({
                where: {
                    OR: [
                        {
                            requesterId: viewerUserId,
                            addresseeId: share.place.createdBy,
                        },
                        {
                            requesterId: share.place.createdBy,
                            addresseeId: viewerUserId,
                        },
                    ],
                },
                select: { status: true },
            });
            friendshipStatus = friendship?.status || null;
        }

        // 7. Determine access
        const accessInfo = determineShareAccess({
            shareVisibility: share.visibility,
            viewerUserId,
            ownerUserId: share.place.createdBy,
            friendshipStatus,
            isExpired: expired,
        });

        if (!accessInfo.canView) {
            return NextResponse.json(
                {
                    error: "Access denied",
                    reason: accessInfo.reason,
                    canView: false,
                },
                { status: 403 }
            );
        }

        // 8. Increment view count (only once per session, not for owner)
        if (viewerUserId !== share.place.createdBy) {
            // In production, you might want to use Redis or similar to track unique views
            await prisma.pinoryShare.update({
                where: { id: share.id },
                data: {
                    viewCount: {
                        increment: 1,
                    },
                },
            });
        }

        // 9. Transform place data to Pinory format
        const pinory = {
            id: share.place.id,
            name: share.place.name,
            address: share.place.address,
            ward: share.place.ward,
            district: share.place.district,
            lat: share.place.lat,
            lng: share.place.lng,
            priceLevel: share.place.priceLevel,
            category: share.place.category,
            categoryName: share.place.categoryModel?.name,
            categorySlug: share.place.categoryModel?.slug,
            phone: share.place.phone,
            website: share.place.website,
            rating: share.place.rating,
            note: share.place.note,
            visitDate: share.place.visitDate,
            createdAt: share.place.createdAt,
            updatedAt: share.place.updatedAt,
            images: share.place.media.map((m) => m.url),
            media: share.place.media,
            creator: share.place.creator,
            visibility: share.place.visibility,
        };

        // 10. Return share data
        return NextResponse.json({
            canView: true,
            viewType: accessInfo.viewType,
            pinory,
            shareInfo: {
                shareSlug: share.shareSlug,
                visibility: share.visibility,
                viewCount: share.viewCount + 1, // Include the current view
                createdAt: share.createdAt,
                expiresAt: share.expiresAt,
            },
        });
    } catch (error) {
        console.error("❌ Error fetching shared pinory:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * PATCH /api/pinory/share/[slug]
 * Revoke or update a share
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        // Check database connection
        if (!prisma) {
            return NextResponse.json(
                { error: "Database unavailable" },
                { status: 503 }
            );
        }

        // Authentication check
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { action } = body; // "revoke" or future: "update_visibility"

        // Find share and verify ownership
        const share = await prisma.pinoryShare.findUnique({
            where: { shareSlug: slug },
            include: {
                place: {
                    select: {
                        createdBy: true,
                    },
                },
            },
        });

        if (!share) {
            return NextResponse.json(
                { error: "Share not found" },
                { status: 404 }
            );
        }

        // Verify user owns the pinory
        if (share.place.createdBy !== session.user.id) {
            return NextResponse.json(
                { error: "You can only manage your own shares" },
                { status: 403 }
            );
        }

        // Handle revoke action
        if (action === "revoke") {
            const updatedShare = await prisma.pinoryShare.update({
                where: { shareSlug: slug },
                data: {
                    isActive: false,
                    revokedAt: new Date(),
                },
            });

            return NextResponse.json({
                success: true,
                message: "Share revoked successfully",
                share: {
                    shareSlug: updatedShare.shareSlug,
                    isActive: updatedShare.isActive,
                    revokedAt: updatedShare.revokedAt,
                },
            });
        }

        return NextResponse.json(
            { error: "Invalid action" },
            { status: 400 }
        );
    } catch (error) {
        console.error("❌ Error updating share:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/pinory/share/[slug]
 * Permanently delete a share (hard delete)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;

        if (!prisma) {
            return NextResponse.json(
                { error: "Database unavailable" },
                { status: 503 }
            );
        }

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Find share and verify ownership
        const share = await prisma.pinoryShare.findUnique({
            where: { shareSlug: slug },
            include: {
                place: {
                    select: {
                        createdBy: true,
                    },
                },
            },
        });

        if (!share) {
            return NextResponse.json(
                { error: "Share not found" },
                { status: 404 }
            );
        }

        if (share.place.createdBy !== session.user.id) {
            return NextResponse.json(
                { error: "You can only delete your own shares" },
                { status: 403 }
            );
        }

        // Hard delete
        await prisma.pinoryShare.delete({
            where: { shareSlug: slug },
        });

        return NextResponse.json({
            success: true,
            message: "Share deleted permanently",
        });
    } catch (error) {
        console.error("❌ Error deleting share:", error);
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 }
        );
    }
}
