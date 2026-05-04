"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { type ColumnDef } from "@tanstack/react-table";
import { api } from "@/lib/api";
import type { PageResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Pencil, Pin, Trash2, Plus, Filter } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTable } from "@/components/data-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { EmptyState, EmptyStates } from "@/components/ui/empty-state";

/* ==============================
 * 文章列表数据类型
 * ============================== */

interface Article {
  id: number;
  articleTitle: string;
  categoryName: string;
  tagNameList: string[];
  type: number;
  status: number;
  isTop: boolean;
  createTime: string;
}

interface Category {
  id: number;
  categoryName: string;
}

// 使用统一的后端分页类型（字段名为 count，不是 total）
type PageData = PageResult<Article>;

/* ==============================
 * 常量映射
 * ============================== */

const TYPE_MAP: Record<number, string> = {
  1: "原创",
  2: "转载",
  3: "翻译",
};

const STATUS_MAP: Record<number, { label: string; variant: "outline" | "secondary" | "default" }> = {
  1: { label: "公开", variant: "outline" },
  2: { label: "私密", variant: "secondary" },
  3: { label: "草稿", variant: "secondary" },
};

const TYPE_OPTIONS = [
  { value: "1", label: "原创" },
  { value: "2", label: "转载" },
  { value: "3", label: "翻译" },
];

const STATUS_OPTIONS = [
  { value: "1", label: "公开" },
  { value: "2", label: "私密" },
  { value: "3", label: "草稿" },
];

/* ==============================
 * 文章列表页面
 * ============================== */

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // 确认对话框状态
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  // 加载全部分类列表（用于筛选下拉）
  const [categoryOptions, setCategoryOptions] = useState<{ value: string; label: string }[]>([]);
  useEffect(() => {
    let cancelled = false;
    api.get<Category[] | { records: Category[] }>("/admin/categories")
      .then((res) => {
        if (cancelled) return;
        if (res.flag) {
          const data = res.data;
          const list = Array.isArray(data) ? data : data.records;
          setCategoryOptions(list.map((c) => ({ value: c.categoryName, label: c.categoryName })));
        }
      })
      .catch(() => {
        // 静默失败，不影响主列表
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchArticles = useCallback(async (page: number, size: number) => {
    setLoading(true);
    try {
      const res = await api.get<PageData>(
        `/admin/articles?current=${page}&size=${size}`,
      );
      if (res.flag) {
        setArticles(res.data.records);
        setCount(res.data.count);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArticles(current, pageSize);
  }, [current, pageSize, fetchArticles]);

  const handleDelete = useCallback((ids: number[]) => {
    const isBatch = ids.length > 1;
    setConfirmDialog({
      open: true,
      title: isBatch ? "确认批量删除" : "确认删除",
      description: isBatch
        ? `确定要删除选中的 ${ids.length} 篇文章吗？此操作不可恢复。`
        : "确定要删除该文章吗？此操作不可恢复。",
      onConfirm: async () => {
        try {
          const res = await api.delete("/admin/articles", ids);
          if (res.flag) {
            toast.success(isBatch ? "批量删除成功" : "删除成功");
            fetchArticles(current, pageSize);
          } else {
            toast.error(res.message);
          }
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "操作失败");
        } finally {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
        }
      },
    });
  }, [current, pageSize]);

  const handleToggleTop = useCallback(async (article: Article) => {
    try {
      const res = await api.put(`/admin/articles/top`, {
        id: article.id,
        isTop: !article.isTop,
      });
      if (res.flag) {
        toast.success(article.isTop ? "已取消置顶" : "已置顶");
        fetchArticles(current, pageSize);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  }, [current, pageSize]);

  const totalPages = Math.max(0, Math.ceil(count / pageSize));

  // 列配置
  const columns: ColumnDef<Article>[] = useMemo(
    () => [
      {
        accessorKey: "articleTitle",
        header: "标题",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate font-medium">
            {row.original.isTop && (
              <Pin className="mr-1 inline-block size-3 text-destructive" />
            )}
            {row.original.articleTitle}
          </div>
        ),
      },
      {
        accessorKey: "categoryName",
        header: ({ column }) => {
          const filterValue = column.getFilterValue() as string | undefined;
          return (
            <div className="flex items-center gap-1">
              分类
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={filterValue ? "text-primary" : ""}
                  >
                    <Filter className="size-3" />
                  </Button>
                } />
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => column.setFilterValue(undefined)}>
                    全部
                  </DropdownMenuItem>
                  {categoryOptions.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => column.setFilterValue(opt.value)}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableColumnFilter: true,
      },
      {
        accessorKey: "tagNameList",
        header: "标签",
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <div className="flex flex-wrap gap-1">
            {row.original.tagNameList?.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        ),
      },
      {
        accessorKey: "type",
        header: ({ column }) => {
          const filterValue = column.getFilterValue() as string | undefined;
          return (
            <div className="flex items-center gap-1">
              类型
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={filterValue ? "text-primary" : ""}
                  >
                    <Filter className="size-3" />
                  </Button>
                } />
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => column.setFilterValue(undefined)}>
                    全部
                  </DropdownMenuItem>
                  {TYPE_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => column.setFilterValue(opt.value)}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableColumnFilter: true,
        cell: ({ row }) => TYPE_MAP[row.original.type] || "未知",
      },
      {
        accessorKey: "status",
        header: ({ column }) => {
          const filterValue = column.getFilterValue() as string | undefined;
          return (
            <div className="flex items-center gap-1">
              状态
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className={filterValue ? "text-primary" : ""}
                  >
                    <Filter className="size-3" />
                  </Button>
                } />
                <DropdownMenuContent align="start">
                  <DropdownMenuItem onClick={() => column.setFilterValue(undefined)}>
                    全部
                  </DropdownMenuItem>
                  {STATUS_OPTIONS.map((opt) => (
                    <DropdownMenuItem
                      key={opt.value}
                      onClick={() => column.setFilterValue(opt.value)}
                    >
                      {opt.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableColumnFilter: true,
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
          <span className="text-muted-foreground">{row.original.createTime}</span>
        ),
      },
      {
        id: "actions",
        header: "操作",
        enableSorting: false,
        enableColumnFilter: false,
        size: 120,
        cell: ({ row }) => {
          const article = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() =>
                  router.push(`/admin/articles/editor?id=${article.id}`)
                }
              >
                <Pencil className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleToggleTop(article)}
              >
                <Pin
                  className={`size-4 ${article.isTop ? "text-destructive" : ""}`}
                />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete([article.id])}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [router, categoryOptions, handleDelete, handleToggleTop],
  );

  // 批量操作配置
  const batchActions = useMemo(
    () => [
      {
        label: "批量删除",
        onClick: (rows: Article[]) => {
          const ids = rows.map((row) => row.id);
          handleDelete(ids);
        },
        variant: "destructive" as const,
      },
    ],
    [handleDelete],
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">文章列表</h1>
        <Button onClick={() => router.push("/admin/articles/editor")}>
          <Plus className="mr-1 size-4" />
          发布文章
        </Button>
      </div>

      {loading ? (
        <DataTableSkeleton columns={7} rows={5} />
      ) : articles.length === 0 ? (
        <EmptyState {...EmptyStates.articles} />
      ) : (
        <DataTable
          data={articles}
          columns={columns}
          pageCount={totalPages}
          pageSize={pageSize}
          currentPage={current}
          onPageChange={setCurrent}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrent(1);
          }}
          selectable={true}
          batchActions={batchActions}
          sortable={true}
          filterable={true}
          loading={false}
          emptyTitle="暂无文章"
          emptyDescription="还没有发布任何文章"
        />
      )}

      {/* 确认删除对话框 */}
      <Dialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              {confirmDialog.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {confirmDialog.description}
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() =>
                setConfirmDialog((prev) => ({ ...prev, open: false }))
              }
            >
              取消
            </Button>
            <Button variant="destructive" onClick={confirmDialog.onConfirm}>
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
