import { NextRequest, NextResponse } from "next/server"

export async function GET(
    request: NextRequest,
    { params }: { params: { slug: string } }
) {
    try {
        const slug = params.slug

        // Mock shared itinerary data
        const mockSharedItinerary = {
            id: "shared-itinerary-1",
            title: "Weekend trong phố cổ",
            description: "Khám phá Hà Nội cổ kính trong 2 ngày thú vị",
            group: {
                name: "Nhóm bạn thân",
                memberCount: 4,
            },
            schedule: {
                startDate: "2024-01-20",
                endDate: "2024-01-21",
                totalDuration: "2 ngày 1 đêm",
            },
            budget: {
                estimated: 800000,
                perPerson: 200000,
                currency: "VND",
            },
            stops: [
                {
                    id: "stop-1",
                    name: "Hồ Hoàn Kiếm",
                    category: "landmark",
                    time: "09:00 - 10:30",
                    description: "Khởi đầu với biểu tượng của Hà Nội",
                    address: "Hoàn Kiếm, Hà Nội",
                    lat: 21.0285,
                    lng: 105.8542,
                },
                {
                    id: "stop-2",
                    name: "Cà phê Cộng",
                    category: "cafe",
                    time: "10:45 - 12:00",
                    description: "Thưởng thức cà phê đặc trưng Việt Nam",
                    address: "152 Trung Liệt, Đống Đa",
                    lat: 21.0227,
                    lng: 105.8194,
                },
                {
                    id: "stop-3",
                    name: "Bánh mì 25 Hàng Cá",
                    category: "food",
                    time: "12:15 - 13:00",
                    description: "Bánh mì ngon nhất phố cổ",
                    address: "25 Hàng Cá, Hoàn Kiếm",
                    lat: 21.0306,
                    lng: 105.8532,
                },
                {
                    id: "stop-4",
                    name: "Temple of Literature",
                    category: "landmark",
                    time: "14:00 - 16:00",
                    description: "Khám phá di sản văn hóa Việt Nam",
                    address: "58 Quốc Tử Giám, Đống Đa",
                    lat: 21.0266,
                    lng: 105.8357,
                },
            ],
            sharing: {
                createdAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
                isPublic: true,
                viewCount: Math.floor(Math.random() * 50) + 10,
            },
            tags: ["cultural", "foodie", "walking", "historic"],
        }

        return NextResponse.json(mockSharedItinerary)

    } catch (error) {
        console.error('Error fetching shared itinerary:', error)
        return NextResponse.json(
            { error: 'Shared itinerary not found' },
            { status: 404 }
        )
    }
}

