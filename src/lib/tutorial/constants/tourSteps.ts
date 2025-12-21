import { TourStepConfig } from '../types'

export const MAP_NAVIGATION_STEPS: TourStepConfig[] = [
  {
    target: 'center',
    title: '🗺️ Welcome to Pinory!',
    description: 'This is your personal memory map. Drop pins to save your favorite places, create journeys, and share moments with friends.',
    placement: 'center',
    type: 'primary',
  },
  {
    target: '[data-tour="user-location"]',
    title: '📍 Find Yourself',
    description: 'Click this button to center the map on your current location.',
    placement: 'left',
  },
  {
    target: '[data-tour="fab"]',
    title: '✨ Create Your First Pinory',
    description: 'This is the magic button! Click here to drop a pin at your current location and save a memory.',
    placement: 'left',
    type: 'primary',
  },
  {
    target: '[data-tour="sidebar-toggle"]',
    title: '📋 Your Collections',
    description: 'Access all your pinories, journeys, friends, and profile settings from here.',
    placement: 'right',
  },
  {
    target: 'center',
    title: '🎯 Ready to Start!',
    description: 'You\'re all set! Let\'s create your first pinory and start building your memory map.',
    placement: 'center',
    type: 'primary',
  },
]

export const FIRST_PINORY_STEPS: TourStepConfig[] = [
  {
    target: '[data-tour="pinory-form"]',
    title: '🎯 Create Your First Pinory',
    description: 'Let\'s save this special place! Just fill in a few details to create your memory.',
    placement: 'center',
    type: 'primary',
  },
  {
    target: '[data-tour="place-name"]',
    title: '📝 Name This Place',
    description: 'Give it a memorable name - could be a cafe, park, restaurant, or any special spot.',
    placement: 'top',
  },
  {
    target: '[data-tour="visit-time"]',
    title: '⏰ When Did You Visit?',
    description: 'Select the date and time you visited this place. This helps you organize your memories chronologically.',
    placement: 'top',
  },
  {
    target: '[data-tour="category"]',
    title: '🏷️ Pick a Category',
    description: 'Optional: Choose or create a category to organize your pinories. You can skip this for now!',
    placement: 'bottom',
  },
  {
    target: '[data-tour="photo-upload"]',
    title: '📸 Add Photos',
    description: 'Photos bring your memories to life! Upload pictures of this place to remember it better.',
    placement: 'top',
    type: 'primary',
  },
  {
    target: '[data-tour="content"]',
    title: '💭 Share Your Thoughts',
    description: 'Write a note about your experience - what you loved, what you ate, or how you felt (up to 280 characters).',
    placement: 'top',
  },
  {
    target: '[data-tour="visibility"]',
    title: '👁️ Choose Who Can See',
    description: 'Control your privacy: keep it private, share with friends only, or make it public for everyone.',
    placement: 'top',
  },
  {
    target: '[data-tour="save-button"]',
    title: '💾 Save Your Memory',
    description: 'All set! Click this button to save your first pinory and see it appear on your map.',
    placement: 'top',
    type: 'primary',
  },
]

export const SIDEBAR_STEPS: TourStepConfig[] = [
  {
    target: '[data-tour="pinories-tab"]',
    title: '📍 Pinories Tab',
    description: 'View all your saved pinories in a list. You can search, filter by category, and manage them here.',
    placement: 'right',
  },
  {
    target: '[data-tour="journeys-tab"]',
    title: '🗺️ Journeys Tab',
    description: 'Create journeys by connecting multiple pinories. Perfect for trips, food tours, or themed collections.',
    placement: 'right',
  },
  {
    target: '[data-tour="social-tab"]',
    title: '👥 Social Tab',
    description: 'Connect with friends, see their pinories, and discover new places through their recommendations.',
    placement: 'right',
  },
  {
    target: '[data-tour="profile-tab"]',
    title: '👤 Profile Tab',
    description: 'Manage your account, view statistics, export data, and customize your settings.',
    placement: 'right',
  },
]

export const FRIENDS_FEATURE_STEPS: TourStepConfig[] = [
  {
    target: '[data-tour="invite-friend"]',
    title: '✉️ Invite Friends',
    description: 'Share your unique invite link to connect with friends and start sharing memories.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="friend-requests"]',
    title: '📬 Friend Requests',
    description: 'Accept or decline friend requests. You can also see pending invitations you\'ve sent.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="friends-list"]',
    title: '👥 Your Friends',
    description: 'View your friends list. Click on any friend to see their shared pinories on the map.',
    placement: 'bottom',
  },
]

export const JOURNEYS_FEATURE_STEPS: TourStepConfig[] = [
  {
    target: '[data-tour="create-journey"]',
    title: '🎒 Create a Journey',
    description: 'Connect multiple pinories to create a journey. Great for documenting trips, food tours, or themed adventures.',
    placement: 'bottom',
  },
  {
    target: '[data-tour="journey-list"]',
    title: '📖 Your Journeys',
    description: 'View all your saved journeys. Click any journey to see the route on the map.',
    placement: 'bottom',
  },
]

