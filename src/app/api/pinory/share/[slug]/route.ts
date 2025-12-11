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

        // 4. Check if expired
        const expired = isShareExpired(share.expiresAt);

        // 5. Check friendship status if viewer is logged in
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

        // 6. Determine access
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

        // 7. Increment view count (only once per session, not for owner)
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

        // 8. Transform place data to Pinory format
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

        // 9. Return share data
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
