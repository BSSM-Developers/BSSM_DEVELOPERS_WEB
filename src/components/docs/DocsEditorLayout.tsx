"use client";


import { DocsBlock } from "@/types/docs";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";

export interface DocsEditorLayoutProps {
  blocks: DocsBlock[];
  onChange: (index: number, block: DocsBlock) => void;
  onAdd: (index: number, block?: DocsBlock) => void;
  onRemove: (index: number) => void;
  onDuplicate: (index: number) => void;
  onFocusMove?: (index: number, direction: "up" | "down") => void;
}

export function DocsEditorLayout({ blocks, onChange, onAdd, onRemove, onDuplicate, onFocusMove }: DocsEditorLayoutProps) {
  return (
    <div
      style={{ padding: "40px 80px", maxWidth: "800px", margin: "0 auto", minHeight: "500px", flex: 1, display: "flex", flexDirection: "column", cursor: "text" }}
      onClick={() => {
        if (blocks.length > 0) {
          const lastBlock = blocks[blocks.length - 1];
          if ((lastBlock.module === "docs_1" || lastBlock.module === "list" || lastBlock.module === "headline_1" || lastBlock.module === "headline_2") && lastBlock.content === "") {
            const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-block-id='${lastBlock.id}']`);
            el?.focus();
            return;
          }
        }
        if (blocks.length === 0) {
          onAdd(0, { module: "docs_1", content: "" });
        } else {
          onAdd(blocks.length);
        }
      }}
    >
      {blocks.length === 0 ? (
        <div style={{ padding: "20px 0", color: "#9CA3AF", cursor: "text" }}>
          내용을 입력하려면 클릭하세요...
        </div>
      ) : (
        blocks.map((block, i) => (
          <DocsBlockEditor
            key={block.id || i}
            index={i}
            block={block}
            onChange={onChange}
            onAddBlock={onAdd}
            onRemoveBlock={onRemove}
            onDuplicateBlock={onDuplicate}
            onFocusMove={onFocusMove}
          />
        ))
      )}
    </div>
  );
}
