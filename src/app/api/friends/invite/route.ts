import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// Helper function to generate unique invite code
function generateInviteCode(): string {
    // 8 characters: uppercase letters + numbers (excluding similar looking chars)
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// GET /api/friends/invite - Lấy hoặc tạo invitation link
export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        // Kiểm tra user có tồn tại không
        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        })

        if (!user) {
            return NextResponse.json(
                { error: "User not found. Please log in again." },
                { status: 404 }
            )
        }

        // Check if user already has an active invitation
        let invitation = await prisma.friendInvitation.findFirst({
            where: {
                userId: session.user.id,
                isActive: true
            }
        })

        // Create new invitation if not exists
        if (!invitation) {
            let inviteCode: string;
            let attempts = 0;
            const maxAttempts = 10;

            // Try to generate unique code
            do {
                inviteCode = generateInviteCode();
                const existing = await prisma.friendInvitation.findUnique({
                    where: { inviteCode }
                });
                if (!existing) break;
                attempts++;
            } while (attempts < maxAttempts);

            if (attempts >= maxAttempts) {
                return NextResponse.json(
                    { error: "Failed to generate unique invite code" },
                    { status: 500 }
                )
            }

            // Get app URL from env or construct from request
            let appUrl = process.env.NEXT_PUBLIC_APP_URL;
            if (!appUrl) {
                // Fallback: construct from request headers
                const host = req.headers.get('host');
                const protocol = req.headers.get('x-forwarded-proto') ||
                    (host?.includes('localhost') ? 'http' : 'https');
                appUrl = `${protocol}://${host}`;
            }

            invitation = await prisma.friendInvitation.create({
                data: {
                    userId: session.user.id,
                    inviteCode,
                    inviteUrl: `${appUrl}/invite/${inviteCode}`
                }
            })
        }

        // Get stats
        const acceptances = await prisma.friendInvitationAcceptance.count({
            where: { invitationId: invitation.id }
        })

        return NextResponse.json({
            inviteCode: invitation.inviteCode,
            inviteUrl: invitation.inviteUrl,
            usageCount: invitation.usageCount,
            acceptedCount: acceptances,
            createdAt: invitation.createdAt
        })
    } catch (error) {
        console.error("Error getting invitation:", error)
        return NextResponse.json(
            { error: "Failed to get invitation" },
            { status: 500 }
        )
    }
}

// DELETE /api/friends/invite - Vô hiệu hóa invitation link
export async function DELETE(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        }

        await prisma.friendInvitation.updateMany({
            where: {
                userId: session.user.id,
                isActive: true
            },
            data: {
                isActive: false
            }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error("Error deactivating invitation:", error)
        return NextResponse.json(
            { error: "Failed to deactivate invitation" },
            { status: 500 }
        )
    }
}

