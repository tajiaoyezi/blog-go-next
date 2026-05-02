"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";
import {
  ArrowLeft,
  Upload,
  Trash2,
  ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Photo {
  id: number;
  albumId: number;
  photoName: string;
  photoDesc: string;
  photoSrc: string;
  isDelete: boolean;
  createTime: string;
  updateTime: string;
}

interface Album {
  id: number;
  albumName: string;
  albumDesc: string;
  albumCover: string;
  photoCount: number;
}

interface PageResult<T> {
  records: T[];
  count: number;
  current: number;
  size: number;
}

export default function AlbumDetailPage() {
  const params = useParams();
  const router = useRouter();
  const albumId = Number(params.id);

  const [album, setAlbum] = useState<Album | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [previewIndex, setPreviewIndex] = useState<number | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<"single" | "batch" | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchAlbum = useCallback(async () => {
    try {
      const res = await api.get<Album[]>("/admin/albums");
      if (res.flag) {
        const found = res.data.find((a) => a.id === albumId);
        if (found) setAlbum(found);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载相册失败");
    }
  }, [albumId]);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PageResult<Photo>>(
        `/admin/albums/${albumId}/photos?current=1&size=1000`
      );
      if (res.flag) {
        setPhotos(res.data.records);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载照片失败");
    } finally {
      setLoading(false);
    }
  }, [albumId]);

  useEffect(() => {
    if (albumId) {
      fetchAlbum();
      fetchPhotos();
    }
  }, [albumId, fetchAlbum, fetchPhotos]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const imageFiles = Array.from(files).filter((f) =>
      f.type.startsWith("image/")
    );
    if (imageFiles.length === 0) {
      toast.error("请选择图片文件");
      return;
    }

    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of imageFiles) {
        const res = await api.upload<string>("/admin/articles/images", file);
        if (res.flag && res.data) {
          urls.push(res.data);
        } else {
          toast.error(`${file.name} 上传失败: ${res.message}`);
        }
      }

      if (urls.length > 0) {
        const saveRes = await api.post("/admin/photos", {
          albumId,
          photoUrlList: urls,
        });
        if (saveRes.flag) {
          toast.success(`成功上传 ${urls.length} 张照片`);
          fetchPhotos();
          fetchAlbum();
        } else {
          toast.error(saveRes.message);
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "上传失败");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    setDeleteTarget("batch");
    setDeleteDialogOpen(true);
  };

  const handleDeletePhoto = (id: number) => {
    setPendingDeleteId(id);
    setDeleteTarget("single");
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      let res;
      if (deleteTarget === "batch") {
        res = await api.delete("/admin/photos", Array.from(selectedIds));
      } else if (deleteTarget === "single" && pendingDeleteId) {
        res = await api.delete("/admin/photos", [pendingDeleteId]);
      }

      if (res?.flag) {
        toast.success("删除成功");
        setSelectedIds(new Set());
        fetchPhotos();
        fetchAlbum();
      } else {
        toast.error(res?.message || "删除失败");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "删除失败");
    } finally {
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
      setPendingDeleteId(null);
    }
  };

  const openPreview = (index: number) => setPreviewIndex(index);
  const closePreview = () => setPreviewIndex(null);
  const prevPhoto = () =>
    setPreviewIndex((i) =>
      i === null || i <= 0 ? photos.length - 1 : i - 1
    );
  const nextPhoto = () =>
    setPreviewIndex((i) =>
      i === null || i >= photos.length - 1 ? 0 : i + 1
    );

  if (!album && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">相册不存在</p>
        <Button variant="outline" onClick={() => router.push("/admin/albums")}>
          <ArrowLeft className="mr-1 size-4" />
          返回相册列表
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/admin/albums")}
          >
            <ArrowLeft className="mr-1 size-4" />
            返回
          </Button>
          <div>
            <h1 className="text-xl font-semibold">
              {album?.albumName || "相册详情"}
            </h1>
            {album?.albumDesc && (
              <p className="text-sm text-muted-foreground">
                {album.albumDesc}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="mr-1 size-4" />
              删除选中 ({selectedIds.size})
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            size="sm"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mr-1 size-4" />
            {uploading ? "上传中..." : "上传照片"}
          </Button>
        </div>
      </div>

      {/* 照片网格 */}
      {loading ? (
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          加载中...
        </div>
      ) : photos.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
          <ImageIcon className="size-12 opacity-40" />
          <p>暂无照片，点击「上传照片」添加</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {photos.map((photo, index) => (
            <Card
              key={photo.id}
              className={`overflow-hidden group cursor-pointer relative ${
                selectedIds.has(photo.id)
                  ? "ring-2 ring-primary ring-offset-2"
                  : ""
              }`}
              onClick={() => openPreview(index)}
            >
              <div className="relative aspect-square bg-muted">
                <Image
                  src={photo.photoSrc}
                  alt={photo.photoName || "照片"}
                  fill
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 16vw"
                  className="object-cover"
                  loading="lazy"
                />
                {/* 悬停遮罩 */}
                <div
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    className="size-8"
                    onClick={() => toggleSelect(photo.id)}
                  >
                    {selectedIds.has(photo.id) ? (
                      <X className="size-4" />
                    ) : (
                      <div className="size-4 rounded-sm border-2 border-current" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    className="size-8"
                    onClick={() => handleDeletePhoto(photo.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* 大图预览 */}
      {previewIndex !== null && photos[previewIndex] && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closePreview}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={closePreview}
          >
            <X className="size-6" />
          </Button>

          {photos.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  prevPhoto();
                }}
              >
                <ChevronLeft className="size-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  nextPhoto();
                }}
              >
                <ChevronRight className="size-8" />
              </Button>
            </>
          )}

          <div
            className="relative max-w-[90vw] max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={photos[previewIndex].photoSrc}
              alt={photos[previewIndex].photoName || "预览"}
              width={1200}
              height={800}
              className="object-contain max-w-[90vw] max-h-[90vh]"
              priority
            />
          </div>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
            {previewIndex + 1} / {photos.length}
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              确认删除
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget === "batch"
              ? `确定要删除选中的 ${selectedIds.size} 张照片吗？此操作不可恢复。`
              : "确定要删除这张照片吗？此操作不可恢复。"}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDelete}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
