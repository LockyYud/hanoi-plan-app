"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Plus, X } from "lucide-react";
import { CATEGORIES, DISTRICTS, PRICE_LEVELS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PlaceFormSchema = z.object({
    name: z.string().min(1, "Tên địa điểm là bắt buộc"),
    address: z.string().min(1, "Địa chỉ là bắt buộc"),
    ward: z.string().optional(),
    district: z.string().optional(),
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
    website: z.string().url("URL không hợp lệ").optional().or(z.literal("")),
    description: z.string().optional(),
    tags: z.array(z.string()).default([]),
});

type PlaceFormData = z.infer<typeof PlaceFormSchema>;

interface PlaceFormProps {
    onSubmit: (
        data: PlaceFormData & { lat: number; lng: number }
    ) => Promise<void>;
    onCancel: () => void;
    initialLocation?: { lat: number; lng: number };
    className?: string;
}

export function PlaceForm({
    onSubmit,
    onCancel,
    initialLocation,
    className,
}: PlaceFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentTag, setCurrentTag] = useState("");
    const [location, setLocation] = useState(
        initialLocation || { lat: 21.0285, lng: 105.8542 }
    );

    const form = useForm<PlaceFormData>({
        resolver: zodResolver(PlaceFormSchema),
        defaultValues: {
            name: "",
            address: "",
            ward: "",
            district: "",
            category: "cafe",
            tags: [],
        },
    });

    const watchedTags = form.watch("tags");

    const handleSubmit = async (data: PlaceFormData) => {
        try {
            setIsSubmitting(true);
            await onSubmit({
                ...data,
                lat: location.lat,
                lng: location.lng,
            });
            toast.success("Địa điểm đã được thêm thành công!");
            form.reset();
        } catch (error) {
            toast.error("Có lỗi xảy ra khi thêm địa điểm");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const addTag = () => {
        if (currentTag.trim() && !watchedTags.includes(currentTag.trim())) {
            form.setValue("tags", [...watchedTags, currentTag.trim()]);
            setCurrentTag("");
        }
    };

    const removeTag = (tagToRemove: string) => {
        form.setValue(
            "tags",
            watchedTags.filter((tag) => tag !== tagToRemove)
        );
    };

    const categoryIcons = {
        cafe: "☕",
        food: "🍜",
        bar: "🍻",
        rooftop: "🏙️",
        activity: "🎯",
        landmark: "🏛️",
    };

    return (
        <Card className={cn("w-full max-w-2xl", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Thêm địa điểm mới
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                >
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Tên địa điểm *</Label>
                            <Input
                                id="name"
                                {...form.register("name")}
                                placeholder="VD: Cà phê Cộng"
                            />
                            {form.formState.errors.name && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.name.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Danh mục *</Label>
                            <Select
                                onValueChange={(value) =>
                                    form.setValue("category", value as any)
                                }
                                defaultValue="cafe"
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn danh mục" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIES.map((category) => (
                                        <SelectItem
                                            key={category}
                                            value={category}
                                        >
                                            {categoryIcons[category]} {category}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="address">Địa chỉ *</Label>
                        <Input
                            id="address"
                            {...form.register("address")}
                            placeholder="VD: 152 Trung Liệt, Đống Đa, Hà Nội"
                        />
                        {form.formState.errors.address && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.address.message}
                            </p>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="ward">Phường/Xã</Label>
                            <Input
                                id="ward"
                                {...form.register("ward")}
                                placeholder="VD: Trung Liệt"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="district">Quận/Huyện</Label>
                            <Select
                                onValueChange={(value) =>
                                    form.setValue("district", value)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn quận/huyện" />
                                </SelectTrigger>
                                <SelectContent>
                                    {DISTRICTS.map((district) => (
                                        <SelectItem
                                            key={district}
                                            value={district}
                                        >
                                            {district}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priceLevel">Mức giá</Label>
                            <Select
                                onValueChange={(value) =>
                                    form.setValue("priceLevel", parseInt(value))
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn mức giá" />
                                </SelectTrigger>
                                <SelectContent>
                                    {PRICE_LEVELS.map((level) => (
                                        <SelectItem
                                            key={level.value}
                                            value={level.value.toString()}
                                        >
                                            {level.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Số điện thoại</Label>
                            <Input
                                id="phone"
                                {...form.register("phone")}
                                placeholder="VD: 024 3537 2826"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="website">Website</Label>
                        <Input
                            id="website"
                            {...form.register("website")}
                            placeholder="https://example.com"
                        />
                        {form.formState.errors.website && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.website.message}
                            </p>
                        )}
                    </div>

                    {/* Tags */}
                    <div className="space-y-2">
                        <Label>Tags</Label>
                        <div className="flex gap-2">
                            <Input
                                value={currentTag}
                                onChange={(e) => setCurrentTag(e.target.value)}
                                placeholder="Thêm tag..."
                                onKeyPress={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        addTag();
                                    }
                                }}
                            />
                            <Button type="button" onClick={addTag} size="sm">
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                        {watchedTags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {watchedTags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="gap-1"
                                    >
                                        {tag}
                                        <button
                                            type="button"
                                            onClick={() => removeTag(tag)}
                                            className="hover:text-red-500"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? "Đang thêm..." : "Thêm địa điểm"}
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onCancel}
                            disabled={isSubmitting}
                        >
                            Hủy
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
