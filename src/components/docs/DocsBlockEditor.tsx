"use client";

import { useState, useEffect } from "react";
import { DocsBlock } from "@/components/docs/DocsBlock";
import { DocsBlock as DocsBlockType } from "@/types/docs";

interface DocsBlockEditorProps {
  block: DocsBlockType;
  index: number;
  onChange: (index: number, updated: DocsBlockType) => void;
  onAddBlock: (index: number, newBlock?: DocsBlockType) => void;
  onRemoveBlock?: (index: number) => void;
  onFocusMove?: (index: number, direction: "up" | "down") => void;
}

export function DocsBlockEditor({ block, index, onChange, onAddBlock, onRemoveBlock, onFocusMove }: DocsBlockEditorProps) {
  const [value, setValue] = useState(block.content ?? "");
  const [focused, setFocused] = useState(false);


  useEffect(() => {
    setValue(block.content ?? "");
  }, [block.content]);

  // 블록 타입 자동 판별
  const detectModuleType = (text: string): DocsBlockType["module"] => {
    if (/^##\s/.test(text)) return "headline_2";
    if (/^#\s/.test(text)) return "headline_1";
    if (/^-\s/.test(text)) return "list";
    return "docs_1";
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;

    const nextModule =
      block.module !== "docs_1"
        ? (text.trim() === "" ? "docs_1" : block.module)
        : detectModuleType(text);

    const cleaned =
      nextModule === "headline_2" ? text.replace(/^##\s*/, "") :
      nextModule === "headline_1" ? text.replace(/^#\s*/, "") :
      nextModule === "list" ? text.replace(/^[-*]\s*/, "") :
      text;

    setValue(cleaned);
    onChange(index, { ...block, module: nextModule, content: cleaned });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const composing = (e.nativeEvent as any)?.isComposing || (e as any).keyCode === 229;
    if (composing) return;

    if (e.key === "Enter") {
      e.preventDefault();
      onAddBlock(index, { module: "docs_1", content: ""});
      return;
    }

    if (e.key === "Backspace" && value === "") {
      e.preventDefault();
      onRemoveBlock?.(index);
      return;
    }

    if (e.key === "ArrowUp") {
      const caret = (e.currentTarget.selectionStart ?? 0);
      if (caret === 0) {
        e.preventDefault();
        onFocusMove?.(index, "up");
        return;
      }
    }

    if (e.key === "ArrowDown") {
      const caret = (e.currentTarget.selectionStart ?? 0);
      const len = e.currentTarget.value.length;
      if (caret === len) {
        e.preventDefault();
        onFocusMove?.(index, "down");
        return;
      }
    }

  };

  if (block.module === "space" || block.module === "big_space") {
    return <DocsBlock module={block.module} />;
  }

  return (
    <DocsBlock module={block.module}>
      <input
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        data-block-id={(block as any).id}
        placeholder={focused ? "내용을 입력하세요..." : ""}
        style={{
          width: "100%",
          border: "none",
          background: "transparent",
          font: "inherit",
          color: "inherit",
          outline: "none",
        }}
      />
    </DocsBlock>
  );
}
