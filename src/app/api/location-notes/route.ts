import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/user-session";

// GET /api/location-notes - Get all location notes
export async function GET(request: NextRequest) {
    try {
        // Get user from session (creates user if needed for JWT strategy)
        const { user, error } = await getUserFromSession();

        if (error || !user) {
            return NextResponse.json(
                { error: error || "Authentication required" },
                { status: 401 }
            );
        }

        // Get only current user's location notes
        console.log(`🔍 Fetching location notes for user: ${user.email} (ID: ${user.id})`);
        const startTime = Date.now();

        const notes = await prisma.place.findMany({
            where: {
                AND: [
                    {
                        openHours: {
                            path: ["isLocationNote"],
                            equals: true,
                        },
                    },
                    {
                        createdBy: user.id, // Use database user ID
                    },
                ],
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50, // Limit to recent 50 notes for performance
        });

        console.log(`⚡ Query took ${Date.now() - startTime}ms, found ${notes.length} notes`);

        // Check if images should be included (for detail view)
        const { searchParams } = new URL(request.url);
        const includeImages = searchParams.get("includeImages") === "true";

        // Transform to location note format
        console.log("🔄 Processing notes data...");
        const processStartTime = Date.now();

        const locationNotes = notes.map(note => {
            const baseNote = {
                id: note.id,
                lng: note.lng,
                lat: note.lat,
                address: note.address,
                content: (note.openHours as any)?.content || "",
                mood: (note.openHours as any)?.mood || "📝",
                timestamp: (note.openHours as any)?.timestamp ? new Date((note.openHours as any).timestamp) : note.createdAt,
                hasImages: Boolean((note.openHours as any)?.images?.length > 0), // Indicate if images exist
            };

            // Only include images if explicitly requested
            if (includeImages) {
                console.log(`📸 Including images for note ${note.id}`);
                baseNote.images = (note.openHours as any)?.images || [];
            }

            return baseNote;
        });

        console.log(`⚡ Processing took ${Date.now() - processStartTime}ms`);

        return NextResponse.json(locationNotes);

    } catch (error) {
        console.error("Error fetching location notes:", error);
        return NextResponse.json(
            { error: "Failed to fetch location notes" },
            { status: 500 }
        );
    }
}

// POST /api/location-notes - Create new location note
export async function POST(request: NextRequest) {
    try {
        // Get user from session (creates user if needed for JWT strategy)
        const { user, error } = await getUserFromSession();
        console.log("🔐 Session check:", user ? "✅ Authenticated" : "❌ Not authenticated");

        if (error || !user) {
            return NextResponse.json(
                { error: error || "Authentication required" },
                { status: 401 }
            );
        }

        if (!prisma) {
            return NextResponse.json({ error: "Database not available" }, { status: 503 });
        }

        const body = await request.json();
        const { lng, lat, address, content, mood, images } = body;

        // Validate required fields
        if (!lng || !lat || !address || !content) {
            return NextResponse.json(
                { error: "Missing required fields: lng, lat, address, content" },
                { status: 400 }
            );
        }

        // For now, create a place entry to store the location note
        // TODO: Create proper location_notes table
        const locationNote = await prisma.place.create({
            data: {
                name: `Note: ${content.substring(0, 50)}...`,
                address,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                category: "landmark", // Use landmark as default category for notes
                source: "manual",
                createdBy: user.id,
                // Store note data in JSON field (temporary solution)
                openHours: {
                    isLocationNote: true,
                    content,
                    mood,
                    images: images || [],
                    timestamp: new Date().toISOString(),
                },
            },
        });

        const responseData = {
            id: locationNote.id,
            lng: locationNote.lng,
            lat: locationNote.lat,
            address: locationNote.address,
            content,
            mood,
            images: images || [],
            timestamp: new Date(),
        };

        return NextResponse.json(responseData, { status: 201 });

    } catch (error) {
        console.error("Error creating location note:", error);
        return NextResponse.json(
            { error: "Failed to create location note" },
            { status: 500 }
        );
    }
}

// DELETE /api/location-notes - Delete a location note
export async function DELETE(request: NextRequest) {
    try {
        // Get user from session (creates user if needed for JWT strategy)
        const { user, error } = await getUserFromSession();

        if (error || !user) {
            return NextResponse.json(
                { error: error || "Authentication required" },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const noteId = searchParams.get("id");

        if (!noteId) {
            return NextResponse.json(
                { error: "Note ID is required" },
                { status: 400 }
            );
        }

        if (!prisma) {
            return NextResponse.json(
                { error: "Database not available" },
                { status: 503 }
            );
        }

        // Delete the location note (stored as place with isLocationNote flag)
        await prisma.place.delete({
            where: {
                id: noteId,
                createdBy: user.id, // Ensure user owns the note
                openHours: {
                    path: ["isLocationNote"],
                    equals: true,
                },
            },
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error deleting location note:", error);
        return NextResponse.json(
            { error: "Failed to delete location note" },
            { status: 500 }
        );
    }
}
