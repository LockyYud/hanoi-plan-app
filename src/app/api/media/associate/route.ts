import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API endpoint to associate uploaded media with a place
 * This links orphan media records to specific places
 */
export async function POST(request: NextRequest) {
    try {
        // Get user session for authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { mediaId, placeId } = body;

        if (!mediaId || !placeId) {
            return NextResponse.json(
                { error: 'mediaId and placeId are required' },
                { status: 400 }
            );
        }

        console.log('🔗 Associating media with place:', { mediaId, placeId, userId: session.user.id });

        // Check if media exists and belongs to user
        const media = await prisma.media.findFirst({
            where: {
                id: mediaId,
                userId: session.user.id,
                isActive: true
            }
        });

        if (!media) {
            return NextResponse.json(
                { error: 'Media not found or access denied' },
                { status: 404 }
            );
        }

        // Check if place exists
        const place = await prisma.place.findUnique({
            where: { id: placeId }
        });

        if (!place) {
            return NextResponse.json(
                { error: 'Place not found' },
                { status: 404 }
            );
        }

        // Update media to associate with place
        const updatedMedia = await prisma.media.update({
            where: { id: mediaId },
            data: { placeId: placeId },
            include: {
                place: {
                    select: {
                        id: true,
                        name: true,
                        category: true
                    }
                }
            }
        });

        console.log('✅ Media associated with place:', {
            mediaId: updatedMedia.id,
            placeId: updatedMedia.placeId,
            placeName: updatedMedia.place?.name
        });

        return NextResponse.json({
            success: true,
            media: updatedMedia
        });

    } catch (error) {
        console.error('❌ Error associating media with place:', error);
        return NextResponse.json(
            {
                error: 'Failed to associate media with place',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}