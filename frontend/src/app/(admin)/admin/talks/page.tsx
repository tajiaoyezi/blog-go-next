"use client";

import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";
import type { PageResult } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { Plus, Trash2 } from "lucide-react";

interface Talk {
  id: number;
  content: string;
  images: string;
  isTop: number;
  status: number;
  createTime: string;
}

type PageData = PageResult<Talk>;

export default function TalksPage() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [content, setContent] = useState("");
  const [images, setImages] = useState("");
  const pageSize = 10;

  const fetchData = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get<PageData>(
        `/admin/talks?current=${page}&size=${pageSize}`,
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
    fetchData(current);
  }, [current, fetchData]);

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
        fetchData(1);
        setCurrent(1);
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
      const res = await api.delete("/admin/talks", [pendingDeleteId]);
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
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">说说管理</h1>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-1 size-4" />
          发布说说
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-24 text-muted-foreground">
          加载中...
        </div>
      ) : talks.length === 0 ? (
        <div className="flex items-center justify-center h-24 text-muted-foreground">
          暂无数据
        </div>
      ) : (
        <div className="space-y-3">
          {talks.map((talk) => (
            <Card key={talk.id}>
              <CardContent className="flex items-start justify-between pt-4">
                <div className="flex-1 space-y-2">
                  <p className="text-sm whitespace-pre-wrap">{talk.content}</p>
                  {talk.images && (
                    <div className="flex flex-wrap gap-2">
                      {talk.images.split(",").map((img, i) => (
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
                  <p className="text-xs text-muted-foreground">
                    {talk.createTime}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => handleDelete(talk.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

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
            确定要删除该说说吗？此操作不可恢复。
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
