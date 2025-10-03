"use client";

import React from "react";
import { CategoryType } from "@prisma/client";
import { PhotoPin } from "./photo-pin";
import { IconPin } from "./icon-pin";

interface LocationNote {
  readonly id: string;
  readonly content: string;
  readonly address: string;
  readonly lat: number;
  readonly lng: number;
  readonly mood?: string;
  readonly timestamp: Date;
  readonly images?: string[];
  readonly hasImages?: boolean;
}

interface MapPinDisplayProps {
  readonly category: CategoryType;
  readonly note?: LocationNote | null; // Use location note instead of latestMedia
  readonly mood?: string;
  readonly size?: "small" | "medium" | "large";
  readonly className?: string;
  readonly onClick?: () => void;
  readonly isSelected?: boolean;
}

export function MapPin({
  category,
  note,
  mood,
  size = "medium",
  className,
  onClick,
  isSelected = false,
}: MapPinDisplayProps) {
  // If we have images in the note, use PhotoPin, otherwise use IconPin
  const hasImages = note?.hasImages && note.images && note.images.length > 0;
  const imageUrl = hasImages ? note.images![0] : undefined; // Use first image

  console.log("Has images hehe: ", note);
  if (hasImages && imageUrl) {
    return (
      <PhotoPin
        imageUrl={imageUrl}
        category={category}
        mood={mood || note.mood}
        size={size}
        className={className}
        onClick={onClick}
      />
    );
  }

  return (
    <IconPin
      category={category}
      mood={mood}
      size={size}
      className={className}
      onClick={onClick}
      isSelected={isSelected}
    />
  );
}

export default MapPin;
