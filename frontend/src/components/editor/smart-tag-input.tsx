"use client";

import React, { useState, useRef, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  availableTags: string[];
  maxTags?: number;
  placeholder?: string;
}

export function SmartTagInput({
  value,
  onChange,
  availableTags,
  maxTags = 5,
  placeholder = "输入标签...",
}: SmartTagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  const filteredTags = availableTags.filter(
    (tag) =>
      tag.toLowerCase().includes(input.toLowerCase()) && !value.includes(tag)
  );

  const suggestions = React.useMemo(() => {
    if (input.trim() && !value.includes(input.trim()) && !availableTags.includes(input.trim())) {
      return [`创建新标签: ${input.trim()}`, ...filteredTags];
    }
    return filteredTags;
  }, [input, value, availableTags, filteredTags]);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.replace(/^创建新标签: /, "").trim();
      if (!trimmed) return;

      if (value.length >= maxTags) {
        toast.error(`最多 ${maxTags} 个标签`);
        return;
      }

      if (value.includes(trimmed)) {
        toast.error("标签已存在");
        return;
      }

      // Validate tag format
      if (!/^[\u4e00-\u9fa5a-zA-Z0-9_-]+$/.test(trimmed)) {
        toast.error("标签只能包含中文、英文、数字、连字符和下划线");
        return;
      }

      if (trimmed.length > 20) {
        toast.error("标签长度不能超过 20 个字符");
        return;
      }

      onChange([...value, trimmed]);
      setInput("");
      setShowSuggestions(false);
      setSelectedIndex(0);
    },
    [value, maxTags, onChange]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        if (suggestions.length > 0) {
          addTag(suggestions[selectedIndex] || input);
        } else if (input.trim()) {
          addTag(input);
        }
      } else if (e.key === "Backspace" && !input && value.length > 0) {
        removeTag(value[value.length - 1]);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          Math.min(prev + 1, suggestions.length - 1)
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [input, value, suggestions, selectedIndex, addTag, removeTag]
  );

  return (
    <div className="relative">
      <div
        className={cn(
          "flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
          value.length >= maxTags && "opacity-60"
        )}
        onClick={focusInput}
      >
        {value.map((tag) => (
          <Badge
            key={tag}
            variant="secondary"
            className="cursor-pointer gap-1 pr-1 hover:bg-secondary/80"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="ml-0.5 rounded-full p-0.5 hover:bg-secondary-foreground/20"
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
        {value.length < maxTags && (
          <Input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setShowSuggestions(true);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => {
              // Delay to allow clicking suggestions
              setTimeout(() => setShowSuggestions(false), 200);
            }}
            placeholder={value.length === 0 ? placeholder : ""}
            className="h-6 min-w-[80px] flex-1 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
          />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          {suggestions.map((tag, index) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTag(tag)}
              className={cn(
                "flex w-full items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors",
                index === selectedIndex && "bg-accent text-accent-foreground"
              )}
            >
              {tag.startsWith("创建新标签:") ? (
                <>
                  <Plus className="mr-1 size-3" />
                  {tag}
                </>
              ) : (
                tag
              )}
            </button>
          ))}
        </div>
      )}

      <p className="mt-1 text-xs text-muted-foreground">
        {value.length}/{maxTags} 个标签，按 Enter 添加，Backspace 删除
      </p>
    </div>
  );
}
