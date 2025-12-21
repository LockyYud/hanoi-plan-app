import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/tutorial/milestone
 * Track milestone achievements
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id
    const body = await request.json()
    const { milestone, metadata } = body

    if (!milestone) {
      return NextResponse.json(
        { error: 'Milestone name is required' },
        { status: 400 }
      )
    }

    console.log(`📊 Milestone reached: ${milestone} by user ${userId}`, metadata)

    // Map milestone to onboarding field
    const milestoneFieldMap: Record<string, string> = {
      first_pinory_created: 'firstPinoryCreated',
      first_photo_added: 'firstPhotoAdded',
      viewed_pinories_list: 'viewedPinoriesList',
      profile_completed: 'profileCompleted',
      fab_tooltip_seen: 'fabTooltipSeen',
      pinories_button_seen: 'pinoriesButtonSeen',
      friends_button_seen: 'friendsButtonSeen',
    }

    const field = milestoneFieldMap[milestone]

    if (field) {
      // Update onboarding record
      await prisma.userOnboarding.upsert({
        where: { userId },
        update: {
          [field]: true,
        },
        create: {
          userId,
          [field]: true,
        },
      })
    }

    // You can add analytics tracking here
    // await trackAnalytics('milestone_reached', { userId, milestone, metadata })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error tracking milestone:', error)
    return NextResponse.json(
      { error: 'Failed to track milestone' },
      { status: 500 }
    )
  }
}

