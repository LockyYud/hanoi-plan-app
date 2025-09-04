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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
    Share2,
    Copy,
    Calendar,
    Download,
    QrCode,
    Facebook,
    Twitter,
    Mail,
    Check,
} from "lucide-react";
import { toast } from "sonner";

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itinerary: {
        id: string;
        title: string;
        stops: any[];
        startDate?: string;
    };
}

export function ShareDialog({
    open,
    onOpenChange,
    itinerary,
}: ShareDialogProps) {
    const [shareLink, setShareLink] = useState("");
    const [copied, setCopied] = useState(false);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);
    const [customMessage, setCustomMessage] = useState("");

    const generateShareLink = async () => {
        setIsGeneratingLink(true);

        try {
            // Simulate API call to create shareable link
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const slug = `${itinerary.id}-${Date.now()}`;
            const link = `${window.location.origin}/share/${slug}`;
            setShareLink(link);

            toast.success("Đã tạo link chia sẻ!");
        } catch (error) {
            toast.error("Không thể tạo link chia sẻ");
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const copyToClipboard = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            setCopied(true);
            toast.success("Đã sao chép link!");

            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Không thể sao chép link");
        }
    };

    const exportToCalendar = async () => {
        try {
            const response = await fetch("/api/export/calendar", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    itineraryId: itinerary.id,
                    title: itinerary.title,
                    stops: itinerary.stops,
                    startDate:
                        itinerary.startDate ||
                        new Date().toISOString().split("T")[0],
                }),
            });

            if (!response.ok) throw new Error("Export failed");

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `${itinerary.title}.ics`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast.success("Đã xuất lịch thành công!");
        } catch (error) {
            toast.error("Không thể xuất lịch");
        }
    };

    const shareToSocial = (platform: string) => {
        const message =
            customMessage ||
            `Xem lộ trình du lịch Hà Nội tuyệt vời này: ${itinerary.title}`;
        const url = shareLink || window.location.href;

        const socialUrls = {
            facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`,
            twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`,
            email: `mailto:?subject=${encodeURIComponent(itinerary.title)}&body=${encodeURIComponent(`${message}\n\n${url}`)}`,
        };

        if (socialUrls[platform as keyof typeof socialUrls]) {
            window.open(
                socialUrls[platform as keyof typeof socialUrls],
                "_blank"
            );
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Chia sẻ lộ trình
                    </DialogTitle>
                    <DialogDescription>
                        Chia sẻ lộ trình "{itinerary.title}" với bạn bè và gia
                        đình
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Custom Message */}
                    <div className="space-y-2">
                        <Label htmlFor="message">Tin nhắn tùy chỉnh</Label>
                        <Textarea
                            id="message"
                            placeholder="Thêm tin nhắn cá nhân..."
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            rows={2}
                        />
                    </div>

                    {/* Share Link */}
                    <div className="space-y-2">
                        <Label>Link chia sẻ</Label>
                        {shareLink ? (
                            <div className="flex gap-2">
                                <Input
                                    value={shareLink}
                                    readOnly
                                    className="flex-1"
                                />
                                <Button size="sm" onClick={copyToClipboard}>
                                    {copied ? (
                                        <Check className="h-4 w-4" />
                                    ) : (
                                        <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <Button
                                onClick={generateShareLink}
                                disabled={isGeneratingLink}
                                className="w-full"
                            >
                                {isGeneratingLink
                                    ? "Đang tạo..."
                                    : "Tạo link chia sẻ"}
                            </Button>
                        )}
                    </div>

                    {/* Social Share */}
                    <div className="space-y-2">
                        <Label>Chia sẻ trên</Label>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial("facebook")}
                                className="flex-1"
                                disabled={!shareLink}
                            >
                                <Facebook className="h-4 w-4 mr-1" />
                                Facebook
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial("twitter")}
                                className="flex-1"
                                disabled={!shareLink}
                            >
                                <Twitter className="h-4 w-4 mr-1" />
                                Twitter
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => shareToSocial("email")}
                                className="flex-1"
                                disabled={!shareLink}
                            >
                                <Mail className="h-4 w-4 mr-1" />
                                Email
                            </Button>
                        </div>
                    </div>

                    {/* Export Options */}
                    <div className="space-y-2">
                        <Label>Xuất dữ liệu</Label>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={exportToCalendar}
                                className="flex-1"
                            >
                                <Calendar className="h-4 w-4 mr-1" />
                                Xuất lịch (.ics)
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    toast.info("Tính năng đang phát triển")
                                }
                                className="flex-1"
                            >
                                <Download className="h-4 w-4 mr-1" />
                                Xuất PDF
                            </Button>
                        </div>
                    </div>

                    {/* Stats */}
                    {shareLink && (
                        <div className="pt-4 border-t">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <span>Link sẽ hết hạn sau 30 ngày</span>
                                <Badge variant="secondary">
                                    {Math.floor(Math.random() * 20) + 5} lượt
                                    xem
                                </Badge>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

