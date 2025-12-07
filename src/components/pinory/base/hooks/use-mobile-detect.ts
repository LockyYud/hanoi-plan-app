"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook to detect mobile viewport
 * @param breakpoint - The width breakpoint for mobile detection (default: 768)
 * @returns boolean indicating if viewport is mobile
 */
export function useMobileDetect(breakpoint: number = 768): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(globalThis.innerWidth < breakpoint);
        };

        // Initial check
        checkMobile();

        // Listen for resize
        globalThis.addEventListener("resize", checkMobile);

        return () => {
            globalThis.removeEventListener("resize", checkMobile);
        };
    }, [breakpoint]);

    return isMobile;
}
