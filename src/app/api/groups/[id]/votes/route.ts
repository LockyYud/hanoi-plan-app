import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const VoteSchema = z.object({
    placeId: z.string(),
    vote: z.number().min(-1).max(1), // -1 (downvote), 0 (neutral), 1 (upvote)
})

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const groupId = params.id
        const body = await request.json()
        const { placeId, vote } = VoteSchema.parse(body)

        // For demo, return mock vote result
        const mockVoteResult = {
            groupId,
            placeId,
            userId: "demo-user",
            vote,
            placeVotes: {
                upvotes: Math.floor(Math.random() * 5) + 1,
                downvotes: Math.floor(Math.random() * 2),
                total: Math.floor(Math.random() * 5) + 1,
            }
        }

        return NextResponse.json(mockVoteResult)

    } catch (error) {
        console.error('Error creating vote:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid vote data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to submit vote' },
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

        // Mock votes data for demo
        const mockVotes = [
            {
                placeId: "place-1",
                placeName: "Cà phê Cộng",
                votes: [
                    { userId: "user-1", userName: "An", vote: 1 },
                    { userId: "user-2", userName: "Bình", vote: 1 },
                    { userId: "user-3", userName: "Chi", vote: 0 },
                ],
                summary: { upvotes: 2, downvotes: 0, total: 2 }
            },
            {
                placeId: "place-2",
                placeName: "Hồ Hoàn Kiếm",
                votes: [
                    { userId: "user-1", userName: "An", vote: 1 },
                    { userId: "user-2", userName: "Bình", vote: 1 },
                    { userId: "user-3", userName: "Chi", vote: 1 },
                ],
                summary: { upvotes: 3, downvotes: 0, total: 3 }
            },
            {
                placeId: "place-3",
                placeName: "The Summit Lounge",
                votes: [
                    { userId: "user-1", userName: "An", vote: -1 },
                    { userId: "user-2", userName: "Bình", vote: 0 },
                    { userId: "user-3", userName: "Chi", vote: 1 },
                ],
                summary: { upvotes: 1, downvotes: 1, total: 0 }
            }
        ]

        return NextResponse.json({ data: mockVotes })

    } catch (error) {
        console.error('Error fetching votes:', error)
        return NextResponse.json(
            { error: 'Failed to fetch votes' },
            { status: 500 }
        )
    }
}

