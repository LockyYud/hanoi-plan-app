import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET /api/location-notes/[id] - Lấy chi tiết place
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)

        const place = await prisma.place.findUnique({
            where: { id: params.id },
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
                    orderBy: { createdAt: "desc" }
                }
            }
        })

        if (!place) {
            return NextResponse.json(
                { error: "Place not found" },
                { status: 404 }
            )
        }

        // Kiểm tra quyền truy cập
        if (place.visibility === "private") {
            if (!session?.user?.id || place.createdBy !== session.user.id) {
                return NextResponse.json(
                    { error: "Forbidden" },
                    { status: 403 }
                )
            }
        } else if (place.visibility === "friends") {
            if (!session?.user?.id) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                )
            }

            // Kiểm tra có phải bạn bè không
            if (place.createdBy !== session.user.id) {
                const friendship = await prisma.friendship.findFirst({
                    where: {
                        OR: [
                            {
                                requesterId: session.user.id,
                                addresseeId: place.createdBy
                            },
                            {
                                requesterId: place.createdBy,
                                addresseeId: session.user.id
                            }
                        ],
                        status: "accepted"
                    }
                })

                if (!friendship) {
                    return NextResponse.json(
                        { error: "Forbidden" },
                        { status: 403 }
                    )
                }
            }
        }

        return NextResponse.json({ place })
    } catch (error) {
        console.error("Error fetching place:", error)
        return NextResponse.json(
            { error: "Failed to fetch place" },
            { status: 500 }
        )
    }
}

// PATCH /api/location-notes/[id] - Cập nhật place
export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { rating, note, visibility, visitDate } = await req.json()

        // Kiểm tra ownership
        const existingPlace = await prisma.place.findUnique({
            where: { id: params.id }
        })

        if (!existingPlace) {
            return NextResponse.json(
                { error: "Place not found" },
                { status: 404 }
            )
        }

        if (existingPlace.createdBy !== session.user.id) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            )
        }

        // Update place
        const place = await prisma.place.update({
            where: { id: params.id },
            data: {
                ...(rating !== undefined && { rating }),
                ...(note !== undefined && { note }),
                ...(visibility !== undefined && { visibility }),
                ...(visitDate !== undefined && {
                    visitDate: visitDate ? new Date(visitDate) : null
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

        return NextResponse.json({ place })
    } catch (error) {
        console.error("Error updating place:", error)
        return NextResponse.json(
            { error: "Failed to update place" },
            { status: 500 }
        )
    }
}

// DELETE /api/location-notes/[id] - Xóa place
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Kiểm tra ownership
        const place = await prisma.place.findUnique({
            where: { id: params.id }
        })

        if (!place) {
            return NextResponse.json(
                { error: "Place not found" },
                { status: 404 }
            )
        }

        if (place.createdBy !== session.user.id) {
            return NextResponse.json(
                { error: "Forbidden" },
                { status: 403 }
            )
        }

        await prisma.place.delete({
            where: { id: params.id }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deleting place:", error)
        return NextResponse.json(
            { error: "Failed to delete place" },
            { status: 500 }
        )
    }
}
