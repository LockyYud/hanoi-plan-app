import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const defaultCategories = [
  {
    name: 'Cafe',
    slug: 'cafe',
    icon: '☕',
    color: '#8B4513',
    isDefault: true,
  },
  {
    name: 'Food',
    slug: 'food',
    icon: '🍽️',
    color: '#FF6B35',
    isDefault: true,
  },
  {
    name: 'Bar',
    slug: 'bar',
    icon: '🍻',
    color: '#8E44AD',
    isDefault: true,
  },
  {
    name: 'Rooftop',
    slug: 'rooftop',
    icon: '🏢',
    color: '#3498DB',
    isDefault: true,
  },
  {
    name: 'Activity',
    slug: 'activity',
    icon: '🎯',
    color: '#E74C3C',
    isDefault: true,
  },
  {
    name: 'Landmark',
    slug: 'landmark',
    icon: '🏛️',
    color: '#2ECC71',
    isDefault: true,
  },
]

async function seedCategories() {
  console.log('Seeding default categories...')

  for (const category of defaultCategories) {
    await prisma.category.upsert({
      where: {
        slug_userId: {
          slug: category.slug,
          userId: null,
        },
      },
      update: {},
      create: category,
    })
  }

  console.log('Default categories seeded successfully!')
}

// Helper function để tạo categories cho user mới
export async function createUserDefaultCategories(userId: string) {
  const userCategories = defaultCategories.map(cat => ({
    ...cat,
    userId,
    isDefault: false,
  }))

  await prisma.category.createMany({
    data: userCategories,
    skipDuplicates: true,
  })
}

// Helper function để lấy categories cho user
export async function getUserCategories(userId: string) {
  return await prisma.category.findMany({
    where: {
      OR: [
        { userId: null, isDefault: true }, // System defaults
        { userId }, // User custom categories  
      ],
      isActive: true,
    },
    orderBy: [
      { isDefault: 'desc' }, // System defaults first
      { name: 'asc' },
    ],
  })
}

if (require.main === module) {
  seedCategories()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}