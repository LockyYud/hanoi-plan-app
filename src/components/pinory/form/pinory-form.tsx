"use client";

import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
    Clock,
    Globe,
    Image as ImageIcon,
    Loader2,
    Lock,
    MapPin,
    Plus,
    Save,
    Star,
    Tag,
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

const PinorySchema = z.object({
    category: z.string().optional(), // Category is optional now
    content: z.string().max(280, "Maximum 280 characters").optional(),
    placeName: z.string().min(1, "Place name is required"),
    visitTime: z.string().min(1, "Visit time is required"),
    visibility: z.enum(["private", "friends", "public"]),
});

type PinoryFormData = z.infer<typeof PinorySchema>;

interface PinoryFormProps {
    readonly isOpen: boolean;
    readonly onClose: () => void;
    readonly location: {
        lng: number;
        lat: number;
        address?: string;
    };
    readonly existingPinory?: {
        id: string;
        content: string;
        images?: string[];
        placeName?: string;
        visitTime?: string;
        category?: string; // single category ID
        coverImageIndex?: number;
        visibility?: string;
    };
    readonly onSubmit: (
        data: PinoryFormData & {
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

export function PinoryForm({
    isOpen,
    onClose,
    location,
    existingPinory,
    onSubmit,
}: PinoryFormProps) {
    const { data: session } = useSession();

    // Form state
    const [selectedCategory, setSelectedCategory] = useState<string>(
        existingPinory?.category || ""
    );
    const [customCategoryName, setCustomCategoryName] = useState<string>("");
    const [showVisibilityMenu, setShowVisibilityMenu] =
        useState<boolean>(false);
    const [showCategoryMenu, setShowCategoryMenu] = useState<boolean>(false);
    const [showTimeMenu, setShowTimeMenu] = useState<boolean>(false);

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
        existingPinory?.coverImageIndex || 0
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
            console.log("📝 PinoryForm: Fetching categories...", {
                isOpen,
                hasSession: !!session,
                currentCategories: categories.length,
            });
            fetchCategories(session);
        } else {
            console.log("📝 PinoryForm: Not fetching categories", {
                isOpen,
                hasSession: !!session,
            });
        }
    }, [isOpen, session, fetchCategories]);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
    } = useForm<PinoryFormData>({
        resolver: zodResolver(PinorySchema),
        defaultValues: {
            category: existingPinory?.category || "",
            content: existingPinory?.content || "",
            placeName: existingPinory?.placeName || location.address || "",
            visitTime:
                existingPinory?.visitTime ||
                new Date().toISOString().slice(0, 16),
            visibility:
                (existingPinory?.visibility as
                    | "private"
                    | "friends"
                    | "public") || "private",
        },
    });

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

    // Sync selectedCategory with existingPinory when form opens for editing
    useEffect(() => {
        if (isOpen && existingPinory?.category) {
            console.log("📝 PinoryForm: Setting category from existingPinory", {
                category: existingPinory.category,
            });
            setSelectedCategory(existingPinory.category);
            setValue("category", existingPinory.category);
        }
    }, [isOpen, existingPinory, setValue]);

    // Log categories changes
    useEffect(() => {
        console.log("📝 PinoryForm: Categories updated", {
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

        if (hasChanges && !existingPinory) {
            // Save draft to localStorage
            const draftKey = `pinory-draft-${location.lng}-${location.lat}`;
            localStorage.setItem(draftKey, JSON.stringify(formData));
        }
    }, [
        selectedCategory,
        contentValue,
        images.length,
        existingImageUrls.length,
        watch,
        location,
        existingPinory,
        hasUnsavedChanges,
    ]);

    // Load draft on mount
    useEffect(() => {
        if (!existingPinory) {
            const draftKey = `pinory-draft-${location.lng}-${location.lat}`;
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
                    if (draftData.visibility)
                        setValue("visibility", draftData.visibility);
                } catch (error) {
                    console.warn("Error loading draft:", error);
                }
            }
        }
    }, [existingPinory, location, setValue]);

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
        if (existingPinory) {
            setSelectedCategory(existingPinory.category || "");
            setValue("category", existingPinory.category || "");
            if (existingPinory.images && existingPinory.images.length > 0) {
                setExistingImageUrls(existingPinory.images);
            }
            setCoverImageIndex(existingPinory.coverImageIndex || 0);
        } else {
            setExistingImageUrls([]);
            setImages([]);
            setPreviewUrls([]);
            setSelectedCategory("");
            setCoverImageIndex(0);
        }
    }, [existingPinory, setValue]);

    // Form submission
    const onFormSubmit = async (data: PinoryFormData) => {
        try {
            setIsUploadingImages(true);

            if (existingPinory) {
                // Editing existing pinory
                setUploadProgress("Processing images...");

                const imageUrls: string[] = [];
                for (const existingImage of existingImageUrls) {
                    if (typeof existingImage === "string") {
                        imageUrls.push(existingImage);
                    }
                }

                if (images.length > 0) {
                    setUploadProgress(`Uploading 0/${images.length} images...`);
                    const uploadResults = await uploadMultipleImages(
                        images,
                        existingPinory.id,
                        (completed, total) => {
                            setUploadProgress(
                                `Uploading ${completed}/${total} images...`
                            );
                        }
                    );

                    let successCount = 0;
                    for (const result of uploadResults) {
                        if (result.success && result.url) {
                            imageUrls.push(result.url);
                            successCount++;
                        }
                    }

                    setUploadProgress(
                        `Uploaded ${successCount}/${images.length} images successfully`
                    );
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }

                setUploadProgress("Updating pinory...");

                // Wait for onSubmit to complete (API call)
                await onSubmit({
                    ...data,
                    id: existingPinory.id,
                    lng: location.lng,
                    lat: location.lat,
                    address: location.address || "",
                    timestamp: new Date(),
                    images: imageUrls,
                    coverImageIndex,
                });
            } else {
                // Creating new pinory
                setUploadProgress("Creating pinory...");

                const pinoryResponse = await fetch("/api/location-notes", {
                    method: "POST",
                    credentials: "include",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        lng: location.lng,
                        lat: location.lat,
                        address: location.address || "",
                        content: data.content,
                        categoryIds: data.category ? [data.category] : [], // Convert single category to array for API
                        placeName: data.placeName,
                        visitTime: data.visitTime,
                        visibility: data.visibility,
                    }),
                });

                if (!pinoryResponse.ok) {
                    const errorData = await pinoryResponse.json();
                    throw new Error(
                        errorData.error || "Failed to create pinory"
                    );
                }

                const createdPinory = await pinoryResponse.json();

                const imageUrls: string[] = [];
                if (images.length > 0) {
                    setUploadProgress(`Uploading 0/${images.length} images...`);
                    const uploadResults = await uploadMultipleImages(
                        images,
                        createdPinory.id,
                        (completed, total) => {
                            setUploadProgress(
                                `Uploading ${completed}/${total} images...`
                            );
                        }
                    );

                    let successCount = 0;
                    for (const result of uploadResults) {
                        if (result.success && result.url) {
                            imageUrls.push(result.url);
                            successCount++;
                        }
                    }

                    setUploadProgress(
                        `Uploaded ${successCount}/${images.length} images successfully`
                    );
                    await new Promise((resolve) => setTimeout(resolve, 500));
                }

                setUploadProgress("Done...");

                console.log("📝 PinoryForm: Calling onSubmit with data:", {
                    id: createdPinory.id,
                    content: data.content?.substring(0, 20),
                    lng: location.lng,
                    lat: location.lat,
                    images: imageUrls.length,
                });

                onSubmit({
                    ...data,
                    id: createdPinory.id,
                    lng: location.lng,
                    lat: location.lat,
                    address: location.address || "",
                    timestamp: new Date(),
                    images: imageUrls,
                    coverImageIndex,
                });

                console.log("✅ PinoryForm: onSubmit called successfully");
            }

            // Reset form and clear draft
            const draftKey = `pinory-draft-${location.lng}-${location.lat}`;
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

            // Only close form here if creating new pinory
            // When editing, parent (map-container) will close the form
            if (!existingPinory) {
                onClose();
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "An error occurred while processing";
            setUploadProgress(`❌ ${errorMessage}`);

            // Show error alert
            alert(`Failed to save pinory: ${errorMessage}`);

            // Keep form open on error so user can retry
        } finally {
            setIsUploadingImages(false);
            // Clear progress message after 3 seconds
            setTimeout(() => setUploadProgress(""), 3000);
        }
    };

    const handleClose = () => {
        // Save draft if there are unsaved changes
        if (hasUnsavedChanges && !existingPinory) {
            const formData = {
                category: selectedCategory,
                content: watch("content"),
                placeName: watch("placeName"),
                visitTime: watch("visitTime"),
                visibility: watch("visibility"),
            };
            const draftKey = `pinory-draft-${location.lng}-${location.lat}`;
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
        setShowCategoryMenu(false);
        setShowTimeMenu(false);
        setHasUnsavedChanges(false);
        onClose();
    };

    const totalImages = existingImageUrls.length + images.length;
    const allImages = [...existingImageUrls, ...previewUrls];

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleClose}>
                <DialogContent className="max-w-[720px] h-[80vh] overflow-hidden p-0 bg-[var(--background)] border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-lg)] flex flex-col [&>button]:hidden">
                    {/* Enhanced Header */}
                    <div className="bg-card border-b border-border px-7 py-6 flex-shrink-0">
                        <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                                <DialogTitle asChild>
                                    <div className="relative">
                                        <Input
                                            {...register("placeName")}
                                            placeholder="Place name"
                                            className="text-xl font-semibold text-[var(--foreground)] mb-2 h-auto py-2 px-3 pr-10 bg-transparent border-transparent hover:border-border focus:border-[var(--color-primary-500)] focus:bg-secondary rounded-lg transition-all"
                                        />
                                        {watch("placeName") && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                onClick={() =>
                                                    setValue("placeName", "")
                                                }
                                                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground hover:text-[var(--foreground)] hover:bg-accent/50 rounded-full mb-1"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </DialogTitle>
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    <span className="text-sm text-muted-foreground truncate">
                                        {location.address ||
                                            "Address not available"}
                                    </span>
                                </div>
                            </div>
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
                                            // Auto-resize textarea
                                            if (e) {
                                                e.style.height = "auto";
                                                e.style.height =
                                                    e.scrollHeight + "px";
                                            }
                                        }}
                                        placeholder="What do you think about this place?"
                                        onInput={(e) => {
                                            const target =
                                                e.target as HTMLTextAreaElement;
                                            target.style.height = "auto";
                                            target.style.height =
                                                target.scrollHeight + "px";
                                        }}
                                        className="resize-none bg-transparent border-0 border-none text-[var(--foreground)] placeholder-muted-foreground text-lg leading-relaxed transition-colors focus:outline-none focus:ring-0 focus:border-0 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[60px] pr-16 w-full overflow-hidden"
                                    />
                                    <div className="absolute bottom-2 right-2 text-xs text-muted-foreground pointer-events-none">
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
                                                        key={`existing-image-${existingPinory?.id || "new"}-${index}`}
                                                        className={`group relative bg-card overflow-hidden ${
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
                                                                    className="w-full h-full cursor-pointer bg-muted"
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
                                                                        alt={`Photo ${index + 1}`}
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
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                                <div className="text-center">
                                                                    <div className="text-xl mb-1">
                                                                        📷
                                                                    </div>
                                                                    <div className="text-xs">
                                                                        Image
                                                                        error
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
                                                    className={`group relative bg-card overflow-hidden ${
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
                                                        className="w-full h-full cursor-pointer bg-muted"
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
                                                            alt={`New photo ${index + 1}`}
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
                                        <div className="flex items-center justify-center border-t border-border pt-3 mt-3">
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
                                                className="text-muted-foreground hover:text-[var(--foreground)] hover:bg-secondary h-10"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Add photos
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Add to post - Facebook style actions bar */}
                    <div className="flex items-center justify-between px-7 py-3 border-t border-border bg-[var(--background)] flex-shrink-0">
                        <span className="text-sm font-medium text-[var(--foreground)]">
                            Add to your post
                        </span>
                        <div className="flex items-center gap-1">
                            {/* Image Button */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                    document.getElementById("images")?.click()
                                }
                                className="h-9 w-9 rounded-full hover:bg-secondary text-green-500"
                                title="Add photos"
                            >
                                <ImageIcon className="h-5 w-5" />
                            </Button>

                            {/* Category Button with Dropdown */}
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setShowCategoryMenu(!showCategoryMenu);
                                        setShowVisibilityMenu(false);
                                        setShowTimeMenu(false);
                                    }}
                                    className={`h-9 w-9 rounded-full hover:bg-secondary ${selectedCategory ? "text-purple-500" : "text-muted-foreground"}`}
                                    title="Select category"
                                >
                                    <Tag className="h-5 w-5" />
                                </Button>

                                {/* Category Dropdown Menu */}
                                {showCategoryMenu && (
                                    <div className="absolute bottom-full right-0 mb-2 w-72 bg-card border border-border rounded-lg shadow-xl z-50 p-3">
                                        <div className="space-y-3">
                                            <div className="text-sm font-medium text-[var(--foreground)]">
                                                Category
                                            </div>

                                            {isLoadingCategories ? (
                                                <div className="flex items-center py-2">
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[var(--color-primary-500)]"></div>
                                                    <span className="ml-2 text-sm text-muted-foreground">
                                                        Loading...
                                                    </span>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Category Select */}
                                                    <select
                                                        value={selectedCategory}
                                                        onChange={(e) => {
                                                            selectCategory(
                                                                e.target.value
                                                            );
                                                        }}
                                                        className="w-full h-10 px-3 bg-secondary border border-border text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/50 transition-colors appearance-none cursor-pointer text-sm"
                                                        style={{
                                                            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                                            backgroundPosition:
                                                                "right 0.5rem center",
                                                            backgroundRepeat:
                                                                "no-repeat",
                                                            backgroundSize:
                                                                "1rem",
                                                        }}
                                                    >
                                                        <option value="">
                                                            None
                                                        </option>
                                                        {categories.map(
                                                            (category) => (
                                                                <option
                                                                    key={
                                                                        category.id
                                                                    }
                                                                    value={
                                                                        category.id
                                                                    }
                                                                >
                                                                    {
                                                                        category.icon
                                                                    }{" "}
                                                                    {
                                                                        category.name
                                                                    }
                                                                </option>
                                                            )
                                                        )}
                                                    </select>

                                                    {/* Create new category */}
                                                    <div className="flex gap-2 pt-2 border-t border-border">
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
                                                            placeholder="Create new..."
                                                            className="flex-1 h-9 text-sm bg-secondary border-border text-[var(--foreground)] placeholder-muted-foreground rounded-lg"
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
                                                            className="h-9 px-2 border-border hover:bg-accent"
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Time Button with Dropdown */}
                            <div className="relative">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setShowTimeMenu(!showTimeMenu);
                                        setShowVisibilityMenu(false);
                                        setShowCategoryMenu(false);
                                    }}
                                    className="h-9 w-9 rounded-full hover:bg-secondary text-orange-500"
                                    title="Visit time"
                                >
                                    <Clock className="h-5 w-5" />
                                </Button>

                                {/* Time Dropdown Menu */}
                                {showTimeMenu && (
                                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-card border border-border rounded-lg shadow-xl z-50 p-3">
                                        <div className="space-y-2">
                                            <div className="text-sm font-medium text-[var(--foreground)]">
                                                Visit time
                                            </div>
                                            <Input
                                                type="datetime-local"
                                                {...register("visitTime")}
                                                className="h-10 bg-secondary border-border text-[var(--foreground)] rounded-lg focus:ring-2 focus:ring-blue-500/20 text-sm"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Visibility Button with Dropdown */}
                            <div className="relative visibility-menu-container">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => {
                                        setShowVisibilityMenu(
                                            !showVisibilityMenu
                                        );
                                        setShowCategoryMenu(false);
                                        setShowTimeMenu(false);
                                    }}
                                    className="h-9 w-9 rounded-full hover:bg-secondary text-blue-500"
                                    title="Who can see?"
                                >
                                    {watch("visibility") === "private" && (
                                        <Lock className="h-5 w-5" />
                                    )}
                                    {watch("visibility") === "friends" && (
                                        <Users className="h-5 w-5" />
                                    )}
                                    {watch("visibility") === "public" && (
                                        <Globe className="h-5 w-5" />
                                    )}
                                </Button>

                                {/* Visibility Dropdown Menu */}
                                {showVisibilityMenu && (
                                    <div className="absolute bottom-full right-0 mb-2 w-64 bg-card border border-border rounded-lg shadow-xl z-50 p-2">
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
                                                    watch("visibility") ===
                                                    "private"
                                                        ? "bg-blue-500/20 border border-blue-500"
                                                        : "hover:bg-secondary"
                                                }`}
                                            >
                                                <Lock className="h-5 w-5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">
                                                        Private
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Only you can see
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
                                                    watch("visibility") ===
                                                    "friends"
                                                        ? "bg-blue-500/20 border border-blue-500"
                                                        : "hover:bg-secondary"
                                                }`}
                                            >
                                                <Users className="h-5 w-5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">
                                                        Friends
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Your friends can see
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
                                                    watch("visibility") ===
                                                    "public"
                                                        ? "bg-blue-500/20 border border-blue-500"
                                                        : "hover:bg-secondary"
                                                }`}
                                            >
                                                <Globe className="h-5 w-5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">
                                                        Public
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Everyone can see
                                                    </div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* FIXED FOOTER */}
                    <form
                        onSubmit={handleSubmit(onFormSubmit)}
                        className="border-t border-border/50 bg-[var(--background)] px-7 py-4 flex-shrink-0"
                    >
                        <div className="flex justify-end gap-2.5 sm:gap-3">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={handleClose}
                                className="min-h-[44px] px-6 text-muted-foreground hover:text-[var(--foreground)] hover:bg-accent/50 rounded-lg transition-all"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isSubmitting || isUploadingImages}
                                className="min-h-[44px] px-8 bg-blue-600 hover:bg-blue-700 text-white border-0 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-50 disabled:cursor-not-allowed font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all"
                            >
                                {isUploadingImages ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        {uploadProgress || "Processing..."}
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        {isSubmitting && "Saving..."}
                                        {!isSubmitting &&
                                            existingPinory &&
                                            "Update Pinory"}
                                        {!isSubmitting &&
                                            !existingPinory &&
                                            "Save Pinory"}
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
                <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-card border border-border text-[var(--foreground)] px-6 py-3 rounded-xl shadow-[var(--shadow-lg)] flex items-center gap-4 z-50 backdrop-blur-sm">
                    <span className="flex items-center gap-2">
                        <span className="text-green-400">✅</span>
                        <span>Pinory saved</span>
                    </span>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground hover:text-[var(--foreground)] hover:bg-accent px-3 py-1 h-auto text-sm"
                        onClick={() => {
                            // Could implement undo logic here
                            setShowUndoToast(false);
                        }}
                    >
                        Undo
                    </Button>
                </div>
            )}
        </>
    );
}
