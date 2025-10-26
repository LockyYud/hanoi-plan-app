"use client";

import { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Calendar,
    MapPin,
    X,
    Navigation,
    Route,
    Clock,
    Image as ImageIcon,
} from "lucide-react";
import { LocationNote, usePlaceStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MemoryLaneViewProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly onShowRoute: (
        notes: LocationNote[],
        sortBy: "time" | "custom"
    ) => void;
}

export function MemoryLaneView({
    isOpen,
    onClose,
    onShowRoute,
}: MemoryLaneViewProps) {
    const { data: session } = useSession();
    const [notes, setNotes] = useState<LocationNote[]>([]);
    const [loading, setLoading] = useState(false);
    const { setSelectedNote } = usePlaceStore();

    // Date filters
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [quickFilter, setQuickFilter] = useState<
        "today" | "week" | "month" | "year" | "all"
    >("month");

    // Sorting
    const [sortBy, setSortBy] = useState<"time" | "custom">("time");
    const [customOrder, setCustomOrder] = useState<string[]>([]);

    // Quick date filters
    const getDateRange = (filter: typeof quickFilter) => {
        const now = new Date();
        const start = new Date();

        switch (filter) {
            case "today":
                start.setHours(0, 0, 0, 0);
                break;
            case "week":
                start.setDate(now.getDate() - 7);
                break;
            case "month":
                start.setMonth(now.getMonth() - 1);
                break;
            case "year":
                start.setFullYear(now.getFullYear() - 1);
                break;
            case "all":
                start.setFullYear(2000);
                break;
        }

        return { start, end: now };
    };

    // Apply quick filter
    useEffect(() => {
        const { start, end } = getDateRange(quickFilter);
        setStartDate(start.toISOString().split("T")[0]);
        setEndDate(end.toISOString().split("T")[0]);
    }, [quickFilter]);

    // Load notes
    useEffect(() => {
        if (isOpen && session) {
            loadNotes();
        }
    }, [isOpen, session, startDate, endDate]);

    const loadNotes = async () => {
        if (!session) return;

        setLoading(true);
        try {
            const response = await fetch(
                "/api/location-notes?includeImages=true",
                {
                    credentials: "include",
                }
            );

            if (response.ok) {
                const allNotes = await response.json();

                // Filter by date range
                const filtered = allNotes.filter((note: LocationNote) => {
                    const noteDate = new Date(note.timestamp);
                    const start = startDate ? new Date(startDate) : new Date(0);
                    const end = endDate ? new Date(endDate) : new Date();

                    // Set end time to end of day
                    end.setHours(23, 59, 59, 999);

                    return noteDate >= start && noteDate <= end;
                });

                setNotes(filtered);
            } else {
                toast.error("Không thể tải ghi chú");
            }
        } catch (error) {
            console.error("Error loading notes:", error);
            toast.error("Có lỗi xảy ra khi tải ghi chú");
        } finally {
            setLoading(false);
        }
    };

    // Sorted notes
    const sortedNotes = useMemo(() => {
        if (sortBy === "time") {
            return [...notes].sort(
                (a, b) =>
                    new Date(a.timestamp).getTime() -
                    new Date(b.timestamp).getTime()
            );
        } else {
            // Custom order
            if (customOrder.length === 0) return notes;
            return customOrder
                .map((id) => notes.find((n) => n.id === id))
                .filter(Boolean) as LocationNote[];
        }
    }, [notes, sortBy, customOrder]);

    // Handle drag and drop for custom ordering
    const handleDragStart = (e: React.DragEvent, noteId: string) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", noteId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = (e: React.DragEvent, targetNoteId: string) => {
        e.preventDefault();
        const draggedNoteId = e.dataTransfer.getData("text/plain");

        if (draggedNoteId === targetNoteId) return;

        const newOrder = [
            ...(customOrder.length > 0 ? customOrder : notes.map((n) => n.id)),
        ];
        const draggedIndex = newOrder.indexOf(draggedNoteId);
        const targetIndex = newOrder.indexOf(targetNoteId);

        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedNoteId);

        setCustomOrder(newOrder);
        setSortBy("custom");
    };

    // Format date
    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(date));
    };

    // Calculate total distance
    const totalDistance = useMemo(() => {
        if (sortedNotes.length < 2) return 0;

        let distance = 0;
        for (let i = 0; i < sortedNotes.length - 1; i++) {
            const lat1 = sortedNotes[i].lat;
            const lng1 = sortedNotes[i].lng;
            const lat2 = sortedNotes[i + 1].lat;
            const lng2 = sortedNotes[i + 1].lng;

            // Haversine formula for distance
            const R = 6371; // Earth's radius in km
            const dLat = ((lat2 - lat1) * Math.PI) / 180;
            const dLng = ((lng2 - lng1) * Math.PI) / 180;
            const a =
                Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos((lat1 * Math.PI) / 180) *
                    Math.cos((lat2 * Math.PI) / 180) *
                    Math.sin(dLng / 2) *
                    Math.sin(dLng / 2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            distance += R * c;
        }

        return distance;
    }, [sortedNotes]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-[#0C0C0C] border-neutral-800">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-2xl font-bold text-[#EDEDED] flex items-center gap-2">
                            <Calendar className="h-6 w-6 text-[#FF6B6B]" />
                            Xem lại kỷ niệm
                        </DialogTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onClose}
                            className="text-[#A0A0A0] hover:text-[#EDEDED]"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto space-y-4">
                    {/* Date Range Filters */}
                    <Card className="p-4 bg-neutral-900/50 border-neutral-800">
                        <div className="space-y-4">
                            {/* Quick filters */}
                            <div className="flex flex-wrap gap-2">
                                {[
                                    {
                                        label: "Hôm nay",
                                        value: "today" as const,
                                    },
                                    {
                                        label: "Tuần này",
                                        value: "week" as const,
                                    },
                                    {
                                        label: "Tháng này",
                                        value: "month" as const,
                                    },
                                    {
                                        label: "Năm này",
                                        value: "year" as const,
                                    },
                                    { label: "Tất cả", value: "all" as const },
                                ].map((filter) => (
                                    <Button
                                        key={filter.value}
                                        variant={
                                            quickFilter === filter.value
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() =>
                                            setQuickFilter(filter.value)
                                        }
                                        className={cn(
                                            "text-xs",
                                            quickFilter === filter.value
                                                ? "bg-[#FF6B6B] hover:bg-[#FF5555] text-white"
                                                : "bg-neutral-800 text-[#A0A0A0] hover:text-[#EDEDED]"
                                        )}
                                    >
                                        {filter.label}
                                    </Button>
                                ))}
                            </div>

                            {/* Custom date range */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label
                                        htmlFor="start-date"
                                        className="text-xs text-[#A0A0A0] mb-1 block"
                                    >
                                        Từ ngày
                                    </label>
                                    <Input
                                        id="start-date"
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => {
                                            setStartDate(e.target.value);
                                            setQuickFilter("all");
                                        }}
                                        className="bg-neutral-800 border-neutral-700 text-[#EDEDED]"
                                    />
                                </div>
                                <div>
                                    <label
                                        htmlFor="end-date"
                                        className="text-xs text-[#A0A0A0] mb-1 block"
                                    >
                                        Đến ngày
                                    </label>
                                    <Input
                                        id="end-date"
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => {
                                            setEndDate(e.target.value);
                                            setQuickFilter("all");
                                        }}
                                        className="bg-neutral-800 border-neutral-700 text-[#EDEDED]"
                                    />
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* Stats */}
                    {notes.length > 0 && (
                        <div className="grid grid-cols-3 gap-3">
                            <Card className="p-4 bg-gradient-to-br from-[#FF6B6B]/20 to-[#FF6B6B]/5 border-[#FF6B6B]/30">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-[#FF6B6B]">
                                        {notes.length}
                                    </div>
                                    <div className="text-xs text-[#A0A0A0]">
                                        Địa điểm
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4 bg-gradient-to-br from-green-500/20 to-green-500/5 border-green-500/30">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-400">
                                        {
                                            notes.filter(
                                                (n) =>
                                                    n.images &&
                                                    n.images.length > 0
                                            ).length
                                        }
                                    </div>
                                    <div className="text-xs text-[#A0A0A0]">
                                        Có ảnh
                                    </div>
                                </div>
                            </Card>
                            <Card className="p-4 bg-gradient-to-br from-blue-500/20 to-blue-500/5 border-blue-500/30">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-400">
                                        {totalDistance.toFixed(1)} km
                                    </div>
                                    <div className="text-xs text-[#A0A0A0]">
                                        Tổng quãng đường
                                    </div>
                                </div>
                            </Card>
                        </div>
                    )}

                    {/* Sort Options */}
                    {notes.length > 0 && (
                        <Card className="p-4 bg-neutral-900/50 border-neutral-800">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-[#EDEDED] font-medium">
                                    Sắp xếp:
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant={
                                            sortBy === "time"
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() => setSortBy("time")}
                                        className={cn(
                                            "text-xs",
                                            sortBy === "time"
                                                ? "bg-[#FF6B6B] hover:bg-[#FF5555]"
                                                : "bg-neutral-800 text-[#A0A0A0]"
                                        )}
                                    >
                                        <Clock className="h-3 w-3 mr-1" />
                                        Theo thời gian
                                    </Button>
                                    <Button
                                        variant={
                                            sortBy === "custom"
                                                ? "default"
                                                : "outline"
                                        }
                                        size="sm"
                                        onClick={() => {
                                            if (customOrder.length === 0) {
                                                setCustomOrder(
                                                    notes.map((n) => n.id)
                                                );
                                            }
                                            setSortBy("custom");
                                        }}
                                        className={cn(
                                            "text-xs",
                                            sortBy === "custom"
                                                ? "bg-[#FF6B6B] hover:bg-[#FF5555]"
                                                : "bg-neutral-800 text-[#A0A0A0]"
                                        )}
                                    >
                                        <Navigation className="h-3 w-3 mr-1" />
                                        Tùy chỉnh
                                    </Button>
                                </div>
                            </div>
                            {sortBy === "custom" && (
                                <div className="mt-2 text-xs text-[#A0A0A0]">
                                    💡 Kéo thả các ghi chú để sắp xếp lại lộ
                                    trình
                                </div>
                            )}
                        </Card>
                    )}

                    {/* Notes List */}
                    {loading ? (
                        <div className="text-center py-12">
                            <div className="animate-spin h-8 w-8 mx-auto mb-3 border-2 border-[#FF6B6B] border-t-transparent rounded-full" />
                            <p className="text-sm text-[#A0A0A0]">
                                Đang tải kỷ niệm...
                            </p>
                        </div>
                    ) : notes.length === 0 ? (
                        <div className="text-center py-12">
                            <Calendar className="h-12 w-12 mx-auto mb-3 text-neutral-600" />
                            <p className="text-[#A0A0A0]">
                                Không có ghi chú nào trong khoảng thời gian này
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {sortedNotes.map((note, index) => (
                                <Card
                                    key={note.id}
                                    draggable={sortBy === "custom"}
                                    onDragStart={(e) =>
                                        handleDragStart(e, note.id)
                                    }
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, note.id)}
                                    className={cn(
                                        "p-4 bg-neutral-900/70 border-neutral-800 hover:border-[#FF6B6B]/40 transition-all duration-200",
                                        sortBy === "custom" &&
                                            "cursor-move hover:bg-neutral-800/70"
                                    )}
                                    onClick={() => setSelectedNote(note)}
                                >
                                    <div className="flex items-start gap-3">
                                        {/* Index/Number */}
                                        <div className="flex-shrink-0">
                                            <div className="w-10 h-10 rounded-full bg-[#FF6B6B] flex items-center justify-center text-white font-bold">
                                                {index + 1}
                                            </div>
                                        </div>

                                        {/* Mood */}
                                        <div className="flex-shrink-0">
                                            <div className="w-12 h-12 rounded-2xl bg-neutral-800 flex items-center justify-center text-2xl">
                                                {note.mood || "📍"}
                                            </div>
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-semibold text-[#EDEDED] mb-1 line-clamp-2">
                                                {note.content ||
                                                    "Không có nội dung"}
                                            </div>
                                            <div className="text-xs text-[#A0A0A0] mb-2 flex items-center gap-1">
                                                <MapPin className="h-3 w-3" />
                                                {note.address}
                                            </div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <Badge
                                                    variant="outline"
                                                    className="text-xs bg-neutral-800 border-neutral-700"
                                                >
                                                    <Clock className="h-3 w-3 mr-1" />
                                                    {formatDate(note.timestamp)}
                                                </Badge>
                                                {note.images &&
                                                    note.images.length > 0 && (
                                                        <Badge
                                                            variant="outline"
                                                            className="text-xs bg-green-900/30 text-green-400 border-green-600/40"
                                                        >
                                                            <ImageIcon className="h-3 w-3 mr-1" />
                                                            {note.images.length}{" "}
                                                            ảnh
                                                        </Badge>
                                                    )}
                                            </div>
                                        </div>

                                        {/* Preview Image */}
                                        {note.images &&
                                            note.images.length > 0 && (
                                                <div className="flex-shrink-0">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={note.images[0]}
                                                        alt="Preview"
                                                        className="w-16 h-16 rounded-xl object-cover"
                                                    />
                                                </div>
                                            )}
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Show Route Button */}
                    {sortedNotes.length >= 2 && (
                        <Button
                            onClick={() => onShowRoute(sortedNotes, sortBy)}
                            className="w-full h-12 bg-gradient-to-r from-[#FF6B6B] to-[#FF8E53] hover:from-[#FF5555] hover:to-[#FF7A3D] text-white font-bold rounded-xl"
                        >
                            <Route className="h-5 w-5 mr-2" />
                            Xem lộ trình trên bản đồ ({sortedNotes.length} điểm)
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
