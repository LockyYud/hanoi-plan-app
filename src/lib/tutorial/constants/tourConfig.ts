export const TOUR_CONFIG = {
  // Timing
  DEFAULT_TOOLTIP_DURATION: 8000, // 8 seconds
  TOOLTIP_SHOW_DELAY: 2000, // 2 seconds before showing
  MILESTONE_CELEBRATION_DURATION: 5000, // 5 seconds
  
  // Feature discovery delays
  PINORIES_BUTTON_DELAY: 30000, // 30 seconds after first pinory
  FRIENDS_BUTTON_DELAY: 120000, // 2 minutes after app start
  
  // Tour settings
  AUTO_SCROLL: true,
  MASK_ENABLED: true,
  KEYBOARD_NAVIGATION: true,
  
  // Z-index
  TOUR_Z_INDEX: 1001,
  TOOLTIP_Z_INDEX: 1000,
  WELCOME_DIALOG_Z_INDEX: 1002,
} as const

export const TOUR_THEME = {
  token: {
    borderRadius: 12,
    colorPrimary: '#2563eb', // Blue
  },
} as const

