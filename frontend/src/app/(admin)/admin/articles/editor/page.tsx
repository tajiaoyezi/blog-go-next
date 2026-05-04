"use client";

import { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, ArrowLeft } from "lucide-react";
import { MarkdownToolbar, CoverImageUploader, SmartTagInput, ImageUploader } from "@/components/editor";
import { useAutoSave } from "@/hooks/use-auto-save";
import { useMarkdownEditor } from "@/hooks/use-markdown-editor";
import { articleSchema, type ArticleFormData } from "@/lib/validations/article";
import { ZodError } from "zod";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

/* ==============================
 * 数据类型
 * ============================== */

interface Category {
  id: number;
  categoryName: string;
}

interface Tag {
  id: number;
  tagName: string;
}

/* ==============================
 * 文章编辑器内容组件
 * ============================== */

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id");
  const articleId = rawId && /^\d+$/.test(rawId) ? Number(rawId) : undefined;

  const [form, setForm] = useState<ArticleFormData>({
    id: undefined,
    articleTitle: "",
    articleContent: "",
    categoryName: "",
    tagNameList: [],
    articleCover: "",
    type: 1,
    status: 1,
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showDraftDialog, setShowDraftDialog] = useState(false);
  const [draftData, setDraftData] = useState<ArticleFormData | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const { wrapSelection, insertAtCursor } = useMarkdownEditor();

  // Auto save
  const { saveDraft, loadDraft, clearDraft } = useAutoSave({
    id: articleId,
    title: form.articleTitle,
    content: form.articleContent,
  });

  // Load draft on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft && !articleId) {
      setDraftData({
        articleTitle: draft.title,
        articleContent: draft.content,
        categoryName: "",
        tagNameList: [],
        articleCover: "",
        type: 1,
        status: 1,
      });
      setShowDraftDialog(true);
    }
  }, [loadDraft, articleId]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  // Load categories and tags
  useEffect(() => {
    api
      .get<Category[] | { records: Category[] }>("/admin/categories")
      .then((res) => {
        if (res.flag) {
          const data = res.data;
          setCategories(Array.isArray(data) ? data : data.records);
        }
      })
      .catch((err) => console.error("加载分类失败:", err));

    api
      .get<Tag[] | { records: Tag[] }>("/admin/tags")
      .then((res) => {
        if (res.flag) {
          const data = res.data;
          setTags(Array.isArray(data) ? data : data.records);
        }
      })
      .catch((err) => console.error("加载标签失败:", err));
  }, []);

  // Load article data in edit mode
  useEffect(() => {
    if (articleId) {
      api
        .get<{
          id: number;
          articleTitle: string;
          articleContent: string;
          articleCover: string;
          type: number;
          status: number;
          category?: { categoryName: string };
          tags?: { tagName: string }[];
        }>(`/admin/articles/${articleId}`)
        .then((res) => {
          if (!res.flag || !res.data) return;
          const d = res.data;
          setForm({
            id: d.id,
            articleTitle: d.articleTitle ?? "",
            articleContent: d.articleContent ?? "",
            articleCover: d.articleCover ?? "",
            type: d.type ?? 1,
            status: d.status ?? 1,
            categoryName: d.category?.categoryName ?? "",
            tagNameList: (d.tags ?? []).map((t) => t.tagName),
          });
        });
    }
  }, [articleId]);

  const updateField = useCallback(<K extends keyof ArticleFormData>(
    key: K,
    value: ArticleFormData[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const validateField = useCallback((key: keyof ArticleFormData) => {
    try {
      articleSchema.shape[key].parse(form[key]);
      setErrors((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues || [];
        setErrors((prev) => ({ ...prev, [key]: issues[0]?.message || "" }));
      }
    }
  }, [form]);

  const handleSave = async () => {
    try {
      articleSchema.parse(form);
    } catch (err) {
      if (err instanceof ZodError) {
        const newErrors: Record<string, string> = {};
        const issues = err.issues || [];
        issues.forEach((e) => {
          const path = String(e.path[0]);
          newErrors[path] = e.message;
        });
        setErrors(newErrors);
        toast.error("请检查表单填写是否正确");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await api.post("/admin/articles", form);
      if (res.flag) {
        toast.success("保存成功");
        clearDraft();
        setIsDirty(false);
        router.push("/admin/articles");
      } else {
        toast.error(res.message);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  const handleToolbarCommand = useCallback((command: string) => {
    switch (command) {
      case "bold":
        wrapSelection("**");
        break;
      case "italic":
        wrapSelection("*");
        break;
      case "strikethrough":
        wrapSelection("~~");
        break;
      case "heading": {
        const textarea = document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement | null;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const text = textarea.value;
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        const line = text.slice(lineStart, start);
        const match = line.match(/^(#{0,5})\s/);
        if (match) {
          // Remove existing heading
          const newText = text.slice(0, lineStart) + text.slice(lineStart + match[0].length);
          textarea.value = newText;
          textarea.setSelectionRange(start - match[0].length, start - match[0].length);
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
        } else {
          // Add heading
          const before = text.slice(0, lineStart);
          const after = text.slice(lineStart);
          textarea.value = before + "# " + after;
          textarea.setSelectionRange(start + 2, start + 2);
          textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }
        break;
      }
      case "quote":
        insertAtCursor("> ");
        break;
      case "code":
        wrapSelection("`");
        break;
      case "codeBlock":
        insertAtCursor("\n```\n\n```\n");
        break;
      case "link":
        insertAtCursor("[链接文字](url)");
        break;
      case "image":
        insertAtCursor("![图片描述](url)");
        break;
      case "hr":
        insertAtCursor("\n---\n");
        break;
      case "unorderedList":
        insertAtCursor("- ");
        break;
      case "orderedList":
        insertAtCursor("1. ");
        break;
    }
  }, [wrapSelection, insertAtCursor]);

  const handleCoverUpload = useCallback(async (file: File): Promise<string> => {
    const res = await api.upload<string>("/admin/articles/images", file);
    if (!res.flag) throw new Error(res.message);
    return res.data;
  }, []);

  const restoreDraft = () => {
    if (draftData) {
      setForm(draftData);
      setIsDirty(true);
    }
    setShowDraftDialog(false);
  };

  const discardDraft = () => {
    setShowDraftDialog(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <h1 className="text-xl font-semibold">
            {articleId ? "编辑文章" : "发布文章"}
          </h1>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" onClick={() => {
            saveDraft();
            toast.success("草稿已保存");
          }}>
            <Save className="mr-1 size-4" />
            保存草稿
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "发布文章"}
          </Button>
        </div>
      </div>

      {/* Draft Recovery Dialog */}
      {showDraftDialog && (
        <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 dark:border-yellow-800 dark:bg-yellow-950">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            检测到未保存的草稿：{draftData?.articleTitle || "无标题"}
          </p>
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={restoreDraft}>
              恢复草稿
            </Button>
            <Button size="sm" variant="ghost" onClick={discardDraft}>
              丢弃
            </Button>
          </div>
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">文章标题 *</Label>
        <Input
          id="title"
          placeholder="请输入文章标题"
          value={form.articleTitle}
          onChange={(e) => updateField("articleTitle", e.target.value)}
          onBlur={() => validateField("articleTitle")}
          className={errors.articleTitle ? "border-destructive" : ""}
        />
        {errors.articleTitle && (
          <p className="text-sm text-destructive">{errors.articleTitle}</p>
        )}
      </div>

      {/* Category & Type & Status */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="category">分类 *</Label>
          <select
            id="category"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={form.categoryName}
            onChange={(e) => updateField("categoryName", e.target.value)}
            onBlur={() => validateField("categoryName")}
          >
            <option value="">请选择分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.categoryName}>
                {c.categoryName}
              </option>
            ))}
          </select>
          {errors.categoryName && (
            <p className="text-sm text-destructive">{errors.categoryName}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="type">类型</Label>
          <select
            id="type"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={form.type}
            onChange={(e) => updateField("type", Number(e.target.value))}
          >
            <option value={1}>原创</option>
            <option value={2}>转载</option>
            <option value={3}>翻译</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">状态</Label>
          <select
            id="status"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            value={form.status}
            onChange={(e) => updateField("status", Number(e.target.value))}
          >
            <option value={1}>公开</option>
            <option value={2}>私密</option>
            <option value={3}>草稿</option>
          </select>
        </div>
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>标签 *</Label>
        <SmartTagInput
          value={form.tagNameList}
          onChange={(tags) => updateField("tagNameList", tags)}
          availableTags={tags.map((t) => t.tagName)}
          maxTags={10}
        />
        {errors.tagNameList && (
          <p className="text-sm text-destructive">{errors.tagNameList}</p>
        )}
      </div>

      {/* Cover Image */}
      <div className="space-y-2">
        <Label>封面图</Label>
        <CoverImageUploader
          value={form.articleCover}
          onChange={(url) => updateField("articleCover", url)}
          onUpload={handleCoverUpload}
        />
      </div>

      {/* Markdown Editor */}
      <div className="space-y-2">
        <Label htmlFor="content">文章内容 *</Label>
        <MarkdownToolbar onCommand={handleToolbarCommand} />
        <ImageUploader
          onUpload={async (files) => {
            const urls: string[] = [];
            for (const file of files) {
              const res = await api.upload<string>("/admin/articles/images", file);
              if (res.flag) urls.push(res.data);
            }
            return urls;
          }}
          onInsert={(urls) => {
            const markdown = urls.map((url) => `![图片](${url})`).join("\n");
            insertAtCursor(markdown + "\n");
          }}
        />
        <div data-color-mode="light">
          <MDEditor
            value={form.articleContent}
            onChange={(val) => {
              updateField("articleContent", val || "");
            }}
            height={500}
          />
        </div>
        {errors.articleContent && (
          <p className="text-sm text-destructive">{errors.articleContent}</p>
        )}
      </div>
    </div>
  );
}

/* ==============================
 * 页面入口
 * ============================== */

export default function ArticleEditorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          加载中...
        </div>
      }
    >
      <EditorContent />
    </Suspense>
  );
}
