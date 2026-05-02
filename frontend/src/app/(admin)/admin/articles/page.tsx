"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
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
import { Pencil, Pin, Trash2, Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

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

// 使用统一的后端分页类型（字段名为 count，不是 total）
type PageData = PageResult<Article>;

/* ==============================
 * 文章列表页面
 * ============================== */

export default function ArticlesPage() {
  const router = useRouter();
  const [articles, setArticles] = useState<Article[]>([]);
  const [count, setCount] = useState(0);
  const [current, setCurrent] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const pageSize = 10;

  const fetchArticles = useCallback(async (page: number) => {
    setLoading(true);
    try {
      const res = await api.get<PageData>(
        `/admin/articles?current=${page}&size=${pageSize}`,
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
    fetchArticles(current);
  }, [current, fetchArticles]);

  const handleDelete = (id: number) => {
    setPendingDeleteId(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      const res = await api.delete("/admin/articles", [pendingDeleteId]);
      if (res.flag) {
        toast.success("删除成功");
        fetchArticles(current);
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

  const handleToggleTop = async (article: Article) => {
    try {
      const res = await api.put(`/admin/articles/top`, {
        id: article.id,
        isTop: !article.isTop,
      });
      if (res.flag) {
        toast.success(article.isTop ? "已取消置顶" : "已置顶");
        fetchArticles(current);
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "操作失败");
    }
  };

  const totalPages = Math.ceil(count / pageSize);

  const statusLabel = (status: number) => {
    switch (status) {
      case 1:
        return <Badge variant="outline">公开</Badge>;
      case 2:
        return <Badge variant="secondary">私密</Badge>;
      case 3:
        return <Badge variant="secondary">草稿</Badge>;
      default:
        return <Badge variant="outline">未知</Badge>;
    }
  };

  const typeLabel = (type: number) => {
    switch (type) {
      case 1:
        return "原创";
      case 2:
        return "转载";
      case 3:
        return "翻译";
      default:
        return "未知";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">文章列表</h1>
        <Button onClick={() => router.push("/admin/articles/editor")}>
          <Plus className="mr-1 size-4" />
          发布文章
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>标题</TableHead>
              <TableHead>分类</TableHead>
              <TableHead>标签</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>状态</TableHead>
              <TableHead>创建时间</TableHead>
              <TableHead className="text-right">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  加载中...
                </TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  暂无数据
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id}>
                  <TableCell className="max-w-[200px] truncate font-medium">
                    {article.isTop && (
                      <Pin className="mr-1 inline-block size-3 text-destructive" />
                    )}
                    {article.articleTitle}
                  </TableCell>
                  <TableCell>{article.categoryName}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {article.tagNameList?.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{typeLabel(article.type)}</TableCell>
                  <TableCell>{statusLabel(article.status)}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {article.createTime}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
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
                        onClick={() => handleDelete(article.id)}
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

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              确认删除
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            确定要删除该文章吗？此操作不可恢复。
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

      {/* 分页 */}
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
    </div>
  );
}
