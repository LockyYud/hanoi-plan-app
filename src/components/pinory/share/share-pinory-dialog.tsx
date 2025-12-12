"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    Share2,
    Copy,
    Check,
    Globe,
    Users,
    Lock,
    ExternalLink,
    Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { ShareVisibility } from "@prisma/client";
import { formatShareStats } from "@/lib/share-utils";

interface SharePinoryDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    pinory: {
        id: string;
        name: string;
        address?: string;
    };
}

interface ShareData {
    id: string; // Keep for backward compatibility but use shareSlug
    shareSlug: string;
    shareUrl: string;
    visibility: ShareVisibility;
    expiresAt: Date | null;
    viewCount: number;
    isActive: boolean;
    createdAt: Date;
}

const visibilityOptions = [
    {
        value: "public" as ShareVisibility,
        label: "Public",
        description: "Anyone with the link can view",
        icon: Globe,
        color: "text-green-500",
    },
    {
        value: "friends" as ShareVisibility,
        label: "Friends",
        description: "Only your friends can view",
        icon: Users,
        color: "text-blue-500",
    },
    {
        value: "private" as ShareVisibility,
        label: "Private",
        description: "Only you can view",
        icon: Lock,
        color: "text-gray-500",
    },
];

export function SharePinoryDialog({
    open,
    onOpenChange,
    pinory,
}: SharePinoryDialogProps) {
    const [shareData, setShareData] = useState<ShareData | null>(null);
    const [selectedVisibility, setSelectedVisibility] =
        useState<ShareVisibility>("friends");
    const [isUpdatingVisibility, setIsUpdatingVisibility] = useState(false);
    const [isLoadingExisting, setIsLoadingExisting] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch or create share link when dialog opens
    useEffect(() => {
        if (open && pinory.id) {
            fetchOrCreateShare();
        } else if (!open) {
            // Reset state when dialog closes
            setCopied(false);
        }
    }, [open, pinory.id]);

    const fetchOrCreateShare = async () => {
        setIsLoadingExisting(true);
        try {
            // First, try to get existing share
            const getResponse = await fetch(
                `/api/pinory/share?placeId=${pinory.id}`,
                {
                    method: "GET",
                }
            );

            if (getResponse.ok) {
                const data = await getResponse.json();
                if (data.share) {
                    setShareData(data.share);
                    setSelectedVisibility(data.share.visibility);
                    setIsLoadingExisting(false);
                    return;
                }
            }

            // If no existing share, create one automatically with default visibility
            const createResponse = await fetch("/api/pinory/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    placeId: pinory.id,
                    visibility: selectedVisibility,
                }),
            });

            if (createResponse.ok) {
                const data = await createResponse.json();
                setShareData(data);
                setSelectedVisibility(data.visibility);
            }
        } catch (error) {
            console.error("Error fetching or creating share:", error);
            toast.error("Could not load share link");
        } finally {
            setIsLoadingExisting(false);
        }
    };

    const copyToClipboard = async () => {
        if (!shareData?.shareUrl) return;

        try {
            await navigator.clipboard.writeText(shareData.shareUrl);
            setCopied(true);
            toast.success("Link copied to clipboard!");

            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Could not copy link");
        }
    };

    const openInNewTab = () => {
        if (!shareData?.shareUrl) return;
        window.open(shareData.shareUrl, "_blank");
    };

    const handleVisibilityChange = async (visibility: ShareVisibility) => {
        setSelectedVisibility(visibility);

        // If share link already exists, update it automatically
        if (shareData) {
            setIsUpdatingVisibility(true);
            try {
                const response = await fetch("/api/pinory/share", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        placeId: pinory.id,
                        visibility: visibility,
                    }),
                });

                if (!response.ok) {
                    throw new Error("Failed to update visibility");
                }

                const data = await response.json();
                setShareData(data);
                toast.success(`Visibility updated to ${visibility}`);
            } catch (error) {
                console.error("Error updating visibility:", error);
                toast.error("Could not update visibility");
                // Reset share data on error so user can try again
                setShareData(null);
            } finally {
                setIsUpdatingVisibility(false);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Share Pinory
                    </DialogTitle>
                    <DialogDescription>
                        Share "{pinory.name}" with others
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Visibility Selection */}
                    <div className="space-y-2">
                        <Label>Who can view this?</Label>
                        <div className="grid grid-cols-1 gap-2">
                            {visibilityOptions.map((option) => {
                                const Icon = option.icon;
                                const isSelected =
                                    selectedVisibility === option.value;

                                return (
                                    <button
                                        key={option.value}
                                        type="button"
                                        onClick={() =>
                                            handleVisibilityChange(option.value)
                                        }
                                        disabled={isUpdatingVisibility}
                                        className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
                                            isSelected
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                                                : "border-border hover:border-blue-300"
                                        } ${isUpdatingVisibility ? "opacity-50 cursor-not-allowed" : ""}`}
                                    >
                                        <Icon
                                            className={`h-5 w-5 mt-0.5 ${
                                                isSelected
                                                    ? "text-blue-500"
                                                    : option.color
                                            }`}
                                        />
                                        <div className="flex-1 text-left">
                                            <div className="font-medium text-sm">
                                                {option.label}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {option.description}
                                            </div>
                                        </div>
                                        {isSelected &&
                                            !isUpdatingVisibility && (
                                                <Check className="h-5 w-5 text-blue-500" />
                                            )}
                                        {isSelected && isUpdatingVisibility && (
                                            <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Share Link */}
                    <div className="space-y-2">
                        <Label>Share link</Label>
                        {isLoadingExisting ? (
                            <div className="flex items-center justify-center p-8 text-muted-foreground">
                                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                                <span>Loading share link...</span>
                            </div>
                        ) : shareData ? (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <Input
                                        value={shareData.shareUrl}
                                        readOnly
                                        className="flex-1 font-mono text-sm"
                                    />
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={copyToClipboard}
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={openInNewTab}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>

                                {/* Stats */}
                                <div className="flex items-center justify-between text-sm pt-2 border-t">
                                    <span className="text-muted-foreground">
                                        {formatShareStats(
                                            shareData.viewCount,
                                            shareData.createdAt
                                        )}
                                    </span>
                                    {shareData.expiresAt && (
                                        <span className="text-xs text-muted-foreground">
                                            Expires:{" "}
                                            {new Date(
                                                shareData.expiresAt
                                            ).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Info */}
                    <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                        <p>
                            💡 <strong>Tip:</strong>{" "}
                            {selectedVisibility === "public" &&
                                "Anyone with this link can view your pinory."}
                            {selectedVisibility === "friends" &&
                                "Only people you've added as friends can view this."}
                            {selectedVisibility === "private" &&
                                "Only you can view this pinory. Others will see an access denied message."}{" "}
                            Share links expire after 30 days.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
