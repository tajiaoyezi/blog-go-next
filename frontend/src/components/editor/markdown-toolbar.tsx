"use client";

import React from "react";
import { Bold, Italic, Strikethrough, Heading, Quote, Code, Link, Image, List, ListOrdered, Minus, Eye } from "lucide-react";

interface MarkdownToolbarProps {
  onCommand: (command: string) => void;
  disabled?: boolean;
}

const commands = [
  {
    id: "bold",
    icon: Bold,
    label: "加粗",
    shortcut: "Ctrl+B",
  },
  {
    id: "italic",
    icon: Italic,
    label: "斜体",
    shortcut: "Ctrl+I",
  },
  {
    id: "strikethrough",
    icon: Strikethrough,
    label: "删除线",
    shortcut: "",
  },
  {
    id: "heading",
    icon: Heading,
    label: "标题",
    shortcut: "Ctrl+Shift+1",
  },
  {
    id: "quote",
    icon: Quote,
    label: "引用",
    shortcut: "",
  },
  {
    id: "code",
    icon: Code,
    label: "行内代码",
    shortcut: "Ctrl+Shift+K",
  },
  {
    id: "codeBlock",
    icon: Eye,
    label: "代码块",
    shortcut: "Ctrl+Shift+C",
  },
  {
    id: "link",
    icon: Link,
    label: "链接",
    shortcut: "Ctrl+K",
  },
  {
    id: "image",
    icon: Image,
    label: "图片",
    shortcut: "",
  },
  {
    id: "hr",
    icon: Minus,
    label: "分割线",
    shortcut: "",
  },
  {
    id: "unorderedList",
    icon: List,
    label: "无序列表",
    shortcut: "",
  },
  {
    id: "orderedList",
    icon: ListOrdered,
    label: "有序列表",
    shortcut: "",
  },
];

const groups = [
  ["bold", "italic", "strikethrough"],
  ["heading", "quote", "code", "codeBlock"],
  ["link", "image", "hr"],
  ["unorderedList", "orderedList"],
];

export function MarkdownToolbar({ onCommand, disabled }: MarkdownToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-t-md border border-b-0 bg-muted/50 px-2 py-1.5">
      {groups.map((group, groupIndex) => (
        <React.Fragment key={groupIndex}>
          {groupIndex > 0 && (
            <div className="mx-1 h-5 w-px bg-border" />
          )}
          {group.map((cmdId) => {
            const cmd = commands.find((c) => c.id === cmdId);
            if (!cmd) return null;
            const Icon = cmd.icon;
            return (
              <button
                key={cmd.id}
                type="button"
                disabled={disabled}
                onClick={() => onCommand(cmd.id)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
                title={`${cmd.label}${cmd.shortcut ? ` (${cmd.shortcut})` : ""}`}
                aria-label={cmd.label}
              >
                <Icon className="size-4" />
              </button>
            );
          })}
        </React.Fragment>
      ))}
    </div>
  );
}
