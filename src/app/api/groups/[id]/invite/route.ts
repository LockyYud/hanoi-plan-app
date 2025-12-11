import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const InviteSchema = z.object({
    email: z.string().email("Invalid email"),
})

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const groupId = params.id
        const body = await request.json()
        const { email } = InviteSchema.parse(body)

        // Generate mock invite code
        const inviteCode = `${groupId}-${Math.random().toString(36).substring(2, 8)}`

        // Get app URL from env or construct from request
        let appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
        if (!appUrl) {
            const host = request.headers.get('host');
            const protocol = request.headers.get('x-forwarded-proto') ||
                (host?.includes('localhost') ? 'http' : 'https');
            appUrl = `${protocol}://${host}`;
        }

        // For demo, return success with invite link
        const inviteLink = `${appUrl}/groups/join/${inviteCode}`

        return NextResponse.json({
            success: true,
            inviteCode,
            inviteLink,
            message: `Lời mời đã được gửi tới ${email}`,
        })

    } catch (error) {
        console.error('Error creating invite:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid email address', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create invite' },
            { status: 500 }
        )
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const groupId = params.id

        // Get app URL from env or construct from request
        let appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
        if (!appUrl) {
            const host = request.headers.get('host');
            const protocol = request.headers.get('x-forwarded-proto') ||
                (host?.includes('localhost') ? 'http' : 'https');
            appUrl = `${protocol}://${host}`;
        }

        // Generate shareable invite link
        const inviteCode = `${groupId}-public`
        const inviteLink = `${appUrl}/groups/join/${inviteCode}`

        return NextResponse.json({
            inviteCode,
            inviteLink,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        })

    } catch (error) {
        console.error('Error getting invite link:', error)
        return NextResponse.json(
            { error: 'Failed to get invite link' },
            { status: 500 }
        )
    }
}

