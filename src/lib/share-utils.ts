/**
 * Share utilities for Pinory sharing functionality
 */

import { ShareVisibility, FriendshipStatus } from "@prisma/client";
import { nanoid } from "nanoid";

/**
 * Generate a unique, URL-safe share slug
 */
export function generateShareSlug(): string {
    // Using nanoid for better collision resistance and URL-safe characters
    // 10 characters gives us ~2 million years before 1% collision probability at 1000 IDs/hour
    return nanoid(10);
}

/**
 * Check if a share link has expired
 */
export function isShareExpired(expiresAt: Date | null | undefined): boolean {
    if (!expiresAt) return false;
    return new Date() > new Date(expiresAt);
}

/**
 * Get default expiry date (30 days from now)
 */
export function getDefaultExpiryDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date;
}

/**
 * Determine what view a user should see based on their relationship to the share owner
 */
export interface ShareAccessInfo {
    canView: boolean;
    viewType: "owner" | "friend" | "public" | "restricted";
    reason?: string;
}

export interface ShareAccessParams {
    shareVisibility: ShareVisibility;
    viewerUserId?: string | null;
    ownerUserId: string;
    friendshipStatus?: FriendshipStatus | null;
    isExpired: boolean;
}

export function determineShareAccess({
    shareVisibility,
    viewerUserId,
    ownerUserId,
    friendshipStatus,
    isExpired,
}: ShareAccessParams): ShareAccessInfo {
    // Check expiry first
    if (isExpired) {
        return {
            canView: false,
            viewType: "restricted",
            reason: "This share link has expired",
        };
    }

    // No viewer = anonymous user
    if (!viewerUserId) {
        if (shareVisibility === "public") {
            return {
                canView: true,
                viewType: "public",
            };
        }
        return {
            canView: false,
            viewType: "restricted",
            reason: "Sign in to view this shared location",
        };
    }

    // Viewer is the owner
    if (viewerUserId === ownerUserId) {
        return {
            canView: true,
            viewType: "owner",
        };
    }

    // Check visibility level
    switch (shareVisibility) {
        case "public":
            return {
                canView: true,
                viewType: "public",
            };

        case "friends":
        case "selected_friends":
            // Check if they are friends
            if (friendshipStatus === "accepted") {
                return {
                    canView: true,
                    viewType: "friend",
                };
            }
            return {
                canView: false,
                viewType: "restricted",
                reason: "This location is only shared with friends",
            };

        case "private":
        default:
            return {
                canView: false,
                viewType: "restricted",
                reason: "This location is private",
            };
    }
}

/**
 * Format share URL for copying/sharing
 */
export function formatShareUrl(shareSlug: string, baseUrl?: string): string {
    // Priority: provided baseUrl > window.location.origin > NEXTAUTH_URL > localhost
    let base = baseUrl;

    if (!base && typeof globalThis.window !== "undefined") {
        base = globalThis.window.location.origin;
    }

    if (!base && typeof process !== "undefined" && process.env?.NEXTAUTH_URL) {
        base = process.env.NEXTAUTH_URL;
    }

    if (!base) {
        base = "http://localhost:3000";
    }

    // Remove trailing slash if present
    base = base.replace(/\/$/, "");

    return `${base}/p/${shareSlug}`;
}

/**
 * Validate share slug format
 */
export function isValidShareSlug(slug: string): boolean {
    // nanoid(10) produces 10 character alphanumeric strings
    return /^[A-Za-z0-9_-]{10}$/.test(slug);
}

/**
 * Get share stats text for display
 */
export function formatShareStats(viewCount: number, createdAt: Date): string {
    const views = viewCount === 1 ? "1 view" : `${viewCount} views`;
    const daysAgo = Math.floor(
        (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysAgo === 0) return `${views} • Shared today`;
    if (daysAgo === 1) return `${views} • Shared yesterday`;
    return `${views} • Shared ${daysAgo} days ago`;
}
