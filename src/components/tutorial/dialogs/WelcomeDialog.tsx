"use client"

import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { MapPin, Users, Camera, Map as MapIcon, Sparkles } from 'lucide-react'
import { useTutorial } from '@/lib/tutorial'

export function WelcomeDialog() {
  const { isWelcomeDialogOpen, setWelcomeDialogOpen, startTour, skipTour } = useTutorial()

  const handleStartTour = () => {
    setWelcomeDialogOpen(false)
    // Wait for dialog to close, then start tour
    setTimeout(() => {
      startTour('map-navigation')
    }, 300)
  }

  const handleSkip = () => {
    skipTour()
    setWelcomeDialogOpen(false)
  }

  return (
    <Dialog open={isWelcomeDialogOpen} onOpenChange={setWelcomeDialogOpen}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8 text-white">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="h-12 w-12 animate-pulse" />
            </div>
            <h2 className="text-3xl font-bold text-center mb-2">
              Welcome to Pinory!
            </h2>
            <p className="text-center text-white/90 text-lg">
              Drop a pin, keep a memory
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Features */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center mb-3">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Save Places</h3>
              <p className="text-sm text-gray-600">
                Pin your favorite spots on the map
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
              <div className="w-12 h-12 rounded-full bg-purple-600 flex items-center justify-center mb-3">
                <Camera className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Add Photos</h3>
              <p className="text-sm text-gray-600">
                Capture memories with pictures
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-pink-50 hover:bg-pink-100 transition-colors">
              <div className="w-12 h-12 rounded-full bg-pink-600 flex items-center justify-center mb-3">
                <MapIcon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Create Journeys</h3>
              <p className="text-sm text-gray-600">
                Connect places into trips
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
              <div className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center mb-3">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Share with Friends</h3>
              <p className="text-sm text-gray-600">
                Discover places together
              </p>
            </div>
          </div>

          {/* CTA Text */}
          <div className="text-center pt-4">
            <p className="text-gray-600 mb-6">
              Would you like a quick tour to get started?
            </p>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleSkip}
                className="flex-1 h-12 text-base"
              >
                Skip for now
              </Button>
              <Button
                onClick={handleStartTour}
                className="flex-1 h-12 text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                Start Tour
              </Button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              You can always restart the tour from your profile settings
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

