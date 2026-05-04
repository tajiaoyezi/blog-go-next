"use client";

import Image from "next/image";
import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, EmptyStates } from "@/components/ui/empty-state";

export interface Photo {
  id: number;
  photoSrc: string;
  photoName: string;
  photoDesc: string;
  createTime: string;
}

interface MasonryGalleryProps {
  photos: Photo[];
  onPhotoClick?: (photo: Photo, index: number) => void;
  selectable?: boolean;
  selectedIds?: number[];
  onSelect?: (id: number, selected: boolean) => void;
  loading?: boolean;
}

export function MasonryGallery({
  photos,
  onPhotoClick,
  selectable,
  selectedIds = [],
  onSelect,
  loading,
}: MasonryGalleryProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="relative aspect-[4/3] overflow-hidden rounded-lg">
            <Skeleton className="absolute inset-0" />
          </div>
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return <EmptyState title="暂无照片" description="该相册还没有照片" />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className={cn(
            "group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md",
            selectable && "cursor-default"
          )}
        >
          {/* Selection Checkbox */}
          {selectable && (
            <div className="absolute left-2 top-2 z-10">
              <input
                type="checkbox"
                checked={selectedIds.includes(photo.id)}
                onChange={(e) => onSelect?.(photo.id, e.target.checked)}
                onClick={(e) => e.stopPropagation()}
                className="size-4 cursor-pointer"
              />
            </div>
          )}

          {/* Photo */}
          <div
            className="relative aspect-[4/3] cursor-pointer overflow-hidden bg-muted"
            onClick={() => onPhotoClick?.(photo, index)}
          >
            {photo.photoSrc ? (
              <Image
                src={photo.photoSrc}
                alt={photo.photoName}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform group-hover:scale-105"
                loading={index < 3 ? "eager" : "lazy"}
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="size-10 text-muted-foreground/40" />
              </div>
            )}

            {/* Hover Overlay */}
            <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100">
              <div className="w-full p-3">
                <p className="truncate text-sm text-white">{photo.photoName}</p>
                <p className="text-xs text-white/70">{photo.createTime}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
