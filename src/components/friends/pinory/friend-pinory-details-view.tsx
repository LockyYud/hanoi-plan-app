/**
 * Re-export FriendPinoryDetails from pinory/variants for backward compatibility
 *
 * @deprecated Import from '@/components/pinory/variants' instead
 */
"use client";

// Re-export with old name for backward compatibility
export { FriendPinoryDetails as FriendPinoryDetailsView } from "@/components/pinory/variants/friend-pinory-details";

// Also export the new name
export { FriendPinoryDetails } from "@/components/pinory/variants/friend-pinory-details";
