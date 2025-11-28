"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    ChevronUp,
    Globe,
    Image as ImageIcon,
    Loader2,
    Lock,
    MapPin,
    Plus,
    Save,
    Star,
    Users,
    X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useImageUpload } from "@/lib/image-upload";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import { useCategoryStore } from "@/lib/store";
import { useCategoryAPI } from "@/lib/hooks";
import { useSession } from "next-auth/react";

const LocationNoteSchema = z.object({
    category: z.string().min(1, "Chọn một danh mục"),
    content: z.string().max(280, "Nội dung tối đa 280 ký tự").optional(),
    mood: z.enum(["😍", "😊", "😐", "🙁", "😴"]).optional(),
    placeName: z.string().min(1, "Tên địa điểm không được để trống"),
    visitTime: z.string().min(1, "Thời gian thăm không được để trống"),
    visibility: z.enum(["private", "friends", "public"]),
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
        category?: string; // single category ID
        coverImageIndex?: number;
        visibility?: string;
    };
    readonly onSubmit: (
        data: LocationNoteFormData & {
            id?: string;
            lng: number;
            lat: number;
            address: string;
            timestamp: Date;
            images?: string[];
            coverImageIndex?: number;
        }
    ) => Promise<void> | void;
}

export function LocationNoteForm({
    isOpen,
    onClose,
    location,
    existingNote,
    onSubmit,
}: LocationNoteFormProps) {
    const { data: session } = useSession();

    // Form state
    const [selectedCategory, setSelectedCategory] = useState<string>(
        existingNote?.category || ""
    );
    const [customCategoryName, setCustomCategoryName] = useState<string>("");
    const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
    const [showAllCategories, setShowAllCategories] = useState<boolean>(false);
    const [showVisibilityMenu, setShowVisibilityMenu] =
        useState<boolean>(false);

    // Text area ref for auto-focus
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Categories state from store (shared with sidebar)
    const { categories, isLoadingCategories, addCategory } = useCategoryStore();
    const { fetchCategories } = useCategoryAPI();

    // Image state
    const [images, setImages] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);
    const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
    const [coverImageIndex, setCoverImageIndex] = useState<number>(
        existingNote?.coverImageIndex || 0
    );

    // Upload state
    const [isUploadingImages, setIsUploadingImages] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string>("");
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [showUndoToast, setShowUndoToast] = useState(false);

    // Lightbox state
    const [showLightbox, setShowLightbox] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const { uploadMultipleImages } = useImageUpload();

    // Auto-focus textarea when modal opens
    useEffect(() => {
        if (isOpen && textareaRef.current) {
            setTimeout(() => {
                textareaRef.current?.focus();
            }, 100);
        }
    }, [isOpen]);

    // Fetch categories when form opens
    useEffect(() => {
        if (isOpen && session) {
            console.log("📝 LocationNoteForm: Fetching categories...", {
                isOpen,
                hasSession: !!session,
                currentCategories: categories.length,
            });
            fetchCategories(session);
        } else {
            console.log("📝 LocationNoteForm: Not fetching categories", {
                isOpen,
                hasSession: !!session,
            });
        }
    }, [isOpen, session, fetchCategories]);

    const moods = [
        { emoji: "😍", label: "Yêu thích" },
        { emoji: "😊", label: "Vui vẻ" },
        { emoji: "😐", label: "Bình thường" },
        { emoji: "🙁", label: "Không hài lòng" },
        { emoji: "😴", label: "Thư giãn" },
    ];

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
    } = useForm<LocationNoteFormData>({
        resolver: zodResolver(LocationNoteSchema),
        defaultValues: {
            category: existingNote?.category || "",
            content: existingNote?.content || "",
            mood:
                existingNote?.mood &&
                moods.some((m) => m.emoji === existingNote.mood)
                    ? (existingNote.mood as "😍" | "😊" | "😐" | "🙁" | "😴")
                    : undefined,
            placeName: existingNote?.placeName || location.address || "",
            visitTime:
                existingNote?.visitTime ||
                new Date().toISOString().slice(0, 16),
            visibility:
                (existingNote?.visibility as
                    | "private"
                    | "friends"
                    | "public") || "private",
        },
    });

    // Auto-select first category if none selected (only when categories exist)
    useEffect(() => {
        if (
            isOpen &&
            categories.length > 0 &&
            !selectedCategory &&
            !existingNote
        ) {
            const firstCategory = categories[0];
            setSelectedCategory(firstCategory.id);
            setValue("category", firstCategory.id);
            console.log("📝 Auto-selected first category:", firstCategory.name);
        }
    }, [isOpen, categories, selectedCategory, existingNote, setValue]);

    // Close visibility menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (
                showVisibilityMenu &&
                !target.closest(".visibility-menu-container")
            ) {
                setShowVisibilityMenu(false);
            }
        };

        if (showVisibilityMenu) {
            document.addEventListener("mousedown", handleClickOutside);
            return () =>
                document.removeEventListener("mousedown", handleClickOutside);
        }
    }, [showVisibilityMenu]);

    // Watch content for character count
    const contentValue = watch("content") || "";

    // Separate register ref from other props to avoid ref conflict
    const { ref: contentRegisterRef, ...contentRegisterRest } =
        register("content");

    // Sync selectedCategory with existingNote when form opens for editing
    useEffect(() => {
        if (isOpen && existingNote?.category) {
            console.log(
                "📝 LocationNoteForm: Setting category from existingNote",
                {
                    category: existingNote.category,
                }
            );
            setSelectedCategory(existingNote.category);
            setValue("category", existingNote.category);
        }
    }, [isOpen, existingNote, setValue]);

    // Log categories changes
    useEffect(() => {
        console.log("📝 LocationNoteForm: Categories updated", {
            count: categories.length,
            isLoading: isLoadingCategories,
            categories: categories.map((c) => ({ id: c.id, name: c.name })),
        });
    }, [categories, isLoadingCategories]);

    // Auto-save draft logic
    useEffect(() => {
        const formData = {
            category: selectedCategory,
            content: contentValue,
            placeName: watch("placeName"),
            visitTime: watch("visitTime"),
            mood: watch("mood"),
            visibility: watch("visibility"),
        };

        const hasChanges =
            !!selectedCategory ||
            !!contentValue.trim() ||
            images.length > 0 ||
            existingImageUrls.length > 0;

        if (hasChanges !== hasUnsavedChanges) {
            setHasUnsavedChanges(hasChanges);
        }

        if (hasChanges && !existingNote) {
            // Save draft to localStorage
            const draftKey = `location-note-draft-${location.lng}-${location.lat}`;
            localStorage.setItem(draftKey, JSON.stringify(formData));
        }
    }, [
        selectedCategory,
        contentValue,
        images.length,
        existingImageUrls.length,
        watch,
        location,
        existingNote,
        hasUnsavedChanges,
    ]);

    // Load draft on mount
    useEffect(() => {
        if (!existingNote) {
            const draftKey = `location-note-draft-${location.lng}-${location.lat}`;
            const draft = localStorage.getItem(draftKey);
            if (draft) {
                try {
                    const draftData = JSON.parse(draft);
                    if (draftData.category)
                        setSelectedCategory(draftData.category);
                    if (draftData.content)
                        setValue("content", draftData.content);
                    if (draftData.placeName)
                        setValue("placeName", draftData.placeName);
                    if (draftData.visitTime)
                        setValue("visitTime", draftData.visitTime);
                    if (draftData.mood) setValue("mood", draftData.mood);
                    if (draftData.visibility)
                        setValue("visibility", draftData.visibility);
                } catch (error) {
                    console.warn("Error loading draft:", error);
                }
            }
        }
    }, [existingNote, location, setValue]);

    // Open lightbox
    const openLightbox = (images: string[], startIndex: number = 0) => {
        setLightboxImages(images);
        setLightboxIndex(startIndex);
        setShowLightbox(true);
    };

    // Category management
    const selectCategory = (categoryId: string) => {
        setSelectedCategory(categoryId);
        setValue("category", categoryId);
    };

    const addCustomCategory = async () => {
        if (!customCategoryName.trim()) return;

        try {
            const response = await fetch("/api/categories", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: customCategoryName.trim(),
                    slug: customCategoryName
                        .trim()
                        .toLowerCase()
                        .replace(/\s+/g, "-"),
                    icon: "📍",
                }),
            });

            if (response.ok) {
                const newCategory = await response.json();
                addCategory(newCategory); // Use store action instead
                setSelectedCategory(newCategory.id);
                setValue("category", newCategory.id);
                setCustomCategoryName("");
            }
        } catch (error) {
            console.error("Error creating category:", error);
        }
    };

    // Image handling
    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);

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
        // Adjust cover index if needed
        if (coverImageIndex === index) {
            setCoverImageIndex(0);
        } else if (coverImageIndex > index) {
            setCoverImageIndex((prev) => prev - 1);
        }
    };

    const setCoverImage = (index: number, isExisting: boolean) => {
        if (isExisting) {
            setCoverImageIndex(index);
        } else {
            setCoverImageIndex(existingImageUrls.length + index);
        }
    };

    // Drag & Drop
    const [dragActive, setDragActive] = useState(false);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFiles = Array.from(e.dataTransfer.files);
            const imageFiles = droppedFiles.filter((file) =>
                file.type.startsWith("image/")
            );

            setImages((prev) => [...prev, ...imageFiles]);
            imageFiles.forEach((file) => {
                const url = URL.createObjectURL(file);
                setPreviewUrls((prev) => [...prev, url]);
            });
        }
    };

    // Initialize form data
    useEffect(() => {
        if (existingNote) {
            setSelectedCategory(existingNote.category || "");
            setValue("category", existingNote.category || "");
            if (existingNote.images && existingNote.images.length > 0) {
                setExistingImageUrls(existingNote.images);
            }
            setCoverImageIndex(existingNote.coverImageIndex || 0);
        } else {
            setExistingImageUrls([]);
            setImages([]);
            setPreviewUrls([]);
            setSelectedCategory("");
            setCoverImageIndex(0);
        }
    }, [existingNote, setValue]);

    // Form submission
    const onFormSubmit = async (data: LocationNoteFormData) => {
        try {
            setIsUploadingImages(true);

            if (existingNote) {
                // Editing existing note
                setUploadProgress("Đang xử lý ảnh...");

                const imageUrls: string[] = [];
                for (const existingImage of existingImageUrls) {
                    if (typeof existingImage === "string") {
                        imageUrls.push(existingImage);
                    }
                }

                if (images.length > 0) {
                    setUploadProgress(`Đang upload ${images.length} ảnh...`);
                    const uploadResults = await uploadMultipleImages(
                        images,
                        existingNote.id
                    );

                    let successCount = 0;
                    for (const result of uploadResults) {
                        if (result.success && result.url) {
                            imageUrls.push(result.url);
                            successCount++;
                        }
                    }

                    setUploadProgress(
                        `Đã upload ${successCount}/${images.length} ảnh thành công`
                    );
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }

                setUploadProgress("Đang cập nhật ghi chú...");

                // Wait for onSubmit to complete (API call)
                await onSubmit({
                    ...data,
                    id: existingNote.id,
                    lng: location.lng,
                    lat: location.lat,
                    address: location.address || "",
                    timestamp: new Date(),
                    images: imageUrls,
                    coverImageIndex,
                });
            } else {
                // Creating new note
                setUploadProgress("Đang tạo ghi chú...");

                const noteResponse = await fetch("/api/location-notes", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lng: location.lng,
                        lat: location.lat,
                        address: location.address || "",
                        content: data.content,
                        mood: data.mood,
                        categoryIds: data.category ? [data.category] : [], // Convert single category to array for API
                        placeName: data.placeName,
                        visitTime: data.visitTime,
                        visibility: data.visibility,
                    }),
                });

                if (!noteResponse.ok) {
                    const errorData = await noteResponse.json();
                    throw new Error(errorData.error || "Failed to create note");
                }

                const createdNote = await noteResponse.json();

                const imageUrls: string[] = [];
                if (images.length > 0) {
                    setUploadProgress(`Đang upload ${images.length} ảnh...`);
                    const uploadResults = await uploadMultipleImages(
                        images,
                        createdNote.id
                    );

                    let successCount = 0;
                    for (const result of uploadResults) {
                        if (result.success && result.url) {
                            imageUrls.push(result.url);
                            successCount++;
                        }
                    }

                    setUploadProgress(
                        `Đã upload ${successCount}/${images.length} ảnh thành công`
                    );
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                }

                setUploadProgress("Hoàn tất...");

                console.log(
                    "📝 LocationNoteForm: Calling onSubmit with data:",
                    {
                        id: createdNote.id,
                        content: data.content?.substring(0, 20),
                        lng: location.lng,
                        lat: location.lat,
                        images: imageUrls.length,
                    }
                );

                onSubmit({
                    ...data,
                    id: createdNote.id,
                    lng: location.lng,
                    lat: location.lat,
                    address: location.address || "",
                    timestamp: new Date(),
                    images: imageUrls,
                    coverImageIndex,
                });

                console.log(
                    "✅ LocationNoteForm: onSubmit called successfully"
                );
            }

            // Reset form and clear draft
            const draftKey = `location-note-draft-${location.lng}-${location.lat}`;
            localStorage.removeItem(draftKey);

            reset();
            setImages([]);
            setPreviewUrls([]);
            setExistingImageUrls([]);
            setSelectedCategory("");
            setCoverImageIndex(0);
            setHasUnsavedChanges(false);

            // Show undo toast
            setShowUndoToast(true);
            setTimeout(() => setShowUndoToast(false), 5000);

            // Only close form here if creating new note
            // When editing, parent (map-container) will close the form
            if (!existingNote) {
                onClose();
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Có lỗi xảy ra khi xử lý";
            setUploadProgress(`❌ ${errorMessage}`);

            // Show error alert
            alert(`Không thể lưu ghi chú: ${errorMessage}`);

            // Keep form open on error so user can retry
        } finally {
            setIsUploadingImages(false);
            // Clear progress message after 3 seconds
            setTimeout(() => setUploadProgress(""), 3000);
        }
    };

    const handleClose = () => {
        // Save draft if there are unsaved changes
        if (hasUnsavedChanges && !existingNote) {
            const formData = {
                category: selectedCategory,
                content: watch("content"),
                placeName: watch("placeName"),
                visitTime: watch("visitTime"),
                mood: watch("mood"),
                visibility: watch("visibility"),
            };
            const draftKey = `location-note-draft-${location.lng}-${location.lat}`;
            localStorage.setItem(draftKey, JSON.stringify(formData));
        }

        reset();
        setImages([]);
        previewUrls.forEach((url) => URL.revokeObjectURL(url));
        setPreviewUrls([]);
        setExistingImageUrls([]);
        setSelectedCategory("");
        setCoverImageIndex(0);
        setCustomCategoryName("");
        setShowAdvanced(false);
        setHasUnsavedChanges(false);
        onClose();
    };

    const totalImages = existingImageUrls.length + images.length;
    const allImages = [...existingImageUrls, ...previewUrls];

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-[720px] h-[80vh] overflow-hidden p-0 bg-[var(--background)] border-[var(--color-neutral-700)] rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] flex flex-col [&>button]:hidden">
                    {/* Enhanced Header */}
                    <div className="bg-[var(--color-neutral-900)] border-b border-[var(--color-neutral-700)] px-7 py-6 flex-shrink-0">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <DialogTitle asChild>
                                    <Input
                                        {...register("placeName")}
                                        placeholder="Tên địa điểm"
                                        className="text-xl font-semibold text-[var(--foreground)] mb-2 h-auto py-2 px-3 bg-transparent border-transparent hover:border-[var(--color-neutral-700)] focus:border-[var(--color-primary-500)] focus:bg-[var(--color-neutral-800)] rounded-lg transition-all"
                                    />
                                </DialogTitle>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-[var(--color-neutral-500)] flex-shrink-0" />
                                    <span className="text-sm text-[var(--color-neutral-500)] truncate">
                                        {location.address ||
                                            "Không xác định được địa chỉ"}
                                    </span>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={handleClose}
                                className="text-[var(--color-neutral-500)] hover:text-[var(--foreground)] hover:bg-[var(--color-neutral-700)] p-2 h-10 w-10"
                            >
                                <X className="h-4 w-4" />
                                <span className="sr-only">Đóng</span>
                            </Button>
                        </div>
                    </div>

                    <div className="flex flex-col flex-1 overflow-hidden">
                        {/* Main Content - Scrollable */}
                        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4 custom-scrollbar">
                            {/* TEXT INPUT - Facebook style */}
                            <div className="space-y-3">
                                <div className="relative">
                                    <Textarea
                                        {...contentRegisterRest}
                                        ref={(e) => {
                                            contentRegisterRef(e);
                                            textareaRef.current = e;
                                        }}
                                        placeholder="Bạn nghĩ gì về địa điểm này?"
                                        rows={3}
                                        className="resize-none bg-transparent border-0 text-[var(--foreground)] placeholder-[var(--color-neutral-500)] text-lg leading-relaxed transition-colors focus:outline-none min-h-[80px] pr-16 w-full"
                                    />
                                    <div className="absolute bottom-2 right-2 text-xs text-[var(--color-neutral-500)] pointer-events-none">
                                        {contentValue.length}/280
                                    </div>
                                </div>
                                {errors.content && (
                                    <p className="text-sm text-red-400 flex items-center gap-1">
                                        <span>⚠️</span>
                                        {errors.content.message}
                                    </p>
                                )}
                            </div>

                            {/* IMAGES - Facebook style */}
                            <div className="space-y-3">
                                <input
                                    type="file"
                                    id="images"
                                    multiple
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />

                                {/* Image Grid - Facebook style */}
                                {totalImages > 0 && (
                                    <div className="space-y-3">
                                        <div
                                            className={`grid gap-2 rounded-lg overflow-hidden ${
                                                totalImages === 1
                                                    ? "grid-cols-1"
                                                    : totalImages === 2
                                                      ? "grid-cols-2"
                                                      : "grid-cols-2 grid-rows-2"
                                            }`}
                                        >
                                            {/* Existing images */}
                                            {existingImageUrls.map(
                                                (url, index) => (
                                                    <div
                                                        key={`existing-image-${existingNote?.id || "new"}-${index}`}
                                                        className={`group relative bg-[var(--color-neutral-900)] overflow-hidden ${
                                                            totalImages === 1
                                                                ? "aspect-[4/3]"
                                                                : totalImages ===
                                                                        3 &&
                                                                    index === 0
                                                                  ? "row-span-2 aspect-square"
                                                                  : "aspect-square"
                                                        }`}
                                                    >
                                                        {isValidImageUrl(
                                                            url
                                                        ) ? (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="w-full h-full cursor-pointer bg-[var(--color-neutral-950)]"
                                                                    onClick={() =>
                                                                        openLightbox(
                                                                            allImages,
                                                                            index
                                                                        )
                                                                    }
                                                                >
                                                                    <ImageDisplay
                                                                        src={
                                                                            url
                                                                        }
                                                                        alt={`Ảnh ${index + 1}`}
                                                                        className="w-full h-full object-contain"
                                                                    />
                                                                </button>
                                                                {/* Cover badge */}
                                                                {coverImageIndex ===
                                                                    index && (
                                                                    <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                                                                        <Star className="h-3 w-3" />
                                                                        Cover
                                                                    </div>
                                                                )}
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all">
                                                                    <Button
                                                                        type="button"
                                                                        variant="destructive"
                                                                        size="sm"
                                                                        className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 bg-red-500/90 hover:bg-red-500"
                                                                        onClick={() =>
                                                                            removeExistingImage(
                                                                                index
                                                                            )
                                                                        }
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                    {coverImageIndex !==
                                                                        index && (
                                                                        <Button
                                                                            type="button"
                                                                            variant="secondary"
                                                                            size="sm"
                                                                            className="absolute bottom-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/30 text-white border-0"
                                                                            onClick={() =>
                                                                                setCoverImage(
                                                                                    index,
                                                                                    true
                                                                                )
                                                                            }
                                                                        >
                                                                            <Star className="h-3 w-3" />
                                                                        </Button>
                                                                    )}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-[var(--color-neutral-500)]">
                                                                <div className="text-center">
                                                                    <div className="text-xl mb-1">
                                                                        📷
                                                                    </div>
                                                                    <div className="text-xs">
                                                                        Ảnh lỗi
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )
                                            )}

                                            {/* New images */}
                                            {previewUrls.map((url, index) => (
                                                <div
                                                    key={`new-image-${url.slice(-10)}-${index}`}
                                                    className={`group relative bg-[var(--color-neutral-900)] overflow-hidden ${
                                                        totalImages === 1
                                                            ? "aspect-[4/3]"
                                                            : totalImages ===
                                                                    3 &&
                                                                existingImageUrls.length +
                                                                    index ===
                                                                    0
                                                              ? "row-span-2 aspect-square"
                                                              : "aspect-square"
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        className="w-full h-full cursor-pointer bg-[var(--color-neutral-950)]"
                                                        onClick={() =>
                                                            openLightbox(
                                                                allImages,
                                                                existingImageUrls.length +
                                                                    index
                                                            )
                                                        }
                                                    >
                                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                                        <img
                                                            src={url}
                                                            alt={`Ảnh mới ${index + 1}`}
                                                            className="w-full h-full object-contain"
                                                        />
                                                    </button>
                                                    {/* Cover badge */}
                                                    {coverImageIndex ===
                                                        existingImageUrls.length +
                                                            index && (
                                                        <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-md font-medium flex items-center gap-1">
                                                            <Star className="h-3 w-3" />
                                                            Cover
                                                        </div>
                                                    )}
                                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all">
                                                        <Button
                                                            type="button"
                                                            variant="destructive"
                                                            size="sm"
                                                            className="absolute top-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 bg-red-500/90 hover:bg-red-500"
                                                            onClick={() =>
                                                                removeNewImage(
                                                                    index
                                                                )
                                                            }
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                        {coverImageIndex !==
                                                            existingImageUrls.length +
                                                                index && (
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="sm"
                                                                className="absolute bottom-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/30 text-white border-0"
                                                                onClick={() =>
                                                                    setCoverImage(
                                                                        index,
                                                                        false
                                                                    )
                                                                }
                                                            >
                                                                <Star className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Add more button - Facebook style */}
                                        <div className="flex items-center justify-center border-t border-[var(--color-neutral-800)] pt-3 mt-3">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    document
                                                        .getElementById(
                                                            "images"
                                                        )
                                                        ?.click()
                                                }
                                                className="text-[var(--color-neutral-400)] hover:text-[var(--foreground)] hover:bg-[var(--color-neutral-800)] h-10"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Thêm ảnh
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Add to post - Facebook style actions bar */}
                            <div className="flex items-center justify-between p-3 border border-[var(--color-neutral-800)] rounded-lg">
                                <span className="text-sm font-medium text-[var(--foreground)]">
                                    Thêm vào bài viết
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            document
                                                .getElementById("images")
                                                ?.click()
                                        }
                                        className="h-9 w-9 rounded-full hover:bg-[var(--color-neutral-800)] text-green-500"
                                        title="Thêm ảnh"
                                    >
                                        <ImageIcon className="h-5 w-5" />
                                    </Button>

                                    {/* Visibility Button with Dropdown */}
                                    <div className="relative visibility-menu-container">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                setShowVisibilityMenu(
                                                    !showVisibilityMenu
                                                )
                                            }
                                            className="h-9 w-9 rounded-full hover:bg-[var(--color-neutral-800)] text-blue-500"
                                            title="Ai có thể xem?"
                                        >
                                            {watch("visibility") ===
                                                "private" && (
                                                <Lock className="h-5 w-5" />
                                            )}
                                            {watch("visibility") ===
                                                "friends" && (
                                                <Users className="h-5 w-5" />
                                            )}
                                            {watch("visibility") ===
                                                "public" && (
                                                <Globe className="h-5 w-5" />
                                            )}
                                        </Button>

                                        {/* Visibility Dropdown Menu */}
                                        {showVisibilityMenu && (
                                            <div className="absolute bottom-full right-0 mb-2 w-64 bg-[var(--color-neutral-900)] border border-[var(--color-neutral-700)] rounded-lg shadow-xl z-50 p-2">
                                                <div className="space-y-1">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setValue(
                                                                "visibility",
                                                                "private"
                                                            );
                                                            setShowVisibilityMenu(
                                                                false
                                                            );
                                                        }}
                                                        className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                                                            watch(
                                                                "visibility"
                                                            ) === "private"
                                                                ? "bg-blue-500/20 border border-blue-500"
                                                                : "hover:bg-[var(--color-neutral-800)]"
                                                        }`}
                                                    >
                                                        <Lock className="h-5 w-5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">
                                                                Riêng tư
                                                            </div>
                                                            <div className="text-xs text-[var(--color-neutral-500)]">
                                                                Chỉ bạn có thể
                                                                xem
                                                            </div>
                                                        </div>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setValue(
                                                                "visibility",
                                                                "friends"
                                                            );
                                                            setShowVisibilityMenu(
                                                                false
                                                            );
                                                        }}
                                                        className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                                                            watch(
                                                                "visibility"
                                                            ) === "friends"
                                                                ? "bg-blue-500/20 border border-blue-500"
                                                                : "hover:bg-[var(--color-neutral-800)]"
                                                        }`}
                                                    >
                                                        <Users className="h-5 w-5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">
                                                                Bạn bè
                                                            </div>
                                                            <div className="text-xs text-[var(--color-neutral-500)]">
                                                                Bạn bè của bạn
                                                                có thể xem
                                                            </div>
                                                        </div>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setValue(
                                                                "visibility",
                                                                "public"
                                                            );
                                                            setShowVisibilityMenu(
                                                                false
                                                            );
                                                        }}
                                                        className={`w-full p-3 rounded-lg text-left transition-all flex items-center gap-3 ${
                                                            watch(
                                                                "visibility"
                                                            ) === "public"
                                                                ? "bg-blue-500/20 border border-blue-500"
                                                                : "hover:bg-[var(--color-neutral-800)]"
                                                        }`}
                                                    >
                                                        <Globe className="h-5 w-5 flex-shrink-0" />
                                                        <div className="flex-1">
                                                            <div className="font-medium text-sm">
                                                                Công khai
                                                            </div>
                                                            <div className="text-xs text-[var(--color-neutral-500)]">
                                                                Mọi người có thể
                                                                xem
                                                            </div>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* ADVANCED OPTIONS - Independent Collapsible Section */}
                            <div className="space-y-4 p-4 bg-[var(--color-neutral-900)]/30 rounded-lg border border-[var(--color-neutral-800)]">
                                {/* Collapsible Header */}
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowAdvanced(!showAdvanced)
                                    }
                                    className="w-full flex items-center justify-between hover:bg-[var(--color-neutral-800)]/30 p-2 -m-2 rounded-lg transition-colors"
                                >
                                    <h3 className="text-sm font-semibold text-[var(--foreground)] flex items-center gap-2">
                                        <MapPin className="h-4 w-4" />
                                        Thông tin chi tiết
                                    </h3>
                                    <ChevronUp
                                        className={`h-4 w-4 text-[var(--color-neutral-500)] transition-transform duration-200 ${
                                            showAdvanced ? "" : "rotate-180"
                                        }`}
                                    />
                                </button>

                                {/* Collapsible Content */}
                                {showAdvanced && (
                                    <div className="space-y-4 pt-3 border-t border-[var(--color-neutral-700)]">
                                        {/* CATEGORY SELECTION */}
                                        <div className="space-y-3">
                                            {isLoadingCategories ? (
                                                <div className="flex items-center justify-center py-4">
                                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--color-primary-500)]"></div>
                                                    <span className="ml-3 text-sm text-[var(--color-neutral-500)]">
                                                        Đang tải danh mục...
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {/* Empty state when no categories */}
                                                    {categories.length ===
                                                        0 && (
                                                        <div className="flex flex-col items-center justify-center py-4 text-center">
                                                            <div className="text-3xl mb-2">
                                                                📂
                                                            </div>
                                                            <p className="text-sm text-[var(--color-neutral-500)] mb-1">
                                                                Chưa có danh mục
                                                                nào
                                                            </p>
                                                            <p className="text-xs text-[var(--color-neutral-600)]">
                                                                Tạo danh mục đầu
                                                                tiên ở dưới
                                                            </p>
                                                        </div>
                                                    )}

                                                    {/* Selected category display - only when categories exist */}
                                                    {categories.length > 0 &&
                                                        selectedCategory && (
                                                            <div className="flex items-center justify-between p-3 bg-[var(--color-neutral-900)] border border-[var(--color-neutral-700)] rounded-xl">
                                                                {(() => {
                                                                    const category =
                                                                        categories.find(
                                                                            (
                                                                                c
                                                                            ) =>
                                                                                c.id ===
                                                                                selectedCategory
                                                                        );
                                                                    if (
                                                                        !category
                                                                    )
                                                                        return null;

                                                                    return (
                                                                        <>
                                                                            <div className="flex items-center gap-3">
                                                                                {category.icon && (
                                                                                    <span className="text-lg">
                                                                                        {
                                                                                            category.icon
                                                                                        }
                                                                                    </span>
                                                                                )}
                                                                                <span className="text-sm font-medium text-[var(--foreground)]">
                                                                                    {
                                                                                        category.name
                                                                                    }
                                                                                </span>
                                                                            </div>
                                                                            <Button
                                                                                type="button"
                                                                                variant="ghost"
                                                                                size="sm"
                                                                                onClick={() =>
                                                                                    setShowAllCategories(
                                                                                        !showAllCategories
                                                                                    )
                                                                                }
                                                                                className="text-[var(--color-neutral-500)] hover:text-[var(--foreground)] hover:bg-[var(--color-neutral-700)] px-3"
                                                                            >
                                                                                Đổi
                                                                            </Button>
                                                                        </>
                                                                    );
                                                                })()}
                                                            </div>
                                                        )}

                                                    {/* Category selection - only when categories exist and (no selection or "Đổi" clicked) */}
                                                    {categories.length > 0 &&
                                                        (!selectedCategory ||
                                                            showAllCategories) && (
                                                            <>
                                                                {/* Top 4 popular categories */}
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {categories
                                                                        .slice(
                                                                            0,
                                                                            4
                                                                        )
                                                                        .map(
                                                                            (
                                                                                category
                                                                            ) => (
                                                                                <button
                                                                                    key={
                                                                                        category.id
                                                                                    }
                                                                                    type="button"
                                                                                    onClick={() => {
                                                                                        selectCategory(
                                                                                            category.id
                                                                                        );
                                                                                        setShowAllCategories(
                                                                                            false
                                                                                        );
                                                                                    }}
                                                                                    className={`p-3 rounded-xl border transition-all duration-200 text-left ${
                                                                                        selectedCategory ===
                                                                                        category.id
                                                                                            ? "border-blue-500 bg-blue-500/10"
                                                                                            : "border-[var(--color-neutral-700)] hover:border-blue-400/50 hover:bg-[var(--color-neutral-700)] bg-[var(--color-neutral-900)]"
                                                                                    }`}
                                                                                >
                                                                                    <div className="flex items-center gap-3">
                                                                                        {category.icon && (
                                                                                            <span className="text-base">
                                                                                                {
                                                                                                    category.icon
                                                                                                }
                                                                                            </span>
                                                                                        )}
                                                                                        <span className="text-sm font-medium text-[var(--foreground)]">
                                                                                            {
                                                                                                category.name
                                                                                            }
                                                                                        </span>
                                                                                    </div>
                                                                                </button>
                                                                            )
                                                                        )}
                                                                </div>

                                                                {/* More categories button */}
                                                                {categories.length >
                                                                    4 && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={() =>
                                                                            setShowAllCategories(
                                                                                !showAllCategories
                                                                            )
                                                                        }
                                                                        className="w-full border-[var(--color-neutral-700)] text-[var(--foreground)] hover:bg-[var(--color-neutral-700)] h-11"
                                                                    >
                                                                        {showAllCategories
                                                                            ? "Thu gọn"
                                                                            : `Xem thêm ${categories.length - 4} loại`}
                                                                    </Button>
                                                                )}

                                                                {/* All categories (when expanded) */}
                                                                {showAllCategories &&
                                                                    categories.length >
                                                                        4 && (
                                                                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-neutral-700)]">
                                                                            {categories
                                                                                .slice(
                                                                                    4
                                                                                )
                                                                                .map(
                                                                                    (
                                                                                        category
                                                                                    ) => (
                                                                                        <button
                                                                                            key={
                                                                                                category.id
                                                                                            }
                                                                                            type="button"
                                                                                            onClick={() => {
                                                                                                selectCategory(
                                                                                                    category.id
                                                                                                );
                                                                                                setShowAllCategories(
                                                                                                    false
                                                                                                );
                                                                                            }}
                                                                                            className={`p-3 rounded-xl border transition-all duration-200 text-left ${
                                                                                                selectedCategory ===
                                                                                                category.id
                                                                                                    ? "border-blue-500 bg-blue-500/10"
                                                                                                    : "border-[var(--color-neutral-700)] hover:border-blue-400/50 hover:bg-[var(--color-neutral-700)] bg-[var(--color-neutral-900)]"
                                                                                            }`}
                                                                                        >
                                                                                            <div className="flex items-center gap-3">
                                                                                                {category.icon && (
                                                                                                    <span className="text-base">
                                                                                                        {
                                                                                                            category.icon
                                                                                                        }
                                                                                                    </span>
                                                                                                )}
                                                                                                <span className="text-sm font-medium text-[var(--foreground)]">
                                                                                                    {
                                                                                                        category.name
                                                                                                    }
                                                                                                </span>
                                                                                            </div>
                                                                                        </button>
                                                                                    )
                                                                                )}
                                                                        </div>
                                                                    )}
                                                            </>
                                                        )}

                                                    {/* Custom category input - ALWAYS SHOW */}
                                                    <div
                                                        className={`flex gap-2 ${categories.length > 0 ? "pt-2 border-t border-[var(--color-neutral-700)]" : ""}`}
                                                    >
                                                        <Input
                                                            value={
                                                                customCategoryName
                                                            }
                                                            onChange={(e) =>
                                                                setCustomCategoryName(
                                                                    e.target
                                                                        .value
                                                                )
                                                            }
                                                            placeholder="+ Tạo loại mới"
                                                            className="flex-1 h-11 bg-[var(--color-neutral-900)] border-[var(--color-neutral-700)] text-[var(--foreground)] placeholder-[var(--color-neutral-500)] rounded-[var(--radius-xl)] focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]"
                                                            onKeyDown={(e) => {
                                                                if (
                                                                    e.key ===
                                                                    "Enter"
                                                                ) {
                                                                    e.preventDefault();
                                                                    addCustomCategory();
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={
                                                                addCustomCategory
                                                            }
                                                            disabled={
                                                                !customCategoryName.trim()
                                                            }
                                                            className="h-11 w-11 p-0 border-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)] hover:text-[var(--foreground)]"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>

                                                    {errors.category && (
                                                        <p className="text-sm text-red-400 flex items-center gap-1">
                                                            <span>⚠️</span>
                                                            {
                                                                errors.category
                                                                    .message
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* MORE OPTIONS - Time, Mood, Place Name */}
                                        <div className="space-y-4 pt-4 border-t border-[var(--color-neutral-700)]">
                                            {/* Visit Time */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-[var(--color-neutral-400)]">
                                                    Thời gian
                                                </Label>
                                                <Input
                                                    type="datetime-local"
                                                    {...register("visitTime")}
                                                    className="h-10 bg-[var(--color-neutral-800)]/80 border-[var(--color-neutral-700)] hover:border-[var(--color-neutral-600)] focus:border-blue-500/50 text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-blue-500/20 transition-colors"
                                                />
                                            </div>

                                            {/* Mood */}
                                            <div className="space-y-2">
                                                <Label className="text-sm font-medium text-[var(--color-neutral-400)]">
                                                    Tâm trạng
                                                </Label>
                                                <div className="flex gap-2">
                                                    {moods.map((mood) => (
                                                        <button
                                                            key={mood.emoji}
                                                            type="button"
                                                            onClick={() =>
                                                                setValue(
                                                                    "mood",
                                                                    mood.emoji as
                                                                        | "😍"
                                                                        | "😊"
                                                                        | "😐"
                                                                        | "🙁"
                                                                        | "😴"
                                                                )
                                                            }
                                                            className={`p-2 rounded-lg border-2 transition-all duration-200 min-h-[40px] min-w-[40px] hover:scale-105 ${
                                                                watch(
                                                                    "mood"
                                                                ) === mood.emoji
                                                                    ? "border-blue-500 bg-blue-500/20 shadow-sm"
                                                                    : "border-[var(--color-neutral-700)] hover:border-blue-500/50 hover:bg-[var(--color-neutral-700)]/50"
                                                            }`}
                                                            title={mood.label}
                                                        >
                                                            <div className="text-lg">
                                                                {mood.emoji}
                                                            </div>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* FIXED FOOTER */}
                    <form
                        onSubmit={handleSubmit(onFormSubmit)}
                        className="border-t border-[var(--color-neutral-800)]/50 bg-[var(--background)] px-7 py-4 flex-shrink-0"
                    >
                        <div className="flex justify-end gap-2.5 sm:gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClose}
                                className="min-h-[44px] px-6 text-[var(--color-neutral-500)] hover:text-[var(--foreground)] hover:bg-[var(--color-neutral-700)]/50 rounded-lg transition-all"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={
                                    isSubmitting ||
                                    isUploadingImages ||
                                    (!selectedCategory && categories.length > 0)
                                }
                                className="min-h-[44px] px-8 bg-blue-600 hover:bg-blue-700 text-white border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                {isUploadingImages ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {uploadProgress || "Đang xử lý..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {isSubmitting && "Đang lưu..."}
                                        {!isSubmitting &&
                                            existingNote &&
                                            "Cập nhật ghi chú"}
                                        {!isSubmitting &&
                                            !existingNote &&
                                            "Lưu ghi chú"}
                                    </>
                                )}
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Image Lightbox */}
            <ImageLightbox
                images={lightboxImages}
                initialIndex={lightboxIndex}
                isOpen={showLightbox}
                onClose={() => setShowLightbox(false)}
            />

            {/* Undo Toast */}
            {showUndoToast && (
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-[var(--color-neutral-900)] border border-[var(--color-neutral-700)] text-[var(--foreground)] px-6 py-3 rounded-xl shadow-[var(--shadow-lg)] flex items-center gap-4 z-50 backdrop-blur-sm">
                    <span className="flex items-center gap-2">
                        <span className="text-green-400">✅</span>
                        <span>Đã lưu ghi chú</span>
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-[var(--color-neutral-500)] hover:text-[var(--foreground)] hover:bg-[var(--color-neutral-700)] px-3 py-1 h-auto text-sm"
                        onClick={() => {
                            // Could implement undo logic here
                            setShowUndoToast(false);
                        }}
                    >
                        Hoàn tác
                    </Button>
                </div>
            )}
        </>
    );
}
