import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/tutorial/progress
 * Get user's onboarding progress
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Get or create onboarding record
    let onboarding = await prisma.userOnboarding.findUnique({
      where: { userId },
    })

    // Create if doesn't exist
    if (!onboarding) {
      onboarding = await prisma.userOnboarding.create({
        data: {
          userId,
        },
      })
    }

    return NextResponse.json(onboarding)
  } catch (error) {
    console.error('Error fetching tutorial progress:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tutorial progress' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/tutorial/progress
 * Update a specific field in the onboarding progress
 */
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { field, value } = body

    if (!field || typeof value !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      )
    }

    // Validate field name
    const allowedFields = [
      'welcomeSeen',
      'tourStarted',
      'tourCompleted',
      'tourSkipped',
      'fabTooltipSeen',
      'pinoriesButtonSeen',
      'friendsButtonSeen',
      'firstPinoryCreated',
      'firstPhotoAdded',
      'viewedPinoriesList',
      'profileCompleted',
    ]

    if (!allowedFields.includes(field)) {
      return NextResponse.json({ error: 'Invalid field name' }, { status: 400 })
    }

    // Update or create onboarding record
    const onboarding = await prisma.userOnboarding.upsert({
      where: { userId },
      update: {
        [field]: value,
      },
      create: {
        userId,
        [field]: value,
      },
    })

    return NextResponse.json(onboarding)
  } catch (error) {
    console.error('Error updating tutorial progress:', error)
    return NextResponse.json(
      { error: 'Failed to update tutorial progress' },
      { status: 500 }
    )
  }
}

