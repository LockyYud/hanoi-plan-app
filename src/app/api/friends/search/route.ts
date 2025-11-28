import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/friends/search?q=xxx - Tìm kiếm người dùng để kết bạn
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const query = searchParams.get("q") || ""

        if (!query || query.length < 2) {
            return NextResponse.json({ users: [] })
        }

        // Tìm kiếm users (trừ current user)
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    { id: { not: session.user.id } },
                    {
                        OR: [
                            { name: { contains: query, mode: "insensitive" } },
                            { email: { contains: query, mode: "insensitive" } }
                        ]
                    }
                ]
            },
            select: {
                id: true,
                name: true,
                email: true,
                avatarUrl: true,
                createdAt: true
            },
            take: 20
        })

        // Lấy friendship status với mỗi user
        const usersWithFriendship = await Promise.all(
            users.map(async (user) => {
                const friendship = await prisma.friendship.findFirst({
                    where: {
                        OR: [
                            { requesterId: session.user.id, addresseeId: user.id },
                            { requesterId: user.id, addresseeId: session.user.id }
                        ]
                    }
                })

                // Đếm số places (pinories) public
                const pinoriesCount = await prisma.place.count({
                    where: {
                        createdBy: user.id,
                        visibility: "public"
                    }
                })

                return {
                    ...user,
                    friendshipStatus: friendship?.status || null,
                    friendshipId: friendship?.id || null,
                    isSentByMe: friendship?.requesterId === session.user.id,
                    pinoriesCount
                }
            })
        )

        return NextResponse.json({ users: usersWithFriendship })
    } catch (error) {
        console.error("Error searching users:", error)
        return NextResponse.json(
            { error: "Failed to search users" },
            { status: 500 }
        )
    }
}


