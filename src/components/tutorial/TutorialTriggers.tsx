"use client"

import { useEffect } from 'react'
import { useTutorial } from '@/lib/tutorial'

/**
 * TutorialTriggers
 * Listens for events and triggers appropriate tours
 */
export function TutorialTriggers() {
  const { progress, startTour, shouldShowTour } = useTutorial()

  // Listen for pinory form open event
  useEffect(() => {
    const handlePinoryFormOpen = () => {
      // Only show tour if:
      // 1. User hasn't created first pinory yet
      // 2. Tour hasn't been shown before
      if (progress && !progress.firstPinoryCreated && shouldShowTour('first-pinory')) {
        // Small delay to let form render
        setTimeout(() => {
          startTour('first-pinory')
        }, 500)
      }
    }

    window.addEventListener('pinoryFormOpened', handlePinoryFormOpen)

    return () => {
      window.removeEventListener('pinoryFormOpened', handlePinoryFormOpen)
    }
  }, [progress, startTour, shouldShowTour])

  return null
}

