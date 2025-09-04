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
import { Textarea } from "@/components/ui/textarea";
import { Users, Calendar, DollarSign, MapPin, X, Plus } from "lucide-react";
import { VIBE_TAGS, DISTRICTS } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const GroupFormSchema = z.object({
    name: z.string().min(1, "Tên nhóm là bắt buộc"),
    startTime: z.string().min(1, "Thời gian bắt đầu là bắt buộc"),
    endTime: z.string().min(1, "Thời gian kết thúc là bắt buộc"),
    budgetMin: z.number().min(0).optional(),
    budgetMax: z.number().min(0).optional(),
    vibeTags: z.array(z.string()).default([]),
    areaPref: z.array(z.string()).default([]),
});

type GroupFormData = z.infer<typeof GroupFormSchema>;

interface GroupFormProps {
    onSubmit: (data: GroupFormData) => Promise<void>;
    onCancel: () => void;
    className?: string;
}

export function GroupForm({ onSubmit, onCancel, className }: GroupFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedVibes, setSelectedVibes] = useState<string[]>([]);
    const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

    const form = useForm<GroupFormData>({
        resolver: zodResolver(GroupFormSchema),
        defaultValues: {
            name: "",
            startTime: "",
            endTime: "",
            vibeTags: [],
            areaPref: [],
        },
    });

    const handleSubmit = async (data: GroupFormData) => {
        try {
            setIsSubmitting(true);
            await onSubmit({
                ...data,
                vibeTags: selectedVibes,
                areaPref: selectedAreas,
            });
            toast.success("Nhóm đã được tạo thành công!");
            form.reset();
            setSelectedVibes([]);
            setSelectedAreas([]);
        } catch (error) {
            toast.error("Có lỗi xảy ra khi tạo nhóm");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleVibe = (vibe: string) => {
        setSelectedVibes((prev) =>
            prev.includes(vibe)
                ? prev.filter((v) => v !== vibe)
                : [...prev, vibe]
        );
    };

    const toggleArea = (area: string) => {
        setSelectedAreas((prev) =>
            prev.includes(area)
                ? prev.filter((a) => a !== area)
                : [...prev, area]
        );
    };

    return (
        <Card className={cn("w-full max-w-2xl", className)}>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Tạo nhóm mới
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-6"
                >
                    {/* Group Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">Tên nhóm *</Label>
                        <Input
                            id="name"
                            {...form.register("name")}
                            placeholder="VD: Weekend trong phố cổ"
                        />
                        {form.formState.errors.name && (
                            <p className="text-sm text-red-500">
                                {form.formState.errors.name.message}
                            </p>
                        )}
                    </div>

                    {/* Time Window */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">
                                Thời gian bắt đầu *
                            </Label>
                            <Input
                                id="startTime"
                                type="datetime-local"
                                {...form.register("startTime")}
                            />
                            {form.formState.errors.startTime && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.startTime.message}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="endTime">
                                Thời gian kết thúc *
                            </Label>
                            <Input
                                id="endTime"
                                type="datetime-local"
                                {...form.register("endTime")}
                            />
                            {form.formState.errors.endTime && (
                                <p className="text-sm text-red-500">
                                    {form.formState.errors.endTime.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Budget Range */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Ngân sách (VND)
                        </Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label
                                    htmlFor="budgetMin"
                                    className="text-sm text-gray-600"
                                >
                                    Tối thiểu
                                </Label>
                                <Input
                                    id="budgetMin"
                                    type="number"
                                    placeholder="100,000"
                                    {...form.register("budgetMin", {
                                        valueAsNumber: true,
                                    })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label
                                    htmlFor="budgetMax"
                                    className="text-sm text-gray-600"
                                >
                                    Tối đa
                                </Label>
                                <Input
                                    id="budgetMax"
                                    type="number"
                                    placeholder="500,000"
                                    {...form.register("budgetMax", {
                                        valueAsNumber: true,
                                    })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vibe Tags */}
                    <div className="space-y-3">
                        <Label>Phong cách</Label>
                        <div className="flex flex-wrap gap-2">
                            {VIBE_TAGS.map((vibe) => (
                                <Badge
                                    key={vibe}
                                    variant={
                                        selectedVibes.includes(vibe)
                                            ? "default"
                                            : "outline"
                                    }
                                    className="cursor-pointer"
                                    onClick={() => toggleVibe(vibe)}
                                >
                                    {vibe}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Area Preferences */}
                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Khu vực ưa thích
                        </Label>
                        <div className="flex flex-wrap gap-2">
                            {DISTRICTS.map((district) => (
                                <Badge
                                    key={district}
                                    variant={
                                        selectedAreas.includes(district)
                                            ? "default"
                                            : "outline"
                                    }
                                    className="cursor-pointer"
                                    onClick={() => toggleArea(district)}
                                >
                                    {district}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? "Đang tạo..." : "Tạo nhóm"}
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

