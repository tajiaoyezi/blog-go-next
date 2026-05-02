"use client";

import { useEffect, useState, Suspense, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ImagePlus } from "lucide-react";

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

interface ArticleForm {
  id?: number;
  articleTitle: string;
  articleContent: string;
  categoryName: string;
  tagNameList: string[];
  articleCover: string;
  type: number;
  status: number;
}

const INITIAL_FORM: ArticleForm = {
  articleTitle: "",
  articleContent: "",
  categoryName: "",
  tagNameList: [],
  articleCover: "",
  type: 1,
  status: 1,
};

/* ==============================
 * 文章编辑器内容组件
 * ============================== */

function EditorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawId = searchParams.get("id");
  const articleId = rawId && /^\d+$/.test(rawId) ? rawId : null;

  const [form, setForm] = useState<ArticleForm>(INITIAL_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFilePicked = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("请选择图片文件");
      return;
    }
    setUploading(true);
    api
      .upload<string>("/admin/articles/images", file)
      .then((res) => {
        if (res.flag) {
          const imageMarkdown = `\n![${file.name}](${res.data})\n`;
          setForm((prev) => ({
            ...prev,
            articleContent: prev.articleContent + imageMarkdown,
          }));
          toast.success("图片上传成功");
        } else {
          toast.error(res.message);
        }
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "图片上传失败");
      })
      .finally(() => {
        setUploading(false);
      });
  }, []);

  // 上传按钮通过 label + input 原生关联实现，不需要 JS 触发 .click()

  // 编辑模式：加载文章数据
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
          isTop?: boolean;
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

  const updateField = <K extends keyof ArticleForm>(
    key: K,
    value: ArticleForm[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const addTag = (tagName: string) => {
    if (tagName && !form.tagNameList.includes(tagName)) {
      updateField("tagNameList", [...form.tagNameList, tagName]);
    }
    setTagInput("");
  };

  const removeTag = (tagName: string) => {
    updateField(
      "tagNameList",
      form.tagNameList.filter((t) => t !== tagName),
    );
  };

  const handleSave = async () => {
    if (!form.articleTitle.trim()) {
      toast.error("请输入文章标题");
      return;
    }
    if (!form.articleContent.trim()) {
      toast.error("请输入文章内容");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/admin/articles", form);
      if (res.flag) {
        toast.success("保存成功");
        router.push("/admin/articles");
      } else {
        toast.error(res.message);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">
          {articleId ? "编辑文章" : "发布文章"}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "保存中..." : "保存"}
          </Button>
        </div>
      </div>

      {/* 标题 */}
      <div className="space-y-2">
        <Label>文章标题</Label>
        <Input
          placeholder="请输入文章标题"
          value={form.articleTitle}
          onChange={(e) => updateField("articleTitle", e.target.value)}
        />
      </div>

      {/* 分类 & 类型 & 状态 */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>分类</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={form.categoryName}
            onChange={(e) => updateField("categoryName", e.target.value)}
          >
            <option value="">请选择分类</option>
            {categories.map((c) => (
              <option key={c.id} value={c.categoryName}>
                {c.categoryName}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>类型</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={form.type}
            onChange={(e) => updateField("type", Number(e.target.value))}
          >
            <option value={1}>原创</option>
            <option value={2}>转载</option>
            <option value={3}>翻译</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>状态</Label>
          <select
            className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            value={form.status}
            onChange={(e) => updateField("status", Number(e.target.value))}
          >
            <option value={1}>公开</option>
            <option value={2}>私密</option>
            <option value={3}>草稿</option>
          </select>
        </div>
      </div>

      {/* 标签 */}
      <div className="space-y-2">
        <Label>标签</Label>
        <div className="flex flex-wrap gap-2">
          {form.tagNameList.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
            >
              {tag}
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => removeTag(tag)}
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="输入标签后回车添加"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag(tagInput.trim());
              }
            }}
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tags
                .filter((t) => !form.tagNameList.includes(t.tagName))
                .slice(0, 5)
                .map((t) => (
                  <Button
                    key={t.id}
                    variant="outline"
                    size="sm"
                    onClick={() => addTag(t.tagName)}
                  >
                    {t.tagName}
                  </Button>
                ))}
            </div>
          )}
        </div>
      </div>

      {/* 封面 */}
      <div className="space-y-2">
        <Label>封面图片 URL</Label>
        <Input
          placeholder="请输入封面图片地址"
          value={form.articleCover}
          onChange={(e) => updateField("articleCover", e.target.value)}
        />
      </div>

      {/* Markdown 编辑器 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>文章内容</Label>
          <div className="flex items-center gap-2">
            <label
              className={`
                inline-flex items-center justify-center gap-1.5 rounded-md border
                px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer
                ${uploading
                  ? "bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                  : "bg-background hover:bg-accent hover:text-accent-foreground border-input"
                }
              `}
            >
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFilePicked(file);
                  e.target.value = "";
                }}
              />
              <ImagePlus className="size-4" />
              {uploading ? "上传中..." : "上传图片"}
            </label>
          </div>
        </div>
        <div data-color-mode="light">
          <MDEditor
            value={form.articleContent}
            onChange={(val) => updateField("articleContent", val || "")}
            height={500}
          />
        </div>
      </div>
    </div>
  );
}

/* ==============================
 * 页面入口：用 Suspense 包裹 useSearchParams
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
