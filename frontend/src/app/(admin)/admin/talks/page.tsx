"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { api } from "@/lib/api";
import type { PageResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Image from "next/image";
import { Plus, Trash2 } from "lucide-react";
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
import { type ColumnDef } from "@tanstack/react-table";

/* ==============================
 * 说说列表数据类型
 * ============================== */

interface Talk {
  id: number;
  content: string;
  images: string;
  isTop: number;
  status: number;
  createTime: string;
}

type PageData = PageResult<Talk>;

/* ==============================
 * 说说管理页面
 * ============================== */

export default function TalksPage() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(true);

  // 发布弹窗
  const [dialogOpen, setDialogOpen] = useState(false);
  const [content, setContent] = useState("");
  const [images, setImages] = useState("");

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
        `/admin/talks?current=${page}&size=${size}`,
      );
      if (res.flag) {
        setTalks(res.data.records);
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

  const handlePublish = async () => {
    if (!content.trim()) {
      toast.error("请输入说说内容");
      return;
    }
    try {
      const res = await api.post("/admin/talks", {
        content,
        images,
        status: 1,
      });
      if (res.flag) {
        toast.success("发布成功");
        setDialogOpen(false);
        setContent("");
        setImages("");
        fetchData(1, pageSize);
        setCurrent(1);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  const handleDelete = useCallback((ids: number[]) => {
    const isBatch = ids.length > 1;
    setConfirmDialog({
      open: true,
      title: isBatch ? "确认批量删除" : "确认删除",
      description: isBatch
        ? `确定要删除选中的 ${ids.length} 条说说吗？此操作不可恢复。`
        : "确定要删除该说说吗？此操作不可恢复。",
      onConfirm: async () => {
        try {
          const res = await api.delete("/admin/talks", ids);
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
  const columns: ColumnDef<Talk>[] = useMemo(
    () => [
      {
        accessorKey: "content",
        header: "内容",
        enableSorting: false,
        cell: ({ row }) => (
          <div className="max-w-[500px]">
            <p className="text-sm whitespace-pre-wrap">
              {row.original.content}
            </p>
            {row.original.images && (
              <div className="mt-2 flex flex-wrap gap-2">
                {row.original.images.split(",").map((img, i) => (
                  <Image
                    key={i}
                    src={img}
                    alt=""
                    width={80}
                    height={80}
                    className="h-20 w-20 rounded-md object-cover"
                    loading="lazy"
                  />
                ))}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "createTime",
        header: "发布时间",
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
          const talk = row.original;
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleDelete([talk.id])}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [handleDelete],
  );

  // 批量操作配置
  const batchActions = useMemo(
    () => [
      {
        label: "批量删除",
        onClick: (rows: unknown[]) => {
          const ids = (rows as Talk[]).map((row) => row.id);
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
        <h1 className="text-xl font-semibold">说说管理</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 size-4" />
          发布说说
        </Button>
      </div>

      {loading ? (
        <DataTableSkeleton columns={3} rows={5} />
      ) : talks.length === 0 ? (
        <EmptyState {...EmptyStates.talks} />
      ) : (
        <DataTable
          data={talks}
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
          emptyTitle="暂无说说"
          emptyDescription="还没有发布任何说说"
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

      {/* 发布弹窗 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>发布说说</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>内容</Label>
              <Textarea
                placeholder="说点什么吧..."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>图片（多个用逗号分隔）</Label>
              <Textarea
                placeholder="图片 URL，多个用逗号分隔"
                rows={2}
                value={images}
                onChange={(e) => setImages(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              取消
            </DialogClose>
            <Button onClick={handlePublish}>发布</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
