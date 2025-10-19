"use client";

import { useState } from "react";
import { DocsBlock } from "@/components/docs/DocsBlock";
import { DocsBlock as DocsBlockType } from "@/types/docs";

interface DocsBlockEditorProps {
  block: DocsBlockType;
  index: number;
  onChange: (index: number, updated: DocsBlockType) => void;
  onAddBlock: (index: number, newBlock?: DocsBlockType) => void;
  onRemoveBlock?: (index: number) => void;
}

export function DocsBlockEditor({ block, index, onChange, onAddBlock, onRemoveBlock }: DocsBlockEditorProps) {
  const [value, setValue] = useState(block.content ?? "");

  // 블록 타입 자동 판별
  const detectModuleType = (text: string): DocsBlockType["module"] => {
    if (/^##\s/.test(text)) return "headline_2";
    if (/^#\s/.test(text)) return "headline_1";
    if (/^-\s/.test(text)) return "list";
    return "docs_1";
  };

  // 입력 감지
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setValue(text);

    if (block.module === "space" && text.trim() !== "") {
      onChange(index, { ...block, module: "docs_1", content: text });
      return;
    }

    onChange(index, { ...block, content: text });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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
  };

  // 🔹 space / big_space 는 비어있는 표시만
  if (block.module === "space" || block.module === "big_space") {
    return <DocsBlock module={block.module} />;
  }

  return (
    <DocsBlock module={block.module}>
      <input
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        data-block-id={(block as any).id}
        placeholder="내용을 입력하세요..."
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
