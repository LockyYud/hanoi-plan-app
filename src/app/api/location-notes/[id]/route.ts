import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/user-session";

// GET /api/location-notes/[id] - Get specific location note with images
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // CRITICAL: Require authentication for security
        // Use getUserFromSession to match the same authentication flow as main notes API
        const { user, error } = await getUserFromSession();
        console.log("🔐 Note API - Session check:", {
            hasUser: !!user,
            userId: user?.id,
            userEmail: user?.email,
            error: error,
            timestamp: new Date().toISOString()
        });

        if (error || !user) {
            console.error("❌ Note API - Authentication failed:", error);
            return NextResponse.json(
                { error: error || "Authentication required" },
                { status: 401 }
            );
        }

        if (!prisma) {
            return NextResponse.json(
                { error: "Database not available" },
                { status: 503 }
            );
        }

        const resolvedParams = await params;
        const noteId = resolvedParams.id;
        console.log("🔍 Note API - Looking for note:", {
            noteId,
            userId: user.id
        });

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
                        createdBy: user.id, // CRITICAL: Only owner can access
                    },
                ],
            },
            include: {
                media: {
                    where: {
                        type: "image",
                        isActive: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
            },
        });

        console.log("🔍 Note API - Database result:", {
            noteFound: !!note,
            noteId: note?.id,
            createdBy: note?.createdBy,
            hasOpenHours: !!note?.openHours
        });

        if (!note) {
            console.error("❌ Note API - Note not found or access denied");
            return NextResponse.json(
                { error: "Note not found or access denied" },
                { status: 404 }
            );
        }

        // Transform to location note format with images
        const openHoursData = note.openHours as Record<string, unknown>;
        const locationNote = {
            id: note.id,
            lng: note.lng,
            lat: note.lat,
            address: note.address,
            content: (openHoursData?.content as string) || "",
            mood: (openHoursData?.mood as string) || "📝",
            timestamp: openHoursData?.timestamp
                ? new Date(openHoursData.timestamp as string)
                : note.createdAt,
            images: note.media.map(media => media.url), // Get images from media relationship
            hasImages: note.media.length > 0, // Check media relationship
        };

        console.log("✅ Note API - Returning note:", {
            id: locationNote.id,
            hasContent: !!locationNote.content,
            hasImages: locationNote.hasImages,
            imageCount: locationNote.images.length
        });

        return NextResponse.json(locationNote);

    } catch (error) {
        console.error("❌ Note API - Unexpected error:", error);
        console.error("❌ Note API - Error stack:", error instanceof Error ? error.stack : "Unknown error");
        return NextResponse.json(
            { error: "Internal server error while fetching location note" },
            { status: 500 }
        );
    }
}
