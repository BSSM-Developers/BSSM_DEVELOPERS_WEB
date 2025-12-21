"use client";

import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { DocsBlock } from "@/components/docs/DocsBlock";
import { ApiBlock } from "@/components/docs/ApiBlock";
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
      onAddBlock(index, { module: "docs_1", content: "" });
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


  // API 블록인 경우 특별한 렌더링
  if (block.module === "api" && block.apiData) {
    return (
      <BlockContainer>
        <ApiBlock
          apiData={block.apiData}
          editable={true}
          onChange={(updatedApiData) => onChange(index, { ...block, apiData: updatedApiData })}
        />
        <AddBlockButton onClick={() => onAddBlock(index)} />
      </BlockContainer>
    );
  }

  return (
    <BlockContainer>
      <DocsBlock module={block.module}>
        <input
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          data-block-id={(block as any).id}
          placeholder={focused ? "내용을 입력하세요" : ""}
          style={{
            width: "100%",
            border: "none",
            background: "white",
            padding: "2px 12px",
            borderRadius: "4px",
            font: "inherit",
            color: "inherit",
            outline: "none",
            margin: 0,
          }}
        />
      </DocsBlock>
      <AddBlockButton onClick={() => onAddBlock(index)} />
    </BlockContainer>
  );
}

const BlockContainer = styled.div`
  position: relative;
  width: 100%;
  padding: 0;
  &:hover > .add-block-area {
    opacity: 1;
  }
`;

const AddBlockButton = ({ onClick }: { onClick: () => void }) => (
  <AddBlockArea className="add-block-area">
    <AddCircle onClick={onClick}>+</AddCircle>
  </AddBlockArea>
);

const AddBlockArea = styled.div`
  position: absolute;
  bottom: -12px;
  left: 0;
  right: 0;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s ease;
  z-index: 10;
  pointer-events: none;
`;

const AddCircle = styled.button`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #58A6FF;
  color: white;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  margin: 0 10px;
  pointer-events: auto;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  &:hover {
    background: #1a7fec;
    transform: scale(1.2);
  }
`;


