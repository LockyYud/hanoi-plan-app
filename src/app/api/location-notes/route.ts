import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ShareVisibility } from "@prisma/client"

// GET /api/location-notes - Lấy places with notes (của user hoặc của bạn bè)
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const type = searchParams.get("type") || "mine" // mine | friends | public
        const friendId = searchParams.get("friendId") // filter by specific friend

        let where: any = {}

        if (type === "mine") {
            where.createdBy = session.user.id
        } else if (type === "friends") {
            // Lấy danh sách friend IDs
            const friendships = await prisma.friendship.findMany({
                where: {
                    OR: [
                        { requesterId: session.user.id },
                        { addresseeId: session.user.id }
                    ],
                    status: "accepted"
                }
            })

            const friendIds = friendships.map(f =>
                f.requesterId === session.user.id ? f.addresseeId : f.requesterId
            )

            if (friendId) {
                where.createdBy = friendId
                where.visibility = { in: ["friends", "public"] }
            } else {
                where.createdBy = { in: friendIds }
                where.visibility = { in: ["friends", "public"] }
            }
        } else if (type === "public") {
            where.visibility = "public"
        }

        const places = await prisma.place.findMany({
            where,
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                },
                categoryModel: true,
                media: {
                    where: { isActive: true },
                    orderBy: { createdAt: "desc" },
                    take: 5
                }
            },
            orderBy: { createdAt: "desc" }
        })

        // Transform to match expected format
        const formattedNotes = places.map((place: any) => ({
            id: place.id,
            lng: place.lng,
            lat: place.lat,
            address: place.address,
            content: place.note || "",
            placeName: place.name,
            mood: "📝",
            timestamp: place.visitDate || place.createdAt,
            visitTime: place.visitDate,
            images: place.media?.map((m: any) => m.url) || [],
            hasImages: (place.media?.length || 0) > 0,
            category: place.category,
            categoryName: place.categoryModel?.name,
            categorySlug: place.categoryModel?.slug || place.category.toLowerCase(),
            visibility: place.visibility,
            userId: place.createdBy,
            user: place.creator,
            coverImageIndex: 0 // Default to first image
        }))

        return NextResponse.json(formattedNotes)
    } catch (error) {
        console.error("Error fetching location notes:", error)
        return NextResponse.json(
            { error: "Failed to fetch location notes" },
            { status: 500 }
        )
    }
}

// POST /api/location-notes - Tạo place with note
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const body = await req.json()

        const {
            placeId,
            lng,
            lat,
            address,
            placeName,
            categoryIds,
            visitDate,
            visitTime
        } = body

        const note = body.note || body.content // Support both 'note' and 'content'
        const visibility = body.visibility || "private"
        const finalVisitDate = visitDate || visitTime

        // If placeId is provided, update existing place
        if (placeId) {
            const existingPlace = await prisma.place.findUnique({
                where: { id: placeId }
            })

            if (!existingPlace) {
                return NextResponse.json(
                    { error: "Place not found" },
                    { status: 404 }
                )
            }

            // Check if user owns this place
            if (existingPlace.createdBy !== session.user.id) {
                return NextResponse.json(
                    { error: "You can only update your own places" },
                    { status: 403 }
                )
            }

            const updatedPlace = await prisma.place.update({
                where: { id: placeId },
                data: {
                    ...(note !== undefined && { note }),
                    visibility: visibility as ShareVisibility,
                    ...(finalVisitDate && { visitDate: new Date(finalVisitDate) })
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true
                        }
                    },
                    categoryModel: true,
                    media: true
                }
            })

            return NextResponse.json({ id: updatedPlace.id, place: updatedPlace }, { status: 200 })
        }

        // Create new place
        if (!lng || !lat) {
            return NextResponse.json(
                { error: "Longitude and latitude are required" },
                { status: 400 }
            )
        }

        if (!placeName) {
            return NextResponse.json(
                { error: "Place name is required" },
                { status: 400 }
            )
        }

        // Try to find existing place at same coordinates owned by user
        const existingPlace = await prisma.place.findFirst({
            where: {
                lng,
                lat,
                name: placeName,
                createdBy: session.user.id
            }
        })

        if (existingPlace) {
            // Update existing place
            const updatedPlace = await prisma.place.update({
                where: { id: existingPlace.id },
                data: {
                    ...(note !== undefined && { note }),
                    visibility: visibility as ShareVisibility,
                    ...(finalVisitDate && { visitDate: new Date(finalVisitDate) })
                },
                include: {
                    creator: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true
                        }
                    },
                    categoryModel: true,
                    media: true
                }
            })
            return NextResponse.json({ id: updatedPlace.id, place: updatedPlace }, { status: 200 })
        }

        // Create new place
        let categoryType = "food" // Default to food
        let categoryModelId = null

        if (categoryIds && categoryIds.length > 0) {
            // Find the category to get its slug/type
            const categoryModel = await prisma.category.findUnique({
                where: { id: categoryIds[0] }
            })

            if (categoryModel) {
                categoryModelId = categoryModel.id
                // Map category slug to CategoryType enum
                const slugToCategoryType: Record<string, string> = {
                    "cafe": "cafe",
                    "nha-hang": "food",
                    "food": "food",
                    "bar": "bar",
                    "rooftop": "rooftop",
                    "hoat-dong": "activity",
                    "activity": "activity",
                    "dia-diem": "landmark",
                    "landmark": "landmark"
                }
                categoryType = slugToCategoryType[categoryModel.slug] || "food"
            }
        }

        const newPlace = await prisma.place.create({
            data: {
                lng,
                lat,
                address: address || "",
                name: placeName,
                category: categoryType as any,
                ...(note && { note }),
                visibility: visibility as ShareVisibility,
                ...(finalVisitDate && { visitDate: new Date(finalVisitDate) }),
                creator: {
                    connect: { id: session.user.id }
                },
                ...(categoryModelId && {
                    categoryModel: {
                        connect: { id: categoryModelId }
                    }
                })
            },
            include: {
                creator: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                },
                categoryModel: true,
                media: true
            }
        })

        return NextResponse.json({ id: newPlace.id, place: newPlace }, { status: 201 })
    } catch (error) {
        console.error("Error creating place:", error)
        return NextResponse.json(
            { error: "Failed to create place" },
            { status: 500 }
        )
    }
}
