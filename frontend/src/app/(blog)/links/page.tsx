"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface FriendLink {
  id: number;
  linkName: string;
  linkAvatar: string;
  linkAddress: string;
  linkIntro: string;
}

export default function LinksPage() {
  const [links, setLinks] = useState<FriendLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<FriendLink[]>("/links")
      .then((res) => {
        if (res.flag && res.data) {
          setLinks(res.data);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">友情链接</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
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
    <div>
      <h1 className="text-3xl font-bold">友情链接</h1>
      <p className="mt-2 text-muted-foreground">
        感谢各位朋友的支持
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {links.map((link) => (
          <a
            key={link.id}
            href={
              /^https?:\/\//i.test(link.linkAddress)
                ? link.linkAddress
                : /^javascript:/i.test(link.linkAddress)
                  ? "#"
                  : `https://${link.linkAddress}`
            }
            target="_blank"
            rel="noopener noreferrer"
          >
            <Card className="h-full transition-shadow hover:shadow-lg">
              <CardHeader className="flex-row items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={link.linkAvatar} alt={link.linkName} />
                  <AvatarFallback>
                    {link.linkName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <CardTitle className="truncate text-base">
                    {link.linkName}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs">
                    {link.linkIntro}
                  </CardDescription>
                </div>
              </CardHeader>
            </Card>
          </a>
        ))}

        {links.length === 0 && (
          <p className="col-span-full text-center text-muted-foreground">
            暂无友链
          </p>
        )}
      </div>
    </div>
  );
}
