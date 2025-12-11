import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

// GET /api/friends/invite/info?code=XXX - Lấy thông tin người mời từ invite code
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const code = searchParams.get("code")

        if (!code) {
            return NextResponse.json(
                { error: "Invalid invite code" },
                { status: 400 }
            )
        }

        // Find invitation
        const invitation = await prisma.friendInvitation.findUnique({
            where: { inviteCode: code },
            include: {
                user: {
                    select: {
                        name: true,
                        email: true,
                        avatarUrl: true
                    }
                }
            }
        })

        if (!invitation) {
            return NextResponse.json(
                { error: "Invite not found" },
                { status: 404 }
            )
        }

        // Check if invitation is still valid
        if (!invitation.isActive) {
            return NextResponse.json(
                { error: "Invite has been deactivated" },
                { status: 410 }
            )
        }

        if (invitation.expiresAt && invitation.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "Invite has expired" },
                { status: 410 }
            )
        }

        if (invitation.maxUsage !== null && invitation.usageCount >= invitation.maxUsage) {
            return NextResponse.json(
                { error: "Invite has reached usage limit" },
                { status: 410 }
            )
        }

        // Return inviter info
        return NextResponse.json({
            inviterName: invitation.user.name || "User",
            inviterEmail: invitation.user.email,
            inviterImage: invitation.user.avatarUrl,
            inviteCode: invitation.inviteCode
        })
    } catch (error) {
        console.error("Error fetching invite info:", error)
        return NextResponse.json(
            { error: "Could not load invite info" },
            { status: 500 }
        )
    }
}

