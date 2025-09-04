import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const InviteSchema = z.object({
    email: z.string().email("Email không hợp lệ"),
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

        // For demo, return success with invite link
        const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/groups/join/${inviteCode}`

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

        // Generate shareable invite link
        const inviteCode = `${groupId}-public`
        const inviteLink = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/groups/join/${inviteCode}`

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

