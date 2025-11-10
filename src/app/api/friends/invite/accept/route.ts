import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// POST /api/friends/invite/accept - Chấp nhận lời mời qua invite code
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        const { inviteCode } = await req.json()

        if (!inviteCode) {
            return NextResponse.json(
                { error: "Invite code is required" },
                { status: 400 }
            )
        }

        // Find invitation
        const invitation = await prisma.friendInvitation.findUnique({
            where: { inviteCode },
            include: {
                user: {
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

        if (!invitation || !invitation.isActive) {
            return NextResponse.json(
                { error: "Invalid or expired invitation" },
                { status: 400 }
            )
        }

        // Check expiration
        if (invitation.expiresAt && invitation.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "Invitation has expired" },
                { status: 400 }
            )
        }

        // Check max usage
        if (invitation.maxUsage && invitation.usageCount >= invitation.maxUsage) {
            return NextResponse.json(
                { error: "Invitation has reached maximum usage" },
                { status: 400 }
            )
        }

        // Cannot accept own invitation
        if (invitation.userId === session.user.id) {
            return NextResponse.json(
                { error: "Cannot accept your own invitation" },
                { status: 400 }
            )
        }

        // Check if already friends
        const existingFriendship = await prisma.friendship.findFirst({
            where: {
                OR: [
                    { requesterId: invitation.userId, addresseeId: session.user.id },
                    { requesterId: session.user.id, addresseeId: invitation.userId }
                ]
            }
        })

        if (existingFriendship) {
            if (existingFriendship.status === "accepted") {
                return NextResponse.json(
                    { error: "You are already friends" },
                    { status: 400 }
                )
            }
            // If pending, update to accepted
            const updatedFriendship = await prisma.friendship.update({
                where: { id: existingFriendship.id },
                data: { status: "accepted" }
            })

            return NextResponse.json({
                success: true,
                friendship: updatedFriendship,
                friend: invitation.user
            })
        }

        // Create new friendship (auto-accepted via invitation)
        const friendship = await prisma.friendship.create({
            data: {
                requesterId: invitation.userId,
                addresseeId: session.user.id,
                status: "accepted"
            }
        })

        // Create acceptance record
        await prisma.friendInvitationAcceptance.create({
            data: {
                invitationId: invitation.id,
                acceptedById: session.user.id,
                friendshipId: friendship.id
            }
        })

        // Update usage count
        await prisma.friendInvitation.update({
            where: { id: invitation.id },
            data: { usageCount: { increment: 1 } }
        })

        return NextResponse.json({
            success: true,
            friendship,
            friend: invitation.user
        })
    } catch (error) {
        console.error("Error accepting invitation:", error)
        return NextResponse.json(
            { error: "Failed to accept invitation" },
            { status: 500 }
        )
    }
}

