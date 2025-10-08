import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * API endpoint to get latest media URLs
 * Useful for debugging and testing media functionality
 */
export async function GET(request: NextRequest) {
    try {
        // Get user session for authentication
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const placeId = searchParams.get('placeId');
        const limit = parseInt(searchParams.get('limit') || '10');

        console.log('🔍 Fetching latest media:', { placeId, limit, userId: session.user.id });

        // Build query conditions
        const where: any = {
            isActive: true,
            type: 'image'
        };

        // Filter by place if specified
        if (placeId) {
            where.placeId = placeId;
        }

        // Get latest media
        const latestMedia = await prisma.media.findMany({
            where,
            include: {
                place: {
                    select: {
                        id: true,
                        name: true,
                        category: true
                    }
                },
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: limit
        });

        console.log('📊 Found media records:', latestMedia.length);

        // Also get media without place association
        const orphanMedia = await prisma.media.findMany({
            where: {
                isActive: true,
                type: 'image',
                placeId: null
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 5
        });

        console.log('🔗 Found orphan media (no place):', orphanMedia.length);

        return NextResponse.json({
            success: true,
            data: {
                mediaWithPlace: latestMedia,
                orphanMedia: orphanMedia,
                total: latestMedia.length + orphanMedia.length
            }
        });

    } catch (error) {
        console.error('❌ Error fetching latest media:', error);
        return NextResponse.json(
            {
                error: 'Failed to fetch latest media',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}