"use client";

import { useRef } from "react";

interface UseMarkdownEditorReturn {
  insertText: (before: string, after?: string) => void;
  wrapSelection: (before: string, after?: string) => void;
  insertAtCursor: (text: string) => void;
  setTextAreaRef: (ref: HTMLTextAreaElement | null) => void;
}

function getTextarea(): HTMLTextAreaElement | null {
  return document.querySelector('.w-md-editor-text-input') as HTMLTextAreaElement | null;
}

export function useMarkdownEditor(): UseMarkdownEditorReturn {
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const setTextAreaRef = (ref: HTMLTextAreaElement | null) => {
    textAreaRef.current = ref;
  };

  const insertText = (before: string, after: string = "") => {
    const textarea = textAreaRef.current || getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.slice(start, end);

    const newText = text.slice(0, start) + before + selectedText + after + text.slice(end);
    textarea.value = newText;

    const newCursorPos = start + before.length + selectedText.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();

    // Trigger input event for React state update
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const wrapSelection = (before: string, after?: string) => {
    const textarea = textAreaRef.current || getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.slice(start, end);

    const afterText = after || before;

    // Check if already wrapped
    const hasPrefix = text.slice(start - before.length, start) === before;
    const hasSuffix = text.slice(end, end + afterText.length) === afterText;

    let newText: string;
    let newStart: number;
    let newEnd: number;

    if (hasPrefix && hasSuffix && selectedText) {
      // Remove wrapping
      newText = text.slice(0, start - before.length) + selectedText + text.slice(end + afterText.length);
      newStart = start - before.length;
      newEnd = newStart + selectedText.length;
    } else {
      // Add wrapping
      newText = text.slice(0, start) + before + selectedText + afterText + text.slice(end);
      newStart = start + before.length;
      newEnd = newStart + selectedText.length;
    }

    textarea.value = newText;
    textarea.setSelectionRange(newStart, newEnd);
    textarea.focus();

    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  };

  const insertAtCursor = (insertText: string) => {
    const textarea = textAreaRef.current || getTextarea();
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;

    const newText = text.slice(0, start) + insertText + text.slice(start);
    textarea.value = newText;

    const newCursorPos = start + insertText.length;
    textarea.setSelectionRange(newCursorPos, newCursorPos);
    textarea.focus();

    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  };

  return {
    insertText,
    wrapSelection,
    insertAtCursor,
    setTextAreaRef,
  };
}
