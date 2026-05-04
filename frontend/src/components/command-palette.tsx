"use client";

import { useEffect, useState, useRef, useCallback, useMemo, useTransition, type ElementType } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  FileText,
  MessageSquare,
  LayoutDashboard,
  FolderTree,
  Tags,
  Settings,
  ScrollText,
  PenSquare,
  List,
  MessageCircle,
  Mail,
  Camera,
  X,
  CornerDownLeft,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { useDebounce } from "@/components/data-table/use-debounce";

/* ==============================
 * 类型定义
 * ============================== */

interface SearchItem {
  id: string;
  type: "article" | "comment" | "page" | "action";
  title: string;
  subtitle?: string;
  icon: ElementType;
  href?: string;
}

interface GroupItem {
  id: string;
  isGroup: true;
  title: string;
}

type SearchResult = SearchItem | GroupItem;

/* ==============================
 * 静态数据源
 * ============================== */

const STATIC_PAGES: SearchItem[] = [
  { id: "page-dashboard", type: "page", title: "首页", icon: LayoutDashboard, href: "/admin" },
  { id: "page-articles", type: "page", title: "文章列表", icon: List, href: "/admin/articles" },
  { id: "page-new-article", type: "page", title: "发布文章", icon: PenSquare, href: "/admin/articles/editor" },
  { id: "page-categories", type: "page", title: "分类管理", icon: FolderTree, href: "/admin/categories" },
  { id: "page-tags", type: "page", title: "标签管理", icon: Tags, href: "/admin/tags" },
  { id: "page-comments", type: "page", title: "评论管理", icon: MessageCircle, href: "/admin/comments" },
  { id: "page-messages", type: "page", title: "留言管理", icon: Mail, href: "/admin/messages" },
  { id: "page-talks", type: "page", title: "说说管理", icon: MessageSquare, href: "/admin/talks" },
  { id: "page-albums", type: "page", title: "相册管理", icon: Camera, href: "/admin/albums" },
  { id: "page-logs", type: "page", title: "日志管理", icon: ScrollText, href: "/admin/logs" },
  { id: "page-settings", type: "page", title: "站点配置", icon: Settings, href: "/admin/settings" },
];

const QUICK_ACTIONS: SearchItem[] = [
  { id: "action-new-article", type: "action", title: "写文章", icon: PenSquare, href: "/admin/articles/editor" },
  { id: "action-comments", type: "action", title: "查看评论", icon: MessageCircle, href: "/admin/comments" },
  { id: "action-settings", type: "action", title: "站点设置", icon: Settings, href: "/admin/settings" },
  { id: "action-logs", type: "action", title: "查看日志", icon: ScrollText, href: "/admin/logs" },
];

// Storage-friendly version of SearchItem (without icon component)
interface StoredItem {
  id: string;
  type: "article" | "comment" | "page" | "action";
  title: string;
  subtitle?: string;
  href?: string;
}

const RECENT_KEY = "command-palette-recent";

function getRecentItems(allItems: SearchItem[]): SearchItem[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const stored = JSON.parse(raw) as StoredItem[];
    // Match stored items against full item list to rehydrate icons
    const itemMap = new Map(allItems.map((item) => [item.id, item]));
    return stored
      .map((s) => itemMap.get(s.id))
      .filter((item): item is SearchItem => item !== undefined)
      .slice(0, 5);
  } catch {
    return [];
  }
}

function addRecentItem(item: SearchItem) {
  try {
    // Get current stored items without relying on allItems list
    const raw = localStorage.getItem(RECENT_KEY);
    const stored: StoredItem[] = raw ? (JSON.parse(raw) as StoredItem[]) : [];
    const filtered = stored.filter((r) => r.id !== item.id);
    const updated: StoredItem[] = [
      {
        id: item.id,
        type: item.type,
        title: item.title,
        subtitle: item.subtitle,
        href: item.href,
      },
      ...filtered,
    ].slice(0, 5);
    localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  } catch {
    // Ignore localStorage errors
  }
}

function isGroup(item: SearchResult): item is GroupItem {
  return "isGroup" in item && item.isGroup;
}

function isSearchItem(item: SearchResult): item is SearchItem {
  return !isGroup(item);
}

/* ==============================
 * Command Palette 组件
 * ============================== */

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [articles, setArticles] = useState<SearchItem[]>([]);
  const [comments, setComments] = useState<SearchItem[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  // Fetch articles and comments on open
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    startTransition(() => setLoading(true));
    Promise.all([
      api.get<{ records: { id: number; articleTitle: string }[] }>("/admin/articles?page=1&size=50"),
      api.get<{ records: { id: number; commentContent: string }[] }>("/admin/comments?page=1&size=50"),
    ])
      .then(([articleRes, commentRes]) => {
        if (cancelled) return;
        if (articleRes.flag && articleRes.data?.records) {
          startTransition(() =>
            setArticles(
              articleRes.data.records.map((a) => ({
                id: `article-${a.id}`,
                type: "article" as const,
                title: a.articleTitle,
                icon: FileText,
                href: `/admin/articles/editor?id=${a.id}`,
              }))
            )
          );
        }
        if (commentRes.flag && commentRes.data?.records) {
          startTransition(() =>
            setComments(
              commentRes.data.records.map((c) => ({
                id: `comment-${c.id}`,
                type: "comment" as const,
                title: c.commentContent.slice(0, 50),
                subtitle: "评论",
                icon: MessageSquare,
                href: `/admin/comments`,
              }))
            )
          );
        }
      })
      .catch(() => {
        // Ignore fetch errors
      })
      .finally(() => {
        if (!cancelled) startTransition(() => setLoading(false));
      });
    return () => {
      cancelled = true;
    };
  }, [open, startTransition]);

  // Global Cmd+K shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      startTransition(() => {
        setQuery("");
        setSelectedIndex(0);
      });
    }
  }, [open, startTransition]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const allItems = useMemo(
    () => [...STATIC_PAGES, ...QUICK_ACTIONS, ...articles, ...comments],
    [articles, comments]
  );

  const debouncedQuery = useDebounce(query, 150);

  const filteredResults = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    if (!q) {
      const recent = getRecentItems(allItems);
      const results: SearchResult[] = [];
      if (recent.length > 0) {
        results.push({ id: "group-recent", isGroup: true, title: "最近访问" });
        results.push(...recent);
      }
      results.push({ id: "group-actions", isGroup: true, title: "快捷操作" });
      results.push(...QUICK_ACTIONS);
      return results;
    }

    const results: SearchResult[] = [];

    const matchedArticles = articles.filter((a) => a.title.toLowerCase().includes(q));
    if (matchedArticles.length > 0) {
      results.push({ id: "group-articles", isGroup: true, title: "文章" });
      results.push(...matchedArticles.slice(0, 5));
    }

    const matchedComments = comments.filter((c) => c.title.toLowerCase().includes(q));
    if (matchedComments.length > 0) {
      results.push({ id: "group-comments", isGroup: true, title: "评论" });
      results.push(...matchedComments.slice(0, 5));
    }

    const matchedPages = STATIC_PAGES.filter((p) => p.title.toLowerCase().includes(q));
    if (matchedPages.length > 0) {
      results.push({ id: "group-pages", isGroup: true, title: "页面" });
      results.push(...matchedPages.slice(0, 5));
    }

    const matchedActions = QUICK_ACTIONS.filter((a) => a.title.toLowerCase().includes(q));
    if (matchedActions.length > 0) {
      results.push({ id: "group-actions", isGroup: true, title: "快捷操作" });
      results.push(...matchedActions);
    }

    return results;
  }, [debouncedQuery, articles, comments, allItems]);

  const handleSelect = useCallback(
    (item: SearchItem) => {
      if (item.href) {
        addRecentItem(item);
        router.push(item.href);
        setOpen(false);
      }
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, filteredResults.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const item = filteredResults[selectedIndex];
        if (item && isSearchItem(item)) handleSelect(item);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    },
    [filteredResults, selectedIndex, handleSelect]
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => setOpen(false)}
      />

      <div className="relative w-full max-w-2xl rounded-xl bg-popover shadow-2xl border overflow-hidden">
        <div className="flex items-center gap-3 border-b px-4 h-14">
          <Search className="size-5 text-muted-foreground shrink-0" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="搜索文章、评论或输入命令..."
            className="flex-1 border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 h-full text-base"
          />
          <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
            <span className="rounded border px-1.5 py-0.5">Esc</span>
            <X className="size-3" />
          </div>
        </div>

        <div className="max-h-[400px] overflow-y-auto py-2">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">加载中...</div>
          ) : filteredResults.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">未找到结果</div>
          ) : (
            filteredResults.map((item, index) => {
              if (isGroup(item)) {
                return (
                  <div
                    key={item.id}
                    className="px-4 py-1.5 text-xs font-medium text-muted-foreground uppercase"
                  >
                    {item.title}
                  </div>
                );
              }

              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent transition-colors",
                    isSelected && "bg-accent"
                  )}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <item.icon className="size-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{item.title}</p>
                    {item.subtitle && (
                      <p className="text-xs text-muted-foreground truncate">{item.subtitle}</p>
                    )}
                  </div>
                  {isSelected && (
                    <CornerDownLeft className="size-3.5 text-muted-foreground shrink-0" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
