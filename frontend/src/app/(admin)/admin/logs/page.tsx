"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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

interface PageData {
  records: OperationLog[];
  total: number;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<OperationLog[]>([]);
  const [total, setTotal] = useState(0);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const pageSize = 10;

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get<PageData>(
        `/admin/operation/logs?current=${page}&size=${pageSize}`,
      );
      if (res.flag) {
        setLogs(res.data.records);
        setTotal(res.data.total);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(current);
  }, [current, fetchData]);

  const handleDelete = (id: number) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      const res = await api.delete("/admin/operation/logs", [pendingDeleteId]);
      if (res.flag) {
        toast.success("删除成功");
        fetchData(current);
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
        fetchData(1);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    } finally {
      setClearDialogOpen(false);
    }
  };

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">操作日志</h1>
        <Button variant="destructive" size="sm" onClick={handleClear}>
          <Trash2 className="mr-1 size-4" />
          清空日志
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>模块</TableHead>
              <TableHead>操作描述</TableHead>
              <TableHead>请求方式</TableHead>
              <TableHead>请求地址</TableHead>
              <TableHead>操作人</TableHead>
              <TableHead>IP</TableHead>
              <TableHead>操作时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.module}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {log.description}
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-1.5 py-0.5 rounded">
                      {log.method}
                    </code>
                  </TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground font-mono text-xs">
                    {log.uri}
                  </TableCell>
                  <TableCell>{log.nickname}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.ipAddress}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {log.createTime}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={current === 1}
            onClick={() => setCurrent((p) => p - 1)}
          >
            上一页
          </Button>
          <span className="text-sm text-muted-foreground">
            {current} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={current === totalPages}
            onClick={() => setCurrent((p) => p + 1)}
          >
            下一页
          </Button>
        </div>
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
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
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
