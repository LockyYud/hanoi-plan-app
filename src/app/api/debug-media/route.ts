import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Debug API endpoint to check media in database
 * No authentication required for debugging
 */
export async function GET(request: NextRequest) {
    try {
        console.log('🔍 Debug: Checking media in database...');

        // Get total media count
        const totalMedia = await prisma.media.count();
        console.log('📊 Total media records:', totalMedia);

        // Get latest media with places
        const mediaWithPlace = await prisma.media.findMany({
            where: {
                isActive: true,
                type: 'image',
                placeId: {
                    not: null
                }
            },
            include: {
                place: {
                    select: {
                        id: true,
                        name: true,
                        category: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        });

        // Get orphan media (no place)
        const orphanMedia = await prisma.media.findMany({
            where: {
                isActive: true,
                type: 'image',
                placeId: null
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        });

        // Get all places count
        const totalPlaces = await prisma.place.count();

        console.log('📊 Debug results:', {
            totalMedia,
            mediaWithPlace: mediaWithPlace.length,
            orphanMedia: orphanMedia.length,
            totalPlaces
        });

        return NextResponse.json({
            success: true,
            debug: {
                totalMedia,
                totalPlaces,
                mediaWithPlace: mediaWithPlace.length,
                orphanMedia: orphanMedia.length
            },
            data: {
                mediaWithPlace: mediaWithPlace.map(m => ({
                    id: m.id,
                    url: m.url,
                    placeId: m.placeId,
                    placeName: m.place?.name,
                    createdAt: m.createdAt
                })),
                orphanMedia: orphanMedia.map(m => ({
                    id: m.id,
                    url: m.url,
                    createdAt: m.createdAt
                }))
            }
        });

    } catch (error) {
        console.error('❌ Debug API error:', error);
        return NextResponse.json(
            {
                error: 'Debug API failed',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}