"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { X, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface CoverImageUploaderProps {
  value: string;
  onChange: (url: string) => void;
  onUpload: (file: File) => Promise<string>;
  maxSize?: number; // MB
}

export function CoverImageUploader({
  value,
  onChange,
  onUpload,
  maxSize = 5,
}: CoverImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!file.type.startsWith("image/")) {
        return "请选择图片文件";
      }
      if (file.size > maxSize * 1024 * 1024) {
        return `文件过大: ${(file.size / 1024 / 1024).toFixed(1)}MB > ${maxSize}MB`;
      }
      return null;
    },
    [maxSize]
  );

  const handleUpload = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }

      setIsUploading(true);
      try {
        const url = await onUpload(file);
        onChange(url);
        toast.success("封面图上传成功");
      } catch (err) {
        toast.error("上传失败: " + (err instanceof Error ? err.message : "未知错误"));
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, onChange, validateFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      e.target.value = "";
    },
    [handleUpload]
  );

  if (value) {
    return (
      <div className="relative aspect-video max-w-md overflow-hidden rounded-lg border">
        <img
          src={value}
          alt="封面图"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => inputRef.current?.click()}
              disabled={isUploading}
            >
              更换
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              onClick={() => onChange("")}
            >
              <X className="mr-1 size-4" />
              删除
            </Button>
          </div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-8 transition-colors cursor-pointer max-w-md aspect-video",
        isDragging && "border-primary bg-primary/5"
      )}
      onClick={() => inputRef.current?.click()}
    >
      <ImagePlus className="mb-2 size-8 text-muted-foreground" />
      <p className="text-sm text-muted-foreground">
        {isUploading ? "上传中..." : "拖拽封面图到此处，或点击上传"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        建议尺寸 1200x630，不超过 {maxSize}MB
      </p>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}
