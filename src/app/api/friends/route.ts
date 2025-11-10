import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { FriendshipStatus } from "@prisma/client"

// GET /api/friends - Lấy danh sách bạn bè
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const search = searchParams.get("search") || ""
        const status = searchParams.get("status") as FriendshipStatus | null

        // Lấy danh sách bạn bè (những người đã accepted)
        const friendships = await prisma.friendship.findMany({
            where: {
                OR: [
                    { requesterId: session.user.id },
                    { addresseeId: session.user.id }
                ],
                status: status || "accepted",
                ...(search && {
                    OR: [
                        {
                            requester: {
                                OR: [
                                    { name: { contains: search, mode: "insensitive" } },
                                    { email: { contains: search, mode: "insensitive" } }
                                ]
                            }
                        },
                        {
                            addressee: {
                                OR: [
                                    { name: { contains: search, mode: "insensitive" } },
                                    { email: { contains: search, mode: "insensitive" } }
                                ]
                            }
                        }
                    ]
                })
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        createdAt: true
                    }
                },
                addressee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        createdAt: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        // Transform để lấy thông tin bạn bè (không phải chính user)
        const friends = await Promise.all(
            friendships.map(async (friendship) => {
                const friend = friendship.requesterId === session.user.id
                    ? friendship.addressee
                    : friendship.requester

                // Đếm số places (location notes) và journeys của bạn
                const [locationNotesCount, journeysCount] = await Promise.all([
                    prisma.place.count({
                        where: {
                            createdBy: friend.id,
                            visibility: { in: ["friends", "public"] }
                        }
                    }),
                    prisma.journey.count({
                        where: {
                            userId: friend.id,
                            visibility: { in: ["friends", "public"] }
                        }
                    })
                ])

                return {
                    ...friend,
                    friendshipId: friendship.id,
                    friendshipStatus: friendship.status,
                    friendsSince: friendship.createdAt,
                    locationNotesCount,
                    journeysCount
                }
            })
        )

        return NextResponse.json({ friends })
    } catch (error) {
        console.error("Error fetching friends:", error)
        return NextResponse.json(
            { error: "Failed to fetch friends" },
            { status: 500 }
        )
    }
}

// POST /api/friends - Gửi lời mời kết bạn
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        console.log("🔍 Friend request - Session user:", {
            id: session.user.id,
            email: session.user.email
        })

        const { targetUserId } = await req.json()
        console.log("🔍 Friend request - Target user ID:", targetUserId)

        if (!targetUserId) {
            return NextResponse.json(
                { error: "Target user ID is required" },
                { status: 400 }
            )
        }

        // Không thể kết bạn với chính mình
        if (targetUserId === session.user.id) {
            return NextResponse.json(
                { error: "Cannot send friend request to yourself" },
                { status: 400 }
            )
        }

        // Kiểm tra xem cả 2 users có tồn tại không
        const [requester, targetUser] = await Promise.all([
            prisma.user.findUnique({ where: { id: session.user.id } }),
            prisma.user.findUnique({ where: { id: targetUserId } })
        ])

        if (!requester) {
            console.error("❌ Requester not found in database:", session.user.id)
            return NextResponse.json(
                { error: "Your user account not found. Please log in again." },
                { status: 404 }
            )
        }

        if (!targetUser) {
            console.error("❌ Target user not found in database:", targetUserId)
            return NextResponse.json(
                { error: "Target user not found" },
                { status: 404 }
            )
        }

        console.log("✅ Both users found, creating friendship...")

        // Kiểm tra xem đã có friendship chưa
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: session.user.id, addresseeId: targetUserId },
                    { requesterId: targetUserId, addresseeId: session.user.id }
                ]
            }
        })

        if (existingFriendship) {
            if (existingFriendship.status === "accepted") {
                return NextResponse.json(
                    { error: "Already friends" },
                    { status: 400 }
                )
            }
            if (existingFriendship.status === "pending") {
                return NextResponse.json(
                    { error: "Friend request already sent" },
                    { status: 400 }
                )
            }
            if (existingFriendship.status === "blocked") {
                return NextResponse.json(
                    { error: "Cannot send friend request" },
                    { status: 403 }
                )
            }
        }

        // Tạo lời mời kết bạn
        const friendship = await prisma.friendship.create({
            data: {
                requesterId: session.user.id,
                addresseeId: targetUserId,
                status: "pending"
            },
            include: {
                requester: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        createdAt: true
                    }
                },
                addressee: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        createdAt: true
                    }
                }
            }
        })

        return NextResponse.json({ friendship }, { status: 201 })
    } catch (error) {
        console.error("Error sending friend request:", error)
        return NextResponse.json(
            { error: "Failed to send friend request" },
            { status: 500 }
        )
    }
}

// DELETE /api/friends?friendshipId=xxx - Xóa bạn bè
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const friendshipId = searchParams.get("friendshipId")

        if (!friendshipId) {
            return NextResponse.json(
                { error: "Friendship ID is required" },
                { status: 400 }
            )
        }

        // Xác minh quyền xóa (phải là một trong hai người trong friendship)
        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId }
        })

        if (!friendship) {
            return NextResponse.json(
                { error: "Friendship not found" },
                { status: 404 }
            )
        }

        if (
            friendship.requesterId !== session.user.id &&
            friendship.addresseeId !== session.user.id
        ) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            )
        }

        // Xóa friendship
        await prisma.friendship.delete({
            where: { id: friendshipId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting friendship:", error)
        return NextResponse.json(
            { error: "Failed to delete friendship" },
            { status: 500 }
        )
    }
}


