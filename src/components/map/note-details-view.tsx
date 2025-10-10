"use client";

import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Clock,
  Edit,
  Trash2,
  Share,
  Heart,
  Eye,
  Tag,
  CalendarDays,
  Star,
  X,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import { ImageLightbox } from "./image-lightbox";

interface LocationNote {
  id: string;
  lng: number;
  lat: number;
  address: string;
  content: string;
  mood?: string;
  timestamp: Date;
  images?: string[];
  hasImages?: boolean;
  placeName?: string;
  visitTime?: string;
  category?: string;
  categoryName?: string;
  coverImageIndex?: number;
}

interface NoteDetailsViewProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly note: LocationNote;
  readonly onEdit?: () => void;
  readonly onDelete?: () => void;
}

export function NoteDetailsView({
  isOpen,
  onClose,
  note,
  onEdit,
  onDelete,
}: NoteDetailsViewProps) {
  const [fullNote, setFullNote] = useState<LocationNote | null>(null);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  const loadFullNote = useCallback(async () => {
    setIsLoadingImages(true);
    setLoadError(null);
    try {
      console.log(`🔄 Loading images for note ${note.id}...`);
      console.log(`🔄 Request URL: /api/location-notes/${note.id}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout

      const response = await fetch(`/api/location-notes/${note.id}`, {
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // 🔑 Include session
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const noteWithImages = await response.json();
        console.log(
          `✅ Loaded note with ${noteWithImages.images?.length || 0} images`
        );
        setFullNote(noteWithImages);
      } else {
        const errorData = await response.text();
        console.error(
          `❌ Failed to load note: ${response.status} ${response.statusText}`
        );
        console.error(`❌ Error details:`, errorData);

        // Set user-friendly error message
        let userError = `Lỗi tải ghi chú (${response.status})`;

        // Try to parse as JSON for better error info
        try {
          const errorJson = JSON.parse(errorData);
          console.error(`❌ Parsed error:`, errorJson);
          userError = errorJson.error || userError;
        } catch {
          // If parsing fails, use raw error response
          console.error(`❌ Raw error response:`, errorData);
        }

        setLoadError(userError);
      }
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        console.error("❌ Request timeout loading note images (60s)");
        console.log(
          "💡 Tip: Images are very large. Consider using compression."
        );
        setLoadError("Hết thời gian chờ tải ảnh. Vui lòng thử lại.");
      } else {
        console.error("❌ Error loading note images:", error);
        setLoadError("Lỗi không xác định khi tải ghi chú.");
      }
    } finally {
      setIsLoadingImages(false);
    }
  }, [note.id]);

  // Load full note with images when dialog opens (only if images not already loaded)
  useEffect(() => {
    console.log("🔍 Note details useEffect:", {
      isOpen,
      noteId: note.id,
      hasImages: note.hasImages,
      imagesAlreadyLoaded: !!note.images?.length,
      fullNoteExists: !!fullNote?.images?.length,
      shouldLoad:
        isOpen &&
        note.id &&
        note.hasImages &&
        !note.images?.length &&
        !fullNote?.images?.length,
    });

    // Only make API call if dialog is open, note has images, but they're not already loaded
    if (
      isOpen &&
      note.id &&
      note.hasImages &&
      !note.images?.length &&
      !fullNote?.images?.length
    ) {
      console.log("✅ Images not yet loaded, fetching from API...");
      loadFullNote();
    } else if (isOpen && note.images?.length) {
      console.log(
        "✅ Images already provided in note data, no API call needed"
      );
      // Images are already loaded in the note prop, use them directly
      setFullNote(note);
    } else if (!isOpen) {
      // Reset state when dialog closes
      setFullNote(null);
      setLoadError(null);
    } else if (isOpen) {
      console.log("❌ Conditions not met for loading images");
    }
  }, [
    isOpen,
    note.id,
    note.hasImages,
    note.images?.length,
    fullNote?.images?.length,
    loadFullNote,
    note,
  ]);

  // Use fullNote if available, otherwise use the basic note
  const displayNote = fullNote || note;

  // Refresh note when content changes (after edit)
  useEffect(() => {
    if (isOpen && note.id && note.content !== displayNote.content) {
      console.log("📝 Note content changed, clearing cache to force refresh");
      setFullNote(null);
      // If note already has images, use them; otherwise load from API
      if (note.images?.length) {
        setFullNote(note);
      } else if (note.hasImages) {
        loadFullNote();
      }
    }
  }, [isOpen, note, displayNote.content, loadFullNote]);

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

  const formatVisitTime = (visitTime: string) => {
    try {
      const date = new Date(visitTime);
      return date.toLocaleString("vi-VN", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return visitTime;
    }
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

  // Handle ESC key for dialog (lightbox handles its own ESC)
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen && !showLightbox) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      return () => document.removeEventListener("keydown", handleEsc);
    }
  }, [isOpen, showLightbox, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0 bg-[#0C0C0C] border border-neutral-800 shadow-2xl flex flex-col backdrop-blur-md">
        {/* Accessible title for screen readers */}
        <DialogTitle className="sr-only">
          Chi tiết ghi chú:{" "}
          {displayNote.placeName ||
            displayNote.content?.slice(0, 50) ||
            "Ghi chú địa điểm"}
        </DialogTitle>

        {/* Compact Header */}
        <div className="relative bg-[#111111] border-b border-neutral-800 px-6 py-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            {/* Breadcrumb */}
            <div
              className="flex items-center gap-2 text-[#A0A0A0]"
              style={{ fontSize: "var(--text-sm)" }}
            >
              <MapPin className="h-4 w-4" strokeWidth={1.5} />
              <span>Địa điểm</span>
              <ChevronRight className="h-3 w-3" strokeWidth={1.5} />
              <span className="text-[#EDEDED] font-medium">
                {displayNote.placeName || "Ghi chú"}
              </span>
            </div>

            {/* Close Button - 40x40px hit area */}
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-neutral-800 transition-colors"
              aria-label="Đóng modal"
            >
              <X
                className="h-5 w-5 text-[#A0A0A0] hover:text-[#EDEDED]"
                strokeWidth={1.5}
              />
            </button>
          </div>
        </div>

        {/* Scrollable content area */}
        <div className="flex-1 overflow-y-auto bg-[#0C0C0C]">
          <div className="space-y-4">
            {/* HERO: Images Section - Full width gallery */}
            {(displayNote.hasImages ||
              (displayNote.images && displayNote.images.length > 0)) && (
              <div className="bg-[#111111] border-b border-neutral-800">
                <div className="p-4 pb-3">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-[#EDEDED] flex items-center gap-2">
                      <Eye
                        className="h-4 w-4 text-[#A0A0A0]"
                        strokeWidth={1.5}
                      />
                      Hình ảnh
                    </h3>
                    {displayNote.images && displayNote.images.length > 0 && (
                      <span
                        className="px-3 py-1 bg-blue-900/30 text-blue-400 rounded-full font-medium border border-blue-800"
                        style={{ fontSize: "var(--text-xs)" }}
                      >
                        {displayNote.images?.length || 0} ảnh
                      </span>
                    )}
                  </div>
                </div>

                <div className="px-4 pb-4">
                  {(() => {
                    if (loadError) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-red-400">
                          <div className="w-16 h-16 bg-red-900/30 rounded-full flex items-center justify-center mb-4 border border-red-800">
                            <div className="text-2xl">⚠️</div>
                          </div>
                          <span
                            className="text-center font-medium"
                            style={{ fontSize: "var(--text-sm)" }}
                          >
                            {loadError}
                          </span>
                          <button
                            onClick={loadFullNote}
                            className="mt-3 px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors font-medium border border-red-800"
                            style={{ fontSize: "var(--text-sm)" }}
                          >
                            Thử lại
                          </button>
                        </div>
                      );
                    }

                    if (isLoadingImages) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-[#A0A0A0]">
                          <div className="relative mb-4">
                            <div className="animate-spin h-8 w-8 border-3 border-blue-500 border-t-transparent rounded-full"></div>
                            <div className="absolute inset-0 animate-ping h-8 w-8 border border-blue-400/30 rounded-full"></div>
                          </div>
                          <span
                            className="text-center font-medium text-[#EDEDED]"
                            style={{ fontSize: "var(--text-sm)" }}
                          >
                            Đang tải ảnh...
                          </span>
                          <span
                            className="text-[#A0A0A0] mt-1"
                            style={{ fontSize: "var(--text-xs)" }}
                          >
                            Có thể mất vài giây do ảnh lớn
                          </span>
                        </div>
                      );
                    }

                    if (displayNote.images && displayNote.images.length > 0) {
                      return (
                        <div className="space-y-3">
                          {/* Main image carousel */}
                          <div className="grid grid-cols-1 gap-3">
                            {displayNote.images.map((image, index) => {
                              const isCoverImage =
                                index === (displayNote.coverImageIndex || 0);
                              return (
                                <button
                                  key={`image-${displayNote.id}-${index}`}
                                  className="group relative aspect-[4/3] bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-lg border border-neutral-700 overflow-hidden hover:shadow-2xl transition-all duration-300 cursor-pointer w-full hover:border-neutral-600"
                                  onClick={() => {
                                    setCurrentImageIndex(index);
                                    setShowLightbox(true);
                                  }}
                                  aria-label={`Xem ảnh ${index + 1} trong lightbox`}
                                >
                                  {isValidImageUrl(image) ? (
                                    <>
                                      <ImageDisplay
                                        src={image}
                                        alt={`Ảnh ${index + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300"></div>

                                      {/* Zoom overlay hint */}
                                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div
                                          className="bg-black/80 text-white px-4 py-2 rounded-lg flex items-center gap-2 border border-neutral-600"
                                          style={{ fontSize: "var(--text-sm)" }}
                                        >
                                          <Eye
                                            className="h-4 w-4"
                                            strokeWidth={1.5}
                                          />
                                          <span>Xem chi tiết</span>
                                        </div>
                                      </div>

                                      {/* Cover badge */}
                                      {isCoverImage && (
                                        <div
                                          className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-2 rounded-lg font-bold shadow-lg"
                                          style={{ fontSize: "var(--text-sm)" }}
                                        >
                                          <Star
                                            className="h-4 w-4 inline mr-2"
                                            strokeWidth={1.5}
                                          />
                                          Ảnh bìa
                                        </div>
                                      )}

                                      {/* Image counter */}
                                      {displayNote.images &&
                                        displayNote.images.length > 1 && (
                                          <div
                                            className="absolute bottom-3 right-3 bg-black/80 text-white px-3 py-2 rounded-lg font-medium border border-neutral-600"
                                            style={{
                                              fontSize: "var(--text-sm)",
                                            }}
                                          >
                                            {index + 1} /{" "}
                                            {displayNote.images.length}
                                          </div>
                                        )}
                                    </>
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-[#A0A0A0]">
                                      <div className="text-center">
                                        <div className="text-3xl mb-2">📷</div>
                                        <div
                                          className="font-medium"
                                          style={{ fontSize: "var(--text-xs)" }}
                                        >
                                          Ảnh lỗi
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    if (displayNote.hasImages) {
                      return (
                        <div className="text-center py-8 text-[#A0A0A0]">
                          <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3 border border-neutral-700">
                            <Eye className="h-5 w-5" strokeWidth={1.5} />
                          </div>
                          <div
                            className="font-medium"
                            style={{ fontSize: "var(--text-sm)" }}
                          >
                            Có ảnh nhưng chưa tải được
                          </div>
                        </div>
                      );
                    }

                    return null;
                  })()}
                </div>
              </div>
            )}

            <div className="px-6 space-y-4">
              {/* PRIORITY 1: Content Card - Enhanced */}
              <div className="bg-[#111111] rounded-xl border border-neutral-800 shadow-lg hover:shadow-xl transition-all duration-200 overflow-hidden">
                <div className="bg-gradient-to-r from-neutral-800 to-neutral-900 px-6 py-4 border-b border-neutral-700">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-[#EDEDED] flex items-center gap-2">
                      <Heart
                        className="h-5 w-5 text-[#A0A0A0]"
                        strokeWidth={1.5}
                      />
                      Nội dung ghi chú
                    </h3>
                  </div>
                </div>
                <div className="p-6 relative">
                  {displayNote.content ? (
                    <>
                      <p
                        className="text-[#EDEDED] whitespace-pre-wrap leading-relaxed"
                        style={{
                          fontSize: "var(--text-base)",
                          lineHeight: "1.6",
                        }}
                      >
                        {displayNote.content}
                      </p>
                      {/* Character counter in bottom right */}
                      <div
                        className="absolute bottom-3 right-4 text-[#A0A0A0] opacity-60"
                        style={{ fontSize: "var(--text-xs)" }}
                      >
                        {displayNote.content.length}/280
                      </div>
                    </>
                  ) : (
                    <p
                      className="text-[#A0A0A0] italic text-center py-8"
                      style={{ fontSize: "var(--text-base)" }}
                    >
                      Không có nội dung ghi chú
                    </p>
                  )}
                </div>
              </div>

              {/* PRIORITY 2: Tags & Mood - Compact chips */}
              <div className="flex flex-wrap gap-2">
                {/* Place Name Chip */}
                {displayNote.placeName && (
                  <div className="flex items-center gap-2 bg-green-900/30 text-green-400 px-3 py-2 rounded-full border border-green-800">
                    <Star className="h-4 w-4" strokeWidth={1.5} />
                    <span
                      className="font-medium"
                      style={{ fontSize: "var(--text-sm)" }}
                    >
                      {displayNote.placeName}
                    </span>
                  </div>
                )}

                {/* Category Chip */}
                {displayNote.categoryName && (
                  <div className="flex items-center gap-2 bg-purple-900/30 text-purple-400 px-3 py-2 rounded-full border border-purple-800">
                    <Tag className="h-4 w-4" strokeWidth={1.5} />
                    <span
                      className="font-medium"
                      style={{ fontSize: "var(--text-sm)" }}
                    >
                      {displayNote.categoryName}
                    </span>
                  </div>
                )}

                {/* Visit Time Chip */}
                {displayNote.visitTime && (
                  <div className="flex items-center gap-2 bg-cyan-900/30 text-cyan-400 px-3 py-2 rounded-full border border-cyan-800">
                    <CalendarDays className="h-4 w-4" strokeWidth={1.5} />
                    <span
                      className="font-medium"
                      style={{ fontSize: "var(--text-sm)" }}
                    >
                      {formatVisitTime(displayNote.visitTime)}
                    </span>
                  </div>
                )}

                {/* Mood Chip */}
                {note.mood && (
                  <div className="flex items-center gap-2 bg-amber-900/30 text-amber-400 px-3 py-2 rounded-full border border-amber-800">
                    <span className="text-lg">{note.mood}</span>
                    <span
                      className="font-medium"
                      style={{ fontSize: "var(--text-sm)" }}
                    >
                      {moodLabels[note.mood] || "Khác"}
                    </span>
                  </div>
                )}
              </div>

              {/* PRIORITY 3: Minimal Metadata - Single row */}
              <div className="bg-[#111111] rounded-lg p-4 border border-neutral-800">
                <div
                  className="flex items-center justify-between text-[#A0A0A0]"
                  style={{ fontSize: "var(--text-sm)" }}
                >
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" strokeWidth={1.5} />
                    <span>Tạo lúc {formatDateTime(note.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" strokeWidth={1.5} />
                    <span>Vị trí đã lưu</span>
                  </div>
                </div>

                {/* Expandable technical details */}
                <details className="mt-3 group">
                  <summary
                    className="cursor-pointer text-[#A0A0A0] hover:text-[#EDEDED] flex items-center gap-2 transition-colors"
                    style={{ fontSize: "var(--text-xs)" }}
                  >
                    <span>Chi tiết kỹ thuật</span>
                    <ChevronDown
                      className="h-3 w-3 transition-transform group-open:rotate-180"
                      strokeWidth={1.5}
                    />
                  </summary>
                  <div className="mt-2 pt-2 border-t border-neutral-700 space-y-1">
                    <div
                      className="text-[#A0A0A0]"
                      style={{ fontSize: "var(--text-xs)" }}
                    >
                      <strong className="text-[#EDEDED]">Địa chỉ:</strong>{" "}
                      {note.address}
                    </div>
                    <div
                      className="text-[#A0A0A0] font-mono"
                      style={{ fontSize: "var(--text-xs)" }}
                    >
                      <strong className="text-[#EDEDED]">Tọa độ:</strong>{" "}
                      {note.lng.toFixed(6)}, {note.lat.toFixed(6)}
                    </div>
                    <div
                      className="text-[#A0A0A0]"
                      style={{ fontSize: "var(--text-xs)" }}
                    >
                      <strong className="text-[#EDEDED]">ID:</strong> {note.id}
                    </div>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Sticky Footer */}
        <div className="sticky bottom-0 bg-[#0C0C0C]/95 backdrop-blur-sm border-t border-neutral-800 p-4 flex-shrink-0 shadow-2xl">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={onEdit}
              className="flex-1 h-11 bg-neutral-800 hover:bg-neutral-700 border-neutral-600 text-[#EDEDED] hover:text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Edit className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Chỉnh sửa
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: "Ghi chú địa điểm",
                    text:
                      note.content ||
                      displayNote.placeName ||
                      "Ghi chú địa điểm",
                    url: window.location.href,
                  });
                }
              }}
              className="flex-1 h-11 bg-green-900/30 hover:bg-green-900/50 border-green-700 text-green-400 hover:text-green-300 font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Share className="h-4 w-4 mr-2" strokeWidth={1.5} />
              Chia sẻ
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (
                  window.confirm(
                    "Bạn có chắc muốn xóa ghi chú này không? Hành động này không thể hoàn tác."
                  )
                ) {
                  onDelete?.();
                }
              }}
              className="h-11 px-4 bg-red-600 hover:bg-red-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      </DialogContent>

      <ImageLightbox
        images={displayNote.images || []}
        currentIndex={currentImageIndex}
        isOpen={showLightbox}
        onClose={() => setShowLightbox(false)}
        onNext={() => {
          setCurrentImageIndex((prev) =>
            prev === (displayNote.images?.length || 1) - 1 ? 0 : prev + 1
          );
        }}
        onPrevious={() => {
          setCurrentImageIndex((prev) =>
            prev === 0 ? (displayNote.images?.length || 1) - 1 : prev - 1
          );
        }}
      />
    </Dialog>
  );
}
