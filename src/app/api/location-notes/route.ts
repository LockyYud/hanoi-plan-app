import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserFromSession } from "@/lib/user-session";

interface LocationNoteResponse {
    id: string;
    lng: number;
    lat: number;
    address: string;
    content: string;
    mood: string;
    timestamp: Date;
    hasImages: boolean;
    images?: string[];
    categorySlug?: string; // Add category slug
}

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

        if (!prisma) {
            return NextResponse.json(
                { error: "Database not available" },
                { status: 503 }
            );
        }

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
            include: {
                categoryModel: true, // Include category relation
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
            const openHoursData = note.openHours as Record<string, unknown> || {};
            const baseNote: LocationNoteResponse = {
                id: note.id,
                lng: note.lng,
                lat: note.lat,
                address: note.address,
                content: (openHoursData.content as string) || "",
                mood: (openHoursData.mood as string) || "📝",
                timestamp: openHoursData.timestamp ? new Date(openHoursData.timestamp as string) : note.createdAt,
                hasImages: note.media.length > 0, // Check media relationship instead of JSON
                categorySlug: note.categoryModel?.slug, // Map category slug from relation
            };

            // Only include images if explicitly requested
            if (includeImages) {
                console.log(`📸 Including images for note ${note.id}`);
                baseNote.images = note.media.map(media => media.url);
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
        const { lng, lat, address, content, mood, categoryIds } = body;

        // Validate required fields
        if (!lng || !lat || !address) {
            return NextResponse.json(
                { error: "Missing required fields: lng, lat, address" },
                { status: 400 }
            );
        }

        // Use first category ID if provided
        const categoryId = categoryIds && categoryIds.length > 0 ? categoryIds[0] : null;

        // For now, create a place entry to store the location note
        // Using media table for proper image storage
        const locationNote = await prisma.place.create({
            data: {
                name: content ? `Note: ${content.substring(0, 50)}...` : `Location Note`,
                address,
                lat: parseFloat(lat),
                lng: parseFloat(lng),
                category: "landmark", // Use landmark as default category for notes
                categoryId: categoryId || null, // Allow custom category
                source: "manual",
                createdBy: user.id,
                // Store note data in JSON field (images will be stored in media table)
                openHours: {
                    isLocationNote: true,
                    content: content || "",
                    mood,
                    timestamp: new Date().toISOString(),
                },
            },
            include: {
                categoryModel: true, // Include category in response
            },
        });

        const responseData = {
            id: locationNote.id,
            lng: locationNote.lng,
            lat: locationNote.lat,
            address: locationNote.address,
            content,
            mood,
            images: [], // Images will be handled separately via upload API
            timestamp: new Date(),
            hasImages: false, // Initially no images
            categorySlug: locationNote.categoryModel?.slug, // Include category slug
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

// PUT /api/location-notes - Update a location note
export async function PUT(request: NextRequest) {
    try {
        // Get user from session (creates user if needed for JWT strategy)
        const { user, error } = await getUserFromSession();
        console.log("🔐 Update note - Session check:", user ? "✅ Authenticated" : "❌ Not authenticated");

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
        const { id, lng, lat, address, content, mood, categoryIds } = body;

        // Validate required fields
        if (!id) {
            return NextResponse.json(
                { error: "Note ID is required" },
                { status: 400 }
            );
        }

        // Use first category ID if provided
        const categoryId = categoryIds && categoryIds.length > 0 ? categoryIds[0] : null;

        // Update the location note and include media to get current images
        const updatedNote = await prisma.place.update({
            where: {
                id: id,
                createdBy: user.id, // Ensure user owns the note
                openHours: {
                    path: ["isLocationNote"],
                    equals: true,
                },
            },
            data: {
                name: content ? `Note: ${content.substring(0, 50)}...` : `Location Note`,
                address: address || undefined,
                lat: lng ? parseFloat(lat) : undefined,
                lng: lat ? parseFloat(lng) : undefined,
                categoryId: categoryId !== undefined ? categoryId : undefined, // Allow setting to null
                // Update note data in JSON field (images stored in media table)
                openHours: {
                    isLocationNote: true,
                    content: content || "",
                    mood,
                    timestamp: new Date().toISOString(),
                },
            },
            include: {
                categoryModel: true, // Include category relation
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

        const responseData = {
            id: updatedNote.id,
            lng: updatedNote.lng,
            lat: updatedNote.lat,
            address: updatedNote.address,
            content,
            mood,
            timestamp: new Date(),
            images: updatedNote.media.map(media => media.url),
            hasImages: updatedNote.media.length > 0,
            categorySlug: updatedNote.categoryModel?.slug, // Include category slug
        };

        return NextResponse.json(responseData);

    } catch (error) {
        console.error("Error updating location note:", error);
        return NextResponse.json(
            { error: "Failed to update location note" },
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
