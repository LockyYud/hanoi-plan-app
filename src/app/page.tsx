"use client";

import { MapContainer } from "@/components/map/map-container";
import { Sidebar } from "@/components/layout/sidebar";
import { LandingPage } from "@/components/landing/landing-page";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const { sidebarOpen } = useUIStore();
    const { data: session, status } = useSession();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted || status === "loading") {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
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
        <div className="h-screen flex overflow-hidden" suppressHydrationWarning>
            <Sidebar />

            <main
                className={cn(
                    "flex-1 transition-all duration-300 relative",
                    sidebarOpen ? "ml-80" : "ml-0"
                )}
            >
                <MapContainer className="h-full" />
            </main>
        </div>
    );
}
