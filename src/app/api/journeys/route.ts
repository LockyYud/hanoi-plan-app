import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/user-session";

// GET /api/journeys - Get all journeys for current user
export async function GET(request: NextRequest) {
    try {
        const { user, error } = await getUserFromSession();

        if (error || !user) {
            return NextResponse.json(
                { error: error || "Authentication required" },
                { status: 401 }
            );
        }

        const journeys = await prisma.journey.findMany({
            where: {
                userId: user.id,
            },
            include: {
                stops: {
                    include: {
                        place: {
                            include: {
                                media: {
                                    where: {
                                        type: "image",
                                        isActive: true,
                                    },
                                    orderBy: {
                                        createdAt: "desc",
                                    },
                                    take: 1,
                                },
                            },
                        },
                    },
                    orderBy: {
                        sequence: "asc",
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(journeys);
    } catch (error) {
        console.error("Error fetching journeys:", error);
        return NextResponse.json(
            { error: "Failed to fetch journeys" },
            { status: 500 }
        );
    }
}

// POST /api/journeys - Create new journey
export async function POST(request: NextRequest) {
    try {
        const { user, error } = await getUserFromSession();

        if (error || !user) {
            return NextResponse.json(
                { error: error || "Authentication required" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { title, description, startDate, endDate, placeIds, coverImage } =
            body;

        // Validate required fields
        if (!title || !placeIds || placeIds.length === 0) {
            return NextResponse.json(
                { error: "Title and at least one place are required" },
                { status: 400 }
            );
        }

        // Create journey with stops
        const journey = await prisma.journey.create({
            data: {
                title,
                description,
                userId: user.id,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                coverImage,
                stops: {
                    create: placeIds.map((placeId: string, index: number) => ({
                        placeId,
                        sequence: index,
                    })),
                },
            },
            include: {
                stops: {
                    include: {
                        place: {
                            include: {
                                media: {
                                    where: {
                                        type: "image",
                                        isActive: true,
                                    },
                                    orderBy: {
                                        createdAt: "desc",
                                    },
                                    take: 1,
                                },
                            },
                        },
                    },
                    orderBy: {
                        sequence: "asc",
                    },
                },
            },
        });

        return NextResponse.json(journey, { status: 201 });
    } catch (error) {
        console.error("Error creating journey:", error);
        return NextResponse.json(
            { error: "Failed to create journey" },
            { status: 500 }
        );
    }
}

// PUT /api/journeys - Update journey
export async function PUT(request: NextRequest) {
    try {
        const { user, error } = await getUserFromSession();

        if (error || !user) {
            return NextResponse.json(
                { error: error || "Authentication required" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            id,
            title,
            description,
            startDate,
            endDate,
            placeIds,
            coverImage,
        } = body;

        if (!id) {
            return NextResponse.json(
                { error: "Journey ID is required" },
                { status: 400 }
            );
        }

        // Delete existing stops and create new ones if placeIds provided
        if (placeIds && Array.isArray(placeIds)) {
            await prisma.journeyStop.deleteMany({
                where: {
                    journeyId: id,
                },
            });

            await prisma.journeyStop.createMany({
                data: placeIds.map((placeId: string, index: number) => ({
                    journeyId: id,
                    placeId,
                    sequence: index,
                })),
            });
        }

        // Update journey details
        const journey = await prisma.journey.update({
            where: {
                id,
                userId: user.id, // Ensure user owns the journey
            },
            data: {
                title,
                description,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                coverImage,
            },
            include: {
                stops: {
                    include: {
                        place: {
                            include: {
                                media: {
                                    where: {
                                        type: "image",
                                        isActive: true,
                                    },
                                    orderBy: {
                                        createdAt: "desc",
                                    },
                                    take: 1,
                                },
                            },
                        },
                    },
                    orderBy: {
                        sequence: "asc",
                    },
                },
            },
        });

        return NextResponse.json(journey);
    } catch (error) {
        console.error("Error updating journey:", error);
        return NextResponse.json(
            { error: "Failed to update journey" },
            { status: 500 }
        );
    }
}

// DELETE /api/journeys - Delete journey
export async function DELETE(request: NextRequest) {
    try {
        const { user, error } = await getUserFromSession();

        if (error || !user) {
            return NextResponse.json(
                { error: error || "Authentication required" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const journeyId = searchParams.get("id");

        if (!journeyId) {
            return NextResponse.json(
                { error: "Journey ID is required" },
                { status: 400 }
            );
        }

        await prisma.journey.delete({
            where: {
                id: journeyId,
                userId: user.id, // Ensure user owns the journey
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting journey:", error);
        return NextResponse.json(
            { error: "Failed to delete journey" },
            { status: 500 }
        );
    }
}


