import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/friends/accept/[id] - Chấp nhận lời mời kết bạn
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const friendshipId = params.id

        // Kiểm tra friendship tồn tại và addressee là current user
        const friendship = await prisma.friendship.findUnique({
            where: { id: friendshipId }
        })

        if (!friendship) {
            return NextResponse.json(
                { error: "Friend request not found" },
                { status: 404 }
            )
        }

        if (friendship.addresseeId !== session.user.id) {
            return NextResponse.json(
                { error: "You can only accept requests sent to you" },
                { status: 403 }
            )
        }

        if (friendship.status !== "pending") {
            return NextResponse.json(
                { error: "Request is not pending" },
                { status: 400 }
            )
        }

        // Cập nhật status thành accepted
        const updatedFriendship = await prisma.friendship.update({
            where: { id: friendshipId },
            data: { status: "accepted" },
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

        return NextResponse.json({ friendship: updatedFriendship })
    } catch (error) {
        console.error("Error accepting friend request:", error)
        return NextResponse.json(
            { error: "Failed to accept friend request" },
            { status: 500 }
        )
    }
}


