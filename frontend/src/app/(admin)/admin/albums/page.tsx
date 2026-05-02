"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import Image from "next/image";
import { Plus, Trash2, ImageIcon, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";

interface Album {
  id: number;
  albumName: string;
  albumDesc: string;
  albumCover: string;
  photoCount: number;
  status: number;
  createTime: string;
}

export default function AlbumsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ albumName: "", albumDesc: "", albumCover: "" });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Album[]>("/admin/albums");
      if (res.flag) setAlbums(res.data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = async () => {
    if (!form.albumName.trim()) {
      toast.error("请输入相册名称");
      return;
    }
    try {
      const res = await api.post("/admin/albums", { ...form, status: 1 });
      if (res.flag) {
        toast.success("创建成功");
        setDialogOpen(false);
        setForm({ albumName: "", albumDesc: "", albumCover: "" });
        fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  const handleDelete = async (id: number) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      const res = await api.delete(`/admin/albums/${pendingDeleteId}`);
      if (res.flag) {
        toast.success("删除成功");
        fetchData();
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    } finally {
      setDeleteDialogOpen(false);
      setPendingDeleteId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">相册管理</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 size-4" />
          新建相册
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24 text-muted-foreground">
          加载中...
        </div>
      ) : albums.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-muted-foreground">
          暂无相册
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {albums.map((album) => (
            <Card
              key={album.id}
              className="overflow-hidden group cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/admin/albums/${album.id}`)}
            >
              <div className="relative aspect-video bg-muted">
                {album.albumCover ? (
                  <Image
                    src={album.albumCover}
                    alt={album.albumName}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="size-10 text-muted-foreground/40" />
                  </div>
                )}
                {/* 悬停时显示操作按钮 */}
                <div
                  className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push(`/admin/albums/${album.id}`)}
                  >
                    <ArrowRight className="mr-1 size-4" />
                    查看
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(album.id)}
                  >
                    <Trash2 className="mr-1 size-4" />
                    删除
                  </Button>
                </div>
              </div>
              <CardContent className="pt-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-sm truncate">
                    {album.albumName}
                  </h3>
                  <span className="text-xs text-muted-foreground">
                    {album.photoCount} 张
                  </span>
                </div>
                {album.albumDesc && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {album.albumDesc}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 新建相册弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>新建相册</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>相册名称</Label>
              <Input
                placeholder="请输入相册名称"
                value={form.albumName}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, albumName: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>相册描述</Label>
              <Textarea
                placeholder="请输入相册描述"
                rows={2}
                value={form.albumDesc}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, albumDesc: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>封面图片 URL</Label>
              <Input
                placeholder="请输入封面图片地址"
                value={form.albumCover}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, albumCover: e.target.value }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              取消
            </DialogClose>
            <Button onClick={handleCreate}>创建</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
            确定要删除该相册吗？相册内的照片也将被一并删除，此操作不可恢复。
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
