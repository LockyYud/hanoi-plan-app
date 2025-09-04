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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { CATEGORIES } from "@/lib/types";
import {
    MapPin,
    Camera,
    X,
    Star,
    DollarSign,
    Clock,
    Phone,
    Globe,
    Save,
} from "lucide-react";

const AddPlaceSchema = z.object({
    name: z.string().min(1, "Tên địa điểm là bắt buộc"),
    category: z.enum([
        "cafe",
        "food",
        "bar",
        "rooftop",
        "activity",
        "landmark",
    ]),
    priceLevel: z.number().min(1).max(4).optional(),
    phone: z.string().optional(),
    website: z.string().url().optional().or(z.literal("")),
    openHours: z.string().optional(),
    notes: z.string().optional(),
});

type AddPlaceFormData = z.infer<typeof AddPlaceSchema>;

interface AddPlaceFormProps {
    isOpen: boolean;
    onClose: () => void;
    location: {
        lng: number;
        lat: number;
        address?: string;
    };
    onSubmit: (
        data: AddPlaceFormData & { lng: number; lat: number; address: string }
    ) => void;
}

export function AddPlaceForm({
    isOpen,
    onClose,
    location,
    onSubmit,
}: AddPlaceFormProps) {
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setValue,
        watch,
        reset,
    } = useForm<AddPlaceFormData>({
        resolver: zodResolver(AddPlaceSchema),
    });

    const categoryIcons = {
        cafe: "☕",
        food: "🍜",
        bar: "🍻",
        rooftop: "🏙️",
        activity: "🎯",
        landmark: "🏛️",
    };

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length + images.length > 5) {
            alert("Tối đa 5 ảnh");
            return;
        }

        setImages((prev) => [...prev, ...files]);

        // Create preview URLs
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

    const onFormSubmit = (data: AddPlaceFormData) => {
        onSubmit({
            ...data,
            lng: location.lng,
            lat: location.lat,
            address: location.address || "",
        });
        reset();
        setImages([]);
        setPreviewUrls([]);
        onClose();
    };

    const handleClose = () => {
        reset();
        setImages([]);
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Thêm địa điểm mới
                    </DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onFormSubmit)}
                    className="space-y-4"
                >
                    {/* Location Info */}
                    <div className="bg-gray-50 p-3 rounded-md">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            {location.address}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                            {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <Label htmlFor="name">Tên địa điểm *</Label>
                        <Input
                            id="name"
                            {...register("name")}
                            placeholder="VD: Café The Coffee House"
                        />
                        {errors.name && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* Category */}
                    <div>
                        <Label htmlFor="category">Loại hình *</Label>
                        <Select
                            onValueChange={(value) =>
                                setValue("category", value as any)
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn loại hình" />
                            </SelectTrigger>
                            <SelectContent>
                                {CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        <span className="flex items-center gap-2">
                                            {categoryIcons[category]} {category}
                                        </span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.category && (
                            <p className="text-sm text-red-600 mt-1">
                                {errors.category.message}
                            </p>
                        )}
                    </div>

                    {/* Price Level */}
                    <div>
                        <Label htmlFor="priceLevel">Mức giá</Label>
                        <Select
                            onValueChange={(value) =>
                                setValue("priceLevel", parseInt(value))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Chọn mức giá" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">₫ - Rẻ</SelectItem>
                                <SelectItem value="2">
                                    ₫₫ - Bình thường
                                </SelectItem>
                                <SelectItem value="3">₫₫₫ - Đắt</SelectItem>
                                <SelectItem value="4">
                                    ₫₫₫₫ - Rất đắt
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Contact Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input
                                id="phone"
                                {...register("phone")}
                                placeholder="0123456789"
                            />
                        </div>
                        <div>
                            <Label htmlFor="website">Website</Label>
                            <Input
                                id="website"
                                {...register("website")}
                                placeholder="https://..."
                            />
                        </div>
                    </div>

                    {/* Hours */}
                    <div>
                        <Label htmlFor="openHours">Giờ mở cửa</Label>
                        <Input
                            id="openHours"
                            {...register("openHours")}
                            placeholder="VD: 8:00 - 22:00"
                        />
                    </div>

                    {/* Images */}
                    <div>
                        <Label htmlFor="images">Hình ảnh (tối đa 5)</Label>
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
                            >
                                <Camera className="h-4 w-4 mr-2" />
                                Thêm ảnh
                            </Button>
                        </div>

                        {/* Image Previews */}
                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative">
                                        <img
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            className="w-full h-20 object-cover rounded-md"
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

                    {/* Notes */}
                    <div>
                        <Label htmlFor="notes">Ghi chú cá nhân</Label>
                        <Textarea
                            id="notes"
                            {...register("notes")}
                            placeholder="Chia sẻ cảm nhận, đánh giá của bạn về địa điểm này..."
                            rows={3}
                        />
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
                            className="flex-1"
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {isSubmitting ? "Đang lưu..." : "Lưu địa điểm"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
