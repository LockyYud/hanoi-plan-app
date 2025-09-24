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
import {
    MapPin,
    Camera,
    X,
    Clock,
    Save,
    BookOpen,
    Star,
    Tag,
    Loader2,
    ChevronDown,
    ChevronRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useImageUpload } from "@/lib/image-upload";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";

const LocationNoteSchema = z.object({
    content: z.string().min(1, "Nội dung ghi chú không được để trống"),
    mood: z.enum(["😊", "😍", "😎", "🤔", "😴", "😋", "🥳", "😤"]).optional(),
    placeName: z.string().min(1, "Tên địa điểm không được để trống"),
    visitTime: z.string().min(1, "Thời gian thăm không được để trống"),
    category: z
        .enum(["cafe", "food", "bar", "rooftop", "activity", "landmark"])
        .optional(),
    rating: z.number().min(1).max(5).optional(),
    expense: z.number().min(0).optional(),
    companions: z.string().optional(),
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
        placeName?: string;
        visitTime?: string;
        category?: string;
        rating?: number;
        expense?: number;
        companions?: string;
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
    const [selectedRating, setSelectedRating] = useState<number>(
        existingNote?.rating || 0
    );
    const [selectedCategory, setSelectedCategory] = useState<string>(
        existingNote?.category || ""
    );
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");

    // Collapsible sections state
    const [expandedSections, setExpandedSections] = useState({
        basic: true, // Cơ bản (always open)
        mood: true, // Tâm trạng (always open)
        additional: false, // Bổ sung (collapsed by default)
    });

    const { uploadMultipleImages } = useImageUpload();

    // Toggle section expansion
    const toggleSection = (section: keyof typeof expandedSections) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

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
            placeName: existingNote?.placeName || location.address || "",
            visitTime:
                existingNote?.visitTime ||
                new Date().toISOString().slice(0, 16),
            category: existingNote?.category as
                | "cafe"
                | "food"
                | "bar"
                | "rooftop"
                | "activity"
                | "landmark"
                | undefined,
            rating: existingNote?.rating || undefined,
            expense: existingNote?.expense || undefined,
            companions: existingNote?.companions || "",
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
            setSelectedRating(existingNote.rating || 0);
            setSelectedCategory(existingNote.category || "");
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
            setSelectedRating(0);
            setSelectedCategory("");
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

    const onFormSubmit = async (data: LocationNoteFormData) => {
        try {
            setIsUploadingImages(true);
            setUploadProgress("Đang xử lý ảnh...");

            // Handle images: combine existing images with new ones
            const imageUrls: string[] = [];

            // Include existing images that weren't removed (these should now be URLs)
            for (const existingImage of existingImageUrls) {
                if (typeof existingImage === "string") {
                    // Support both old base64 format and new URL format
                    imageUrls.push(existingImage);
                }
            }

            // Upload new images to ShareVoucher API
            if (images.length > 0) {
                setUploadProgress(`Đang upload ${images.length} ảnh...`);
                console.log(
                    `📤 Uploading ${images.length} images to ShareVoucher API`
                );

                const uploadResults = await uploadMultipleImages(images);

                let successCount = 0;
                for (const result of uploadResults) {
                    if (result.success && result.url) {
                        imageUrls.push(result.url);
                        successCount++;
                        console.log(
                            `✅ Successfully uploaded image: ${result.url}`
                        );
                    } else {
                        console.error(
                            `❌ Failed to upload image: ${result.error}`
                        );
                        // You could show user notification here
                    }
                }

                console.log(
                    `📊 Upload summary: ${successCount}/${images.length} images uploaded successfully`
                );
                setUploadProgress(
                    `Đã upload ${successCount}/${images.length} ảnh thành công`
                );

                // Brief delay to show the progress message
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }

            setUploadProgress("Đang lưu ghi chú...");

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
                category: selectedCategory as
                    | "cafe"
                    | "food"
                    | "bar"
                    | "rooftop"
                    | "activity"
                    | "landmark"
                    | undefined,
                rating: selectedRating > 0 ? selectedRating : undefined,
                lng: location.lng,
                lat: location.lat,
                address: location.address || "",
                timestamp: new Date(),
                images: imageUrls, // Include image URLs
            });

            // Reset form
            reset();
            setImages([]);
            setPreviewUrls([]);
            setExistingImageUrls([]);
            setSelectedMood("");
            setSelectedRating(0);
            setSelectedCategory("");
            onClose();
        } catch (error) {
            console.error("Error submitting form:", error);
            setUploadProgress("Có lỗi xảy ra khi xử lý ảnh");
            // You could show user notification here
        } finally {
            setIsUploadingImages(false);
            setUploadProgress("");
        }
    };

    const handleClose = () => {
        reset();
        setImages([]);
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        setExistingImageUrls([]);
        setSelectedMood("");
        setSelectedRating(0);
        setSelectedCategory("");
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl sm:max-w-[95vw] max-h-[90vh] sm:max-h-[95vh] overflow-hidden p-0 bg-gradient-to-br from-white to-gray-50/50 border-0 shadow-2xl sm:rounded-t-2xl sm:rounded-b-none sm:fixed sm:bottom-0 sm:top-auto sm:translate-y-0">
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
                    className="p-6 sm:p-4 space-y-6 sm:space-y-4 overflow-y-auto max-h-[calc(90vh-120px)] sm:max-h-[calc(95vh-120px)]"
                >
                    {/* Section 1: Cơ bản */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection("basic")}
                            className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:from-blue-100 hover:to-indigo-100 transition-all duration-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-500/10 rounded-xl">
                                    <Clock className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-900">
                                        Thông tin cơ bản
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Thời gian và địa điểm
                                    </p>
                                </div>
                            </div>
                            {expandedSections.basic ? (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            )}
                        </button>

                        {expandedSections.basic && (
                            <div className="p-6 space-y-4">
                                {/* Visit Time - Editable */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-500" />
                                        Thời gian thăm *
                                    </Label>
                                    <Input
                                        type="datetime-local"
                                        {...register("visitTime")}
                                        className="bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-xl"
                                    />
                                    {errors.visitTime && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <span>⚠️</span>
                                            {errors.visitTime.message}
                                        </p>
                                    )}
                                </div>

                                {/* Place Name - Editable */}
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-gray-500" />
                                        Tên địa điểm *
                                    </Label>
                                    <Input
                                        {...register("placeName")}
                                        placeholder="VD: Cafe The Coffee Bean, Nhà hàng Madame Hiền..."
                                        className="bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-xl"
                                    />
                                    {errors.placeName && (
                                        <p className="text-sm text-red-600 flex items-center gap-1">
                                            <span>⚠️</span>
                                            {errors.placeName.message}
                                        </p>
                                    )}
                                </div>

                                {/* Address Display */}
                                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                    <div className="font-medium text-gray-700 mb-1">
                                        Địa chỉ:
                                    </div>
                                    <div className="break-words mb-2">
                                        {location.address}
                                    </div>
                                    <div className="font-mono text-gray-500">
                                        {location.lat.toFixed(6)},{" "}
                                        {location.lng.toFixed(6)}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Tâm trạng */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection("mood")}
                            className="w-full bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:from-amber-100 hover:to-orange-100 transition-all duration-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-500/10 rounded-xl">
                                    <span className="text-xl">😊</span>
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-900">
                                        Tâm trạng
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Cảm xúc của bạn lúc này
                                    </p>
                                </div>
                            </div>
                            {expandedSections.mood ? (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            )}
                        </button>

                        {expandedSections.mood && (
                            <div className="p-6">
                                <div className="grid grid-cols-4 sm:grid-cols-2 gap-3 sm:gap-2">
                                    {moods.map((mood) => (
                                        <button
                                            key={mood.emoji}
                                            type="button"
                                            onClick={() =>
                                                setSelectedMood(mood.emoji)
                                            }
                                            className={`group p-4 rounded-xl border-2 transition-all duration-200 transform hover:scale-105 ${
                                                selectedMood === mood.emoji
                                                    ? "border-amber-400 bg-amber-50 shadow-md ring-2 ring-amber-100"
                                                    : "border-gray-200 hover:border-amber-300 bg-white hover:bg-amber-50/50"
                                            }`}
                                            title={mood.label}
                                        >
                                            <div className="text-2xl group-hover:scale-110 transition-transform duration-200 mb-1">
                                                {mood.emoji}
                                            </div>
                                            <div
                                                className={`text-xs font-medium ${
                                                    selectedMood === mood.emoji
                                                        ? "text-amber-700"
                                                        : "text-gray-600"
                                                }`}
                                            >
                                                {mood.label}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Section 3: Bổ sung (collapsed by default) */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <button
                            type="button"
                            onClick={() => toggleSection("additional")}
                            className="w-full bg-gradient-to-r from-green-50 to-emerald-50 px-6 py-4 flex items-center justify-between border-b border-gray-100 hover:from-green-100 hover:to-emerald-100 transition-all duration-200"
                        >
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-500/10 rounded-xl">
                                    <Tag className="h-5 w-5 text-green-600" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-semibold text-gray-900">
                                        Thông tin bổ sung
                                    </h3>
                                    <p className="text-sm text-gray-500">
                                        Đánh giá, chi phí, bạn đồng hành
                                    </p>
                                </div>
                            </div>
                            {expandedSections.additional ? (
                                <ChevronDown className="h-5 w-5 text-gray-400" />
                            ) : (
                                <ChevronRight className="h-5 w-5 text-gray-400" />
                            )}
                        </button>

                        {expandedSections.additional && (
                            <div className="p-6">
                                <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-3">
                                    {/* Category */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">
                                            Loại địa điểm
                                        </Label>
                                        <Select
                                            value={selectedCategory}
                                            onValueChange={setSelectedCategory}
                                        >
                                            <SelectTrigger className="bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-xl">
                                                <SelectValue placeholder="Chọn loại địa điểm" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="cafe">
                                                    ☕ Cafe
                                                </SelectItem>
                                                <SelectItem value="food">
                                                    🍜 Nhà hàng
                                                </SelectItem>
                                                <SelectItem value="bar">
                                                    🍺 Bar/Pub
                                                </SelectItem>
                                                <SelectItem value="rooftop">
                                                    🏢 Rooftop
                                                </SelectItem>
                                                <SelectItem value="activity">
                                                    🎯 Hoạt động
                                                </SelectItem>
                                                <SelectItem value="landmark">
                                                    🏛️ Địa danh
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Rating */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">
                                            Đánh giá (1-5 sao)
                                        </Label>
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <button
                                                    key={star}
                                                    type="button"
                                                    onClick={() =>
                                                        setSelectedRating(star)
                                                    }
                                                    className={`p-1 hover:scale-110 transition-transform ${
                                                        star <= selectedRating
                                                            ? "text-yellow-500"
                                                            : "text-gray-300"
                                                    }`}
                                                >
                                                    <Star
                                                        className={`h-6 w-6 ${
                                                            star <=
                                                            selectedRating
                                                                ? "fill-yellow-500"
                                                                : "fill-gray-300"
                                                        }`}
                                                    />
                                                </button>
                                            ))}
                                        </div>
                                        {selectedRating > 0 && (
                                            <div className="text-sm text-yellow-600 font-medium">
                                                {selectedRating} sao
                                            </div>
                                        )}
                                    </div>

                                    {/* Expense */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700">
                                            Chi phí (VNĐ)
                                        </Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="1000"
                                            placeholder="0"
                                            {...register("expense", {
                                                setValueAs: (value) =>
                                                    value === ""
                                                        ? undefined
                                                        : Number(value),
                                            })}
                                            className="bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-xl"
                                        />
                                    </div>

                                    {/* Companions */}
                                    <div className="space-y-2 md:col-span-2">
                                        <Label className="text-sm font-medium text-gray-700">
                                            Đi cùng với ai?
                                        </Label>
                                        <Input
                                            placeholder="VD: Bạn bè, gia đình, đồng nghiệp..."
                                            {...register("companions")}
                                            className="bg-gray-50/50 border-gray-200 focus:bg-white focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all duration-200 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
                            <Label
                                htmlFor="content"
                                className="font-semibold text-gray-900 flex items-center gap-3"
                            >
                                <div className="p-2 bg-gray-500/10 rounded-xl">
                                    <span className="text-lg">✍️</span>
                                </div>
                                <div>
                                    <div>Nội dung ghi chú *</div>
                                    <div className="text-sm font-normal text-gray-500">
                                        Chia sẻ cảm xúc và trải nghiệm của bạn
                                    </div>
                                </div>
                            </Label>
                        </div>
                        <div className="p-6">
                            <Textarea
                                id="content"
                                {...register("content")}
                                placeholder="Bạn đang nghĩ gì? Cảm xúc như thế nào? Có gì đặc biệt tại đây không?

Ví dụ:
• Đang ngồi café với bạn bè, không gian rất chill
• Món ăn ở đây ngon quá, nhất định phải quay lại  
• View từ đây nhìn xuống phố đi bộ rất đẹp
• Buổi họp quan trọng vừa kết thúc, cảm thấy nhẹ nhõm..."
                                rows={6}
                                className="resize-none border-0 focus:ring-2 focus:ring-blue-100 focus:border-blue-300 rounded-xl bg-gray-50/50 text-gray-900 placeholder:text-gray-400 transition-all duration-200"
                            />
                            {errors.content && (
                                <p className="text-sm text-red-600 mt-3 flex items-center gap-2">
                                    <span className="text-lg">⚠️</span>
                                    {errors.content.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Images Section */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="bg-gradient-to-r from-gray-50 to-slate-50 px-6 py-4 border-b border-gray-100">
                            <Label
                                htmlFor="images"
                                className="font-semibold text-gray-900 flex items-center gap-3"
                            >
                                <div className="p-2 bg-gray-500/10 rounded-xl">
                                    <Camera className="h-5 w-5 text-gray-600" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span>Hình ảnh</span>
                                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                            {existingImageUrls.length +
                                                images.length}
                                            /3
                                        </span>
                                    </div>
                                    <div className="text-sm font-normal text-gray-500">
                                        Thêm ảnh để lưu giữ kỷ niệm
                                    </div>
                                </div>
                            </Label>
                        </div>
                        <div className="p-6 space-y-6">
                            <input
                                type="file"
                                id="images"
                                multiple
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                            />
                            {/* Upload Zone */}
                            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:bg-blue-50/50 transition-all duration-200">
                                <div className="text-center">
                                    <div className="w-12 h-12 bg-blue-100 rounded-xl mx-auto mb-3 flex items-center justify-center">
                                        <Camera className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            document
                                                .getElementById("images")
                                                ?.click()
                                        }
                                        className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 rounded-xl"
                                        disabled={
                                            existingImageUrls.length +
                                                images.length >=
                                            3
                                        }
                                    >
                                        <Camera className="h-4 w-4 mr-2" />
                                        {images.length > 0
                                            ? `Đã chọn ${images.length} ảnh mới`
                                            : "Chọn ảnh"}
                                    </Button>
                                    <p className="text-xs text-gray-500 mt-2">
                                        Kéo thả hoặc click để thêm ảnh (tối đa 3
                                        ảnh)
                                    </p>
                                </div>
                            </div>

                            {/* Existing Images */}
                            {existingImageUrls.length > 0 && (
                                <div>
                                    <div className="text-sm font-medium text-gray-700 mb-2">
                                        Ảnh hiện có:
                                    </div>
                                    <div className="grid grid-cols-3 sm:grid-cols-2 gap-3 sm:gap-2">
                                        {existingImageUrls.map((url, index) => (
                                            <div
                                                key={`existing-image-${existingNote?.id || "unknown"}-${index}`}
                                                className="group relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300"
                                            >
                                                {isValidImageUrl(url) ? (
                                                    <>
                                                        <ImageDisplay
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
                                    <div className="grid grid-cols-3 sm:grid-cols-2 gap-3 sm:gap-2">
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

                    {/* Action Buttons */}
                    <div className="bg-white border-t border-gray-100 p-6 mt-6 rounded-b-2xl">
                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                className="flex-1 h-12 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 hover:text-gray-800 font-medium shadow-sm hover:shadow-md transition-all duration-200 rounded-xl"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || isUploadingImages}
                                className="flex-2 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-sm hover:shadow-md transition-all duration-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUploadingImages ? (
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                ) : (
                                    <Save className="h-4 w-4 mr-2" />
                                )}
                                {(() => {
                                    if (isUploadingImages && uploadProgress)
                                        return uploadProgress;
                                    if (isSubmitting) return "Đang lưu...";
                                    if (existingNote) return "Cập nhật ghi chú";
                                    return "Lưu ghi chú";
                                })()}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
