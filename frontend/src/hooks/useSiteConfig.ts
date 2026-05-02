"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";

interface SiteConfig {
  name?: string;
  author?: string;
  [key: string]: unknown;
}

function parseConfig(raw: string | null): SiteConfig | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function useSiteConfig() {
  const [config, setConfig] = useState<SiteConfig | null>(null);

  useEffect(() => {
    api
      .get<string>("/website/config")
      .then((res) => {
        if (res.flag && res.data) {
          const parsed = parseConfig(
            typeof res.data === "string" ? res.data : JSON.stringify(res.data),
          );
          setConfig(parsed);
        }
      })
      .catch(() => {});
  }, []);

  return config;
}