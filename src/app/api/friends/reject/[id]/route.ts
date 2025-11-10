import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/friends/reject/[id] - Từ chối lời mời kết bạn
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
                { error: "You can only reject requests sent to you" },
                { status: 403 }
            )
        }

        if (friendship.status !== "pending") {
            return NextResponse.json(
                { error: "Request is not pending" },
                { status: 400 }
            )
        }

        // Xóa friendship (reject = delete)
        await prisma.friendship.delete({
            where: { id: friendshipId }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error rejecting friend request:", error)
        return NextResponse.json(
            { error: "Failed to reject friend request" },
            { status: 500 }
        )
    }
}


