import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/feed - Lấy activity feed của bạn bè
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const type = searchParams.get("type") || "all" // all | location_note | journey | media
        const limit = parseInt(searchParams.get("limit") || "50")

        // Lấy danh sách bạn bè
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

        if (friendIds.length === 0) {
            return NextResponse.json({ feed: [] })
        }

        // Fetch places (location notes)
        const placesPromise = (type === "all" || type === "location_note")
            ? prisma.place.findMany({
                where: {
                    createdBy: { in: friendIds },
                    visibility: { in: ["friends", "public"] }
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
                    media: {
                        where: { isActive: true },
                        take: 3
                    }
                },
                orderBy: { createdAt: "desc" },
                take: limit
            })
            : Promise.resolve([])

        // Fetch journeys
        const journeysPromise = (type === "all" || type === "journey")
            ? prisma.journey.findMany({
                where: {
                    userId: { in: friendIds },
                    visibility: { in: ["friends", "public"] }
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            avatarUrl: true
                        }
                    },
                    stops: {
                        include: {
                            place: true
                        },
                        orderBy: { sequence: "asc" }
                    }
                },
                orderBy: { createdAt: "desc" },
                take: limit
            })
            : Promise.resolve([])

        const [places, journeys] = await Promise.all([
            placesPromise,
            journeysPromise
        ])

        // Combine and sort by date
        const feed = [
            ...places.map(place => ({
                id: place.id,
                type: "location_note" as const,
                user: place.creator,
                content: place,
                createdAt: place.createdAt
            })),
            ...journeys.map(j => ({
                id: j.id,
                type: "journey" as const,
                user: j.user,
                content: j,
                createdAt: j.createdAt
            }))
        ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, limit)

        // Fetch reactions for each feed item
        const feedWithReactions = await Promise.all(
            feed.map(async (item) => {
                const reactions = await prisma.reaction.findMany({
                    where: {
                        contentId: item.id,
                        contentType: item.type
                    },
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                avatarUrl: true
                            }
                        }
                    }
                })

                return {
                    ...item,
                    reactions
                }
            })
        )

        return NextResponse.json({ feed: feedWithReactions })
    } catch (error) {
        console.error("Error fetching feed:", error)
        return NextResponse.json(
            { error: "Failed to fetch feed" },
            { status: 500 }
        )
    }
}


