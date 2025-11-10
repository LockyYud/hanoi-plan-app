import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { ReactionType } from "@prisma/client"

// GET /api/reactions?contentId=xxx&contentType=xxx - Lấy reactions cho content
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const contentId = searchParams.get("contentId")
        const contentType = searchParams.get("contentType")

        if (!contentId || !contentType) {
            return NextResponse.json(
                { error: "Content ID and type are required" },
                { status: 400 }
            )
        }

        const reactions = await prisma.reaction.findMany({
            where: {
                contentId,
                contentType
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        avatarUrl: true
                    }
                }
            },
            orderBy: { createdAt: "desc" }
        })

        // Group by reaction type
        const reactionCounts = reactions.reduce((acc, reaction) => {
            acc[reaction.type] = (acc[reaction.type] || 0) + 1
            return acc
        }, {} as Record<ReactionType, number>)

        return NextResponse.json({ reactions, reactionCounts })
    } catch (error) {
        console.error("Error fetching reactions:", error)
        return NextResponse.json(
            { error: "Failed to fetch reactions" },
            { status: 500 }
        )
    }
}

// POST /api/reactions - Tạo hoặc update reaction
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { contentId, contentType, type } = await req.json()

        if (!contentId || !contentType || !type) {
            return NextResponse.json(
                { error: "Content ID, type, and reaction type are required" },
                { status: 400 }
            )
        }

        // Validate reaction type
        const validTypes: ReactionType[] = ["love", "like", "wow", "smile", "fire"]
        if (!validTypes.includes(type)) {
            return NextResponse.json(
                { error: "Invalid reaction type" },
                { status: 400 }
            )
        }

        // Upsert reaction
        const reaction = await prisma.reaction.upsert({
            where: {
                userId_contentId_contentType: {
                    userId: session.user.id,
                    contentId,
                    contentType
                }
            },
            create: {
                userId: session.user.id,
                contentId,
                contentType,
                type
            },
            update: {
                type
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

        return NextResponse.json({ reaction }, { status: 201 })
    } catch (error) {
        console.error("Error creating reaction:", error)
        return NextResponse.json(
            { error: "Failed to create reaction" },
            { status: 500 }
        )
    }
}

// DELETE /api/reactions - Xóa reaction
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { searchParams } = new URL(req.url)
        const contentId = searchParams.get("contentId")
        const contentType = searchParams.get("contentType")

        if (!contentId || !contentType) {
            return NextResponse.json(
                { error: "Content ID and type are required" },
                { status: 400 }
            )
        }

        await prisma.reaction.delete({
            where: {
                userId_contentId_contentType: {
                    userId: session.user.id,
                    contentId,
                    contentType
                }
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting reaction:", error)
        return NextResponse.json(
            { error: "Failed to delete reaction" },
            { status: 500 }
        )
    }
}


