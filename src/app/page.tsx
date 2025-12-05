"use client";

import { MapContainer } from "@/components/map/core/map-container";
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

    // Show main app if authenticated - full screen map with floating controls
    return (
        <div className="h-svh w-full overflow-hidden" suppressHydrationWarning>
            <MapContainer className="h-full w-full" />
        </div>
    );
}
