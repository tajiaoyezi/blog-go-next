"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import Image from "next/image";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, ImageIcon, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { EmptyState, EmptyStates } from "@/components/ui/empty-state";
import { AlbumGrid } from "@/components/albums/album-grid";
import { ViewToggle, getSavedViewMode, type ViewMode } from "@/components/albums/view-toggle";

interface Album {
  id: number;
  albumName: string;
  albumDesc: string;
  albumCover: string;
  photoCount: number;
  status: number;
  createTime: string;
}

const STATUS_MAP: Record<
  number,
  { label: string; variant: "outline" | "secondary" }
> = {
  1: { label: "公开", variant: "outline" },
  2: { label: "私密", variant: "secondary" },
};

export default function AlbumsPage() {
  const router = useRouter();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    albumName: "",
    albumDesc: "",
    albumCover: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Load saved view mode on client
  useEffect(() => {
    setViewMode(getSavedViewMode());
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<Album[]>("/admin/albums");
      if (res.flag) {
        setAlbums(res.data);
      }
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

  const handleDelete = useCallback((id: number) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  }, []);

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

  const totalPages = Math.ceil(albums.length / pageSize) || 1;

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const columns: ColumnDef<Album>[] = useMemo(
    () => [
      {
        accessorKey: "albumCover",
        header: "封面",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="relative h-10 w-16 overflow-hidden rounded bg-muted">
            {row.original.albumCover ? (
              <Image
                src={row.original.albumCover}
                alt={row.original.albumName}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <ImageIcon className="size-4 text-muted-foreground/40" />
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "albumName",
        header: "相册名称",
        enableSorting: true,
        cell: ({ row }) => (
          <span
            className="cursor-pointer font-medium hover:text-primary"
            onClick={() => router.push(`/admin/albums/${row.original.id}`)}
          >
            {row.original.albumName}
          </span>
        ),
      },
      {
        accessorKey: "albumDesc",
        header: "描述",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="line-clamp-1 max-w-[200px] text-muted-foreground">
            {row.original.albumDesc || "-"}
          </span>
        ),
      },
      {
        accessorKey: "photoCount",
        header: "照片数",
        enableSorting: true,
      },
      {
        accessorKey: "status",
        header: "状态",
        enableSorting: false,
        cell: ({ row }) => {
          const status = STATUS_MAP[row.original.status];
          return (
            <Badge variant={status?.variant || "outline"}>
              {status?.label || "未知"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "createTime",
        header: "创建时间",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.createTime}
          </span>
        ),
      },
      {
        id: "actions",
        header: "操作",
        enableSorting: false,
        size: 120,
        cell: ({ row }) => {
          const album = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => router.push(`/admin/albums/${album.id}`)}
              >
                <ArrowRight className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(album.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, handleDelete]
  );

  const renderContent = () => {
    if (loading) {
      return viewMode === "grid" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[4/3] animate-pulse rounded-lg bg-muted"
            />
          ))}
        </div>
      ) : (
        <DataTableSkeleton columns={7} rows={5} />
      );
    }

    if (albums.length === 0) {
      return <EmptyState {...EmptyStates.albums} />;
    }

    if (viewMode === "grid") {
      return (
        <AlbumGrid
          albums={albums}
          onAlbumClick={(album) => router.push(`/admin/albums/${album.id}`)}
          onDelete={(album) => handleDelete(album.id)}
        />
      );
    }

    return (
      <DataTable
        data={albums}
        columns={columns}
        pageCount={totalPages}
        pageSize={pageSize}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={handlePageSizeChange}
        sortable={true}
        filterable={true}
        loading={false}
        emptyTitle="暂无相册"
        emptyDescription="还没有创建任何相册"
      />
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">相册管理</h1>
        <div className="flex items-center gap-2">
          <ViewToggle view={viewMode} onChange={setViewMode} />
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-1 size-4" />
            新建相册
          </Button>
        </div>
      </div>

      {renderContent()}

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
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
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
