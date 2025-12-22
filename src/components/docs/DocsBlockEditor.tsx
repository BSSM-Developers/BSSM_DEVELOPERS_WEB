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
  const detectModuleType = (text: string): { module: DocsBlockType["module"]; content: string; imageSrc?: string } | null => {
    // Headline 1: "# "
    if (/^#\s/.test(text)) return { module: "headline_1", content: text.replace(/^#\s*/, "") };
    // Headline 2: "## "
    if (/^##\s/.test(text)) return { module: "headline_2", content: text.replace(/^##\s*/, "") };
    // List: "- "
    if (/^-\s/.test(text)) return { module: "list", content: text.replace(/^-\s*/, "") };
    // Code: "``` " (trigger on space after backticks)
    if (/^```\s/.test(text)) return { module: "code", content: text.replace(/^```\s*/, "") };
    // Image: "![] " or "![url] "
    if (/^!\[(.*)\]\s/.test(text)) {
      const match = text.match(/^!\[(.*)\]\s/);
      return { module: "image", content: "", imageSrc: match ? match[1] : "" };
    }
    return null;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;

    if (block.module === "docs_1") {
      const detection = detectModuleType(text);
      if (detection) {
        setValue(detection.content);
        onChange(index, {
          ...block,
          module: detection.module,
          content: detection.content,
          imageSrc: detection.imageSrc
        });
        return;
      }
    } else if (text.trim() === "") {
      // Reset to docs_1 if cleared
      setValue("");
      onChange(index, { ...block, module: "docs_1", content: "" });
      return;
    }

    setValue(text);
    onChange(index, { ...block, content: text });
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

  // 이미지 블록인 경우
  if (block.module === "image") {
    return (
      <BlockContainer>
        <DocsBlock module="image">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
            {block.imageSrc && <img src={block.imageSrc} alt="Preview" style={{ maxWidth: '100%', borderRadius: '8px' }} />}
            <input
              value={block.imageSrc || ""}
              onChange={(e) => onChange(index, { ...block, imageSrc: e.target.value })}
              placeholder="이미지 URL을 입력하세요"
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              style={{
                width: "100%",
                border: "1px solid #E5E7EB",
                background: "white",
                padding: "4px 12px",
                borderRadius: "4px",
                fontSize: "12px",
                outline: "none",
              }}
            />
          </div>
        </DocsBlock>
        <AddBlockButton onClick={() => onAddBlock(index)} />
      </BlockContainer>
    );
  }

  const isCode = block.module === "code";
  const isList = block.module === "list";

  return (
    <BlockContainer>
      <DocsBlock module={block.module}>
        {isList ? (
          <li style={{ width: "100%" }}>
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
                padding: "2px 0",
                borderRadius: "4px",
                font: "inherit",
                color: "inherit",
                outline: "none",
                margin: 0,
              }}
            />
          </li>
        ) : isCode ? (
          <textarea
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onChange(index, { ...block, content: e.target.value });
            }}
            onKeyDown={(e: any) => {
              if (e.key === "Enter" && !e.shiftKey) {
                // Allow new lines in code block, but maybe Enter should still add a new block?
                // Usually in Notion-like editors, Shift+Enter is new line, Enter is new block.
                // But for code, Enter is usually new line.
              }
              handleKeyDown(e);
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            data-block-id={(block as any).id}
            placeholder={focused ? "코드를 입력하세요" : ""}
            style={{
              width: "100%",
              minHeight: "80px",
              border: "none",
              background: "transparent",
              padding: "0",
              fontFamily: "monospace",
              fontSize: "14px",
              color: "inherit",
              outline: "none",
              margin: 0,
              resize: "vertical",
            }}
          />
        ) : (
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
        )}
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


