import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/tutorial/reset
 * Reset all tutorial progress (for testing/development)
 */
export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Delete existing onboarding record
    await prisma.userOnboarding.deleteMany({
      where: { userId },
    })

    // Create a fresh one
    const newOnboarding = await prisma.userOnboarding.create({
      data: {
        userId,
      },
    })

    console.log(`🔄 Tutorial progress reset for user ${userId}`)

    return NextResponse.json(newOnboarding)
  } catch (error) {
    console.error('Error resetting tutorial progress:', error)
    return NextResponse.json(
      { error: 'Failed to reset tutorial progress' },
      { status: 500 }
    )
  }
}

