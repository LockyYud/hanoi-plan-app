import { UserOnboarding } from '../types'

export const tutorialAPI = {
  /**
   * Get user's onboarding progress
   */
  async getProgress(): Promise<UserOnboarding | null> {
    try {
      const response = await fetch('/api/tutorial/progress', {
        method: 'GET',
        credentials: 'include',
      })

      if (!response.ok) {
        if (response.status === 404) {
          return null
        }
        throw new Error('Failed to fetch tutorial progress')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error fetching tutorial progress:', error)
      return null
    }
  },

  /**
   * Update a specific field in the onboarding progress
   */
  async updateProgress(
    field: keyof Omit<UserOnboarding, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
    value: boolean
  ): Promise<UserOnboarding | null> {
    try {
      const response = await fetch('/api/tutorial/progress', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ field, value }),
      })

      if (!response.ok) {
        throw new Error('Failed to update tutorial progress')
      }

      const data = await response.json()
      return data
    } catch (error) {
      console.error('Error updating tutorial progress:', error)
      return null
    }
  },

  /**
   * Mark a milestone achievement
   */
  async markMilestone(milestone: string, metadata?: any): Promise<boolean> {
    try {
      const response = await fetch('/api/tutorial/milestone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ milestone, metadata }),
      })

      return response.ok
    } catch (error) {
      console.error('Error marking milestone:', error)
      return false
    }
  },

  /**
   * Reset all tutorial progress (for testing/development)
   */
  async resetProgress(): Promise<boolean> {
    try {
      const response = await fetch('/api/tutorial/reset', {
        method: 'POST',
        credentials: 'include',
      })

      return response.ok
    } catch (error) {
      console.error('Error resetting tutorial progress:', error)
      return false
    }
  },
}

