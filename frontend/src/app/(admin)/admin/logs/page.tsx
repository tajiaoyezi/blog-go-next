"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { api } from "@/lib/api";
import type { PageResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { DataTable } from "@/components/data-table";
import { DataTableSkeleton } from "@/components/data-table/data-table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";

interface OperationLog {
  id: number;
  module: string;
  type: string;
  uri: string;
  method: string;
  description: string;
  nickname: string;
  ipAddress: string;
  createTime: string;
}

type PageData = PageResult<OperationLog>;

export default function LogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  const fetchData = useCallback(async (page: number, size: number) => {
    setLoading(true);
    try {
      const res = await api.get<PageData>(
        `/admin/operation/logs?current=${page}&size=${size}`,
      );
      if (res.flag) {
        setLogs(res.data.records);
        setCount(res.data.count);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(current, pageSize);
  }, [current, pageSize, fetchData]);

  const handleDelete = useCallback((id: number) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      const res = await api.delete("/admin/operation/logs", [pendingDeleteId]);
      if (res.flag) {
        toast.success("删除成功");
        fetchData(current, pageSize);
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

  const handleClear = () => {
    setClearDialogOpen(true);
  };

  const confirmClear = async () => {
    try {
      const res = await api.delete("/admin/operation/logs", []);
      if (res.flag) {
        toast.success("清空成功");
        setCurrent(1);
        fetchData(1, pageSize);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    } finally {
      setClearDialogOpen(false);
    }
  };

  const totalPages = Math.max(0, Math.ceil(count / pageSize));

  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setCurrent(1);
  }, []);

  const columns: ColumnDef<OperationLog>[] = useMemo(
    () => [
      {
        accessorKey: "module",
        header: "模块",
        enableSorting: true,
      },
      {
        accessorKey: "description",
        header: "操作描述",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="block max-w-[200px] truncate">
            {row.original.description}
          </span>
        ),
      },
      {
        accessorKey: "method",
        header: "请求方式",
        enableSorting: false,
        cell: ({ row }) => (
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
            {row.original.method}
          </code>
        ),
      },
      {
        accessorKey: "uri",
        header: "请求地址",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="block max-w-[180px] truncate font-mono text-xs text-muted-foreground">
            {row.original.uri}
          </span>
        ),
      },
      {
        accessorKey: "nickname",
        header: "操作人",
        enableSorting: true,
      },
      {
        accessorKey: "ipAddress",
        header: "IP",
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-muted-foreground">
            {row.original.ipAddress}
          </span>
        ),
      },
      {
        accessorKey: "createTime",
        header: "操作时间",
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
        size: 80,
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => handleDelete(row.original.id)}
          >
            <Trash2 className="size-4" />
          </Button>
        ),
      },
    ],
    [handleDelete]
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">操作日志</h1>
        <Button variant="destructive" size="sm" onClick={handleClear}>
          <Trash2 className="mr-1 size-4" />
          清空日志
        </Button>
      </div>

      {loading ? (
        <DataTableSkeleton columns={8} rows={5} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={Trash2}
          title="暂无日志"
          description="还没有任何操作日志"
        />
      ) : (
        <DataTable
          data={logs}
          columns={columns}
          pageCount={totalPages}
          pageSize={pageSize}
          currentPage={current}
          onPageChange={setCurrent}
          onPageSizeChange={handlePageSizeChange}
          sortable={true}
          filterable={true}
          loading={false}
          emptyTitle="暂无日志"
          emptyDescription="还没有任何操作日志"
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
            确定要删除该日志吗？此操作不可恢复。
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

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              确认清空
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要清空所有日志吗？此操作不可恢复。
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setClearDialogOpen(false)}
            >
              取消
            </Button>
            <Button variant="destructive" onClick={confirmClear}>
              确认清空
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
