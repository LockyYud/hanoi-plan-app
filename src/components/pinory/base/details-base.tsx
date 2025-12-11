"use client";

import React, {
    useState,
    useEffect,
    useRef,
    useCallback,
    useMemo,
} from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { cn } from "@/lib/utils";
import { useMobileDetect, useBottomSheetDrag, useDirections } from "./hooks";
import type { Pinory } from "@/lib/types";
import type { PinoryTheme, DirectionsDestination } from "./types";

// ============================================
// THEME CONFIGURATION
// ============================================

interface ThemeStyles {
    card: string;
    border: string;
    headerBg: string;
    actionsBg: string;
    primaryButton: string;
    secondaryButton: string;
}

const themeStyles: Record<PinoryTheme, ThemeStyles> = {
    default: {
        card: "bg-card",
        border: "border-border",
        headerBg: "bg-card/80",
        actionsBg: "bg-card/95 border-border/50",
        primaryButton:
            "bg-blue-900/50 hover:bg-blue-800/60 border-blue-700/50 text-blue-300",
        secondaryButton:
            "bg-brand/25 hover:bg-brand/35 border-brand/40 text-brand-accent",
    },
    friend: {
        card: "bg-card",
        border: "border-purple-700/50",
        headerBg: "bg-purple-900/80",
        actionsBg: "bg-card/95 border-purple-900/30",
        primaryButton:
            "bg-blue-900/50 hover:bg-blue-800/60 border-blue-700/50 text-blue-300",
        secondaryButton:
            "bg-purple-900/50 hover:bg-purple-800/60 border-purple-700/50 text-purple-300",
    },
};

// ============================================
// COMPONENT INTERFACES
// ============================================

export interface PinoryDetailsBaseProps {
    /** Whether the dialog is open */
    readonly isOpen: boolean;
    /** Callback when dialog should close */
    readonly onClose: () => void;
    /** The pinory data to display */
    readonly pinory: Pinory;
    /** Theme variant */
    readonly theme?: PinoryTheme;

    // === SLOT PROPS FOR CUSTOMIZATION ===

    /** Header content for desktop view */
    readonly desktopHeader?: React.ReactNode;
    /** Header content for mobile view */
    readonly mobileHeader?: React.ReactNode;
    /** Main content (replaces default image gallery + content) */
    readonly mainContent?: React.ReactNode;
    /** Action buttons for desktop view */
    readonly desktopActions?: React.ReactNode;
    /** Action buttons for mobile view */
    readonly mobileActions?: React.ReactNode;

    // === FEATURE FLAGS ===

    /** Whether to show directions button in default actions */
    readonly showDirections?: boolean;
    /** Whether to show image gallery */
    readonly showImageGallery?: boolean;

    // === DATA LOADING (for lazy loading images) ===

    /** Full pinory data with images (if loaded separately) */
    readonly fullPinory?: Pinory | null;
    /** Whether images are currently loading */
    readonly isLoadingImages?: boolean;
    /** Error message from loading */
    readonly loadError?: string | null;
    /** Callback to retry loading images */
    readonly onRetryLoad?: () => void;

    // === LIGHTBOX STATE (can be controlled externally) ===

    /** Current image index for lightbox */
    readonly currentImageIndex?: number;
    /** Callback when image index changes */
    readonly onImageIndexChange?: (index: number) => void;
    /** Whether lightbox is shown */
    readonly showLightbox?: boolean;
    /** Callback when lightbox visibility changes */
    readonly onLightboxChange?: (show: boolean) => void;
}

/**
 * PinoryDetailsBase - Base component for pinory details view
 * Provides mobile bottom sheet and desktop dialog layouts with customizable slots
 */
export function PinoryDetailsBase({
    isOpen,
    onClose,
    pinory,
    theme = "default",
    // Slots
    desktopHeader,
    mobileHeader,
    mainContent,
    desktopActions,
    mobileActions,
    // Features
    showDirections = true,
    showImageGallery = true,
    // Data loading
    fullPinory,
    isLoadingImages = false,
    loadError = null,
    onRetryLoad,
    // Lightbox (internal state if not provided)
    currentImageIndex: controlledImageIndex,
    onImageIndexChange,
    showLightbox: controlledShowLightbox,
    onLightboxChange,
}: PinoryDetailsBaseProps) {
    // Theme
    const styles = themeStyles[theme];

    // Mobile detection
    const isMobile = useMobileDetect();

    // Bottom sheet drag
    const {
        isDragging,
        dragOffset,
        isExpanded,
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        toggleExpanded,
    } = useBottomSheetDrag({
        onClose,
    });

    // Directions - exported via render props if needed
    const { isGettingDirections, handleGetDirections } = useDirections({
        toastId: "details-directions",
    });

    // Internal lightbox state (if not controlled)
    const [internalImageIndex, setInternalImageIndex] = useState(0);
    const [internalShowLightbox, setInternalShowLightbox] = useState(false);

    // Use controlled or internal state
    const currentImageIndex = controlledImageIndex ?? internalImageIndex;
    const setCurrentImageIndex = onImageIndexChange ?? setInternalImageIndex;
    const showLightbox = controlledShowLightbox ?? internalShowLightbox;
    const setShowLightbox = onLightboxChange ?? setInternalShowLightbox;

    // Drag ref for scroll handling
    const dragStartYRef = useRef(0);

    // Get display data
    const displayPinory = fullPinory || pinory;
    const images = displayPinory.images || [];

    // Handle ESC key for dialog (lightbox handles its own ESC)
    useEffect(() => {
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isOpen && !showLightbox) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener("keydown", handleEsc);
            return () => document.removeEventListener("keydown", handleEsc);
        }
    }, [isOpen, showLightbox, onClose]);

    // Get directions for this pinory
    const handleDirections = useCallback(() => {
        const destination: DirectionsDestination = {
            name: pinory.name || pinory.content || "Location",
            address: pinory.address || "",
            lat: pinory.lat,
            lng: pinory.lng,
        };
        handleGetDirections(destination);
    }, [pinory, handleGetDirections]);

    // Lightbox navigation
    const handleLightboxNext = useCallback(() => {
        const nextIndex =
            currentImageIndex === images.length - 1 ? 0 : currentImageIndex + 1;
        setCurrentImageIndex(nextIndex);
    }, [images.length, currentImageIndex, setCurrentImageIndex]);

    const handleLightboxPrev = useCallback(() => {
        const prevIndex =
            currentImageIndex === 0 ? images.length - 1 : currentImageIndex - 1;
        setCurrentImageIndex(prevIndex);
    }, [images.length, currentImageIndex, setCurrentImageIndex]);

    // Open image in lightbox
    const openLightbox = useCallback(
        (index: number) => {
            setCurrentImageIndex(index);
            setShowLightbox(true);
        },
        [setCurrentImageIndex, setShowLightbox]
    );

    // Context value for child components
    const contextValue: PinoryDetailsContextValue = useMemo(
        () => ({
            pinory,
            displayPinory,
            theme,
            styles,
            isExpanded,
            isMobile,
            isGettingDirections,
            handleDirections,
            openLightbox,
        }),
        [
            pinory,
            displayPinory,
            theme,
            styles,
            isExpanded,
            isMobile,
            isGettingDirections,
            handleDirections,
            openLightbox,
        ]
    );

    // ============================================
    // MOBILE BOTTOM SHEET
    // ============================================

    if (isMobile && isOpen) {
        return (
            <PinoryDetailsContext.Provider value={contextValue}>
                {/* Backdrop */}
                <button
                    type="button"
                    className="fixed inset-0 bg-black/50 z-40 cursor-default transition-opacity duration-300"
                    onClick={onClose}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") onClose();
                    }}
                    onTouchMove={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    style={{ touchAction: "none", willChange: "opacity" }}
                    aria-label="Close"
                />

                {/* Bottom Sheet */}
                <div
                    className={cn(
                        "fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] shadow-2xl overflow-hidden flex flex-col",
                        styles.card,
                        isExpanded ? "h-[80vh]" : "h-[50vh]"
                    )}
                    style={{
                        touchAction: "none",
                        transform: (() => {
                            if (!isDragging) return "translate3d(0, 0, 0)";
                            if (isExpanded)
                                return `translate3d(0, ${Math.max(0, dragOffset)}px, 0)`;
                            return `translate3d(0, ${dragOffset}px, 0)`;
                        })(),
                        transition: isDragging
                            ? "none"
                            : "transform 0.4s cubic-bezier(0.32, 0.72, 0, 1), height 0.4s cubic-bezier(0.32, 0.72, 0, 1)",
                        willChange: isDragging ? "transform" : "auto",
                    }}
                    onTouchMove={(e) => e.stopPropagation()}
                >
                    {/* Drag Handle */}
                    <button
                        type="button"
                        className="w-full py-2.5 flex justify-center cursor-grab active:cursor-grabbing flex-shrink-0"
                        onTouchStart={handleDragStart}
                        onTouchMove={handleDragMove}
                        onTouchEnd={handleDragEnd}
                        onClick={toggleExpanded}
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                        <div className="w-10 h-1 bg-muted rounded-full" />
                    </button>

                    {/* Mobile Header Slot */}
                    {mobileHeader && (
                        <div
                            className="flex-shrink-0"
                            onTouchStart={handleDragStart}
                            onTouchMove={handleDragMove}
                            onTouchEnd={handleDragEnd}
                        >
                            {mobileHeader}
                        </div>
                    )}

                    {/* Main Content */}
                    <div
                        className="flex-1 overflow-y-auto px-5 py-3 space-y-4"
                        style={{ touchAction: isExpanded ? "pan-y" : "none" }}
                        onTouchStart={(e) => {
                            if (!isExpanded) {
                                handleDragStart(e);
                                return;
                            }
                            const target = e.currentTarget;
                            const isAtTop = target.scrollTop === 0;
                            target.dataset.allowDrag = isAtTop
                                ? "true"
                                : "false";
                        }}
                        onTouchMove={(e) => {
                            if (!isExpanded) {
                                handleDragMove(e);
                                return;
                            }
                            const target = e.currentTarget;
                            const allowDrag =
                                target.dataset.allowDrag === "true";
                            const isAtTop = target.scrollTop <= 1;
                            if (allowDrag && isAtTop) {
                                const touchY = e.touches[0].clientY;
                                const startY = dragStartYRef.current || touchY;
                                if (touchY > startY + 5) {
                                    e.preventDefault();
                                    handleDragMove(e);
                                    return;
                                }
                            }
                            e.stopPropagation();
                        }}
                        onTouchEnd={(e) => {
                            if (!isExpanded) handleDragEnd(e);
                            delete e.currentTarget.dataset.allowDrag;
                        }}
                    >
                        {mainContent}
                    </div>

                    {/* Mobile Actions Slot */}
                    {mobileActions && (
                        <div
                            className={cn(
                                "sticky bottom-0 backdrop-blur-xl border-t px-5 py-3 flex-shrink-0",
                                styles.actionsBg
                            )}
                        >
                            {mobileActions}
                        </div>
                    )}
                </div>

                {/* Lightbox */}
                {images.length > 0 && (
                    <ImageLightbox
                        images={images}
                        currentIndex={currentImageIndex}
                        isOpen={showLightbox}
                        onClose={() => setShowLightbox(false)}
                        onNext={handleLightboxNext}
                        onPrevious={handleLightboxPrev}
                        title={displayPinory.name}
                    />
                )}
            </PinoryDetailsContext.Provider>
        );
    }

    // ============================================
    // DESKTOP DIALOG
    // ============================================

    return (
        <PinoryDetailsContext.Provider value={contextValue}>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent
                    className={cn(
                        "max-w-3xl max-h-[90vh] overflow-hidden p-0 shadow-2xl flex flex-col rounded-2xl",
                        styles.card,
                        styles.border
                    )}
                >
                    <DialogTitle className="sr-only">
                        Details:{" "}
                        {displayPinory.name ||
                            displayPinory.content?.slice(0, 50) ||
                            "Location"}
                    </DialogTitle>

                    {/* Desktop Header Slot */}
                    {desktopHeader && (
                        <div
                            className={cn(
                                "relative border-b px-6 py-5 flex-shrink-0",
                                styles.headerBg,
                                styles.border
                            )}
                        >
                            {desktopHeader}
                        </div>
                    )}

                    {/* Scrollable Content */}
                    <div className="flex-1 overflow-y-auto bg-background custom-scrollbar">
                        <div className="space-y-5 p-6">{mainContent}</div>
                    </div>

                    {/* Desktop Actions Slot */}
                    {desktopActions && (
                        <div
                            className={cn(
                                "sticky bottom-0 backdrop-blur-xl border-t p-4 flex-shrink-0",
                                styles.headerBg,
                                styles.border
                            )}
                        >
                            {desktopActions}
                        </div>
                    )}
                </DialogContent>

                {/* Lightbox */}
                {images.length > 0 && (
                    <ImageLightbox
                        images={images}
                        currentIndex={currentImageIndex}
                        isOpen={showLightbox}
                        onClose={() => setShowLightbox(false)}
                        onNext={handleLightboxNext}
                        onPrevious={handleLightboxPrev}
                        title={displayPinory.name}
                    />
                )}
            </Dialog>
        </PinoryDetailsContext.Provider>
    );
}

// ============================================
// CONTEXT FOR CHILD COMPONENTS
// ============================================

interface PinoryDetailsContextValue {
    pinory: Pinory;
    displayPinory: Pinory;
    theme: PinoryTheme;
    styles: ThemeStyles;
    isExpanded: boolean;
    isMobile: boolean;
    isGettingDirections: boolean;
    handleDirections: () => void;
    openLightbox: (index: number) => void;
}

const PinoryDetailsContext =
    React.createContext<PinoryDetailsContextValue | null>(null);

export function usePinoryDetailsContext() {
    const context = React.useContext(PinoryDetailsContext);
    if (!context) {
        throw new Error(
            "usePinoryDetailsContext must be used within PinoryDetailsBase"
        );
    }
    return context;
}
