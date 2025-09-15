"use client";

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MapPin, Clock, Edit, Trash2, Share, BookOpen } from "lucide-react";

interface LocationNote {
    id: string;
    lng: number;
    lat: number;
    address: string;
    content: string;
    mood?: string;
    timestamp: Date;
    images?: string[];
    hasImages?: boolean;
}

interface NoteDetailsViewProps {
    isOpen: boolean;
    onClose: () => void;
    note: LocationNote;
    onEdit?: () => void;
    onDelete?: () => void;
}

export function NoteDetailsView({
    isOpen,
    onClose,
    note,
    onEdit,
    onDelete,
}: NoteDetailsViewProps) {
    const [fullNote, setFullNote] = useState<LocationNote | null>(null);
    const [isLoadingImages, setIsLoadingImages] = useState(false);

    // Load full note with images when dialog opens
    useEffect(() => {
        console.log("🔍 Note details useEffect:", {
            isOpen,
            noteId: note.id,
            hasImages: note.hasImages,
            fullNoteExists: !!fullNote?.images?.length,
            shouldLoad:
                isOpen &&
                note.id &&
                note.hasImages &&
                !fullNote?.images?.length,
        });

        if (isOpen && note.id && note.hasImages && !fullNote?.images?.length) {
            console.log("✅ Conditions met, loading full note...");
            loadFullNote();
        } else if (!isOpen) {
            // Reset fullNote when dialog closes
            setFullNote(null);
        } else if (isOpen) {
            console.log("❌ Conditions not met for loading images");
        }
    }, [isOpen, note.id, note.hasImages]);

    const loadFullNote = async () => {
        setIsLoadingImages(true);
        try {
            console.log(`🔄 Loading images for note ${note.id}...`);
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

            const response = await fetch(`/api/location-notes/${note.id}`, {
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                const noteWithImages = await response.json();
                console.log(
                    `✅ Loaded note with ${noteWithImages.images?.length || 0} images`
                );
                setFullNote(noteWithImages);
            } else {
                console.error(`❌ Failed to load note: ${response.status}`);
            }
        } catch (error) {
            if (error.name === "AbortError") {
                console.error("❌ Request timeout loading note images (60s)");
                console.log(
                    "💡 Tip: Images are very large. Consider using compression."
                );
            } else {
                console.error("❌ Error loading note images:", error);
            }
        } finally {
            setIsLoadingImages(false);
        }
    };

    // Use fullNote if available, otherwise use the basic note
    const displayNote = fullNote || note;

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleString("vi-VN", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const moodLabels: { [key: string]: string } = {
        "😊": "Vui vẻ",
        "😍": "Yêu thích",
        "😎": "Thư giãn",
        "🤔": "Suy nghĩ",
        "😴": "Bình thản",
        "😋": "Ngon miệng",
        "🥳": "Vui nhộn",
        "😤": "Không hài lòng",
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-green-600" />
                        Ghi chú địa điểm
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Time & Location */}
                    <div className="bg-green-50 p-4 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm text-green-700">
                            <Clock className="h-4 w-4" />
                            {formatDateTime(note.timestamp)}
                        </div>
                        <div className="flex items-start gap-2 text-sm text-green-600">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="break-words">{note.address}</span>
                        </div>
                        <div className="text-xs text-green-500">
                            {note.lng.toFixed(6)}, {note.lat.toFixed(6)}
                        </div>
                    </div>

                    {/* Mood */}
                    {note.mood && (
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-3xl">{note.mood}</div>
                            <div>
                                <div className="text-sm font-medium text-gray-900">
                                    Tâm trạng lúc đó
                                </div>
                                <div className="text-sm text-gray-600">
                                    {moodLabels[note.mood] || "Khác"}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Content */}
                    <div>
                        <h3 className="font-medium text-gray-900 mb-2">
                            Nội dung ghi chú
                        </h3>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {displayNote.content}
                            </p>
                        </div>
                    </div>

                    {/* Images */}
                    {(displayNote.hasImages ||
                        displayNote.images?.length > 0) && (
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">
                                Hình ảnh{" "}
                                {displayNote.images?.length
                                    ? `(${displayNote.images.length})`
                                    : ""}
                            </h3>
                            {isLoadingImages ? (
                                <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                                    <div className="animate-spin h-6 w-6 mb-3 border-2 border-blue-600 border-t-transparent rounded-full" />
                                    <span className="text-sm text-center">
                                        Đang tải ảnh...
                                        <br />
                                        <span className="text-xs text-gray-400">
                                            Có thể mất vài giây do ảnh lớn
                                        </span>
                                    </span>
                                </div>
                            ) : displayNote.images &&
                              displayNote.images.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2">
                                    {displayNote.images.map((image, index) => (
                                        <div
                                            key={index}
                                            className="aspect-square bg-gray-100 rounded-lg border border-gray-200 overflow-hidden"
                                        >
                                            {typeof image === "string" &&
                                            image.startsWith("data:image") ? (
                                                <img
                                                    src={image}
                                                    alt={`Ảnh ${index + 1}`}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                /* Fallback for invalid images */
                                                <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                    <div className="text-center">
                                                        <div className="text-2xl mb-1">
                                                            📷
                                                        </div>
                                                        <div className="text-xs">
                                                            Ảnh lỗi
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : displayNote.hasImages ? (
                                <div className="text-center py-4 text-gray-500">
                                    <div className="text-sm">
                                        Có ảnh nhưng chưa tải được
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={onEdit}
                            className="flex-1"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                // Share functionality
                                if (navigator.share) {
                                    navigator.share({
                                        title: "Ghi chú địa điểm",
                                        text: note.content,
                                        url: window.location.href,
                                    });
                                }
                            }}
                            className="flex-1"
                        >
                            <Share className="h-4 w-4 mr-2" />
                            Chia sẻ
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={onDelete}
                            size="sm"
                            className="px-3"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
