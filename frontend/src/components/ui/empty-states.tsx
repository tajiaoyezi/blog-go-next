import {
  FileText,
  MessageSquare,
  FolderTree,
  Tags,
  Search,
  Inbox,
} from "lucide-react";
import { EmptyState, type EmptyStateProps } from "./empty-state";

export function EmptyArticle({ action }: { action?: EmptyStateProps["action"] }) {
  return (
    <EmptyState
      icon={FileText}
      title="暂无文章"
      description="点击按钮发布第一篇文章"
      action={action ?? { label: "写文章", href: "/admin/articles/editor" }}
    />
  );
}

export function EmptyComment({ action }: { action?: EmptyStateProps["action"] }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="暂无评论"
      description="文章收到评论后会显示在这里"
      action={action ?? { label: "查看文章", href: "/admin/articles" }}
    />
  );
}

export function EmptyCategory({ action }: { action?: EmptyStateProps["action"] }) {
  return (
    <EmptyState
      icon={FolderTree}
      title="暂无分类"
      description="创建分类来组织文章"
      action={action ?? { label: "创建分类", href: "/admin/categories" }}
    />
  );
}

export function EmptyTag({ action }: { action?: EmptyStateProps["action"] }) {
  return (
    <EmptyState
      icon={Tags}
      title="暂无标签"
      description="为文章添加标签"
      action={action ?? { label: "创建标签", href: "/admin/tags" }}
    />
  );
}

export function EmptySearch({ action }: { action?: EmptyStateProps["action"] }) {
  return (
    <EmptyState
      icon={Search}
      title="未找到结果"
      description="尝试其他关键词或筛选条件"
      action={action}
    />
  );
}

export function EmptyGeneric({ action }: { action?: EmptyStateProps["action"] }) {
  return (
    <EmptyState
      icon={Inbox}
      title="暂无数据"
      description="—"
      action={action}
    />
  );
}
