import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const FavoriteCreateSchema = z.object({
    placeId: z.string(),
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
})

const FavoriteUpdateSchema = z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const favorites = await prisma.favorite.findMany({
            where: {
                userId: session.user.id
            },
            include: {
                place: {
                    include: {
                        tags: true,
                        media: {
                            where: {
                                OR: [
                                    { visibility: 'group' },
                                    { userId: session.user.id }
                                ]
                            },
                            take: 3
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        })

        return NextResponse.json(favorites)

    } catch (error) {
        console.error('Error fetching favorites:', error)
        return NextResponse.json(
            { error: 'Failed to fetch favorites' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const data = FavoriteCreateSchema.parse(body)

        // Check if place exists
        const place = await prisma.place.findUnique({
            where: { id: data.placeId }
        })

        if (!place) {
            return NextResponse.json(
                { error: 'Place not found' },
                { status: 404 }
            )
        }

        // Check if already favorited
        const existingFavorite = await prisma.favorite.findUnique({
            where: {
                userId_placeId: {
                    userId: session.user.id,
                    placeId: data.placeId
                }
            }
        })

        if (existingFavorite) {
            return NextResponse.json(
                { error: 'Place already in favorites' },
                { status: 409 }
            )
        }

        const favorite = await prisma.favorite.create({
            data: {
                userId: session.user.id,
                placeId: data.placeId,
                rating: data.rating,
                comment: data.comment
            },
            include: {
                place: {
                    include: {
                        tags: true,
                        media: true
                    }
                }
            }
        })

        return NextResponse.json(favorite, { status: 201 })

    } catch (error) {
        console.error('Error creating favorite:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to add to favorites' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const placeId = searchParams.get('placeId')

        if (!placeId) {
            return NextResponse.json(
                { error: 'Place ID is required' },
                { status: 400 }
            )
        }

        const body = await request.json()
        const data = FavoriteUpdateSchema.parse(body)

        const favorite = await prisma.favorite.update({
            where: {
                userId_placeId: {
                    userId: session.user.id,
                    placeId: placeId
                }
            },
            data: {
                rating: data.rating,
                comment: data.comment
            },
            include: {
                place: {
                    include: {
                        tags: true,
                        media: true
                    }
                }
            }
        })

        return NextResponse.json(favorite)

    } catch (error) {
        console.error('Error updating favorite:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to update favorite' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const placeId = searchParams.get('placeId')

        if (!placeId) {
            return NextResponse.json(
                { error: 'Place ID is required' },
                { status: 400 }
            )
        }

        await prisma.favorite.delete({
            where: {
                userId_placeId: {
                    userId: session.user.id,
                    placeId: placeId
                }
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting favorite:', error)
        return NextResponse.json(
            { error: 'Failed to remove from favorites' },
            { status: 500 }
        )
    }
}
