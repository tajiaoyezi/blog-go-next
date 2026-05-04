"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Plus, Pencil, Trash2 } from "lucide-react";
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

interface Tag {
  id: number;
  tagName: string;
  articleCount: number;
  createTime: string;
}

interface TagListResponse {
  records: Tag[];
}

type TagApiResponse = Tag[] | TagListResponse;

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<TagApiResponse>("/admin/tags");
      if (res.flag) {
        const data = res.data;
        if (Array.isArray(data)) {
          setTags(data);
        } else {
          setTags(data.records);
        }
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

  const openCreate = () => {
    setEditingId(null);
    setName("");
    setDialogOpen(true);
  };

  const openEdit = useCallback((tag: Tag) => {
    setEditingId(tag.id);
    setName(tag.tagName);
    setDialogOpen(true);
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("请输入标签名称");
      return;
    }
    try {
      const payload = { id: editingId, tagName: name };
      const res = await api.post("/admin/tags", payload);
      if (res.flag) {
        toast.success(editingId ? "修改成功" : "添加成功");
        setDialogOpen(false);
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
      const res = await api.delete("/admin/tags", [pendingDeleteId]);
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

  const totalPages = Math.ceil(tags.length / pageSize) || 1;

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const columns: ColumnDef<Tag>[] = useMemo(
    () => [
      {
        accessorKey: "tagName",
        header: "标签名称",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.tagName}</span>
        ),
      },
      {
        accessorKey: "articleCount",
        header: "文章数",
        enableSorting: true,
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
          const tag = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => openEdit(tag)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(tag.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [openEdit, handleDelete]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">标签管理</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          新增标签
        </Button>
      </div>

      {loading ? (
        <DataTableSkeleton columns={4} rows={5} />
      ) : tags.length === 0 ? (
        <EmptyState {...EmptyStates.tags} />
      ) : (
        <DataTable
          data={tags}
          columns={columns}
          pageCount={totalPages}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          sortable={true}
          filterable={true}
          loading={false}
          emptyTitle="暂无标签"
          emptyDescription="还没有创建任何标签"
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              确认删除
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要删除该标签吗？此操作不可恢复。
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

      {/* 新增/编辑弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "编辑标签" : "新增标签"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>标签名称</Label>
              <Input
                placeholder="请输入标签名称"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              取消
            </DialogClose>
            <Button onClick={handleSave}>确定</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
