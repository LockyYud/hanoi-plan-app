import { useEffect } from 'react'
import { useTutorialStore } from '../store/tutorialStore'
import { TourType } from '../types'

/**
 * Main hook for interacting with the tutorial system
 */
export function useTutorial() {
  const store = useTutorialStore()

  // Load progress on mount
  useEffect(() => {
    if (!store.progress && !store.isLoading) {
      store.loadProgress()
    }
  }, [])

  return {
    // State
    currentTour: store.currentTour,
    currentStep: store.currentStep,
    isWelcomeDialogOpen: store.isWelcomeDialogOpen,
    activeTooltips: store.activeTooltips,
    progress: store.progress,
    isLoading: store.isLoading,

    // Actions
    startTour: store.startTour,
    nextStep: store.nextStep,
    prevStep: store.prevStep,
    completeTour: store.completeTour,
    skipTour: store.skipTour,
    closeTour: store.closeTour,
    
    updateProgress: store.updateProgress,
    markMilestone: store.markMilestone,
    loadProgress: store.loadProgress,
    
    showTooltip: store.showTooltip,
    hideTooltip: store.hideTooltip,
    clearAllTooltips: store.clearAllTooltips,
    
    setWelcomeDialogOpen: store.setWelcomeDialogOpen,
    
    shouldShowTour: store.shouldShowTour,
    resetAllProgress: store.resetAllProgress,
  }
}

/**
 * Hook to check if a specific tour should be shown
 */
export function useShouldShowTour(tourType: TourType) {
  const shouldShowTour = useTutorialStore((state) => state.shouldShowTour)
  return shouldShowTour(tourType)
}

/**
 * Hook to get tutorial progress
 */
export function useTutorialProgress() {
  const progress = useTutorialStore((state) => state.progress)
  const isLoading = useTutorialStore((state) => state.isLoading)
  
  return { progress, isLoading }
}

