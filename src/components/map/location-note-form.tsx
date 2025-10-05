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
  MapPin,
  Camera,
  X,
  Save,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
  Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useImageUpload } from "@/lib/image-upload";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import { ImageLightbox } from "@/components/ui/image-lightbox";

const LocationNoteSchema = z.object({
  category: z.string().min(1, "Chọn một danh mục"),
  content: z.string().max(280, "Nội dung tối đa 280 ký tự").optional(),
  mood: z.enum(["😍", "😊", "😐", "🙁", "😴"]).optional(),
  placeName: z.string().min(1, "Tên địa điểm không được để trống"),
  visitTime: z.string().min(1, "Thời gian thăm không được để trống"),
});

type LocationNoteFormData = z.infer<typeof LocationNoteSchema>;

// Category type from database
interface Category {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  color?: string;
  isDefault: boolean;
  userId?: string;
}

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
  ) => void;
}

export function LocationNoteForm({
  isOpen,
  onClose,
  location,
  existingNote,
  onSubmit,
}: LocationNoteFormProps) {
  // Form state
  const [selectedCategory, setSelectedCategory] = useState<string>(
    existingNote?.category || ""
  );
  const [customCategoryName, setCustomCategoryName] = useState<string>("");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(false);

  // Text area ref for auto-focus
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Categories state
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

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

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        const response = await fetch("/api/categories", {
          credentials: "include",
        });
        if (response.ok) {
          const categoriesData = await response.json();
          setCategories(categoriesData);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

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
        existingNote?.mood && moods.some((m) => m.emoji === existingNote.mood)
          ? (existingNote.mood as "😍" | "😊" | "😐" | "🙁" | "😴")
          : undefined,
      placeName: existingNote?.placeName || location.address || "",
      visitTime:
        existingNote?.visitTime || new Date().toISOString().slice(0, 16),
    },
  });

  // Watch content for character count
  const contentValue = watch("content") || "";

  // Auto-save draft logic
  useEffect(() => {
    const formData = {
      category: selectedCategory,
      content: contentValue,
      placeName: watch("placeName"),
      visitTime: watch("visitTime"),
      mood: watch("mood"),
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
          if (draftData.category) setSelectedCategory(draftData.category);
          if (draftData.content) setValue("content", draftData.content);
          if (draftData.placeName) setValue("placeName", draftData.placeName);
          if (draftData.visitTime) setValue("visitTime", draftData.visitTime);
          if (draftData.mood) setValue("mood", draftData.mood);
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
          slug: customCategoryName.trim().toLowerCase().replace(/\s+/g, "-"),
        }),
      });

      if (response.ok) {
        const newCategory = await response.json();
        setCategories((prev) => [...prev, newCategory]);
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

      const totalImages = existingImageUrls.length + images.length;
      if (imageFiles.length + totalImages > 3) {
        alert("Tối đa 3 ảnh cho ghi chú");
        return;
      }

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

        onSubmit({
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

      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      setUploadProgress("Có lỗi xảy ra khi xử lý");
    } finally {
      setIsUploadingImages(false);
      setUploadProgress("");
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
          <DialogTitle className="sr-only">
            {existingNote ? "Chỉnh sửa ghi chú" : "Thêm ghi chú"}
          </DialogTitle>

          {/* Enhanced Header */}
          <div className="bg-[var(--color-neutral-900)] border-b border-[var(--color-neutral-700)] px-7 py-6 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">
                  {existingNote ? "Chỉnh sửa ghi chú" : "Thêm ghi chú"}
                </h3>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-[var(--color-neutral-500)] flex-shrink-0" />
                  <span className="text-sm text-[var(--color-neutral-500)] truncate">
                    {location.address || "Không xác định được địa chỉ"}
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
            <div className="flex-1 overflow-y-auto px-7 py-6 space-y-6">
              {/* PRIORITY 1: QUICK NOTES */}
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-lg font-medium text-[var(--foreground)]">
                    Ghi nhanh cảm nhận
                  </Label>
                  <p className="text-sm text-[var(--color-neutral-500)]">
                    Cảm nhận nhanh, món đã thử, tips...
                  </p>
                </div>
                <div className="relative">
                  <Textarea
                    ref={textareaRef}
                    {...register("content")}
                    placeholder="Chia sẻ trải nghiệm của bạn tại đây..."
                    rows={4}
                    className="resize-none bg-[var(--color-neutral-900)] border-[var(--color-neutral-700)] text-[var(--foreground)] placeholder-[var(--color-neutral-500)] rounded-xl focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)] min-h-[100px] pr-16 text-base leading-relaxed"
                  />
                  <div className="absolute bottom-3 right-3 text-xs text-[var(--color-neutral-500)] pointer-events-none">
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

              {/* PRIORITY 2: IMAGES */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Camera className="h-5 w-5 text-[var(--foreground)]" />
                  <Label className="text-lg font-medium text-[var(--foreground)]">
                    Thêm ảnh
                  </Label>
                  {totalImages > 0 && (
                    <span className="px-2 py-1 bg-[var(--color-primary-500)]/20 text-[var(--color-primary-500)] text-xs rounded-lg font-medium border border-[var(--color-primary-500)]/30">
                      {totalImages}/3
                    </span>
                  )}
                </div>

                <input
                  type="file"
                  id="images"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Primary Upload Zone */}
                {totalImages === 0 && (
                  <div
                    className={`border-2 border-dashed rounded-xl transition-all duration-200 cursor-pointer ${
                      dragActive
                        ? "border-[var(--color-primary-500)] bg-[var(--color-primary-500)]/10 h-40"
                        : "border-[var(--color-neutral-700)] hover:border-[var(--color-primary-500)]/50 hover:bg-[var(--color-primary-500)]/5 h-36"
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById("images")?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        document.getElementById("images")?.click();
                      }
                    }}
                  >
                    <div className="flex flex-col items-center justify-center h-full text-center px-6">
                      <Camera className="h-10 w-10 text-[var(--color-neutral-500)] mb-3" />
                      <Button
                        type="button"
                        variant="outline"
                        size="lg"
                        className="border-[var(--color-neutral-700)] text-[var(--foreground)] hover:bg-[var(--color-neutral-700)] mb-2 h-12 px-6"
                      >
                        + Thêm ảnh
                      </Button>
                      <p className="text-sm text-[var(--color-neutral-500)]">
                        Kéo ảnh vào đây hoặc bấm để chọn
                      </p>
                      <p className="text-xs text-[var(--color-neutral-500)] mt-1">
                        Chọn 1 ảnh làm Cover để hiện trên bản đồ
                      </p>
                    </div>
                  </div>
                )}

                {/* Image Grid */}
                {totalImages > 0 && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      {/* Existing images */}
                      {existingImageUrls.map((url, index) => (
                        <div
                          key={`existing-image-${existingNote?.id || "new"}-${index}`}
                          className="group relative aspect-square bg-[var(--color-neutral-900)] rounded-[var(--radius-xl)] border border-[var(--color-neutral-700)] overflow-hidden"
                        >
                          {isValidImageUrl(url) ? (
                            <>
                              <div
                                className="w-full h-full cursor-pointer"
                                onClick={() => openLightbox(allImages, index)}
                              >
                                <ImageDisplay
                                  src={url}
                                  alt={`Ảnh ${index + 1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {/* Cover badge */}
                              {coverImageIndex === index && (
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
                                  onClick={() => removeExistingImage(index)}
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                                {coverImageIndex !== index && (
                                  <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    className="absolute bottom-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/30 text-white border-0"
                                    onClick={() => setCoverImage(index, true)}
                                  >
                                    <Star className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[var(--color-neutral-500)]">
                              <div className="text-center">
                                <div className="text-xl mb-1">📷</div>
                                <div className="text-xs">Ảnh lỗi</div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}

                      {/* New images */}
                      {previewUrls.map((url, index) => (
                        <div
                          key={`new-image-${url.slice(-10)}-${index}`}
                          className="group relative aspect-square bg-[var(--color-neutral-900)] rounded-[var(--radius-xl)] border border-[var(--color-neutral-700)] overflow-hidden"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={url}
                            alt={`Ảnh mới ${index + 1}`}
                            className="w-full h-full object-cover cursor-pointer"
                            onClick={() =>
                              openLightbox(
                                allImages,
                                existingImageUrls.length + index
                              )
                            }
                          />
                          {/* Cover badge */}
                          {coverImageIndex ===
                            existingImageUrls.length + index && (
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
                              onClick={() => removeNewImage(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            {coverImageIndex !==
                              existingImageUrls.length + index && (
                              <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                className="absolute bottom-2 right-2 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 bg-white/20 hover:bg-white/30 text-white border-0"
                                onClick={() => setCoverImage(index, false)}
                              >
                                <Star className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Add more button */}
                    {totalImages < 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          document.getElementById("images")?.click()
                        }
                        className="border-[var(--color-neutral-700)] text-[var(--foreground)] hover:bg-[var(--color-neutral-700)] w-full h-11"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Thêm ảnh khác ({totalImages}/3)
                      </Button>
                    )}
                  </div>
                )}
                {/* PRIORITY 3: COMPACT CATEGORY SELECTION */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-[var(--foreground)]" />
                    <Label className="text-lg font-medium text-[var(--foreground)]">
                      Loại địa điểm *
                    </Label>
                  </div>

                  {isLoadingCategories ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--color-primary-500)]"></div>
                      <span className="ml-3 text-sm text-[var(--color-neutral-500)]">
                        Đang tải...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Selected category display */}
                      {selectedCategory && (
                        <div className="flex items-center justify-between p-3 bg-[var(--color-neutral-900)] border border-[var(--color-neutral-700)] rounded-xl">
                          {(() => {
                            const category = categories.find(
                              (c) => c.id === selectedCategory
                            );
                            if (!category) return null;

                            return (
                              <>
                                <div className="flex items-center gap-3">
                                  {category.icon && (
                                    <span className="text-lg">
                                      {category.icon}
                                    </span>
                                  )}
                                  <span className="text-sm font-medium text-[var(--foreground)]">
                                    {category.name}
                                  </span>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    setShowAllCategories(!showAllCategories)
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

                      {/* Category selection (show when no selection or when "Đổi" clicked) */}
                      {(!selectedCategory || showAllCategories) && (
                        <>
                          {/* Top 4 popular categories */}
                          <div className="grid grid-cols-2 gap-2">
                            {categories.slice(0, 4).map((category) => (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => {
                                  selectCategory(category.id);
                                  setShowAllCategories(false);
                                }}
                                className={`p-3 rounded-xl border transition-all duration-200 text-left ${
                                  selectedCategory === category.id
                                    ? "border-blue-500 bg-blue-500/10"
                                    : "border-[var(--color-neutral-700)] hover:border-blue-400/50 hover:bg-[var(--color-neutral-700)] bg-[var(--color-neutral-900)]"
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  {category.icon && (
                                    <span className="text-base">
                                      {category.icon}
                                    </span>
                                  )}
                                  <span className="text-sm font-medium text-[var(--foreground)]">
                                    {category.name}
                                  </span>
                                </div>
                              </button>
                            ))}
                          </div>

                          {/* More categories button */}
                          {categories.length > 4 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setShowAllCategories(!showAllCategories)
                              }
                              className="w-full border-[var(--color-neutral-700)] text-[var(--foreground)] hover:bg-[var(--color-neutral-700)] h-11"
                            >
                              {showAllCategories
                                ? "Thu gọn"
                                : `Xem thêm ${categories.length - 4} loại`}
                            </Button>
                          )}

                          {/* All categories (when expanded) */}
                          {showAllCategories && categories.length > 4 && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-neutral-700)]">
                              {categories.slice(4).map((category) => (
                                <button
                                  key={category.id}
                                  type="button"
                                  onClick={() => {
                                    selectCategory(category.id);
                                    setShowAllCategories(false);
                                  }}
                                  className={`p-3 rounded-xl border transition-all duration-200 text-left ${
                                    selectedCategory === category.id
                                      ? "border-blue-500 bg-blue-500/10"
                                      : "border-[var(--color-neutral-700)] hover:border-blue-400/50 hover:bg-[var(--color-neutral-700)] bg-[var(--color-neutral-900)]"
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    {category.icon && (
                                      <span className="text-base">
                                        {category.icon}
                                      </span>
                                    )}
                                    <span className="text-sm font-medium text-[var(--foreground)]">
                                      {category.name}
                                    </span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Custom category input */}
                          <div className="flex gap-2 pt-2 border-t border-[var(--color-neutral-700)]">
                            <Input
                              value={customCategoryName}
                              onChange={(e) =>
                                setCustomCategoryName(e.target.value)
                              }
                              placeholder="+ Tạo loại mới"
                              className="flex-1 h-11 bg-[var(--color-neutral-900)] border-[var(--color-neutral-700)] text-[var(--foreground)] placeholder-[var(--color-neutral-500)] rounded-[var(--radius-xl)] focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addCustomCategory();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={addCustomCategory}
                              disabled={!customCategoryName.trim()}
                              className="h-11 w-11 p-0 border-[var(--color-neutral-700)] hover:bg-[var(--color-neutral-700)] text-[var(--color-neutral-500)] hover:text-[var(--foreground)]"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </>
                      )}

                      {errors.category && (
                        <p className="text-sm text-red-400 flex items-center gap-1">
                          <span>⚠️</span>
                          {errors.category.message}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* ADVANCED OPTIONS (Collapsed by default) */}
                <div className="space-y-4">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-2 text-[var(--color-neutral-500)] hover:text-[var(--foreground)] hover:bg-[var(--color-neutral-700)]/50 p-2 -ml-2"
                  >
                    <span className="text-sm font-medium">Tùy chọn khác</span>
                    {showAdvanced ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>

                  {showAdvanced && (
                    <div className="space-y-4 pl-4 border-l-2 border-[var(--color-neutral-700)]">
                      {/* Place Name */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[var(--foreground)]">
                          Tên địa điểm
                        </Label>
                        <Input
                          {...register("placeName")}
                          placeholder="VD: Cafe The Coffee Bean..."
                          className="h-11 bg-[var(--color-neutral-900)] border-[var(--color-neutral-700)] text-[var(--foreground)] placeholder-[var(--color-neutral-500)] rounded-[var(--radius-xl)] focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]"
                        />
                        {errors.placeName && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <span>⚠️</span>
                            {errors.placeName.message}
                          </p>
                        )}
                      </div>

                      {/* Visit Time */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[var(--foreground)]">
                          Thời gian
                        </Label>
                        <Input
                          type="datetime-local"
                          {...register("visitTime")}
                          className="h-11 bg-[var(--color-neutral-900)] border-[var(--color-neutral-700)] text-[var(--foreground)] rounded-[var(--radius-xl)] focus:ring-2 focus:ring-[var(--color-primary-500)] focus:border-[var(--color-primary-500)]"
                        />
                      </div>

                      {/* Mood */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-[var(--foreground)]">
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
                                  mood.emoji as "😍" | "😊" | "😐" | "🙁" | "😴"
                                )
                              }
                              className={`p-3 rounded-xl border-2 transition-all duration-200 min-h-[44px] min-w-[44px] ${
                                watch("mood") === mood.emoji
                                  ? "border-blue-500 bg-blue-500/10"
                                  : "border-[var(--color-neutral-700)] hover:border-blue-400/50 hover:bg-[var(--color-neutral-700)]/50"
                              }`}
                              title={mood.label}
                            >
                              <div className="text-lg">{mood.emoji}</div>
                            </button>
                          ))}
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
              className="border-t border-[var(--color-neutral-700)] bg-[var(--background)] px-7 py-4 flex-shrink-0"
            >
              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  className="min-h-[44px] px-6 text-[var(--color-neutral-500)] hover:text-[var(--foreground)] hover:bg-[var(--color-neutral-700)]/50"
                >
                  Hủy
                </Button>
                <Button
                  type="submit"
                  disabled={
                    isSubmitting || isUploadingImages || !selectedCategory
                  }
                  className="min-h-[44px] px-8 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white border-0 focus:ring-2 focus:ring-[var(--color-primary-500)] focus:ring-offset-2 focus:ring-offset-[var(--background)] disabled:opacity-50 disabled:cursor-not-allowed font-medium"
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
                    if (existingNote) return "Cập nhật";
                    return "Lưu ghi chú";
                  })()}
                </Button>
              </div>
            </form>
          </div>
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
