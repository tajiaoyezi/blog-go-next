"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface DraftData {
  id?: number;
  title: string;
  content: string;
  savedAt: string;
}

const DRAFT_KEY = "article-draft";
const MAX_DRAFTS = 3;

export function useAutoSave({
  id,
  title,
  content,
  interval = 30000,
  enabled = true,
}: {
  id?: number;
  title: string;
  content: string;
  interval?: number;
  enabled?: boolean;
}) {
  const [lastSaved, setLastSaved] = useState<number>(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveDraft = useCallback(() => {
    if (!enabled || !title.trim() || !content.trim()) return;

    try {
      const drafts: DraftData[] = JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]");
      
      // Remove existing draft for this article
      const filtered = drafts.filter((d) => d.id !== id);
      
      // Add new draft
      filtered.unshift({
        id,
        title: title.trim(),
        content: content.trim(),
        savedAt: new Date().toISOString(),
      });
      
      // Keep only MAX_DRAFTS
      const trimmed = filtered.slice(0, MAX_DRAFTS);
      
      localStorage.setItem(DRAFT_KEY, JSON.stringify(trimmed));
      setLastSaved(Date.now());
    } catch {
      // localStorage might be full or unavailable
    }
  }, [id, title, content, enabled]);

  const loadDraft = useCallback((): DraftData | null => {
    try {
      const drafts: DraftData[] = JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]");
      return drafts.find((d) => d.id === id) || drafts[0] || null;
    } catch {
      return null;
    }
  }, [id]);

  const clearDraft = useCallback(() => {
    try {
      const drafts: DraftData[] = JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]");
      const filtered = drafts.filter((d) => d.id !== id);
      localStorage.setItem(DRAFT_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore
    }
  }, [id]);

  // Auto save on interval
  useEffect(() => {
    if (!enabled) return;

    timerRef.current = setInterval(() => {
      saveDraft();
    }, interval);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [enabled, interval, saveDraft]);

  // Save on page unload
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = () => {
      saveDraft();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [enabled, saveDraft]);

  // Manual save shortcut (Ctrl+S)
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        saveDraft();
        toast.success("草稿已保存");
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [enabled, saveDraft]);

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    lastSaved,
  };
}
