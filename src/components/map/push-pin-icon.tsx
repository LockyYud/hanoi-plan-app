"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface PushPinIconProps {
    readonly className?: string;
    /** Rotation of the pushpin: 'left' tilts left, 'right' tilts right, 'center' is straight */
    readonly tilt?: "left" | "center" | "right";
}

/**
 * PushPinIcon - A classic red pushpin SVG icon
 * Used to pin photos on the map, similar to a cork board
 */
export function PushPinIcon({ className, tilt = "center" }: PushPinIconProps) {
    // Rotation based on tilt direction
    const tiltRotation = {
        left: "rotate-[-15deg]",
        center: "rotate-0",
        right: "rotate-[15deg]",
    };

    return (
        <svg
            viewBox="0 0 32 40"
            className={cn("drop-shadow-lg", tiltRotation[tilt], className)}
            aria-hidden="true"
        >
            {/* Pin head - red gradient for 3D effect */}
            <defs>
                <radialGradient id="pinHeadGradient" cx="40%" cy="30%" r="60%">
                    <stop offset="0%" stopColor="#EF4444" />
                    <stop offset="50%" stopColor="#DC2626" />
                    <stop offset="100%" stopColor="#B91C1C" />
                </radialGradient>
                {/* Shadow for depth */}
                <filter
                    id="pinShadow"
                    x="-20%"
                    y="-20%"
                    width="140%"
                    height="140%"
                >
                    <feDropShadow
                        dx="1"
                        dy="2"
                        stdDeviation="1"
                        floodOpacity="0.3"
                    />
                </filter>
            </defs>

            {/* Pin head - heart/teardrop shape pointing down */}
            <path
                d="M16 4 C10 4 5 9 5 15 C5 21 16 28 16 28 C16 28 27 21 27 15 C27 9 22 4 16 4 Z"
                fill="url(#pinHeadGradient)"
                filter="url(#pinShadow)"
            />

            {/* Highlight on pin head for glossy effect */}
            <ellipse cx="12" cy="11" rx="4" ry="3" fill="white" opacity="0.3" />

            {/* Pin needle */}
            <path
                d="M16 26 L16 38"
                stroke="#6B7280"
                strokeWidth="2.5"
                strokeLinecap="round"
            />

            {/* Needle tip */}
            <circle cx="16" cy="38" r="1.5" fill="#4B5563" />
        </svg>
    );
}

export default PushPinIcon;
