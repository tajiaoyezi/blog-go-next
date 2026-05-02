"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api";

interface Message {
  id: number;
  nickname: string;
  avatar: string;
  messageContent: string;
  createTime: string;
}

export default function MessagePage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 表单状态
  const [nickname, setNickname] = useState("");
  const [avatar, setAvatar] = useState("");
  const [content, setContent] = useState("");

  /** 加载留言列表 */
  const fetchMessages = () => {
    setError("");
    api
      .get<Message[]>("/messages")
      .then((res) => {
        if (res.flag && res.data) {
          setMessages(Array.isArray(res.data) ? res.data : []);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "加载失败"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  /** 提交留言 */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nickname.trim() || !content.trim()) return;

    setSubmitting(true);
    try {
      const res = await api.post("/messages", {
        nickname: nickname.trim(),
        avatar: avatar.trim(),
        messageContent: content.trim(),
      });
      if (res.flag) {
        // 提交成功，清空表单并刷新列表
        setNickname("");
        setAvatar("");
        setContent("");
        fetchMessages();
      }
    } catch {
      // 静默处理，生产环境应加 toast 提示
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-3xl font-bold">留言板</h1>
      <p className="mt-2 text-muted-foreground">
        欢迎留下你的足迹
      </p>

      {/* 留言表单 */}
      <Card className="mt-8">
        <CardContent className="pt-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="nickname">昵称 *</Label>
                <Input
                  id="nickname"
                  placeholder="你的昵称"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="avatar">头像 URL</Label>
                <Input
                  id="avatar"
                  placeholder="头像链接（可选）"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">留言内容 *</Label>
              <Textarea
                id="content"
                placeholder="说点什么吧..."
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                required
              />
            </div>
            <Button type="submit" disabled={submitting}>
              {submitting ? "提交中..." : "提交留言"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* 留言列表 */}
      <div className="mt-8 space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <p>加载失败: {error}</p>
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-muted-foreground">
            还没有留言，来做第一个留言的人吧！
          </p>
        ) : (
          messages.map((msg) => (
            <Card key={msg.id}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
<Avatar className="h-9 w-9 shrink-0">
                     {msg.avatar ? (
                       <Image
                         src={msg.avatar}
                         alt={msg.nickname}
                         className="object-cover"
                         fill
                         sizes="36px"
                       />
                     ) : (
                      <AvatarFallback>
                        {msg.nickname.slice(0, 1)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {msg.nickname}
                      </span>
                      <time className="text-xs text-muted-foreground">
                        {msg.createTime}
                      </time>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed">
                      {msg.messageContent}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
