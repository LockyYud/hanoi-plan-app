import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const PlaceCreateSchema = z.object({
    name: z.string().min(1),
    address: z.string().min(1),
    ward: z.string().optional(),
    district: z.string().optional(),
    lat: z.number(),
    lng: z.number(),
    priceLevel: z.number().min(1).max(4).optional(),
    category: z.enum(["cafe", "food", "bar", "rooftop", "activity", "landmark"]),
    openHours: z.any().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    tags: z.array(z.string()).optional(),
})

const PlaceFilterSchema = z.object({
    bbox: z.string().optional(),
    category: z.array(z.string()).optional(),
    district: z.array(z.string()).optional(),
    priceLevel: z.array(z.number()).optional(),
    query: z.string().optional(),
    openAt: z.string().optional(),
    limit: z.number().default(50),
    offset: z.number().default(0),
})

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const params = Object.fromEntries(searchParams.entries())

        // Parse array parameters
        if (params.category) {
            params.category = params.category.split(',')
        }
        if (params.district) {
            params.district = params.district.split(',')
        }
        if (params.priceLevel) {
            params.priceLevel = params.priceLevel.split(',').map(Number)
        }

        const filter = PlaceFilterSchema.parse(params)

        const where: any = {}

        // Apply filters
        if (filter.category) {
            where.category = { in: filter.category }
        }

        if (filter.district) {
            where.district = { in: filter.district }
        }

        if (filter.priceLevel) {
            where.priceLevel = { in: filter.priceLevel }
        }

        if (filter.query) {
            where.OR = [
                { name: { contains: filter.query, mode: 'insensitive' } },
                { address: { contains: filter.query, mode: 'insensitive' } },
                { tags: { some: { tag: { contains: filter.query, mode: 'insensitive' } } } }
            ]
        }

        // Bounding box filter for map viewport
        if (filter.bbox) {
            const [west, south, east, north] = filter.bbox.split(',').map(Number)
            where.lat = { gte: south, lte: north }
            where.lng = { gte: west, lte: east }
        }

        const places = await prisma.place.findMany({
            where,
            include: {
                tags: true,
                favorites: {
                    select: {
                        userId: true,
                        rating: true,
                    }
                },
                media: {
                    where: {
                        visibility: "group"
                    },
                    take: 3
                }
            },
            take: filter.limit,
            skip: filter.offset,
            orderBy: [
                { favorites: { _count: 'desc' } },
                { createdAt: 'desc' }
            ]
        })

        return NextResponse.json({
            data: places,
            total: places.length,
            hasMore: places.length === filter.limit
        })

    } catch (error) {
        console.error('Error fetching places:', error)
        return NextResponse.json(
            { error: 'Failed to fetch places' },
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
        const data = PlaceCreateSchema.parse(body)

        // Check for duplicate places near the same location
        const existingPlace = await prisma.place.findFirst({
            where: {
                AND: [
                    { lat: { gte: data.lat - 0.0001, lte: data.lat + 0.0001 } },
                    { lng: { gte: data.lng - 0.0001, lte: data.lng + 0.0001 } },
                    { name: { contains: data.name, mode: 'insensitive' } }
                ]
            }
        })

        if (existingPlace) {
            return NextResponse.json(
                { error: 'A similar place already exists at this location' },
                { status: 409 }
            )
        }

        // Create place
        const place = await prisma.place.create({
            data: {
                name: data.name,
                address: data.address,
                ward: data.ward,
                district: data.district,
                lat: data.lat,
                lng: data.lng,
                priceLevel: data.priceLevel,
                category: data.category,
                openHours: data.openHours,
                phone: data.phone,
                website: data.website,
                createdBy: session.user.id,
                tags: data.tags ? {
                    create: data.tags.map(tag => ({ tag }))
                } : undefined
            },
            include: {
                tags: true,
                favorites: true,
                media: true
            }
        })

        return NextResponse.json(place, { status: 201 })

    } catch (error) {
        console.error('Error creating place:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create place' },
            { status: 500 }
        )
    }
}
