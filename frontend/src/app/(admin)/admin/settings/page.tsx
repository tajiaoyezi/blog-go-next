"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function SettingsPage() {
  const [config, setConfig] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");

  useEffect(() => {
    api
      .get<string>("/website/config")
      .then((res) => {
        if (res.flag) {
          const value =
            typeof res.data === "string"
              ? res.data
              : JSON.stringify(res.data, null, 2);
          setConfig(value);
        }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "加载失败";
        setError(msg);
        toast.error(msg);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    // 验证 JSON 格式
    try {
      JSON.parse(config);
    } catch {
      toast.error("JSON 格式不正确，请检查后重试");
      return;
    }

    setSaving(true);
    try {
      const parsed = JSON.parse(config);
      // 校验顶层结构：必须是普通对象，拒绝危险键
      if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
        toast.error("配置必须是 JSON 对象");
        setSaving(false);
        return;
      }
      const dangerousKeys = Object.keys(parsed).filter(
        (k) => k === "__proto__" || k === "constructor" || k === "prototype",
      );
      if (dangerousKeys.length > 0) {
        toast.error(`包含不允许的键: ${dangerousKeys.join(", ")}`);
        setSaving(false);
        return;
      }
      const res = await api.put("/admin/website/config", { config: JSON.stringify(parsed) });
      if (res.flag) {
        toast.success("保存成功");
      } else {
        toast.error(res.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(config);
      setConfig(JSON.stringify(parsed, null, 2));
      toast.success("格式化完成");
    } catch {
      toast.error("JSON 格式不正确，无法格式化");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-muted-foreground">
        <p>加载失败: {error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">站点配置</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">JSON 配置</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>配置内容</Label>
            <Textarea
              className="font-mono text-sm min-h-[400px]"
              value={config}
              onChange={(e) => setConfig(e.target.value)}
              placeholder='{"key": "value"}'
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "保存中..." : "保存配置"}
            </Button>
            <Button variant="outline" onClick={handleFormat}>
              格式化 JSON
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
