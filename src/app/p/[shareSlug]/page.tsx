import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PublicPinoryView } from "@/components/pinory/share/public-pinory-view";
import { FriendPinoryShareView } from "@/components/pinory/share/friend-pinory-share-view";
import {
    isShareExpired,
    determineShareAccess,
    isValidShareSlug,
} from "@/lib/share-utils";

interface SharePageProps {
    params: Promise<{
        shareSlug: string;
    }>;
}

/**
 * Fetch shared pinory data directly from database (server-side)
 */
async function getSharedPinory(shareSlug: string, session: any) {
    try {
        if (!prisma || !isValidShareSlug(shareSlug)) {
            return null;
        }

        const viewerUserId = session?.user?.id;

        // Find share record
        const share = await prisma.pinoryShare.findUnique({
            where: { shareSlug: shareSlug },
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
            return null;
        }

        // Check if share is active
        if (!share.isActive) {
            return {
                canView: false,
                reason: "This share link has been revoked by the owner",
            };
        }

        // Check if expired
        const expired = isShareExpired(share.expiresAt);

        // Check friendship status if viewer is logged in
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

        // Determine access
        const accessInfo = determineShareAccess({
            shareVisibility: share.visibility,
            viewerUserId,
            ownerUserId: share.place.createdBy,
            friendshipStatus,
            isExpired: expired,
        });

        if (!accessInfo.canView) {
            return {
                canView: false,
                reason: accessInfo.reason,
            };
        }

        // Increment view count (not for owner)
        if (viewerUserId !== share.place.createdBy) {
            await prisma.pinoryShare.update({
                where: { id: share.id },
                data: {
                    viewCount: {
                        increment: 1,
                    },
                },
            });
        }

        // Transform place data to Pinory format
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
            phone: share.place.phone,
            website: share.place.website,
            rating: share.place.rating,
            note: share.place.note,
            visitDate: share.place.visitDate,
            createdAt: share.place.createdAt,
            images: share.place.media.map((m) => m.url),
            media: share.place.media,
            creator: share.place.creator,
            visibility: share.place.visibility,
        };

        return {
            canView: true,
            viewType: accessInfo.viewType,
            pinory,
            shareInfo: {
                shareSlug: share.shareSlug,
                visibility: share.visibility,
                viewCount: share.viewCount + 1,
                createdAt: share.createdAt,
                expiresAt: share.expiresAt,
            },
        };
    } catch (error) {
        console.error("Error fetching shared pinory:", error);
        return null;
    }
}

/**
 * Generate metadata for SEO and social sharing
 */
export async function generateMetadata({
    params,
}: SharePageProps): Promise<Metadata> {
    const { shareSlug } = await params;
    const session = await getServerSession(authOptions);
    const data = await getSharedPinory(shareSlug, session);

    if (!data?.pinory) {
        return {
            title: "Pinory Not Found",
            description: "This shared location could not be found.",
        };
    }

    const { pinory } = data;
    const firstImage = pinory.images?.[0];

    return {
        title: `${pinory.name} - Shared on Pinory`,
        description:
            pinory.note ||
            pinory.content ||
            `Check out this location in Hanoi: ${pinory.address}`,
        openGraph: {
            title: pinory.name,
            description:
                pinory.note ||
                pinory.content ||
                `A location shared on Pinory: ${pinory.address}`,
            images: firstImage ? [firstImage] : [],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            title: pinory.name,
            description:
                pinory.note ||
                pinory.content ||
                `A location shared on Pinory: ${pinory.address}`,
            images: firstImage ? [firstImage] : [],
        },
    };
}

/**
 * Universal Share Page - Entry point for all share links
 * Server-side logic determines which view to show
 */
export default async function SharePage({ params }: SharePageProps) {
    const { shareSlug } = await params;
    const session = await getServerSession(authOptions);
    const data = await getSharedPinory(shareSlug, session);

    // Handle not found
    if (!data || !data.canView) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4 p-8">
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Cannot Access This Share
                    </h1>
                    <p className="text-muted-foreground max-w-md">
                        {data?.reason ||
                            "This share link is invalid, expired, or you don't have permission to view it."}
                    </p>
                    {!session && (
                        <div className="pt-4">
                            <a
                                href="/login"
                                className="text-blue-500 hover:underline"
                            >
                                Sign in to view
                            </a>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    const { viewType, pinory, shareInfo } = data;

    // CASE 1: Owner viewing their own share -> redirect to map
    if (viewType === "owner") {
        redirect(`/?pinory=${pinory.id}`);
    }

    // CASE 2: Friend viewing -> Show friend view
    if (viewType === "friend") {
        return <FriendPinoryShareView pinory={pinory} shareInfo={shareInfo} />;
    }

    // CASE 3: Public or anonymous -> Show public view
    return <PublicPinoryView pinory={pinory} shareInfo={shareInfo} />;
}
