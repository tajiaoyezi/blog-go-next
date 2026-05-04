import { z } from "zod";

export const articleSchema = z.object({
  id: z.number().optional(),
  articleTitle: z
    .string()
    .min(1, "请输入文章标题")
    .max(100, "标题不能超过 100 个字符"),
  articleContent: z
    .string()
    .min(1, "请输入文章内容")
    .max(50000, "内容不能超过 50000 个字符"),
  categoryName: z.string().min(1, "请选择分类"),
  tagNameList: z
    .array(z.string())
    .min(1, "至少选择一个标签")
    .max(10, "最多 10 个标签"),
  articleCover: z.string().default(""),
  type: z.number().min(1).max(3),
  status: z.number().min(1).max(3),
});

export type ArticleFormData = z.infer<typeof articleSchema>;
