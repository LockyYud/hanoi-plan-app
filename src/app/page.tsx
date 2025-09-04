"use client";

import { MapContainer } from "@/components/map/map-container";
import { Sidebar } from "@/components/layout/sidebar";
import { useUIStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

export default function Home() {
    const [mounted, setMounted] = useState(false);
    const { sidebarOpen } = useUIStore();

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải Hanoi Plan...</p>
                </div>
            </div>
        );
    }

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
