"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import type { PageResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Image from "next/image";
import { Check, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { EmptyState, EmptyStates } from "@/components/ui/empty-state";
import { type ColumnDef } from "@tanstack/react-table";

/* ==============================
 * 评论列表数据类型
 * ============================== */

interface Comment {
  id: number;
  nickname: string;
  avatar: string;
  commentContent: string;
  articleTitle: string;
  isReview: boolean;
  createTime: string;
}

type PageData = PageResult<Comment>;

/* ==============================
 * 评论管理页面
 * ============================== */

export default function CommentsPage() {
  const [comments, setComments] = useState<Comment[]>([]);
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

  const fetchData = useCallback(async (page: number, size: number) => {
    setLoading(true);
    try {
      const res = await api.get<PageData>(
        `/admin/comments?current=${page}&size=${size}`,
      );
      if (res.flag) {
        setComments(res.data.records);
        setCount(res.data.count);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(current, pageSize);
  }, [current, pageSize, fetchData]);

  const handleReview = useCallback(async (ids: number[]) => {
    const isBatch = ids.length > 1;
    try {
      const res = await api.put("/admin/comments/review", {
        idList: ids,
        isReview: true,
      });
      if (res.flag) {
        toast.success(isBatch ? "批量审核通过" : "审核通过");
        fetchData(current, pageSize);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  }, [current, pageSize]);

  const handleDelete = useCallback((ids: number[]) => {
    const isBatch = ids.length > 1;
    setConfirmDialog({
      open: true,
      title: isBatch ? "确认批量删除" : "确认删除",
      description: isBatch
        ? `确定要删除选中的 ${ids.length} 条评论吗？此操作不可恢复。`
        : "确定要删除该评论吗？此操作不可恢复。",
      onConfirm: async () => {
        try {
          const res = await api.delete("/admin/comments", ids);
          if (res.flag) {
            toast.success(isBatch ? "批量删除成功" : "删除成功");
            fetchData(current, pageSize);
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

  const totalPages = Math.max(0, Math.ceil(count / pageSize));

  // 列配置
  const columns: ColumnDef<Comment>[] = useMemo(
    () => [
      {
        accessorKey: "nickname",
        header: "用户",
        enableSorting: true,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            {row.original.avatar && (
              <Image
                src={row.original.avatar}
                alt=""
                width={24}
                height={24}
                className="size-6 rounded-full"
                loading="lazy"
              />
            )}
            <span className="text-sm">{row.original.nickname}</span>
          </div>
        ),
      },
      {
        accessorKey: "commentContent",
        header: "评论内容",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="max-w-[300px] truncate">
            {row.original.commentContent}
          </div>
        ),
      },
      {
        accessorKey: "articleTitle",
        header: "文章",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="max-w-[150px] truncate text-muted-foreground">
            {row.original.articleTitle}
          </div>
        ),
      },
      {
        accessorKey: "isReview",
        header: "状态",
        enableSorting: true,
        cell: ({ row }) =>
          row.original.isReview ? (
            <Badge variant="outline">已审核</Badge>
          ) : (
            <Badge variant="secondary">待审核</Badge>
          ),
      },
      {
        accessorKey: "createTime",
        header: "评论时间",
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
          const comment = row.original;
          return (
            <div className="flex items-center gap-1">
              {!comment.isReview && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleReview([comment.id])}
                >
                  <Check className="size-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete([comment.id])}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleDelete, handleReview],
  );

  // 批量操作配置
  const batchActions = useMemo(
    () => [
      {
        label: "批量审核",
        onClick: (rows: unknown[]) => {
          const ids = (rows as Comment[]).map((row) => row.id);
          handleReview(ids);
        },
        variant: "default" as const,
      },
      {
        label: "批量删除",
        onClick: (rows: unknown[]) => {
          const ids = (rows as Comment[]).map((row) => row.id);
          handleDelete(ids);
        },
        variant: "destructive" as const,
      },
    ],
    [handleDelete, handleReview],
  );

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">评论管理</h1>

      {loading ? (
        <DataTableSkeleton columns={6} rows={5} />
      ) : comments.length === 0 ? (
        <EmptyState {...EmptyStates.comments} />
      ) : (
        <DataTable
          data={comments}
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
          loading={false}
          emptyTitle="暂无评论"
          emptyDescription="还没有收到任何评论"
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
