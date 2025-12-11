"use client";

import { useState } from "react";
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
    XCircle,
    AlertTriangle,
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
    const [isGenerating, setIsGenerating] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);
    const [copied, setCopied] = useState(false);

    const generateShareLink = async () => {
        setIsGenerating(true);

        try {
            const response = await fetch("/api/pinory/share", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    placeId: pinory.id,
                    visibility: selectedVisibility,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to create share link");
            }

            const data = await response.json();
            setShareData(data);
            toast.success("Share link created!");
        } catch (error) {
            console.error("Error creating share link:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Could not create share link"
            );
        } finally {
            setIsGenerating(false);
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

    const handleVisibilityChange = (visibility: ShareVisibility) => {
        setSelectedVisibility(visibility);
        // Reset share data when visibility changes
        setShareData(null);
    };

    const handleRevokeShare = async () => {
        if (!shareData?.shareSlug) return;

        // Confirm action
        if (
            !confirm(
                "Are you sure you want to revoke this share link? It will no longer be accessible."
            )
        ) {
            return;
        }

        setIsRevoking(true);

        try {
            const response = await fetch(
                `/api/pinory/share/${shareData.shareSlug}`,
                {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        action: "revoke",
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to revoke share");
            }

            toast.success("Share link revoked successfully");
            setShareData(null); // Clear share data
        } catch (error) {
            console.error("Error revoking share:", error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Could not revoke share"
            );
        } finally {
            setIsRevoking(false);
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
                                        className={`flex items-start gap-3 p-3 rounded-lg border-2 transition-all ${
                                            isSelected
                                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                                                : "border-border hover:border-blue-300"
                                        }`}
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
                                        {isSelected && (
                                            <Check className="h-5 w-5 text-blue-500" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Share Link */}
                    <div className="space-y-2">
                        <Label>Share link</Label>
                        {shareData ? (
                            <div className="space-y-2">
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
                                <div className="pt-2 border-t space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">
                                            {formatShareStats(
                                                shareData.viewCount,
                                                shareData.createdAt
                                            )}
                                        </span>
                                        <Badge variant="secondary">
                                            {shareData.visibility}
                                        </Badge>
                                    </div>
                                    {shareData.expiresAt && (
                                        <div className="text-xs text-muted-foreground">
                                            Expires:{" "}
                                            {new Date(
                                                shareData.expiresAt
                                            ).toLocaleDateString()}
                                        </div>
                                    )}

                                    {/* Revoke Button */}
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        onClick={handleRevokeShare}
                                        disabled={isRevoking}
                                        className="w-full"
                                    >
                                        {isRevoking ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Revoking...
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="h-4 w-4 mr-2" />
                                                Revoke Share Link
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <Button
                                onClick={generateShareLink}
                                disabled={isGenerating}
                                className="w-full"
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Create share link
                                    </>
                                )}
                            </Button>
                        )}
                    </div>

                    {/* Info */}
                    <div className="text-xs text-muted-foreground p-3 bg-muted rounded-lg">
                        <p>
                            💡 <strong>Tip:</strong> Share links expire after 30
                            days.
                            {selectedVisibility === "friends" &&
                                " Only people you've added as friends can view this."}
                            {selectedVisibility === "public" &&
                                " Anyone with this link can view your pinory."}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
