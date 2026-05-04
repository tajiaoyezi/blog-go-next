"use client";

import Image from "next/image";
import { ImageIcon, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Album {
  id: number;
  albumName: string;
  albumDesc: string;
  albumCover: string;
  photoCount: number;
  status: number;
  createTime: string;
}

interface AlbumCardProps {
  album: Album;
  onClick?: (album: Album) => void;
  onEdit?: (album: Album) => void;
  onDelete?: (album: Album) => void;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: (id: number, selected: boolean) => void;
}

export function AlbumCard({
  album,
  onClick,
  onEdit,
  onDelete,
  selectable,
  selected,
  onSelect,
}: AlbumCardProps) {
  return (
    <div
      role="button"
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-card transition-all hover:shadow-md",
        selectable && "cursor-default"
      )}
      onClick={() => onClick?.(album)}
    >
      {/* Selection Checkbox */}
      {selectable && (
        <div className="absolute left-2 top-2 z-10">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect?.(album.id, e.target.checked)}
            onClick={(e) => e.stopPropagation()}
            className="size-4 cursor-pointer"
          />
        </div>
      )}

      {/* Cover Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {album.albumCover ? (
          <Image
            src={album.albumCover}
            alt={album.albumName}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <ImageIcon className="size-10 text-muted-foreground/40" />
          </div>
        )}

        {/* Hover Actions */}
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          {onEdit && (
            <button
              type="button"
              aria-label="编辑"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(album);
              }}
              className="rounded-full bg-white/90 p-2 text-foreground transition-colors hover:bg-white"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {onDelete && (
            <button
              type="button"
              aria-label="删除"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(album);
              }}
              className="rounded-full bg-white/90 p-2 text-destructive transition-colors hover:bg-white"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="truncate font-medium">{album.albumName}</h3>
        <p className="text-sm text-muted-foreground">
          {album.photoCount} 张图片
        </p>
      </div>
    </div>
  );
}
