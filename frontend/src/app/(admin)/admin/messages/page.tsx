"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { PageResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

interface Message {
  id: number;
  nickname: string;
  avatar: string;
  messageContent: string;
  isReview: boolean;
  createTime: string;
}

type PageData = PageResult<Message>;

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const pageSize = 10;

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get<PageData>(
        `/admin/messages?current=${page}&size=${pageSize}`,
      );
      if (res.flag) {
        setMessages(res.data.records);
        setCount(res.data.count);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(current);
  }, [current, fetchData]);

  const handleReview = async (id: number) => {
    try {
      const res = await api.put("/admin/messages/review", {
        idList: [id],
        isReview: true,
      });
      if (res.flag) {
        toast.success("审核通过");
        fetchData(current);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  const handleDelete = (id: number) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      const res = await api.delete("/admin/messages", [pendingDeleteId]);
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

  const totalPages = Math.ceil(count / pageSize);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">留言管理</h1>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>用户</TableHead>
              <TableHead>留言内容</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>留言时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : messages.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              messages.map((msg) => (
                <TableRow key={msg.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {msg.avatar && (
                        <Image
                          src={msg.avatar}
                          alt=""
                          width={24}
                          height={24}
                          className="size-6 rounded-full"
                          loading="lazy"
                        />
                      )}
                      <span className="text-sm">{msg.nickname}</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[400px] truncate">
                    {msg.messageContent}
                  </TableCell>
                  <TableCell>
                    {msg.isReview ? (
                      <Badge variant="outline">已审核</Badge>
                    ) : (
                      <Badge variant="secondary">待审核</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {msg.createTime}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!msg.isReview && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleReview(msg.id)}
                        >
                          <Check className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(msg.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
            确定要删除该留言吗？此操作不可恢复。
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
