"use client";

import React, { useState, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Upload, X, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageFile {
  file: File;
  id: string;
  preview: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  url?: string;
}

interface ImageUploaderProps {
  onUpload: (files: File[]) => Promise<string[]>;
  onInsert: (urls: string[]) => void;
  maxFiles?: number;
  maxSize?: number; // MB
  accept?: string[];
}

const DEFAULT_ACCEPT = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export function ImageUploader({
  onUpload,
  onInsert,
  maxFiles = 10,
  maxSize = 5,
  accept = DEFAULT_ACCEPT,
}: ImageUploaderProps) {
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!accept.includes(file.type)) {
        return `不支持的格式: ${file.type}`;
      }
      if (file.size > maxSize * 1024 * 1024) {
        return `文件过大: ${(file.size / 1024 / 1024).toFixed(1)}MB > ${maxSize}MB`;
      }
      return null;
    },
    [accept, maxSize]
  );

  const addFiles = useCallback(
    (newFiles: FileList | null) => {
      if (!newFiles) return;

      const fileArray = Array.from(newFiles);
      if (fileArray.length + files.length > maxFiles) {
        toast.error(`最多上传 ${maxFiles} 张图片`);
        return;
      }

      const newImageFiles: ImageFile[] = [];
      for (const file of fileArray) {
        const error = validateFile(file);
        if (error) {
          toast.error(error);
          continue;
        }

        newImageFiles.push({
          file,
          id: Math.random().toString(36).slice(2),
          preview: URL.createObjectURL(file),
          progress: 0,
          status: "pending",
        });
      }

      setFiles((prev) => [...prev, ...newImageFiles]);
    },
    [files.length, maxFiles, validateFile]
  );

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((f) => f.id !== id);
    });
  }, []);

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;
    if (isUploading) return;

    setIsUploading(true);
    const pendingFiles = files.filter((f) => f.status === "pending");

    try {
      const urls = await onUpload(pendingFiles.map((f) => f.file));

      setFiles((prev) => {
        const updated = [...prev];
        pendingFiles.forEach((file, index) => {
          const idx = updated.findIndex((f) => f.id === file.id);
          if (idx !== -1 && urls[index]) {
            updated[idx] = { ...updated[idx], status: "done", url: urls[index], progress: 100 };
          }
        });
        return updated;
      });

      onInsert(urls.filter(Boolean));
      toast.success(`成功上传 ${urls.length} 张图片`);

      // Clear after a delay
      setTimeout(() => {
        setFiles((prev) => {
          prev.forEach((f) => URL.revokeObjectURL(f.preview));
          return [];
        });
      }, 2000);
    } catch (err) {
      toast.error("上传失败: " + (err instanceof Error ? err.message : "未知错误"));
      setFiles((prev) =>
        prev.map((f) =>
          f.status === "pending" ? { ...f, status: "error", error: "上传失败" } : f
        )
      );
    } finally {
      setIsUploading(false);
    }
  }, [files, isUploading, onUpload, onInsert]);

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
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  return (
    <div className="space-y-3">
      {files.length === 0 ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 px-6 py-8 transition-colors",
            isDragging && "border-primary bg-primary/5"
          )}
        >
          <ImagePlus className="mb-2 size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            拖拽图片到此处，或{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-primary hover:underline"
            >
              点击上传
            </button>
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            支持 JPG、PNG、GIF、WEBP，单张不超过 {maxSize}MB
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-4 gap-2">
            {files.map((file) => (
              <div key={file.id} className="relative aspect-square rounded-md border bg-muted overflow-hidden">
                <img
                  src={file.preview}
                  alt={file.file.name}
                  className="h-full w-full object-cover"
                />
                {file.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <div className="w-12 h-1 bg-white/30 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-white transition-all duration-300" 
                        style={{ width: `${file.progress}%` }} 
                      />
                    </div>
                  </div>
                )}
                {file.status === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-destructive/80 text-destructive-foreground text-xs">
                    {file.error}
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 group-hover:opacity-100"
                  style={{ opacity: 1 }}
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleUpload}
              disabled={isUploading || files.every((f) => f.status !== "pending")}
            >
              <Upload className="mr-1 size-4" />
              {isUploading ? "上传中..." : "上传"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                files.forEach((f) => URL.revokeObjectURL(f.preview));
                setFiles([]);
              }}
              disabled={isUploading}
            >
              清空
            </Button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept.join(",")}
        multiple
        className="sr-only"
        onChange={(e) => addFiles(e.target.files)}
      />
    </div>
  );
}
