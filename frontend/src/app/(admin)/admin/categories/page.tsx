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

interface Category {
  id: number;
  categoryName: string;
  articleCount: number;
  createTime: string;
}

interface CategoryListResponse {
  records: Category[];
}

type CategoryApiResponse = Category[] | CategoryListResponse;

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
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
      const res = await api.get<CategoryApiResponse>("/admin/categories");
      if (res.flag) {
        const data = res.data;
        if (Array.isArray(data)) {
          setCategories(data);
        } else {
          setCategories(data.records);
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

  const openEdit = useCallback((cat: Category) => {
    setEditingId(cat.id);
    setName(cat.categoryName);
    setDialogOpen(true);
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("请输入分类名称");
      return;
    }
    try {
      const payload = { id: editingId, categoryName: name };
      const res = await api.post("/admin/categories", payload);
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
      const res = await api.delete("/admin/categories", [pendingDeleteId]);
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

  const totalPages = Math.ceil(categories.length / pageSize) || 1;

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  }, []);

  const columns: ColumnDef<Category>[] = useMemo(
    () => [
      {
        accessorKey: "categoryName",
        header: "分类名称",
        enableSorting: true,
        cell: ({ row }) => (
          <span className="font-medium">{row.original.categoryName}</span>
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
          const cat = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => openEdit(cat)}
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete(cat.id)}
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
        <h1 className="text-xl font-semibold">分类管理</h1>
        <Button onClick={openCreate}>
          <Plus className="mr-1 size-4" />
          新增分类
        </Button>
      </div>

      {loading ? (
        <DataTableSkeleton columns={4} rows={5} />
      ) : categories.length === 0 ? (
        <EmptyState {...EmptyStates.categories} />
      ) : (
        <DataTable
          data={categories}
          columns={columns}
          pageCount={totalPages}
          pageSize={pageSize}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
          onPageSizeChange={handlePageSizeChange}
          sortable={true}
          filterable={true}
          loading={false}
          emptyTitle="暂无分类"
          emptyDescription="还没有创建任何分类"
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
            确定要删除该分类吗？此操作不可恢复。
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
            <DialogTitle>{editingId ? "编辑分类" : "新增分类"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>分类名称</Label>
              <Input
                placeholder="请输入分类名称"
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
