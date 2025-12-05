"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    X,
    Copy,
    Check,
    Share2,
    MessageCircle,
    Mail,
    Facebook,
    Send,
    Users,
} from "lucide-react";
import { toast } from "sonner";

interface InviteData {
    inviteCode: string;
    inviteUrl: string;
    usageCount: number;
    acceptedCount: number;
    createdAt: string;
}

interface InviteDialogProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
}

export function InviteDialog({ isOpen, onClose }: InviteDialogProps) {
    const [inviteData, setInviteData] = useState<InviteData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    // Fetch invitation link
    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const fetchInvite = async () => {
            setIsLoading(true);
            try {
                const response = await fetch("/api/friends/invite", {
                    credentials: "include",
                });

                if (response.ok) {
                    const data = await response.json();
                    setInviteData(data);
                } else {
                    const error = await response.json();
                    console.error("API Error:", error);

                    // Show specific error message
                    if (error.error?.includes("not found")) {
                        toast.error(
                            "Tài khoản không tồn tại. Vui lòng đăng nhập lại."
                        );
                    } else {
                        toast.error(error.error || "Không thể tạo link mời");
                    }
                }
            } catch (error) {
                console.error("Error fetching invite:", error);
                toast.error("Lỗi khi tạo link mời");
            } finally {
                setIsLoading(false);
            }
        };

        fetchInvite();
    }, [isOpen]);

    const copyToClipboard = async () => {
        if (!inviteData) return;

        try {
            await navigator.clipboard.writeText(inviteData.inviteUrl);
            setCopied(true);
            toast.success("Đã copy link!");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy:", error);
            toast.error("Không thể copy link");
        }
    };

    const shareViaWebAPI = async () => {
        if (!inviteData) return;

        try {
            if (navigator.share) {
                await navigator.share({
                    title: "Tham gia Pinory cùng tôi!",
                    text: "Khám phá và chia sẻ những địa điểm tuyệt vời tại Hà Nội",
                    url: inviteData.inviteUrl,
                });
            } else {
                // Fallback to copy
                await copyToClipboard();
            }
        } catch (error) {
            // User cancelled or error occurred
            console.log("Share cancelled or failed:", error);
        }
    };

    const shareViaSMS = () => {
        if (!inviteData) return;
        const text = encodeURIComponent(
            `Tham gia Pinory cùng tôi! ${inviteData.inviteUrl}`
        );
        window.open(`sms:?body=${text}`, "_blank");
    };

    const shareViaMessenger = () => {
        if (!inviteData) return;
        const url = encodeURIComponent(inviteData.inviteUrl);
        window.open(
            `https://www.facebook.com/dialog/send?link=${url}&app_id=YOUR_FB_APP_ID&redirect_uri=${encodeURIComponent(window.location.origin)}`,
            "_blank"
        );
    };

    const shareViaEmail = () => {
        if (!inviteData) return;
        const subject = encodeURIComponent("Tham gia Pinory!");
        const body = encodeURIComponent(
            `Tôi đang dùng Pinory để lưu và chia sẻ những địa điểm yêu thích tại Hà Nội. Tham gia cùng tôi nhé!\n\n${inviteData.inviteUrl}`
        );
        window.location.href = `mailto:?subject=${subject}&body=${body}`;
    };

    const shareViaTelegram = () => {
        if (!inviteData) return;
        const text = encodeURIComponent(
            `Tham gia Pinory! ${inviteData.inviteUrl}`
        );
        window.open(`https://t.me/share/url?url=${text}`, "_blank");
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <button
                type="button"
                className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-default"
                onClick={onClose}
                aria-label="Close dialog"
            />

            {/* Dialog */}
            <div className="relative w-full max-w-md bg-card rounded-2xl border border-border/50 shadow-2xl max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 flex items-center justify-between p-5 border-b border-border/50 bg-card/90 backdrop-blur-sm rounded-t-2xl z-10">
                    <div>
                        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <Users className="w-5 h-5 text-purple-400" />
                            Mời bạn bè
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1">
                            Chia sẻ link để kết bạn
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-5">
                    {isLoading ? (
                        <div className="text-center py-8">
                            <div className="animate-spin h-8 w-8 border-3 border-purple-500/30 border-t-purple-500 rounded-full mx-auto mb-3" />
                            <p className="text-sm text-muted-foreground">
                                Đang tạo link...
                            </p>
                        </div>
                    ) : inviteData ? (
                        <>
                            {/* Invite Link */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Link mời của bạn
                                </label>
                                <div className="flex gap-2">
                                    <Input
                                        value={inviteData.inviteUrl}
                                        readOnly
                                        className="flex-1 bg-secondary/60 border-border text-foreground font-mono text-sm"
                                        onClick={(e) =>
                                            (
                                                e.target as HTMLInputElement
                                            ).select()
                                        }
                                    />
                                    <Button
                                        onClick={copyToClipboard}
                                        className="h-10 w-10 p-0 bg-purple-600 hover:bg-purple-700"
                                        title="Copy link"
                                    >
                                        {copied ? (
                                            <Check className="h-4 w-4" />
                                        ) : (
                                            <Copy className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Người nhận click vào link sẽ tự động kết bạn
                                    với bạn
                                </p>
                            </div>

                            {/* Share Buttons */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-foreground">
                                    Hoặc chia sẻ qua
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={shareViaWebAPI}
                                        className="h-12 bg-secondary/60 border-border hover:bg-accent hover:border-purple-500/50 text-foreground"
                                    >
                                        <Share2 className="h-4 w-4 mr-2" />
                                        Share
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={shareViaSMS}
                                        className="h-12 bg-secondary/60 border-border hover:bg-accent hover:border-green-500/50 text-foreground"
                                    >
                                        <MessageCircle className="h-4 w-4 mr-2" />
                                        SMS
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={shareViaMessenger}
                                        className="h-12 bg-secondary/60 border-border hover:bg-accent hover:border-blue-500/50 text-foreground"
                                    >
                                        <Facebook className="h-4 w-4 mr-2" />
                                        Messenger
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={shareViaTelegram}
                                        className="h-12 bg-secondary/60 border-border hover:bg-accent hover:border-cyan-500/50 text-foreground"
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        Telegram
                                    </Button>
                                </div>
                                <Button
                                    variant="outline"
                                    onClick={shareViaEmail}
                                    className="w-full h-12 bg-secondary/60 border-border hover:bg-accent hover:border-orange-500/50 text-foreground"
                                >
                                    <Mail className="h-4 w-4 mr-2" />
                                    Email
                                </Button>
                            </div>

                            {/* Stats */}
                            <div className="bg-purple-900/20 border border-purple-600/30 rounded-xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <Users className="w-4 h-4 text-purple-400" />
                                    <span className="text-sm font-semibold text-purple-300">
                                        Thống kê lời mời
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-center">
                                    <div>
                                        <div className="text-2xl font-black text-purple-400">
                                            {inviteData.acceptedCount}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Đã tham gia
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-2xl font-black text-purple-400">
                                            {inviteData.usageCount}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Lần dùng
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Invite Code Display */}
                            <div className="text-center">
                                <div className="text-xs text-muted-foreground mb-2">
                                    Mã mời của bạn
                                </div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary/60 border border-border rounded-lg">
                                    <span className="font-mono text-lg font-bold text-purple-400 tracking-wider">
                                        {inviteData.inviteCode}
                                    </span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-8 space-y-4">
                            <div className="text-muted-foreground">
                                <p className="text-sm">
                                    Không thể tải link mời
                                </p>
                                <p className="text-xs mt-2">
                                    Vui lòng kiểm tra console để xem lỗi chi
                                    tiết
                                </p>
                            </div>
                            <Button
                                onClick={() => window.location.reload()}
                                variant="outline"
                                className="bg-secondary border-border text-foreground hover:bg-accent"
                            >
                                Thử lại
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
