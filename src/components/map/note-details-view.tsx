"use client";

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
                        <h3 className="font-medium text-gray-900 mb-2">Nội dung ghi chú</h3>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                {note.content}
                            </p>
                        </div>
                    </div>

                    {/* Images */}
                    {note.images && note.images.length > 0 && (
                        <div>
                            <h3 className="font-medium text-gray-900 mb-2">
                                Hình ảnh ({note.images.length})
                            </h3>
                            <div className="grid grid-cols-2 gap-2">
                                {note.images.map((image, index) => (
                                    <div
                                        key={index}
                                        className="aspect-square bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center"
                                    >
                                        {/* Placeholder for images */}
                                        <div className="text-center text-gray-500">
                                            <div className="text-2xl mb-1">📷</div>
                                            <div className="text-xs">Ảnh {index + 1}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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
