"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Camera, X, Clock, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useImageUpload } from "@/lib/image-upload";
import { isValidImageUrl, ImageDisplay } from "@/lib/image-utils";
import { ImageLightbox } from "@/components/ui/image-lightbox";

const LocationNoteSchema = z.object({
  content: z.string().min(1, "Nội dung ghi chú không được để trống"),
  mood: z.enum(["😊", "😍", "😎", "🤔", "😴", "😋", "🥳", "😤"]).optional(),
  placeName: z.string().min(1, "Tên địa điểm không được để trống"),
  visitTime: z.string().min(1, "Thời gian thăm không được để trống"),
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
  };
  readonly onSubmit: (
    data: LocationNoteFormData & {
      id?: string;
      lng: number;
      lat: number;
      address: string;
      timestamp: Date;
      images?: string[];
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
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [existingImageUrls, setExistingImageUrls] = useState<string[]>([]);
  const [selectedMood, setSelectedMood] = useState<string>(
    existingNote?.mood || ""
  );
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>("");

  // Lightbox state
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { uploadMultipleImages } = useImageUpload();

  // Open lightbox
  const openLightbox = (images: string[], startIndex: number = 0) => {
    setLightboxImages(images);
    setLightboxIndex(startIndex);
    setShowLightbox(true);
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LocationNoteFormData>({
    resolver: zodResolver(LocationNoteSchema),
    defaultValues: {
      content: existingNote?.content || "",
      mood: existingNote?.mood as
        | "😊"
        | "😍"
        | "😎"
        | "🤔"
        | "😴"
        | "😋"
        | "🥳"
        | "😤"
        | undefined,
      placeName: existingNote?.placeName || location.address || "",
      visitTime:
        existingNote?.visitTime || new Date().toISOString().slice(0, 16),
    },
  });

  const moods = [
    { emoji: "😊", label: "Vui vẻ" },
    { emoji: "😍", label: "Yêu thích" },
    { emoji: "😎", label: "Thư giãn" },
    { emoji: "🤔", label: "Suy nghĩ" },
    { emoji: "😴", label: "Bình thản" },
    { emoji: "😋", label: "Ngon miệng" },
    { emoji: "🥳", label: "Vui nhộn" },
    { emoji: "😤", label: "Không hài lòng" },
  ];

  // Initialize form with existing note data when editing
  useEffect(() => {
    if (existingNote) {
      setSelectedMood(existingNote.mood || "");
      // Separate existing images from new ones
      if (existingNote.images && existingNote.images.length > 0) {
        setExistingImageUrls(existingNote.images);
      }
    } else {
      // Reset when creating new note
      setExistingImageUrls([]);
      setImages([]);
      setPreviewUrls([]);
      setSelectedMood("");
    }
  }, [existingNote]);

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
  };

  // Drag & Drop handlers
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

  const onFormSubmit = async (data: LocationNoteFormData) => {
    try {
      setIsUploadingImages(true);

      if (existingNote) {
        // EDITING EXISTING NOTE - use current workflow
        setUploadProgress("Đang xử lý ảnh...");

        // Handle images: combine existing images with new ones
        const imageUrls: string[] = [];

        // Include existing images that weren't removed
        for (const existingImage of existingImageUrls) {
          if (typeof existingImage === "string") {
            imageUrls.push(existingImage);
          }
        }

        // Upload new images to ShareVoucher API
        if (images.length > 0) {
          setUploadProgress(`Đang upload ${images.length} ảnh...`);
          console.log(
            `📤 Uploading ${images.length} images to ShareVoucher API`
          );

          const uploadResults = await uploadMultipleImages(
            images,
            existingNote.id // Use existing note ID
          );

          let successCount = 0;
          for (const result of uploadResults) {
            if (result.success && result.url) {
              imageUrls.push(result.url);
              successCount++;
              console.log(`✅ Successfully uploaded image: ${result.url}`);
            } else {
              console.error(`❌ Failed to upload image: ${result.error}`);
            }
          }

          console.log(
            `📊 Upload summary: ${successCount}/${images.length} images uploaded successfully`
          );
          setUploadProgress(
            `Đã upload ${successCount}/${images.length} ảnh thành công`
          );

          // Brief delay to show the progress message
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        setUploadProgress("Đang cập nhật ghi chú...");

        onSubmit({
          ...data,
          id: existingNote.id,
          mood: selectedMood as
            | "😊"
            | "😍"
            | "😎"
            | "🤔"
            | "😴"
            | "😋"
            | "🥳"
            | "😤"
            | undefined,
          lng: location.lng,
          lat: location.lat,
          address: location.address || "",
          timestamp: new Date(),
          images: imageUrls,
        });
      } else {
        // NEW NOTE CREATION - use new workflow
        setUploadProgress("Đang tạo ghi chú...");
        console.log("� Creating new note with new workflow");

        // Step 1: Create note first (without images)
        const noteResponse = await fetch("/api/location-notes", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lng: location.lng,
            lat: location.lat,
            address: location.address || "",
            content: data.content,
            mood: selectedMood,
          }),
        });

        if (!noteResponse.ok) {
          const errorData = await noteResponse.json();
          throw new Error(errorData.error || "Failed to create note");
        }

        const createdNote = await noteResponse.json();
        console.log("✅ Note created successfully:", createdNote);

        // Step 2: Upload images with noteId (if any)
        const imageUrls: string[] = [];
        if (images.length > 0) {
          setUploadProgress(`Đang upload ${images.length} ảnh...`);
          console.log(
            `📤 Uploading ${images.length} images with noteId: ${createdNote.id}`
          );

          const uploadResults = await uploadMultipleImages(
            images,
            createdNote.id // Use the newly created note ID
          );

          let successCount = 0;
          for (const result of uploadResults) {
            if (result.success && result.url) {
              imageUrls.push(result.url);
              successCount++;
              console.log(`✅ Successfully uploaded image: ${result.url}`);
            } else {
              console.error(`❌ Failed to upload image: ${result.error}`);
            }
          }

          console.log(
            `📊 Upload summary: ${successCount}/${images.length} images uploaded successfully`
          );
          setUploadProgress(
            `Đã upload ${successCount}/${images.length} ảnh thành công`
          );

          // Brief delay to show the progress message
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        setUploadProgress("Hoàn tất...");

        // Step 3: Call parent onSubmit with the final data
        onSubmit({
          ...data,
          id: createdNote.id,
          mood: selectedMood as
            | "😊"
            | "😍"
            | "😎"
            | "🤔"
            | "😴"
            | "😋"
            | "🥳"
            | "😤"
            | undefined,
          lng: location.lng,
          lat: location.lat,
          address: location.address || "",
          timestamp: new Date(),
          images: imageUrls,
        });
      }

      // Reset form
      reset();
      setImages([]);
      setPreviewUrls([]);
      setExistingImageUrls([]);
      setSelectedMood("");
      onClose();
    } catch (error) {
      console.error("Error submitting form:", error);
      setUploadProgress("Có lỗi xảy ra khi xử lý");
      // You could show user notification here
    } finally {
      setIsUploadingImages(false);
      setUploadProgress("");
    }
  };

  const handleClose = () => {
    reset();
    setImages([]);
    previewUrls.forEach((url) => URL.revokeObjectURL(url));
    setPreviewUrls([]);
    setExistingImageUrls([]);
    setSelectedMood("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden p-0">
        {/* DialogTitle for accessibility - visually hidden */}
        <DialogTitle className="sr-only">
          {existingNote
            ? "Chỉnh sửa ghi chú tại địa điểm"
            : "Thêm ghi chú tại địa điểm"}
        </DialogTitle>

        {/* Simplified Header */}
        <div className="bg-gray-50 border-b border-gray-100 p-4 mb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">
                {existingNote ? "Chỉnh sửa ghi chú" : "Thêm ghi chú"}
              </h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    {new Date(
                      existingNote?.visitTime || new Date()
                    ).toLocaleDateString("vi-VN", {
                      weekday: "short",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm line-clamp-2">
                    {location.address || "Không xác định được địa chỉ"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <form
          onSubmit={handleSubmit(onFormSubmit)}
          className="px-4 space-y-4 overflow-y-auto max-h-[70vh]"
        >
          {/* Place Name */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Tên địa điểm *
            </Label>
            <Input
              {...register("placeName")}
              placeholder="VD: Cafe The Coffee Bean, Nhà hàng Madame Hiền..."
              className="border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-lg"
            />
            {errors.placeName && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                {errors.placeName.message}
              </p>
            )}
          </div>

          {/* Visit Time */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Thời gian thăm *
            </Label>
            <Input
              type="datetime-local"
              {...register("visitTime")}
              className="border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-lg"
            />
            {errors.visitTime && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <span>⚠️</span>
                {errors.visitTime.message}
              </p>
            )}
          </div>

          {/* Mood Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">
              Tâm trạng
            </Label>
            <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
              {moods.map((mood) => (
                <button
                  key={mood.emoji}
                  type="button"
                  onClick={() => setSelectedMood(mood.emoji)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                    selectedMood === mood.emoji
                      ? "border-blue-400 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300 bg-white"
                  }`}
                  title={mood.label}
                >
                  <div className="text-xl mb-1">{mood.emoji}</div>
                  <div
                    className={`text-xs font-medium ${
                      selectedMood === mood.emoji
                        ? "text-blue-700"
                        : "text-gray-600"
                    }`}
                  >
                    {mood.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label className="text-sm font-medium text-gray-700">
              Nội dung ghi chú *
            </Label>
            <Textarea
              {...register("content")}
              placeholder="Bạn đang nghĩ gì? Cảm xúc như thế nào? Có gì đặc biệt tại đây không?

Ví dụ:
• Đang ngồi café với bạn bè, không gian rất chill
• Món ăn ở đây ngon quá, nhất định phải quay lại  
• View từ đây nhìn xuống phố đi bộ rất đẹp..."
              rows={5}
              className="resize-none border-gray-200 focus:border-blue-300 focus:ring-2 focus:ring-blue-100 rounded-lg"
            />
            {errors.content && (
              <p className="text-sm text-red-600 flex items-center gap-2">
                <span>⚠️</span>
                {errors.content.message}
              </p>
            )}
          </div>

          {/* Images Section */}
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Camera className="h-4 w-4" />
              <span>Hình ảnh</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                {existingImageUrls.length + images.length}/3
              </span>
            </Label>

            <input
              type="file"
              id="images"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            {/* Upload Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-4 transition-all duration-200 ${
                dragActive
                  ? "border-blue-400 bg-blue-50"
                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="text-center">
                <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("images")?.click()}
                  className="border-gray-200 text-gray-700 hover:bg-gray-50"
                  disabled={existingImageUrls.length + images.length >= 3}
                >
                  {images.length > 0
                    ? `Đã chọn ${images.length} ảnh mới`
                    : "Chọn ảnh"}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  Kéo thả hoặc click để thêm ảnh (tối đa 3 ảnh)
                </p>
              </div>
            </div>

            {/* Existing Images */}
            {existingImageUrls.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Ảnh hiện có:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {existingImageUrls.map((url, index) => (
                    <div
                      key={`existing-image-${existingNote?.id || "unknown"}-${index}`}
                      className="group relative aspect-square bg-gray-100 rounded-lg border overflow-hidden cursor-pointer"
                      onClick={() => openLightbox(existingImageUrls, index)}
                    >
                      {isValidImageUrl(url) ? (
                        <>
                          <ImageDisplay
                            src={url}
                            alt={`Ảnh hiện có ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeExistingImage(index);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-500">
                          <div className="text-center">
                            <div className="text-2xl mb-1">📷</div>
                            <div className="text-xs">Ảnh lỗi</div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images Previews */}
            {previewUrls.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Ảnh mới:
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {previewUrls.map((url, index) => (
                    <div
                      key={`new-image-${url}-${index}`}
                      className="group relative aspect-square bg-gray-100 rounded-lg border overflow-hidden cursor-pointer"
                      onClick={() => openLightbox(previewUrls, index)}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={url}
                        alt={`Ảnh mới ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-1 -right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeNewImage(index);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-100 px-4 pb-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1 border-gray-200 text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploadingImages}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploadingImages ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {(() => {
                if (isUploadingImages && uploadProgress) return uploadProgress;
                if (isSubmitting) return "Đang lưu...";
                if (existingNote) return "Cập nhật";
                return "Lưu ghi chú";
              })()}
            </Button>
          </div>
        </form>

        {/* Image Lightbox */}
        <ImageLightbox
          images={lightboxImages}
          initialIndex={lightboxIndex}
          isOpen={showLightbox}
          onClose={() => setShowLightbox(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
