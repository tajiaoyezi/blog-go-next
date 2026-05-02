"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

/**
 * 说说条目。字段与后端 TalkVO（service/talk.go）保持一致：
 * - content: 正文
 * - imgList: 图片 URL 数组（后端已按逗号拆好）
 * - isTop: 布尔值，true 表示置顶
 */
interface Talk {
  id: number;
  nickname: string;
  avatar: string;
  content: string;
  imgList: string[] | null;
  isTop: boolean;
  createTime: string;
}

interface PageResult {
  records: Talk[];
  count: number;
}

export default function TalksPage() {
  const [talks, setTalks] = useState<Talk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<PageResult>("/talks?current=1&size=10")
      .then((res) => {
        if (res.flag && res.data) {
          setTalks(res.data.records || []);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">说说</h1>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>加载失败: {error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">说说</h1>
      <p className="mt-2 text-muted-foreground">随心所记</p>

      {/* 时间线 */}
      <div className="mt-8 space-y-6">
        {talks.map((talk) => {
          // 后端已返回 imgList 数组，直接使用（null/undefined 时降级为空数组）
          const imageList = talk.imgList ?? [];

          return (
            <Card key={talk.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-10 w-10 shrink-0">
                    {talk.avatar ? (
                      <Image src={talk.avatar} alt="" className="object-cover" fill sizes="40px" />
                    ) : (
                      <AvatarFallback>
                        {(talk.nickname || "U").slice(0, 1)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {talk.nickname || "博主"}
                      </span>
                      {talk.isTop && (
                        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs text-primary">
                          置顶
                        </span>
                      )}
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                      {talk.content}
                    </p>

                    {/* 图片列表 */}
                    {imageList.length > 0 && (
                      <div className="mt-3 grid grid-cols-3 gap-2">
{imageList.map((img, idx) => (
                           <div key={idx} className="relative aspect-square">
                             <Image
                               src={img}
                               alt=""
                               className="rounded-lg object-cover"
                               fill
                               sizes="(max-width: 640px) 33vw, 200px"
                               loading="lazy"
                             />
                           </div>
                         ))}
                      </div>
                    )}

                    <time className="mt-2 block text-xs text-muted-foreground">
                      {talk.createTime}
                    </time>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {talks.length === 0 && (
          <p className="text-center text-muted-foreground">暂无说说</p>
        )}
      </div>
    </div>
  );
}
