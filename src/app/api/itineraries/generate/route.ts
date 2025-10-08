import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"

const GenerateItinerarySchema = z.object({
    groupId: z.string(),
    preferences: z.object({
        maxStops: z.number().min(2).max(10).default(5),
        maxTravelTime: z.number().min(30).max(480).default(120), // minutes
        categories: z.array(z.string()).default([]),
        startLocation: z.object({
            lat: z.number(),
            lng: z.number(),
            name: z.string().optional(),
        }).optional(),
        endLocation: z.object({
            lat: z.number(),
            lng: z.number(),
            name: z.string().optional(),
        }).optional(),
    }),
})

// Mock algorithm to generate itineraries
function generateMockItinerary(preferences: any, routeNumber: number) {
    const samplePlaces = [
        {
            id: "place-1",
            name: "Cà phê Cộng",
            lat: 21.0227,
            lng: 105.8194,
            category: "cafe",
            rating: 4.5,
            priceLevel: 2,
            estimatedTime: 60,
        },
        {
            id: "place-2",
            name: "Hồ Hoàn Kiếm",
            lat: 21.0285,
            lng: 105.8542,
            category: "landmark",
            rating: 4.8,
            priceLevel: 1,
            estimatedTime: 90,
        },
        {
            id: "place-3",
            name: "Bánh mì 25 Hàng Cá",
            lat: 21.0306,
            lng: 105.8532,
            category: "food",
            rating: 4.3,
            priceLevel: 1,
            estimatedTime: 30,
        },
        {
            id: "place-4",
            name: "Temple of Literature",
            lat: 21.0266,
            lng: 105.8357,
            category: "landmark",
            rating: 4.6,
            priceLevel: 1,
            estimatedTime: 120,
        },
        {
            id: "place-5",
            name: "The Summit Lounge",
            lat: 21.0333,
            lng: 105.8133,
            category: "rooftop",
            rating: 4.7,
            priceLevel: 4,
            estimatedTime: 90,
        },
    ];

    // Simple algorithm: select places and create route
    const maxStops = Math.min(preferences.maxStops || 5, samplePlaces.length);
    const selectedPlaces = samplePlaces
        .sort(() => 0.5 - Math.random()) // Random selection for demo
        .slice(0, maxStops - routeNumber); // Vary by route number

    const stops = selectedPlaces.map((place, index) => {
        const baseTime = new Date();
        baseTime.setHours(9 + index * 2); // Start at 9 AM, 2 hours apart

        return {
            id: `stop-${place.id}-${index}`,
            seq: index + 1,
            place,
            arriveTime: baseTime.toISOString(),
            departTime: new Date(baseTime.getTime() + place.estimatedTime * 60000).toISOString(),
            travelMinutes: index === 0 ? 0 : Math.floor(Math.random() * 30) + 10,
        };
    });

    const totalBudget = selectedPlaces.reduce((sum, place) => sum + (place.priceLevel * 100000), 0);
    const totalTime = stops.reduce((sum, stop) => sum + stop.travelMinutes + 60, 0);

    return {
        id: `itinerary-${routeNumber}`,
        title: `Lộ trình ${routeNumber}`,
        score: Math.random() * 0.3 + 0.7, // Random score between 0.7-1.0
        totalDuration: totalTime,
        totalBudget,
        totalDistance: Math.floor(Math.random() * 10) + 5, // km
        stops,
        rationale: generateRationale(selectedPlaces, totalBudget, totalTime),
    };
}

function generateRationale(places: any[], budget: number, time: number): string {
    const reasons = [
        `Tuyến này có ${places.length} điểm thú vị`,
        `Thời gian di chuyển tối ưu: ${Math.floor(time / 60)}h${time % 60}m`,
        `Ngân sách ước tính: ${(budget / 1000).toFixed(0)}k VND/người`,
        `Kết hợp hoàn hảo giữa ${places.map(p => p.category).join(', ')}`,
    ];
    return reasons.join('. ') + '.';
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const data = GenerateItinerarySchema.parse(body)

        // Generate 2-3 route options
        const routes = [1, 2, 3].map(routeNum => generateMockItinerary(data.preferences, routeNum));

        // Sort by score (best first)
        routes.sort((a, b) => b.score - a.score);

        return NextResponse.json({
            success: true,
            routes,
            generatedAt: new Date().toISOString(),
            preferences: data.preferences,
        })

    } catch (error) {
        console.error('Error generating itinerary:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to generate itinerary' },
            { status: 500 }
        )
    }
}

