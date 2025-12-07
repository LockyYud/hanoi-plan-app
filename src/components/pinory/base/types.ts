import type { Pinory } from "@/lib/types";

// ============================================
// SHARED TYPES FOR PINORY COMPONENTS
// ============================================

/**
 * Theme variants for pinory components
 */
export type PinoryTheme = "default" | "friend";

/**
 * Theme configuration for styling
 */
export interface ThemeConfig {
    // Colors
    primary: string;
    primaryHover: string;
    border: string;
    background: string;
    headerBg: string;

    // Text colors
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
}

export const themeConfigs: Record<PinoryTheme, ThemeConfig> = {
    default: {
        primary: "blue-600",
        primaryHover: "blue-700",
        border: "border-border",
        background: "bg-background",
        headerBg: "bg-card/80",
        textPrimary: "text-foreground",
        textSecondary: "text-muted-foreground",
        textMuted: "text-muted-foreground",
    },
    friend: {
        primary: "purple-600",
        primaryHover: "purple-700",
        border: "border-purple-700/50",
        background: "bg-background",
        headerBg: "bg-purple-900/80",
        textPrimary: "text-purple-300",
        textSecondary: "text-purple-200/70",
        textMuted: "text-purple-300/70",
    },
};

// ============================================
// BOTTOM SHEET TYPES
// ============================================

export interface BottomSheetDragState {
    isDragging: boolean;
    dragOffset: number;
    isExpanded: boolean;
}

export interface BottomSheetDragHandlers {
    handleDragStart: (e: React.TouchEvent) => void;
    handleDragMove: (e: React.TouchEvent) => void;
    handleDragEnd: (e: React.TouchEvent) => void;
}

export interface BottomSheetDragOptions {
    /** Threshold for expanding (swipe up) in pixels */
    expandThreshold?: number;
    /** Threshold for collapsing (swipe down when expanded) in pixels */
    collapseThreshold?: number;
    /** Threshold for closing (swipe down when collapsed) in pixels */
    closeThreshold?: number;
    /** Callback when sheet should expand */
    onExpand?: () => void;
    /** Callback when sheet should collapse */
    onCollapse?: () => void;
    /** Callback when sheet should close */
    onClose?: () => void;
}

// ============================================
// DIRECTIONS TYPES
// ============================================

export interface DirectionsDestination {
    name: string;
    address: string;
    lat: number;
    lng: number;
}

export interface DirectionsState {
    isGettingDirections: boolean;
}

export interface DirectionsOptions {
    destination: DirectionsDestination;
    toastId?: string;
}

// ============================================
// POPUP POSITIONING TYPES
// ============================================

export interface PopupPosition {
    left: number;
    top: number;
    arrowPosition: "top" | "bottom";
    arrowOffset: number;
}

export interface PopupPositionOptions {
    coordinates: [number, number];
    popupWidth?: number;
    popupHeight?: number;
    markerOffset?: number;
    margin?: number;
}

// ============================================
// DETAILS VIEW TYPES
// ============================================

export interface PinoryDetailsBaseProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly pinory: Pinory;
    readonly theme?: PinoryTheme;

    // Customizable slots
    readonly headerSlot?: React.ReactNode;
    readonly mobileHeaderSlot?: React.ReactNode;
    readonly actionsSlot?: React.ReactNode;
    readonly mobileActionsSlot?: React.ReactNode;

    // Feature flags
    readonly showDirections?: boolean;
    readonly showImageGallery?: boolean;

    // Data loading (optional - for lazy loading images)
    readonly onLoadImages?: () => Promise<Pinory | null>;
    readonly isLoadingImages?: boolean;
    readonly loadError?: string | null;
}

// ============================================
// POPUP BASE TYPES
// ============================================

export interface PinoryPopupBaseProps {
    readonly pinory: Pinory;
    readonly onClose: () => void;
    readonly mapRef?: React.RefObject<mapboxgl.Map>;
    readonly theme?: PinoryTheme;

    // Customizable slots
    readonly headerSlot?: React.ReactNode;
    readonly contentSlot?: React.ReactNode;
    readonly actionsSlot?: React.ReactNode;

    // Optional callbacks
    readonly onViewDetails?: () => void;
}

// ============================================
// HELPER TYPES
// ============================================

export interface UserInfo {
    id: string;
    name?: string | null;
    email: string;
    avatarUrl?: string | null;
}

export const moodLabels: Record<string, string> = {
    "😊": "Vui vẻ",
    "😍": "Yêu thích",
    "😎": "Thư giãn",
    "🤔": "Suy nghĩ",
    "😴": "Bình thản",
    "😋": "Ngon miệng",
    "🥳": "Vui nhộn",
    "😤": "Không hài lòng",
};
