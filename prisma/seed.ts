import { PrismaClient, CategoryType } from '@prisma/client'

const prisma = new PrismaClient()

const samplePlaces = [
    {
        name: "Cà phê Cộng",
        address: "152 Trung Liệt, Đống Đa, Hà Nội",
        ward: "Trung Liệt",
        district: "Đống Đa",
        lat: 21.0227,
        lng: 105.8194,
        priceLevel: 2,
        category: "cafe" as CategoryType,
        phone: "024 3537 2826",
        tags: ["vintage", "local", "affordable", "wifi"]
    },
    {
        name: "Bánh mì 25 Hàng Cá",
        address: "25 Hàng Cá, Hoàn Kiếm, Hà Nội",
        ward: "Hoàn Kiếm",
        district: "Hoàn Kiếm",
        lat: 21.0306,
        lng: 105.8532,
        priceLevel: 1,
        category: "food" as CategoryType,
        tags: ["street food", "authentic", "cheap", "local favorite"]
    },
    {
        name: "The Summit Lounge",
        address: "65th floor, Lotte Center, 54 Liễu Giai, Ba Đình, Hà Nội",
        ward: "Cống Vị",
        district: "Ba Đình",
        lat: 21.0333,
        lng: 105.8133,
        priceLevel: 4,
        category: "rooftop" as CategoryType,
        phone: "024 3333 1000",
        website: "https://lottehotel.com/hanoi",
        tags: ["view", "luxury", "cocktails", "skyline"]
    },
    {
        name: "Hồ Hoàn Kiếm",
        address: "Hồ Hoàn Kiếm, Hoàn Kiếm, Hà Nội",
        ward: "Hoàn Kiếm",
        district: "Hoàn Kiếm",
        lat: 21.0285,
        lng: 105.8542,
        category: "landmark" as CategoryType,
        tags: ["historic", "scenic", "walking", "iconic"]
    },
    {
        name: "Bún chả Hương Liên",
        address: "24 Lê Văn Hưu, Hai Bà Trưng, Hà Nội",
        ward: "Phan Chu Trinh",
        district: "Hai Bà Trưng",
        lat: 21.0156,
        lng: 105.8475,
        priceLevel: 2,
        category: "food" as CategoryType,
        phone: "024 3943 4106",
        tags: ["bun cha", "obama", "famous", "traditional"]
    },
    {
        name: "Bia Hơi Corner",
        address: "Tạ Hiện, Hoàn Kiếm, Hà Nội",
        ward: "Hoàn Kiếm",
        district: "Hoàn Kiếm",
        lat: 21.0308,
        lng: 105.8525,
        priceLevel: 1,
        category: "bar" as CategoryType,
        tags: ["beer", "street", "nightlife", "backpacker"]
    },
    {
        name: "Temple of Literature",
        address: "58 Quốc Tử Giám, Đống Đa, Hà Nội",
        ward: "Quốc Tử Giám",
        district: "Đống Đa",
        lat: 21.0266,
        lng: 105.8357,
        category: "landmark" as CategoryType,
        tags: ["temple", "historic", "education", "peaceful"]
    },
    {
        name: "Cà phê Đinh",
        address: "13 Đinh Tiên Hoàng, Hoàn Kiếm, Hà Nội",
        ward: "Hoàn Kiếm",
        district: "Hoàn Kiếm",
        lat: 21.0289,
        lng: 105.8539,
        priceLevel: 2,
        category: "cafe" as CategoryType,
        tags: ["local", "traditional", "authentic", "lake view"]
    },
    {
        name: "Weekend Night Market",
        address: "Hàng Đào, Hoàn Kiếm, Hà Nội",
        ward: "Hoàn Kiếm",
        district: "Hoàn Kiếm",
        lat: 21.0314,
        lng: 105.8511,
        category: "activity" as CategoryType,
        tags: ["market", "shopping", "weekend", "street food"]
    },
    {
        name: "Tây Hồ Water Park",
        address: "614 Lạc Long Quân, Tây Hồ, Hà Nội",
        ward: "Xuân La",
        district: "Tây Hồ",
        lat: 21.0583,
        lng: 105.8094,
        priceLevel: 3,
        category: "activity" as CategoryType,
        phone: "024 3718 8888",
        tags: ["water park", "family", "fun", "summer"]
    }
]

async function main() {
    console.log('Start seeding...')

    // Create a default user for seeding
    const user = await prisma.user.upsert({
        where: { email: 'admin@hanoiplan.com' },
        update: {},
        create: {
            email: 'admin@hanoiplan.com',
            name: 'Admin User',
        },
    })

    // Create places
    for (const placeData of samplePlaces) {
        const { tags, ...placeInfo } = placeData

        const place = await prisma.place.upsert({
            where: {
                // Use a combination of name and location for uniqueness
                id: `${placeInfo.name.toLowerCase().replace(/\s+/g, '-')}-${placeInfo.district.toLowerCase()}`,
            },
            update: {},
            create: {
                id: `${placeInfo.name.toLowerCase().replace(/\s+/g, '-')}-${placeInfo.district.toLowerCase()}`,
                ...placeInfo,
                createdBy: user.id,
                tags: {
                    create: tags.map(tag => ({ tag }))
                }
            },
            include: {
                tags: true
            }
        })

        console.log(`Created place: ${place.name}`)
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
