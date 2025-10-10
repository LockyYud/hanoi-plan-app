"use client";

import { useEffect } from "react";
import { X, ChevronRight } from "lucide-react";
import { ImageDisplay } from "@/lib/image-utils";

interface ImageLightboxProps {
  images: string[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
}

export function ImageLightbox({
  images,
  currentIndex,
  isOpen,
  onClose,
  onNext,
  onPrevious,
}: ImageLightboxProps) {
  // Handle ESC key
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, onClose]);

  // Handle arrow keys
  useEffect(() => {
    const handleArrowKeys = (event: KeyboardEvent) => {
      if (!isOpen) return;
      
      if (event.key === "ArrowLeft") {
        onPrevious();
      } else if (event.key === "ArrowRight") {
        onNext();
      }
    };

    if (isOpen && images.length > 1) {
      document.addEventListener("keydown", handleArrowKeys);
      return () => document.removeEventListener("keydown", handleArrowKeys);
    }
  }, [isOpen, images.length, onNext, onPrevious]);

  if (!isOpen || !images.length) return null;

  return (
    <div
      className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
      onClick={(e) => {
        console.log('Backdrop clicked');
        // Only close if clicking the backdrop itself
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="relative max-w-4xl max-h-full">
        <ImageDisplay
          src={images[currentIndex]}
          alt={`Ảnh ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain rounded-lg border border-neutral-600"
        />

        {/* Close button */}
        <button
          onClick={() => {
            console.log('Close button clicked');
            onClose()
          }}
          className="absolute top-4 right-4 bg-black/80 hover:bg-black/90 text-white p-3 rounded-full transition-colors border border-neutral-600 z-10"
          aria-label="Đóng lightbox"
        >
          <X className="h-5 w-5" strokeWidth={1.5} />
        </button>

        {/* Navigation buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={onPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-black/90 text-white p-3 rounded-full transition-colors border border-neutral-600 z-10"
              aria-label="Ảnh trước"
            >
              <ChevronRight className="h-5 w-5 rotate-180" strokeWidth={1.5} />
            </button>
            <button
              onClick={onNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/80 hover:bg-black/90 text-white p-3 rounded-full transition-colors border border-neutral-600 z-10"
              aria-label="Ảnh tiếp theo"
            >
              <ChevronRight className="h-5 w-5" strokeWidth={1.5} />
            </button>
          </>
        )}

        {/* Image counter */}
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-full border border-neutral-600"
          style={{ fontSize: "var(--text-sm)" }}
        >
          {currentIndex + 1} / {images.length}
        </div>
      </div>
    </div>
  );
}
