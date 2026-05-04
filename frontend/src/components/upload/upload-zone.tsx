"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFilesDrop: (files: FileList) => void;
  disabled?: boolean;
  accept?: string;
}

export function UploadZone({
  onFilesDrop,
  disabled,
  accept = "image/jpeg,image/png,image/gif,image/webp",
}: UploadZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!disabled) setIsDragActive(true);
    },
    [disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      if (!disabled && e.dataTransfer.files.length > 0) {
        onFilesDrop(e.dataTransfer.files);
      }
    },
    [disabled, onFilesDrop]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        onFilesDrop(e.target.files);
      }
    },
    [onFilesDrop]
  );

  return (
    <div
      className={cn(
        "relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-muted-foreground/25 hover:border-muted-foreground/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        className="hidden"
        onChange={handleChange}
        disabled={disabled}
      />

      <Upload className="mb-2 size-8 text-muted-foreground" />
      <p className="text-sm font-medium">拖拽图片到这里上传</p>
      <p className="text-xs text-muted-foreground">或点击选择文件</p>
      <p className="mt-2 text-xs text-muted-foreground">
        支持格式: JPG, PNG, GIF, WebP
      </p>
    </div>
  );
}
