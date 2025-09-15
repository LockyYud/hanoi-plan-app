"use client";

import { useState } from "react";
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
    isOpen: boolean;
    onClose: () => void;
    location: {
        lng: number;
        lat: number;
        address?: string;
    };
    onSubmit: (
        data: LocationNoteFormData & {
            lng: number;
            lat: number;
            address: string;
            timestamp: Date;
        }
    ) => void;
}

export function LocationNoteForm({
    isOpen,
    onClose,
    location,
    onSubmit,
}: LocationNoteFormProps) {
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [selectedMood, setSelectedMood] = useState<string>("");

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        watch,
        reset,
    } = useForm<LocationNoteFormData>({
        resolver: zodResolver(LocationNoteSchema),
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

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length + images.length > 3) {
            alert("Tối đa 3 ảnh cho ghi chú");
            return;
        }

        setImages((prev) => [...prev, ...files]);

        files.forEach((file) => {
            const url = URL.createObjectURL(file);
            setPreviewUrls((prev) => [...prev, url]);
        });
    };

    const removeImage = (index: number) => {
        setImages((prev) => prev.filter((_, i) => i !== index));
        setPreviewUrls((prev) => {
            URL.revokeObjectURL(prev[index]);
            return prev.filter((_, i) => i !== index);
        });
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
        // Convert and compress images
        const imageDataUrls: string[] = [];
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
            mood: selectedMood as any,
            lng: location.lng,
            lat: location.lat,
            address: location.address || "",
            timestamp: new Date(),
            images: imageDataUrls, // Include images
        });
        reset();
        setImages([]);
        setPreviewUrls([]);
        setSelectedMood("");
        onClose();
    };

    const handleClose = () => {
        reset();
        setImages([]);
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);
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
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        Ghi chú tại địa điểm
                    </DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onFormSubmit)}
                    className="space-y-4"
                >
                    {/* Time & Location Info */}
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                        <div className="flex items-center gap-2 text-sm text-blue-700">
                            <Clock className="h-4 w-4" />
                            {currentTime}
                        </div>
                        <div className="flex items-start gap-2 text-sm text-blue-600">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <span className="break-words">
                                {location.address}
                            </span>
                        </div>
                        <div className="text-xs text-blue-500">
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </div>
                    </div>

                    {/* Mood Selection */}
                    <div>
                        <Label>Tâm trạng lúc này</Label>
                        <div className="grid grid-cols-4 gap-2 mt-2">
                            {moods.map((mood) => (
                                <button
                                    key={mood.emoji}
                                    type="button"
                                    onClick={() => setSelectedMood(mood.emoji)}
                                    className={`p-3 rounded-lg border-2 transition-all ${
                                        selectedMood === mood.emoji
                                            ? "border-blue-500 bg-blue-50"
                                            : "border-gray-200 hover:border-gray-300"
                                    }`}
                                    title={mood.label}
                                >
                                    <div className="text-2xl">{mood.emoji}</div>
                                    <div className="text-xs text-gray-600 mt-1">
                                        {mood.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Note Content */}
                    <div>
                        <Label htmlFor="content">Ghi chú của bạn *</Label>
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
                            className="resize-none"
                        />
                        {errors.content && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.content.message}
                            </p>
                        )}
                    </div>

                    {/* Images */}
                    <div>
                        <Label htmlFor="images">Hình ảnh (tối đa 3)</Label>
                        <div className="mt-2">
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
                                className="w-full"
                                disabled={images.length >= 3}
                            >
                                <Camera className="h-4 w-4 mr-2" />
                                {images.length > 0
                                    ? `Đã chọn ${images.length}/3 ảnh`
                                    : "Chụp/chọn ảnh"}
                            </Button>
                        </div>

                        {/* Image Previews */}
                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={url}
                                            alt={`Ảnh ${index + 1}`}
                                            className="w-full h-24 object-cover rounded-md"
                                        />
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="sm"
                                            className="absolute -top-2 -right-2 h-6 w-6 p-0"
                                            onClick={() => removeImage(index)}
                                        >
                                            <X className="h-3 w-3" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? "Đang lưu..." : "Lưu ghi chú"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
