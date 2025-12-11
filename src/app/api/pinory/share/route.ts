import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
    generateShareSlug,
    getDefaultExpiryDate,
    formatShareUrl,
} from "@/lib/share-utils";
import { ShareVisibility } from "@prisma/client";

/**
 * Get base URL from request
 */
function getBaseUrl(request: NextRequest): string {
    // Try to get from headers first (most accurate)
    const host = request.headers.get("host");
    const protocol = request.headers.get("x-forwarded-proto") || "https";

    if (host) {
        return `${protocol}://${host}`;
    }

    // Fallback to NEXTAUTH_URL
    if (process.env.NEXTAUTH_URL) {
        return process.env.NEXTAUTH_URL;
    }

    // Last resort fallback
    return "http://localhost:3000";
}

/**
 * POST /api/pinory/share
 * Create a new share link for a pinory
 */
export async function POST(request: NextRequest) {
    try {
        // 0. Check database connection
        if (!prisma) {
            return NextResponse.json(
                { error: "Database unavailable" },
                { status: 503 }
            );
        }

        // 1. Authentication check
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized. Please sign in." },
                { status: 401 }
            );
        }

        // 2. Parse request body
        const body = await request.json();
        const { placeId, visibility, expiresAt } = body;

        if (!placeId) {
            return NextResponse.json(
                { error: "placeId is required" },
                { status: 400 }
            );
        }

        // 3. Verify place exists and user owns it
        const place = await prisma.place.findUnique({
            where: { id: placeId },
            select: {
                id: true,
                createdBy: true,
                name: true,
            },
        });

        if (!place) {
            return NextResponse.json(
                { error: "Place not found" },
                { status: 404 }
            );
        }

        if (place.createdBy !== session.user.id) {
            return NextResponse.json(
                { error: "You can only share your own pinories" },
                { status: 403 }
            );
        }

        // 4. Validate visibility
        const validVisibility: ShareVisibility =
            visibility && ["private", "friends", "selected_friends", "public"].includes(visibility)
                ? visibility
                : "friends";

        // 5. Check if active share already exists
        const existingShare = await prisma.pinoryShare.findFirst({
            where: {
                placeId: placeId,
                createdBy: session.user.id,
                isActive: true, // Only check for active shares
            },
        });

        if (existingShare) {
            // Return existing active share link with full URL
            const baseUrl = getBaseUrl(request);
            const shareUrl = formatShareUrl(existingShare.shareSlug, baseUrl);
            return NextResponse.json({
                id: existingShare.id, // Include id for revoke action
                shareSlug: existingShare.shareSlug,
                shareUrl,
                visibility: existingShare.visibility,
                expiresAt: existingShare.expiresAt,
                viewCount: existingShare.viewCount,
                isActive: existingShare.isActive,
                createdAt: existingShare.createdAt,
            });
        }

        // 6. Generate unique slug
        let shareSlug = generateShareSlug();
        let slugExists = true;
        let attempts = 0;

        // Ensure uniqueness (rare collision)
        while (slugExists && attempts < 5) {
            const existing = await prisma.pinoryShare.findUnique({
                where: { shareSlug },
            });
            if (!existing) {
                slugExists = false;
            } else {
                shareSlug = generateShareSlug();
                attempts++;
            }
        }

        if (slugExists) {
            return NextResponse.json(
                { error: "Failed to generate unique share link. Please try again." },
                { status: 500 }
            );
        }

        // 7. Create share record
        const share = await prisma.pinoryShare.create({
            data: {
                placeId: placeId,
                shareSlug,
                visibility: validVisibility,
                expiresAt: expiresAt ? new Date(expiresAt) : getDefaultExpiryDate(),
                createdBy: session.user.id,
            },
        });

        // 8. Return share info with full URL
        const baseUrl = getBaseUrl(request);
        const shareUrl = formatShareUrl(shareSlug, baseUrl);

        return NextResponse.json({
            id: share.id, // Include id for revoke action
            shareSlug: share.shareSlug,
            shareUrl,
            visibility: share.visibility,
            expiresAt: share.expiresAt,
            viewCount: share.viewCount,
            isActive: share.isActive,
            createdAt: share.createdAt,
        });
    } catch (error) {
        console.error("❌ Error creating pinory share:", error);
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
 * GET /api/pinory/share
 * Get all shares created by current user
 */
export async function GET(request: NextRequest) {
    try {
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

        const shares = await prisma.pinoryShare.findMany({
            where: {
                createdBy: session.user.id,
                isActive: true, // Only return active shares
            },
            include: {
                place: {
                    select: {
                        id: true,
                        name: true,
                        address: true,
                        lat: true,
                        lng: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json({ shares });
    } catch (error) {
        console.error("❌ Error fetching shares:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
