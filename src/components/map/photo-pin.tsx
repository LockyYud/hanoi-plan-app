"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CategoryType } from "@prisma/client";

interface PhotoPinProps {
  readonly imageUrl: string;
  readonly category?: CategoryType;
  readonly mood?: string;
  readonly size?: "small" | "medium" | "large";
  readonly className?: string;
  readonly onClick?: () => void;
  readonly onLoad?: () => void;
  readonly onError?: () => void;
}

// Category badge colors and emojis
const categoryConfig = {
  cafe: { emoji: "☕", color: "bg-amber-100 text-amber-800" },
  food: { emoji: "🍜", color: "bg-red-100 text-red-800" },
  bar: { emoji: "🍻", color: "bg-purple-100 text-purple-800" },
  rooftop: { emoji: "🏙️", color: "bg-blue-100 text-blue-800" },
  activity: { emoji: "🎯", color: "bg-green-100 text-green-800" },
  landmark: { emoji: "🏛️", color: "bg-gray-100 text-gray-800" },
};

const sizeConfig = {
  small: {
    container: "w-16 h-20", // 64px x 80px
    image: "w-14 h-14", // 56px
    imagePx: 56,
    border: "border-4",
    badge: "w-5 h-5 text-xs",
    rotation: "rotate-3",
  },
  medium: {
    container: "w-20 h-24", // 80px x 96px
    image: "w-18 h-18", // 72px
    imagePx: 72,
    border: "border-6",
    badge: "w-6 h-6 text-sm",
    rotation: "rotate-6",
  },
  large: {
    container: "w-24 h-28", // 96px x 112px
    image: "w-22 h-22", // 88px
    imagePx: 88,
    border: "border-6",
    badge: "w-7 h-7 text-base",
    rotation: "-rotate-3",
  },
};

export function PhotoPin({
  imageUrl,
  category,
  mood,
  size = "medium",
  className,
  onClick,
  onLoad,
  onError,
}: PhotoPinProps) {
  const config = sizeConfig[size];
  const categoryInfo = category ? categoryConfig[category] : null;

  // Random rotation between -6 to 6 degrees for natural look
  const randomRotation = React.useMemo(() => {
    const rotations = [
      "-rotate-6",
      "-rotate-3",
      "-rotate-2",
      "-rotate-1",
      "rotate-0",
      "rotate-1",
      "rotate-2",
      "rotate-3",
      "rotate-6",
    ];
    return rotations[Math.floor(Math.random() * rotations.length)];
  }, []);

  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    onClick?.();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick?.();
    }
  };

  return (
    <button
      type="button"
      className={cn(
        "relative cursor-pointer transition-all duration-300 ease-out",
        "hover:scale-105 hover:z-20",
        "transform-gpu",
        "border-0 p-0 bg-transparent",
        randomRotation,
        config.container,
        className
      )}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={{
        filter: "drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15))",
      }}
    >
      {/* Photo container with white border and rounded corners */}
      <div
        className={cn(
          "relative bg-white rounded-xl overflow-hidden",
          "transition-all duration-300",
          config.border,
          config.image
        )}
        style={{
          /* Anchor point at bottom center */
          transformOrigin: "bottom center",
        }}
      >
        {/* Photo image */}
        <Image
          src={imageUrl}
          alt="Location"
          width={config.imagePx}
          height={config.imagePx}
          className="w-full h-full object-cover"
          onLoad={onLoad}
          onError={onError}
          style={{
            /* Ensure crisp rendering on high DPR displays */
            imageRendering: "crisp-edges",
          }}
        />

        {/* Category/mood badge in corner */}
        {(categoryInfo || mood) && (
          <div
            className={cn(
              "absolute -top-1 -right-1",
              "rounded-full border-2 border-white",
              "flex items-center justify-center",
              "shadow-sm",
              config.badge,
              categoryInfo ? categoryInfo.color : "bg-gray-100 text-gray-800"
            )}
          >
            <span className="leading-none">
              {mood || categoryInfo?.emoji || "📍"}
            </span>
          </div>
        )}
      </div>

      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-black opacity-0 hover:opacity-10 transition-opacity duration-200 rounded-xl pointer-events-none" />
    </button>
  );
}

export default PhotoPin;
