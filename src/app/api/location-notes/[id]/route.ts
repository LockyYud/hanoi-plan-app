import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/location-notes/[id] - Get specific location note with images
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // CRITICAL: Require authentication for security
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Authentication required" },
                { status: 401 }
            );
        }

        if (!prisma) {
            return NextResponse.json(
                { error: "Database not available" },
                { status: 503 }
            );
        }

        const noteId = params.id;

        // Get specific location note (only if owned by current user)
        const note = await prisma.place.findFirst({
            where: {
                AND: [
                    { id: noteId },
                    {
                        openHours: {
                            path: ["isLocationNote"],
                            equals: true,
                        },
                    },
                    {
                        createdBy: session.user.id, // CRITICAL: Only owner can access
                    },
                ],
            },
        });

        if (!note) {
            return NextResponse.json(
                { error: "Note not found" },
                { status: 404 }
            );
        }

        // Transform to location note format with images
        const locationNote = {
            id: note.id,
            lng: note.lng,
            lat: note.lat,
            address: note.address,
            content: (note.openHours as any)?.content || "",
            mood: (note.openHours as any)?.mood || "📝",
            timestamp: (note.openHours as any)?.timestamp
                ? new Date((note.openHours as any).timestamp)
                : note.createdAt,
            images: (note.openHours as any)?.images || [],
            hasImages: Boolean((note.openHours as any)?.images?.length > 0),
        };

        return NextResponse.json(locationNote);

    } catch (error) {
        console.error("Error fetching location note:", error);
        return NextResponse.json(
            { error: "Failed to fetch location note" },
            { status: 500 }
        );
    }
}
