"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, MapPin, Calendar, Sparkles } from "lucide-react";
import { LocationNote } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CreateJourneyDialogProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onSuccess: () => void;
    readonly editingJourney?: {
        id: string;
        title: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        placeIds: string[];
    } | null;
}

export function CreateJourneyDialog({
    isOpen,
    onClose,
    onSuccess,
    editingJourney,
}: CreateJourneyDialogProps) {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [availableNotes, setAvailableNotes] = useState<LocationNote[]>([]);
    const [selectedPlaceIds, setSelectedPlaceIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingNotes, setLoadingNotes] = useState(false);

    // Load available location notes
    useEffect(() => {
        if (isOpen) {
            loadNotes();
        }
    }, [isOpen]);

    // Pre-fill when editing
    useEffect(() => {
        if (editingJourney) {
            setTitle(editingJourney.title);
            setDescription(editingJourney.description || "");
            setStartDate(
                editingJourney.startDate
                    ? new Date(editingJourney.startDate)
                          .toISOString()
                          .split("T")[0]
                    : ""
            );
            setEndDate(
                editingJourney.endDate
                    ? new Date(editingJourney.endDate)
                          .toISOString()
                          .split("T")[0]
                    : ""
            );
            setSelectedPlaceIds(editingJourney.placeIds);
        } else {
            // Reset form
            setTitle("");
            setDescription("");
            setStartDate("");
            setEndDate("");
            setSelectedPlaceIds([]);
        }
    }, [editingJourney, isOpen]);

    const loadNotes = async () => {
        setLoadingNotes(true);
        try {
            const response = await fetch(
                "/api/location-notes?includeImages=true",
                {
                    credentials: "include",
                }
            );

            if (response.ok) {
                const notes = await response.json();
                setAvailableNotes(notes);
            }
        } catch (error) {
            console.error("Error loading notes:", error);
            toast.error("Không thể tải danh sách địa điểm");
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!title.trim()) {
            toast.error("Vui lòng nhập tên hành trình");
            return;
        }

        if (selectedPlaceIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một địa điểm");
            return;
        }

        setLoading(true);
        try {
            const method = editingJourney ? "PUT" : "POST";
            const response = await fetch("/api/journeys", {
                method,
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    ...(editingJourney && { id: editingJourney.id }),
                    title,
                    description,
                    startDate: startDate || null,
                    endDate: endDate || null,
                    placeIds: selectedPlaceIds,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to save journey");
            }

            toast.success(
                editingJourney
                    ? "Đã cập nhật hành trình"
                    : "Đã tạo hành trình mới"
            );
            onSuccess();
            onClose();
        } catch (error) {
            console.error("Error saving journey:", error);
            toast.error("Có lỗi xảy ra khi lưu hành trình");
        } finally {
            setLoading(false);
        }
    };

    const togglePlace = (placeId: string) => {
        setSelectedPlaceIds((prev) =>
            prev.includes(placeId)
                ? prev.filter((id) => id !== placeId)
                : [...prev, placeId]
        );
    };

    const movePlace = (index: number, direction: "up" | "down") => {
        const newOrder = [...selectedPlaceIds];
        const targetIndex = direction === "up" ? index - 1 : index + 1;

        if (targetIndex < 0 || targetIndex >= newOrder.length) return;

        [newOrder[index], newOrder[targetIndex]] = [
            newOrder[targetIndex],
            newOrder[index],
        ];
        setSelectedPlaceIds(newOrder);
    };

    // Filter available notes by date range if dates are selected
    const filteredAvailableNotes = useMemo(() => {
        if (!startDate && !endDate) {
            return availableNotes;
        }

        const start = startDate ? new Date(startDate).getTime() : null;
        const end = endDate
            ? new Date(endDate).setHours(23, 59, 59, 999)
            : null;

        return availableNotes.filter((note) => {
            const noteTime = new Date(note.timestamp).getTime();

            if (start && end) {
                return noteTime >= start && noteTime <= end;
            } else if (start) {
                return noteTime >= start;
            } else if (end) {
                return noteTime <= end;
            }

            return true;
        });
    }, [availableNotes, startDate, endDate]);

    const selectedNotes = selectedPlaceIds
        .map((id) => availableNotes.find((n) => n.id === id))
        .filter(Boolean) as LocationNote[];

    // Get date range from selected places
    const getDateRangeFromSelection = () => {
        if (selectedNotes.length === 0) return null;

        const timestamps = selectedNotes.map((note) =>
            new Date(note.timestamp).getTime()
        );
        const minDate = new Date(Math.min(...timestamps));
        const maxDate = new Date(Math.max(...timestamps));

        return {
            start: minDate.toISOString().split("T")[0],
            end: maxDate.toISOString().split("T")[0],
        };
    };

    // Set start date from selected places
    const setStartDateFromSelection = () => {
        const dateRange = getDateRangeFromSelection();
        if (dateRange) {
            setStartDate(dateRange.start);
            toast.success(
                `Đã đặt ngày bắt đầu: ${new Date(dateRange.start).toLocaleDateString("vi-VN")}`
            );
        }
    };

    // Set end date from selected places
    const setEndDateFromSelection = () => {
        const dateRange = getDateRangeFromSelection();
        if (dateRange) {
            setEndDate(dateRange.end);
            toast.success(
                `Đã đặt ngày kết thúc: ${new Date(dateRange.end).toLocaleDateString("vi-VN")}`
            );
        }
    };

    // Set both dates from selected places
    const setBothDatesFromSelection = () => {
        const dateRange = getDateRangeFromSelection();
        if (dateRange) {
            setStartDate(dateRange.start);
            setEndDate(dateRange.end);
            toast.success(
                `Đã đặt khoảng thời gian: ${new Date(dateRange.start).toLocaleDateString("vi-VN")} - ${new Date(dateRange.end).toLocaleDateString("vi-VN")}`
            );
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-[#0C0C0C] border-neutral-800 w-[95vw] sm:w-full">
                <DialogHeader>
                    <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-[#EDEDED]">
                        {editingJourney
                            ? "Chỉnh sửa hành trình"
                            : "Tạo hành trình mới"}
                    </DialogTitle>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto space-y-3 sm:space-y-4"
                >
                    {/* Title */}
                    <div>
                        <Label
                            htmlFor="title"
                            className="text-xs sm:text-sm text-[#EDEDED]"
                        >
                            Tên hành trình *
                        </Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Ví dụ: Hà Nội - Tuần 1"
                            className="bg-neutral-800 border-neutral-700 text-[#EDEDED] h-9 sm:h-10 text-sm"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <Label
                            htmlFor="description"
                            className="text-xs sm:text-sm text-[#EDEDED]"
                        >
                            Mô tả
                        </Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Mô tả ngắn về hành trình"
                            className="bg-neutral-800 border-neutral-700 text-[#EDEDED] h-9 sm:h-10 text-sm"
                        />
                    </div>

                    {/* Date Range */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                            <Label className="text-xs sm:text-sm text-[#EDEDED]">
                                Thời gian hành trình
                            </Label>
                            {selectedNotes.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={setBothDatesFromSelection}
                                    className="h-6 sm:h-7 text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2"
                                >
                                    <Sparkles className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                                    <span className="hidden xs:inline">
                                        Lấy từ địa điểm
                                    </span>
                                    <span className="xs:hidden">Auto</span>
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                            <div className="space-y-1 sm:space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <Label
                                        htmlFor="start-date"
                                        className="text-xs sm:text-sm text-[#A0A0A0]"
                                    >
                                        Ngày bắt đầu
                                    </Label>
                                    {selectedNotes.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={setStartDateFromSelection}
                                            className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                            title="Lấy ngày sớm nhất từ địa điểm đã chọn"
                                        >
                                            ← Lấy
                                        </button>
                                    )}
                                </div>
                                <Input
                                    id="start-date"
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="bg-neutral-800 border-neutral-700 text-[#EDEDED] h-9 sm:h-10 text-sm"
                                />
                            </div>
                            <div className="space-y-1 sm:space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                    <Label
                                        htmlFor="end-date"
                                        className="text-xs sm:text-sm text-[#A0A0A0]"
                                    >
                                        Ngày kết thúc
                                    </Label>
                                    {selectedNotes.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={setEndDateFromSelection}
                                            className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 hover:underline"
                                            title="Lấy ngày muộn nhất từ địa điểm đã chọn"
                                        >
                                            ← Lấy
                                        </button>
                                    )}
                                </div>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-neutral-800 border-neutral-700 text-[#EDEDED] h-9 sm:h-10 text-sm"
                                />
                            </div>
                        </div>
                        {(startDate || endDate) &&
                            filteredAvailableNotes.length <
                                availableNotes.length && (
                                <div className="flex items-start gap-1.5 sm:gap-2 p-2 sm:p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-[10px] sm:text-xs text-blue-300">
                                        Đang lọc {filteredAvailableNotes.length}
                                        /{availableNotes.length} địa điểm trong
                                        khoảng thời gian này
                                    </p>
                                </div>
                            )}
                    </div>

                    {/* Selected Places (with ordering) */}
                    {selectedNotes.length > 0 && (
                        <div className="space-y-2">
                            <Label className="text-xs sm:text-sm text-[#EDEDED]">
                                Lộ trình ({selectedNotes.length} địa điểm)
                            </Label>
                            <div className="space-y-1.5 sm:space-y-2 max-h-40 sm:max-h-48 overflow-y-auto p-1.5 sm:p-2 bg-neutral-900/50 rounded-xl">
                                {selectedNotes.map((note, index) => (
                                    <div
                                        key={note.id}
                                        className="flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-neutral-800 rounded-lg"
                                    >
                                        <div className="flex flex-col gap-0.5 sm:gap-1">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-3 w-5 sm:h-4 sm:w-6 p-0 text-[10px] sm:text-xs"
                                                onClick={() =>
                                                    movePlace(index, "up")
                                                }
                                                disabled={index === 0}
                                            >
                                                ▲
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                className="h-3 w-5 sm:h-4 sm:w-6 p-0 text-[10px] sm:text-xs"
                                                onClick={() =>
                                                    movePlace(index, "down")
                                                }
                                                disabled={
                                                    index ===
                                                    selectedNotes.length - 1
                                                }
                                            >
                                                ▼
                                            </Button>
                                        </div>
                                        <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-[#FF6B6B] flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                                            {index + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-xs sm:text-sm text-[#EDEDED] truncate">
                                                {note.content ||
                                                    "Không có tiêu đề"}
                                            </div>
                                            <div className="text-[10px] sm:text-xs text-[#A0A0A0] truncate">
                                                {note.address}
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => togglePlace(note.id)}
                                            className="h-6 w-6 sm:h-7 sm:w-7 md:h-8 md:w-8 p-0 text-red-400 hover:text-red-300 flex-shrink-0"
                                        >
                                            <X className="h-3 w-3 sm:h-4 sm:w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Available Places */}
                    <div className="space-y-2">
                        <Label className="text-xs sm:text-sm text-[#EDEDED]">
                            Chọn địa điểm (
                            <span className="hidden xs:inline">
                                {filteredAvailableNotes.length}{" "}
                                {(startDate || endDate) &&
                                filteredAvailableNotes.length <
                                    availableNotes.length
                                    ? `/ ${availableNotes.length} `
                                    : ""}
                                có sẵn
                            </span>
                            <span className="xs:hidden">
                                {filteredAvailableNotes.length}{" "}
                                {(startDate || endDate) &&
                                filteredAvailableNotes.length <
                                    availableNotes.length
                                    ? `/ ${availableNotes.length}`
                                    : ""}
                            </span>
                            )
                        </Label>
                        {loadingNotes ? (
                            <div className="text-center py-4 text-[#A0A0A0] text-xs sm:text-sm">
                                Đang tải...
                            </div>
                        ) : filteredAvailableNotes.length === 0 ? (
                            <div className="text-center py-6 sm:py-8 text-[#A0A0A0] bg-neutral-900/50 rounded-xl">
                                <MapPin className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 opacity-50" />
                                <p className="text-xs sm:text-sm">
                                    Không có địa điểm nào
                                </p>
                                {(startDate || endDate) && (
                                    <p className="text-[10px] sm:text-xs mt-1">
                                        trong khoảng thời gian này
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-1.5 sm:space-y-2 max-h-56 sm:max-h-64 overflow-y-auto p-1.5 sm:p-2 bg-neutral-900/50 rounded-xl">
                                {filteredAvailableNotes.map((note) => {
                                    const isSelected =
                                        selectedPlaceIds.includes(note.id);
                                    return (
                                        <div
                                            key={note.id}
                                            onClick={() => togglePlace(note.id)}
                                            onKeyDown={(e) => {
                                                if (
                                                    e.key === "Enter" ||
                                                    e.key === " "
                                                ) {
                                                    e.preventDefault();
                                                    togglePlace(note.id);
                                                }
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            className={cn(
                                                "flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg cursor-pointer transition-all",
                                                isSelected
                                                    ? "bg-[#FF6B6B]/20 border border-[#FF6B6B]/50"
                                                    : "bg-neutral-800 hover:bg-neutral-700 border border-transparent"
                                            )}
                                        >
                                            <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-neutral-700 flex items-center justify-center text-xl sm:text-2xl">
                                                {note.mood || "📍"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs sm:text-sm font-medium text-[#EDEDED] truncate">
                                                    {note.content ||
                                                        "Không có tiêu đề"}
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-[#A0A0A0] truncate flex items-center gap-1">
                                                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                    <span className="truncate">
                                                        {note.address}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-[#666] flex items-center gap-1 mt-0.5">
                                                    <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                    {new Date(
                                                        note.timestamp
                                                    ).toLocaleDateString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Badge className="bg-[#FF6B6B] text-white text-xs px-2 py-0.5 flex-shrink-0">
                                                    ✓
                                                </Badge>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-neutral-800">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 bg-neutral-800 text-[#EDEDED] border-neutral-700 h-9 sm:h-10 text-sm"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5555] hover:to-[#FF7A3D] text-white h-9 sm:h-10 text-sm"
                        >
                            {loading
                                ? "Đang lưu..."
                                : editingJourney
                                  ? "Cập nhật"
                                  : "Tạo hành trình"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
