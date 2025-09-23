"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Camera, X, Clock, Save, BookOpen } from "lucide-react";

const LocationNoteSchema = z.object({
    content: z.string().min(1, "Nội dung ghi chú không được để trống"),
    mood: z.enum(["😊", "😍", "😎", "🤔", "😴", "😋", "🥳", "😤"]).optional(),
});

type LocationNoteFormData = z.infer<typeof LocationNoteSchema>;

interface LocationNoteFormProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly location: {
        lng: number;
        lat: number;
        address?: string;
    };
    readonly existingNote?: {
        id: string;
        content: string;
        mood?: string;
        images?: string[];
    };
    readonly onSubmit: (
        data: LocationNoteFormData & {
            id?: string;
            lng: number;
            lat: number;
            address: string;
            timestamp: Date;
            images?: string[];
        }
    ) => void;
}

export function LocationNoteForm({
    isOpen,
    onClose,
    location,
    existingNote,
    onSubmit,
}: LocationNoteFormProps) {
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [selectedMood, setSelectedMood] = useState<string>(
        existingNote?.mood || ""
    );

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<LocationNoteFormData>({
        resolver: zodResolver(LocationNoteSchema),
        defaultValues: {
            content: existingNote?.content || "",
            mood: existingNote?.mood as
                | "😊"
                | "😍"
                | "😎"
                | "🤔"
                | "😴"
                | "😋"
                | "🥳"
                | "😤"
                | undefined,
        },
    });

    const moods = [
        { emoji: "😊", label: "Vui vẻ" },
        { emoji: "😍", label: "Yêu thích" },
        { emoji: "😎", label: "Thư giãn" },
        { emoji: "🤔", label: "Suy nghĩ" },
        { emoji: "😴", label: "Bình thản" },
        { emoji: "😋", label: "Ngon miệng" },
        { emoji: "🥳", label: "Vui nhộn" },
        { emoji: "😤", label: "Không hài lòng" },
    ];

    // Initialize form with existing note data when editing
    useEffect(() => {
        if (existingNote) {
            setSelectedMood(existingNote.mood || "");
            // Separate existing images from new ones
            if (existingNote.images && existingNote.images.length > 0) {
                setExistingImageUrls(existingNote.images);
            }
        } else {
            // Reset when creating new note
            setExistingImageUrls([]);
            setImages([]);
            setPreviewUrls([]);
            setSelectedMood("");
        }
    }, [existingNote]);

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        const totalImages = existingImageUrls.length + images.length;

        if (files.length + totalImages > 3) {
            alert("Tối đa 3 ảnh cho ghi chú");
            return;
        }

        setImages((prev) => [...prev, ...files]);

        files.forEach((file) => {
            const url = URL.createObjectURL(file);
            setPreviewUrls((prev) => [...prev, url]);
        });
    };

    const removeNewImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
    };

    const removeExistingImage = (index: number) => {
        setExistingImageUrls((prev) => prev.filter((_, i) => i !== index));
    };

    const compressImage = (
        file: File,
        maxWidth: number = 800,
        quality: number = 0.7
    ): Promise<string> => {
        return new Promise((resolve) => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d")!;
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                const ratio = Math.min(
                    maxWidth / img.width,
                    maxWidth / img.height
                );
                canvas.width = img.width * ratio;
                canvas.height = img.height * ratio;

                // Draw and compress
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                const compressedDataUrl = canvas.toDataURL(
                    "image/jpeg",
                    quality
                );
                resolve(compressedDataUrl);
            };

            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        });
    };

    const onFormSubmit = async (data: LocationNoteFormData) => {
        // Handle images: combine existing images with new ones
        const imageDataUrls: string[] = [];

        // Include existing images that weren't removed
        for (const existingImage of existingImageUrls) {
            if (
                typeof existingImage === "string" &&
                existingImage.startsWith("data:image")
            ) {
                imageDataUrls.push(existingImage);
            }
        }

        // Convert and compress new images
        for (const file of images) {
            console.log(
                `🗜️ Compressing image: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`
            );
            const compressedDataUrl = await compressImage(file, 800, 0.7);
            console.log(
                `✅ Compressed to: ${((compressedDataUrl.length / 1024 / 1024) * 0.75).toFixed(2)}MB`
            );
            imageDataUrls.push(compressedDataUrl);
        }

        onSubmit({
            ...data,
            id: existingNote?.id,
            mood: selectedMood as
                | "😊"
                | "😍"
                | "😎"
                | "🤔"
                | "😴"
                | "😋"
                | "🥳"
                | "😤"
                | undefined,
            lng: location.lng,
            lat: location.lat,
            address: location.address || "",
            timestamp: new Date(),
            images: imageDataUrls, // Include images
        });
        reset();
        setImages([]);
        setPreviewUrls([]);
        setExistingImageUrls([]);
        setSelectedMood("");
        onClose();
    };

    const handleClose = () => {
        reset();
        setImages([]);
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        setExistingImageUrls([]);
        setSelectedMood("");
        onClose();
    };

    const currentTime = new Date().toLocaleString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-2xl">
                {/* Header with gradient background */}
                <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white p-6 pb-8">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <DialogHeader className="relative z-10">
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold text-white">
                            <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                                <BookOpen className="h-6 w-6" />
                            </div>
                            {existingNote
                                ? "Chỉnh sửa ghi chú"
                                : "Ghi chú tại địa điểm"}
                        </DialogTitle>
                    </DialogHeader>

                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-16 translate-x-16"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
                </div>

                <form
                    onSubmit={handleSubmit(onFormSubmit)}
                    className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]"
                >
                    {/* Time & Location Card */}
                    <div className="relative bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-2xl border border-blue-100/50 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-8 translate-x-8"></div>
                        <div className="relative space-y-3">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <div className="text-sm font-medium text-blue-900">
                                        Thời gian
                                    </div>
                                    <div className="text-sm text-blue-700">
                                        {currentTime}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-lg mt-0.5">
                                    <MapPin className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="text-sm font-medium text-blue-900 mb-1">
                                        Địa chỉ
                                    </div>
                                    <div className="text-sm text-blue-700 break-words leading-relaxed">
                                        {location.address}
                                    </div>
                                    <div className="text-xs text-blue-500 mt-1 font-mono">
                                        {location.lat.toFixed(6)},{" "}
                                        {location.lng.toFixed(6)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mood Selection Card */}
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-5 rounded-2xl border border-amber-100/50 shadow-sm hover:shadow-md transition-all duration-200">
                        <div className="mb-4">
                            <Label className="text-base font-semibold text-amber-900 flex items-center gap-2">
                                <div className="p-1 bg-amber-500/10 rounded-lg">
                                    <span className="text-lg">😊</span>
                                </div>
                                Tâm trạng lúc này
                            </Label>
                        </div>
                        <div className="grid grid-cols-4 gap-3">
                            {moods.map((mood) => (
                                <button
                                    key={mood.emoji}
                                    type="button"
                                    onClick={() => setSelectedMood(mood.emoji)}
                                    className={`group p-3 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                                        selectedMood === mood.emoji
                                            ? "border-amber-500 bg-amber-100 shadow-md"
                                            : "border-amber-200 hover:border-amber-300 bg-white/50"
                                    }`}
                                    title={mood.label}
                                >
                                    <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
                                        {mood.emoji}
                                    </div>
                                    <div className="text-xs text-amber-700 mt-1 font-medium">
                                        {mood.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Content Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-5 py-3 border-b border-gray-100">
                            <Label
                                htmlFor="content"
                                className="font-semibold text-gray-900 flex items-center gap-2"
                            >
                                <div className="p-1 bg-gray-500/10 rounded-lg">
                                    <span className="text-sm">✍️</span>
                                </div>
                                Nội dung ghi chú *
                            </Label>
                        </div>
                        <div className="p-5">
                            <Textarea
                                id="content"
                                {...register("content")}
                                placeholder="Bạn đang nghĩ gì? Cảm xúc như thế nào? Có gì đặc biệt tại đây không?

Ví dụ:
- Đang ngồi café với bạn bè, không gian rất chill
- Món ăn ở đây ngon quá, nhất định phải quay lại
- View từ đây nhìn xuống phố đi bộ rất đẹp
- Buổi họp quan trọng vừa kết thúc, cảm thấy nhẹ nhõm..."
                                rows={6}
                                className="resize-none border-0 focus:ring-2 focus:ring-blue-500 rounded-xl bg-gray-50/50"
                            />
                            {errors.content && (
                                <p className="text-sm text-red-600 mt-2 flex items-center gap-2">
                                    <span className="text-lg">⚠️</span>
                                    {errors.content.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Images Card */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-5 py-3 border-b border-gray-100">
                            <Label
                                htmlFor="images"
                                className="font-semibold text-gray-900 flex items-center gap-2"
                            >
                                <Camera className="h-4 w-4 text-gray-600" />
                                Hình ảnh{" "}
                                <span className="ml-1 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                    {existingImageUrls.length + images.length}/3
                                </span>
                            </Label>
                        </div>
                        <div className="p-5 space-y-4">
                            <input
                                type="file"
                                id="images"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    document.getElementById("images")?.click()
                                }
                                className="w-full h-12 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 hover:border-blue-300 transition-all duration-200"
                                disabled={
                                    existingImageUrls.length + images.length >=
                                    3
                                }
                            >
                                <Camera className="h-5 w-5 mr-2" />
                                {images.length > 0
                                    ? `Đã chọn ${images.length} ảnh mới`
                                    : "Chụp/chọn ảnh"}
                            </Button>

                            {/* Existing Images */}
                            {existingImageUrls.length > 0 && (
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Ảnh hiện có:
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {existingImageUrls.map((url, index) => (
                                            <div
                                                key={`existing-image-${existingNote?.id || "unknown"}-${index}`}
                                                className="group relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                                            >
                                                {typeof url === "string" &&
                                                url.startsWith("data:image") ? (
                                                    <>
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={url}
                                                            alt={`Ảnh hiện có ${index + 1}`}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                        />
                                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute -top-2 -right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                            onClick={() =>
                                                                removeExistingImage(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-500">
                                                        <div className="text-center">
                                                            <div className="text-3xl mb-2">
                                                                📷
                                                            </div>
                                                            <div className="text-xs font-medium">
                                                                Ảnh lỗi
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* New Images Previews */}
                            {previewUrls.length > 0 && (
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Ảnh mới:
                                    </div>
                                    <div className="grid grid-cols-3 gap-3">
                                        {previewUrls.map((url, index) => (
                                            <div
                                                key={`new-image-${url}-${index}`}
                                                className="group relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                                            >
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={url}
                                                    alt={`Ảnh mới ${index + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"></div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="sm"
                                                    className="absolute -top-2 -right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                    onClick={() =>
                                                        removeNewImage(index)
                                                    }
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                {/* Action Buttons - Fixed at bottom */}
                <div className="bg-gradient-to-r from-gray-50 to-slate-50 border-t border-gray-100 p-4">
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1 h-11 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800 font-medium shadow-sm hover:shadow transition-all duration-200"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            onClick={handleSubmit(onFormSubmit)}
                            className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-sm hover:shadow transition-all duration-200"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {(() => {
                                if (isSubmitting) return "Đang lưu...";
                                if (existingNote) return "Cập nhật ghi chú";
                                return "Lưu ghi chú";
                            })()}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
