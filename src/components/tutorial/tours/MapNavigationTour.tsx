"use client"

import { Tour } from 'antd'
import type { TourProps } from 'antd'
import { useTutorial } from '@/lib/tutorial'
import { MAP_NAVIGATION_STEPS } from '@/lib/tutorial'
import { useEffect, useState } from 'react'

export function MapNavigationTour() {
  const { currentTour, currentStep, completeTour, closeTour, nextStep, prevStep } = useTutorial()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setOpen(currentTour === 'map-navigation')
  }, [currentTour])

  const handleClose = () => {
    setOpen(false)
    closeTour()
  }

  const handleFinish = () => {
    setOpen(false)
    completeTour()
  }

  const steps: TourProps['steps'] = MAP_NAVIGATION_STEPS.map((step, index) => ({
    title: step.title,
    description: step.description,
    target: step.target === 'center' ? null : () => {
      const selector = step.target as string
      const element = document.querySelector(selector)
      return element as HTMLElement
    },
    placement: step.placement || 'bottom',
    type: step.type,
    nextButtonProps: {
      children: index === MAP_NAVIGATION_STEPS.length - 1 ? 'Get Started!' : 'Next',
    },
    prevButtonProps: {
      children: 'Back',
    },
  }))

  return (
    <Tour
      open={open}
      onClose={handleClose}
      onFinish={handleFinish}
      current={currentStep}
      onChange={(current) => {
        // Update step when user navigates
        if (current > currentStep) {
          nextStep()
        } else if (current < currentStep) {
          prevStep()
        }
      }}
      steps={steps}
      mask={{
        style: {
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
        },
      }}
      zIndex={1001}
    />
  )
}

