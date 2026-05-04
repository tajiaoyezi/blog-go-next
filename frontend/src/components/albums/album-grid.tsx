"use client";

import { EmptyState, EmptyStates } from "@/components/ui/empty-state";
import { Album, AlbumCard } from "./album-card";

interface AlbumGridProps {
  albums: Album[];
  onAlbumClick?: (album: Album) => void;
  onEdit?: (album: Album) => void;
  onDelete?: (album: Album) => void;
  selectable?: boolean;
  selectedIds?: number[];
  onSelect?: (id: number, selected: boolean) => void;
}

export function AlbumGrid({
  albums,
  onAlbumClick,
  onEdit,
  onDelete,
  selectable,
  selectedIds = [],
  onSelect,
}: AlbumGridProps) {
  if (albums.length === 0) {
    return <EmptyState {...EmptyStates.albums} />;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {albums.map((album) => (
        <AlbumCard
          key={album.id}
          album={album}
          onClick={onAlbumClick}
          onEdit={onEdit}
          onDelete={onDelete}
          selectable={selectable}
          selected={selectedIds.includes(album.id)}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

export type { Album };
