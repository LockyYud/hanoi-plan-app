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
import {
    X,
    MapPin,
    Calendar,
    Sparkles,
    Route,
    Clock,
    Search,
} from "lucide-react";
import { LocationNote } from "@/lib/store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

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
    const [searchQuery, setSearchQuery] = useState("");
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

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

    // Drag and drop handlers
    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;
        setDragOverIndex(index);
    };

    const handleDragLeave = () => {
        setDragOverIndex(null);
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === dropIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }

        const newOrder = [...selectedPlaceIds];
        const draggedItem = newOrder[draggedIndex];
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(dropIndex, 0, draggedItem);

        setSelectedPlaceIds(newOrder);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Filter available notes by date range and search query
    const filteredAvailableNotes = useMemo(() => {
        let filtered = availableNotes;

        // Filter by date range
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate).getTime() : null;
            const end = endDate
                ? new Date(endDate).setHours(23, 59, 59, 999)
                : null;

            filtered = filtered.filter((note) => {
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
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (note) =>
                    note.content?.toLowerCase().includes(query) ||
                    note.address?.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [availableNotes, startDate, endDate, searchQuery]);

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
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col bg-card border-border w-[95vw] sm:w-full rounded-2xl shadow-2xl">
                {/* Modern Header with Icon */}
                <DialogHeader className="border-b border-border/50 pb-4 sm:pb-5 px-1">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 sm:p-3 rounded-xl bg-brand shadow-lg">
                            <Route className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                        </div>
                        <div className="flex-1">
                            <DialogTitle className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-0.5">
                                {editingJourney
                                    ? "Chỉnh sửa hành trình"
                                    : "Tạo hành trình mới"}
                            </DialogTitle>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                                {editingJourney
                                    ? "Cập nhật thông tin và địa điểm"
                                    : "Tạo hành trình từ các địa điểm đã lưu"}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit}
                    className="flex-1 overflow-y-auto space-y-4 sm:space-y-6 custom-scrollbar"
                >
                    {/* Basic Info Section */}
                    <div className="space-y-4 p-4 sm:p-5 bg-card/50 rounded-xl border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="h-1 w-1 rounded-full bg-brand"></div>
                            <h3 className="text-sm sm:text-base font-semibold text-foreground">
                                Thông tin cơ bản
                            </h3>
                        </div>

                        {/* Title */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="title"
                                className="text-xs sm:text-sm text-muted-foreground font-medium flex items-center gap-1.5"
                            >
                                <span>Tên hành trình</span>
                                <span className="text-brand">*</span>
                            </Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Ví dụ: Khám phá Hà Nội - Tuần 1"
                                className="bg-secondary/80 border-border hover:border-border focus:border-brand/50 text-foreground h-10 sm:h-11 text-sm transition-colors rounded-lg"
                                required
                            />
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <Label
                                htmlFor="description"
                                className="text-xs sm:text-sm text-muted-foreground font-medium"
                            >
                                Mô tả
                            </Label>
                            <Textarea
                                id="description"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Mô tả ngắn về hành trình của bạn..."
                                rows={2}
                                className="bg-secondary/80 border-border hover:border-border focus:border-brand/50 text-foreground text-sm resize-none transition-colors rounded-lg"
                            />
                        </div>
                    </div>

                    {/* Date Range Section */}
                    <div className="space-y-3 p-4 sm:p-5 bg-card/50 rounded-xl border border-border/50">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-brand"></div>
                                <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                                    <Clock className="h-4 w-4" />
                                    Thời gian hành trình
                                </h3>
                            </div>
                            {selectedNotes.length > 0 && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={setBothDatesFromSelection}
                                    className="h-7 sm:h-8 text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-2 sm:px-3 rounded-lg transition-colors"
                                >
                                    <Sparkles className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1" />
                                    <span className="hidden xs:inline">
                                        Tự động điền
                                    </span>
                                    <span className="xs:hidden">Auto</span>
                                </Button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label
                                        htmlFor="start-date"
                                        className="text-xs sm:text-sm text-muted-foreground font-medium"
                                    >
                                        Ngày bắt đầu
                                    </Label>
                                    {selectedNotes.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={setStartDateFromSelection}
                                            className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                                            title="Lấy ngày sớm nhất từ địa điểm đã chọn"
                                        >
                                            ← Lấy ngày
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
                                    className="bg-secondary/80 border-border hover:border-border focus:border-brand/50 text-foreground h-10 sm:h-11 text-sm transition-colors rounded-lg"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                    <Label
                                        htmlFor="end-date"
                                        className="text-xs sm:text-sm text-muted-foreground font-medium"
                                    >
                                        Ngày kết thúc
                                    </Label>
                                    {selectedNotes.length > 0 && (
                                        <button
                                            type="button"
                                            onClick={setEndDateFromSelection}
                                            className="text-[10px] sm:text-xs text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                                            title="Lấy ngày muộn nhất từ địa điểm đã chọn"
                                        >
                                            ← Lấy ngày
                                        </button>
                                    )}
                                </div>
                                <Input
                                    id="end-date"
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-secondary/80 border-border hover:border-border focus:border-brand/50 text-foreground h-10 sm:h-11 text-sm transition-colors rounded-lg"
                                />
                            </div>
                        </div>

                        {(startDate || endDate) &&
                            filteredAvailableNotes.length <
                                availableNotes.length && (
                                <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                    <Calendar className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                    <p className="text-xs text-blue-300">
                                        Đang hiển thị{" "}
                                        <span className="font-semibold">
                                            {filteredAvailableNotes.length}
                                        </span>
                                        /{availableNotes.length} địa điểm trong
                                        khoảng thời gian đã chọn
                                    </p>
                                </div>
                            )}
                    </div>

                    {/* Selected Places (with ordering) */}
                    {selectedNotes.length > 0 && (
                        <div className="space-y-3 p-4 sm:p-5 bg-brand/10 rounded-xl border border-brand/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-1 w-1 rounded-full bg-brand"></div>
                                    <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                                        <Route className="h-4 w-4" />
                                        Lộ trình đã chọn
                                    </h3>
                                </div>
                                <Badge className="bg-brand text-white border-0 text-xs px-2.5 py-0.5">
                                    {selectedNotes.length} điểm
                                </Badge>
                            </div>

                            <div className="space-y-2 max-h-52 sm:max-h-64 overflow-y-auto custom-scrollbar pr-1">
                                {selectedNotes.map((note, index) => {
                                    const isDragging = draggedIndex === index;
                                    const isDragOver = dragOverIndex === index;

                                    return (
                                        <div
                                            key={note.id}
                                            draggable
                                            onDragStart={() =>
                                                handleDragStart(index)
                                            }
                                            onDragOver={(e) =>
                                                handleDragOver(e, index)
                                            }
                                            onDragLeave={handleDragLeave}
                                            onDrop={(e) => handleDrop(e, index)}
                                            onDragEnd={handleDragEnd}
                                            className={cn(
                                                "group flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-lg border transition-all cursor-move",
                                                isDragging &&
                                                    "opacity-50 scale-95 rotate-2",
                                                isDragOver &&
                                                    !isDragging &&
                                                    "border-brand bg-brand/20 scale-105",
                                                !isDragging &&
                                                    !isDragOver &&
                                                    "bg-card/80 hover:bg-secondary/80 border-border/50 hover:border-brand/30"
                                            )}
                                        >
                                            {/* Drag handle icon */}
                                            <div className="flex-shrink-0 text-neutral-500 group-hover:text-brand transition-colors touch-none">
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="w-4 h-4"
                                                >
                                                    <circle
                                                        cx="9"
                                                        cy="5"
                                                        r="1"
                                                    />
                                                    <circle
                                                        cx="9"
                                                        cy="12"
                                                        r="1"
                                                    />
                                                    <circle
                                                        cx="9"
                                                        cy="19"
                                                        r="1"
                                                    />
                                                    <circle
                                                        cx="15"
                                                        cy="5"
                                                        r="1"
                                                    />
                                                    <circle
                                                        cx="15"
                                                        cy="12"
                                                        r="1"
                                                    />
                                                    <circle
                                                        cx="15"
                                                        cy="19"
                                                        r="1"
                                                    />
                                                </svg>
                                            </div>

                                            {/* Order number */}
                                            <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg">
                                                {index + 1}
                                            </div>

                                            {/* Place info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                                                    {note.content ||
                                                        "Không có tiêu đề"}
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                                    <span>{note.address}</span>
                                                </div>
                                            </div>

                                            {/* Remove button */}
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    togglePlace(note.id);
                                                }}
                                                className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                                            </Button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Available Places Section */}
                    <div className="space-y-3 p-4 sm:p-5 bg-card/50 rounded-xl border border-border/50">
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <div className="h-1 w-1 rounded-full bg-brand"></div>
                                <h3 className="text-sm sm:text-base font-semibold text-foreground flex items-center gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Chọn địa điểm
                                </h3>
                            </div>
                            <Badge
                                variant="outline"
                                className="bg-secondary border-border text-muted-foreground text-xs px-2.5 py-0.5"
                            >
                                {filteredAvailableNotes.length}
                                {(startDate || endDate || searchQuery) &&
                                filteredAvailableNotes.length <
                                    availableNotes.length
                                    ? `/${availableNotes.length}`
                                    : ""}{" "}
                                sẵn
                            </Badge>
                        </div>

                        {/* Search Bar */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Tìm theo tên hoặc địa chỉ..."
                                className="pl-9 bg-secondary/80 border-border hover:border-border focus:border-brand/50 text-foreground h-10 text-sm transition-colors rounded-lg"
                            />
                            {searchQuery && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setSearchQuery("")}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                            )}
                        </div>

                        {/* Places List */}
                        {loadingNotes && (
                            <div className="text-center py-8 text-muted-foreground text-sm">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-2"></div>
                                Đang tải địa điểm...
                            </div>
                        )}

                        {!loadingNotes &&
                            filteredAvailableNotes.length === 0 && (
                                <div className="text-center py-8 sm:py-10 bg-secondary/50 rounded-xl">
                                    <MapPin className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-muted-foreground" />
                                    <p className="text-sm sm:text-base text-muted-foreground font-medium">
                                        Không có địa điểm nào
                                    </p>
                                    {(startDate || endDate || searchQuery) && (
                                        <p className="text-xs sm:text-sm text-neutral-500 mt-1">
                                            {searchQuery && "với từ khóa này"}
                                            {!searchQuery &&
                                                "trong khoảng thời gian này"}
                                        </p>
                                    )}
                                </div>
                            )}

                        {!loadingNotes && filteredAvailableNotes.length > 0 && (
                            <div className="space-y-2 max-h-64 sm:max-h-72 overflow-y-auto custom-scrollbar pr-1">
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
                                                "group flex items-center gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-lg cursor-pointer transition-all border",
                                                isSelected
                                                    ? "bg-brand/20 border-brand/50 shadow-sm"
                                                    : "bg-secondary/80 hover:bg-accent/80 border-border/50 hover:border-border"
                                            )}
                                        >
                                            <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-neutral-700/80 group-hover:bg-muted/80 flex items-center justify-center text-xl sm:text-2xl transition-colors">
                                                {note.mood || "📍"}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="text-xs sm:text-sm font-medium text-foreground truncate">
                                                    {note.content ||
                                                        "Không có tiêu đề"}
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                                    <span className="truncate">
                                                        {note.address}
                                                    </span>
                                                </div>
                                                <div className="text-[10px] sm:text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                                                    <Calendar className="h-2.5 w-2.5 sm:h-3 sm:w-3 flex-shrink-0" />
                                                    {new Date(
                                                        note.timestamp
                                                    ).toLocaleDateString(
                                                        "vi-VN"
                                                    )}
                                                </div>
                                            </div>
                                            {isSelected && (
                                                <Badge className="bg-brand text-white border-0 text-xs px-2 py-0.5 flex-shrink-0 shadow-sm">
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
                    <div className="flex gap-2.5 sm:gap-3 pt-4 sm:pt-5 border-t border-border/50">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="flex-1 bg-secondary/80 hover:bg-accent text-foreground border-border hover:border-border h-10 sm:h-11 text-sm font-medium rounded-lg transition-all"
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-brand hover:from-brand-hover hover:to-brand-secondary-hover text-white border-0 h-10 sm:h-11 text-sm font-semibold shadow-lg hover:shadow-xl transition-all rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Đang lưu...
                                </span>
                            ) : (
                                <>
                                    {editingJourney
                                        ? "Cập nhật hành trình"
                                        : "Tạo hành trình"}
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
