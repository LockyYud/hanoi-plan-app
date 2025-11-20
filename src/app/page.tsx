"use client";

import { MapContainer } from "@/components/map/map-container";
import { Sidebar } from "@/components/layout/sidebar";
import { LandingPage } from "@/components/landing/landing-page";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const { data: session, status } = useSession();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || status === "loading") {
    return (
      <div className="h-svh flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải Pinory...</p>
        </div>
      </div>
    );
  }

  // Show landing page if not authenticated
  if (!session) {
    return <LandingPage />;
  }

  // Show main app if authenticated
  return (
    <div className="h-svh flex overflow-hidden" suppressHydrationWarning>
      <Sidebar />

      {/* Map container takes full width, sidebar overlays on top */}
      <main className="flex-1 relative w-full h-full">
        <MapContainer className="h-full" />
      </main>
    </div>
  );
}
