import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const GroupCreateSchema = z.object({
    name: z.string().min(1, "Tên nhóm là bắt buộc"),
    startTime: z.string().datetime("Thời gian bắt đầu không hợp lệ"),
    endTime: z.string().datetime("Thời gian kết thúc không hợp lệ"),
    budgetMin: z.number().min(0).optional(),
    budgetMax: z.number().min(0).optional(),
    vibeTags: z.string().default(""),
    areaPref: z.string().default(""),
})

export async function GET(request: NextRequest) {
    try {
        // For demo purposes, return mock user groups
        const mockGroups = [
            {
                id: "demo-group-1",
                name: "Weekend trong phố cổ",
                startTime: new Date("2024-01-20T14:00:00Z"),
                endTime: new Date("2024-01-20T22:00:00Z"),
                budgetMin: 200000,
                budgetMax: 500000,
                vibeTags: "chill,cultural,foodie",
                areaPref: "Hoàn Kiếm,Ba Đình",
                createdAt: new Date(),
                members: [
                    { user: { name: "Bạn", email: "you@example.com" }, role: "owner" },
                    { user: { name: "An", email: "an@example.com" }, role: "member" },
                    { user: { name: "Bình", email: "binh@example.com" }, role: "member" },
                ],
            },
            {
                id: "demo-group-2",
                name: "Cafe hopping Tây Hồ",
                startTime: new Date("2024-01-21T09:00:00Z"),
                endTime: new Date("2024-01-21T17:00:00Z"),
                budgetMin: 100000,
                budgetMax: 300000,
                vibeTags: "chill,view,coffee",
                areaPref: "Tây Hồ",
                createdAt: new Date(),
                members: [
                    { user: { name: "Bạn", email: "you@example.com" }, role: "owner" },
                    { user: { name: "Chi", email: "chi@example.com" }, role: "member" },
                ],
            }
        ]

        return NextResponse.json({ data: mockGroups })

    } catch (error) {
        console.error('Error fetching groups:', error)
        return NextResponse.json(
            { error: 'Failed to fetch groups' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = GroupCreateSchema.parse(body)

        // For demo, create a mock group response
        const mockGroup = {
            id: `demo-group-${Date.now()}`,
            ...data,
            startTime: new Date(data.startTime),
            endTime: new Date(data.endTime),
            createdAt: new Date(),
            ownerId: "demo-user",
            members: [
                { user: { name: "Bạn", email: "you@example.com" }, role: "owner" }
            ],
        }

        return NextResponse.json(mockGroup, { status: 201 })

    } catch (error) {
        console.error('Error creating group:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid input data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create group' },
            { status: 500 }
        )
    }
}

