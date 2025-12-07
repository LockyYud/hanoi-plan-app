"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type {
    BottomSheetDragState,
    BottomSheetDragHandlers,
    BottomSheetDragOptions,
} from "../types";

interface UseBottomSheetDragReturn extends BottomSheetDragState, BottomSheetDragHandlers {
    /** Toggle expanded state */
    toggleExpanded: () => void;
    /** Set expanded state directly */
    setIsExpanded: (expanded: boolean) => void;
}

const DEFAULT_OPTIONS: Required<Omit<BottomSheetDragOptions, 'onExpand' | 'onCollapse' | 'onClose'>> = {
    expandThreshold: 30,
    collapseThreshold: 40,
    closeThreshold: 60,
};

/**
 * Custom hook for bottom sheet drag gesture handling
 * Optimized for smooth 60fps animations with requestAnimationFrame
 */
export function useBottomSheetDrag(
    options: BottomSheetDragOptions = {}
): UseBottomSheetDragReturn {
    const {
        expandThreshold = DEFAULT_OPTIONS.expandThreshold,
        collapseThreshold = DEFAULT_OPTIONS.collapseThreshold,
        closeThreshold = DEFAULT_OPTIONS.closeThreshold,
        onExpand,
        onCollapse,
        onClose,
    } = options;

    // State
    const [isDragging, setIsDragging] = useState(false);
    const [dragOffset, setDragOffset] = useState(0);
    const [isExpanded, setIsExpanded] = useState(false);

    // Refs for intermediate drag values to avoid re-renders
    const dragStartYRef = useRef(0);
    const currentYRef = useRef(0);
    const dragStartTimeRef = useRef(0);
    const lastUpdateTimeRef = useRef(0);
    const velocityRef = useRef(0);
    const rafIdRef = useRef<number | null>(null);

    // Cleanup animation frame on unmount
    useEffect(() => {
        return () => {
            if (rafIdRef.current) {
                cancelAnimationFrame(rafIdRef.current);
            }
        };
    }, []);

    const handleDragStart = useCallback((e: React.TouchEvent) => {
        e.stopPropagation();

        const touchY = e.touches[0].clientY;
        dragStartYRef.current = touchY;
        currentYRef.current = touchY;
        dragStartTimeRef.current = Date.now();
        lastUpdateTimeRef.current = Date.now();
        velocityRef.current = 0;

        setIsDragging(true);
        setDragOffset(0);
    }, []);

    const handleDragMove = useCallback((e: React.TouchEvent) => {
        if (!isDragging) return;

        e.preventDefault();
        e.stopPropagation();

        const touchY = e.touches[0].clientY;
        const now = Date.now();
        const deltaTime = now - lastUpdateTimeRef.current;

        // Calculate velocity (pixels per millisecond)
        if (deltaTime > 0) {
            const deltaY = touchY - currentYRef.current;
            velocityRef.current = deltaY / deltaTime;
        }

        currentYRef.current = touchY;
        lastUpdateTimeRef.current = now;

        // Use requestAnimationFrame for smooth 60fps updates
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
            const rawDeltaY = touchY - dragStartYRef.current;

            // Collapsed + swipe up -> expand immediately, no visual drag
            if (!isExpanded && rawDeltaY < -expandThreshold) {
                setIsExpanded(true);
                setIsDragging(false);
                setDragOffset(0);
                onExpand?.();
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                    rafIdRef.current = null;
                }
                return;
            }

            // Expanded + swipe down -> collapse immediately
            if (isExpanded && rawDeltaY > collapseThreshold) {
                setIsExpanded(false);
                setIsDragging(false);
                setDragOffset(0);
                onCollapse?.();
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                    rafIdRef.current = null;
                }
                return;
            }

            // Collapsed + swipe down -> close immediately
            if (!isExpanded && rawDeltaY > closeThreshold) {
                onClose?.();
                setIsDragging(false);
                setDragOffset(0);
                if (rafIdRef.current) {
                    cancelAnimationFrame(rafIdRef.current);
                    rafIdRef.current = null;
                }
            }

            // If threshold not reached, no visual drag effect
            // Component will snap when threshold is reached above
        });
    }, [isDragging, isExpanded, expandThreshold, collapseThreshold, closeThreshold, onExpand, onCollapse, onClose]);

    const handleDragEnd = useCallback((e: React.TouchEvent) => {
        e.stopPropagation();

        if (!isDragging) return;

        // Cancel any pending animation frame
        if (rafIdRef.current) {
            cancelAnimationFrame(rafIdRef.current);
            rafIdRef.current = null;
        }

        // Actions have been handled in handleDragMove with snap thresholds
        // Just reset states
        setIsDragging(false);
        setDragOffset(0);
        dragStartYRef.current = 0;
        currentYRef.current = 0;
        velocityRef.current = 0;
    }, [isDragging]);

    const toggleExpanded = useCallback(() => {
        setIsExpanded((prev) => !prev);
    }, []);

    return {
        // State
        isDragging,
        dragOffset,
        isExpanded,
        // Handlers
        handleDragStart,
        handleDragMove,
        handleDragEnd,
        // Actions
        toggleExpanded,
        setIsExpanded,
    };
}
