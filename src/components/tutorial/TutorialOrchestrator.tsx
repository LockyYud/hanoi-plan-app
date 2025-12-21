"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useTutorial } from '@/lib/tutorial'
import { WelcomeDialog } from './dialogs/WelcomeDialog'
import { MapNavigationTour } from './tours/MapNavigationTour'
import { FirstPinoryTour } from './tours/FirstPinoryTour'
import { TutorialTriggers } from './TutorialTriggers'

/**
 * TutorialOrchestrator
 * Manages the tutorial flow and decides which tour/dialog to show
 */
export function TutorialOrchestrator() {
  const { data: session, status } = useSession()
  const { progress, loadProgress, isLoading, startTour, shouldShowTour } = useTutorial()

  // Load progress when user is authenticated
  useEffect(() => {
    if (status === 'authenticated' && !progress && !isLoading) {
      loadProgress()
    }
  }, [status, progress, isLoading, loadProgress])

  // Auto-show FAB tooltip after tour completion
  useEffect(() => {
    if (progress?.tourCompleted && !progress?.firstPinoryCreated && !progress?.fabTooltipSeen) {
      // Wait a bit then show FAB tooltip
      const timer = setTimeout(() => {
        // We'll handle this with a separate tooltip component later
        console.log('💡 Show FAB tooltip')
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [progress])

  // Don't render anything if not authenticated or still loading
  if (status !== 'authenticated' || !progress) {
    return null
  }

  return (
    <>
      {/* Welcome Dialog - shows on first visit */}
      <WelcomeDialog />

      {/* Map Navigation Tour - shows after user clicks "Start Tour" */}
      <MapNavigationTour />

      {/* First Pinory Tour - shows when creating first pinory */}
      <FirstPinoryTour />

      {/* Tutorial event triggers */}
      <TutorialTriggers />
    </>
  )
}

