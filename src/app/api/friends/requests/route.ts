import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/friends/requests - Lấy danh sách lời mời kết bạn
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const type = searchParams.get("type") || "received" // received | sent

        const where = type === "received"
            ? { addresseeId: session.user.id, status: "pending" }
            : { requesterId: session.user.id, status: "pending" }

        const requests = await prisma.friendship.findMany({
            where,
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

        return NextResponse.json({ requests })
    } catch (error) {
        console.error("Error fetching friend requests:", error)
        return NextResponse.json(
            { error: "Failed to fetch friend requests" },
            { status: 500 }
        )
    }
}


