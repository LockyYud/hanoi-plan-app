import { create } from 'zustand'
import { TutorialStore, TourType, UserOnboarding } from '../types'
import { tutorialAPI } from '../api/tutorialAPI'

const initialState = {
  currentTour: null as TourType | null,
  currentStep: 0,
  isWelcomeDialogOpen: false,
  activeTooltips: [] as string[],
  progress: null as UserOnboarding | null,
  isLoading: false,
}

export const useTutorialStore = create<TutorialStore>((set, get) => ({
  ...initialState,

  // Tour control
  startTour: (tourType: TourType) => {
    set({ currentTour: tourType, currentStep: 0 })
    
    // Mark tour as started if it's the welcome tour
    if (tourType === 'welcome' || tourType === 'map-navigation') {
      get().updateProgress('tourStarted', true)
    }
  },

  nextStep: () => {
    set((state) => ({ currentStep: state.currentStep + 1 }))
  },

  prevStep: () => {
    set((state) => ({ 
      currentStep: Math.max(0, state.currentStep - 1) 
    }))
  },

  completeTour: () => {
    const { currentTour } = get()
    
    // Mark specific progress based on tour type
    if (currentTour === 'map-navigation') {
      get().updateProgress('tourCompleted', true)
    }

    set({ currentTour: null, currentStep: 0 })
  },

  skipTour: () => {
    const { currentTour } = get()
    
    if (currentTour === 'welcome' || currentTour === 'map-navigation') {
      get().updateProgress('tourSkipped', true)
    }

    set({ currentTour: null, currentStep: 0 })
  },

  closeTour: () => {
    set({ currentTour: null, currentStep: 0 })
  },

  // Progress tracking
  setProgress: (progress: UserOnboarding) => {
    set({ progress })
  },

  updateProgress: async (field, value) => {
    const { progress } = get()
    
    // Optimistic update
    if (progress) {
      set({
        progress: {
          ...progress,
          [field]: value,
        },
      })
    }

    // API call
    const updated = await tutorialAPI.updateProgress(field, value)
    
    if (updated) {
      set({ progress: updated })
    } else if (progress) {
      // Rollback on error
      set({ progress })
    }
  },

  markMilestone: async (milestone, metadata) => {
    await tutorialAPI.markMilestone(milestone, metadata)
    
    // Update local state based on milestone
    switch (milestone) {
      case 'first_pinory_created':
        get().updateProgress('firstPinoryCreated', true)
        break
      case 'first_photo_added':
        get().updateProgress('firstPhotoAdded', true)
        break
      case 'viewed_pinories_list':
        get().updateProgress('viewedPinoriesList', true)
        break
      case 'profile_completed':
        get().updateProgress('profileCompleted', true)
        break
    }
  },

  loadProgress: async () => {
    set({ isLoading: true })
    
    try {
      const progress = await tutorialAPI.getProgress()
      set({ progress, isLoading: false })
      
      // Auto-show welcome dialog if user is new
      if (progress && !progress.welcomeSeen) {
        set({ isWelcomeDialogOpen: true })
      }
    } catch (error) {
      console.error('Error loading tutorial progress:', error)
      set({ isLoading: false })
    }
  },

  // Tooltip management
  showTooltip: (tooltipId: string) => {
    set((state) => ({
      activeTooltips: [...state.activeTooltips, tooltipId],
    }))
  },

  hideTooltip: (tooltipId: string) => {
    set((state) => ({
      activeTooltips: state.activeTooltips.filter((id) => id !== tooltipId),
    }))
  },

  clearAllTooltips: () => {
    set({ activeTooltips: [] })
  },

  // Dialog control
  setWelcomeDialogOpen: (open: boolean) => {
    set({ isWelcomeDialogOpen: open })
    
    // Mark welcome as seen when closing
    if (!open && get().progress && !get().progress!.welcomeSeen) {
      get().updateProgress('welcomeSeen', true)
    }
  },

  // Utility
  shouldShowTour: (tourType: TourType) => {
    const { progress } = get()
    
    if (!progress) return false

    switch (tourType) {
      case 'welcome':
        return !progress.welcomeSeen
      case 'map-navigation':
        return progress.welcomeSeen && !progress.tourCompleted && !progress.tourSkipped
      case 'first-pinory':
        return !progress.firstPinoryCreated
      case 'sidebar':
        return !progress.viewedPinoriesList && progress.firstPinoryCreated
      case 'friends-feature':
        return !progress.friendsButtonSeen
      case 'journeys-feature':
        return progress.firstPinoryCreated
      default:
        return false
    }
  },

  resetAllProgress: async () => {
    const success = await tutorialAPI.resetProgress()
    
    if (success) {
      set({
        ...initialState,
        isWelcomeDialogOpen: true,
      })
      
      // Reload progress
      get().loadProgress()
    }
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading })
  },
}))

