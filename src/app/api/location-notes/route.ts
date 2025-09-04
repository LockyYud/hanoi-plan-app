import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET /api/location-notes - Get all location notes
export async function GET() {
    try {
        if (!prisma) {
            return NextResponse.json({ error: "Database not available" }, { status: 503 });
        }

        // For development: Get all location notes (stored as places with isLocationNote flag)
        const notes = await prisma.place.findMany({
            where: {
                openHours: {
                    path: ["isLocationNote"],
                    equals: true,
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        // Transform to location note format
        const locationNotes = notes.map(note => ({
            id: note.id,
            lng: note.lng,
            lat: note.lat,
            address: note.address,
            content: (note.openHours as any)?.content || "",
            mood: (note.openHours as any)?.mood || "📝",
            timestamp: (note.openHours as any)?.timestamp ? new Date((note.openHours as any).timestamp) : note.createdAt,
            images: (note.openHours as any)?.images || [],
        }));

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
        const session = await getServerSession(authOptions);
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!prisma) {
            return NextResponse.json({ error: "Database not available" }, { status: 503 });
        }

        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
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
