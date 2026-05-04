"use client";

import { useEffect } from "react";
import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export type ViewMode = "grid" | "list";

interface ViewToggleProps {
  view: ViewMode;
  onChange: (view: ViewMode) => void;
}

const STORAGE_KEY = "album-view-mode";

export function ViewToggle({ view, onChange }: ViewToggleProps) {
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ViewMode | null;
    if (saved && saved !== view) {
      onChange(saved);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (newView: ViewMode) => {
    localStorage.setItem(STORAGE_KEY, newView);
    onChange(newView);
  };

  return (
    <div className="flex items-center rounded-md border">
      <button
        type="button"
        aria-label="网格视图"
        data-active={view === "grid"}
        onClick={() => handleChange("grid")}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center transition-colors",
          view === "grid"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50"
        )}
      >
        <LayoutGrid className="size-4" />
      </button>
      <button
        type="button"
        aria-label="列表视图"
        data-active={view === "list"}
        onClick={() => handleChange("list")}
        className={cn(
          "inline-flex h-8 w-8 items-center justify-center transition-colors",
          view === "list"
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50"
        )}
      >
        <List className="size-4" />
      </button>
    </div>
  );
}

export function getSavedViewMode(): ViewMode {
  if (typeof window === "undefined") return "grid";
  return (localStorage.getItem(STORAGE_KEY) as ViewMode) || "grid";
}
