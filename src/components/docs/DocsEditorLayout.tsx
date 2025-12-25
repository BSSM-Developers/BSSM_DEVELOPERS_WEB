"use client";

import { useState } from "react";
import { DocsBlock } from "@/types/docs";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";

export function DocsEditorLayout() {
  const [blocks, setBlocks] = useState<DocsBlock[]>([
    { module: "headline_1", content: "시작하기" },
    { module: "docs_1", content: "" },
  ]);

  const handleBlockChange = (index: number, updated: DocsBlock) => {
    const copy = [...blocks];
    copy[index] = updated;
    console.log(copy);
    setBlocks(copy);
  };

  const handleAddBlock = (index: number, newBlock?: DocsBlock) => {
    const copy = [...blocks];
    copy.splice(index + 1, 0, newBlock ?? { module: "docs_1", content: "   " });
    console.log(copy);
    setBlocks(copy);
  };

  const handleRemoveBlock = (index: number) => {
    if (blocks.length <= 1) {
      // 마지막 블록은 삭제하지 않고 내용만 초기화
      setBlocks([{ module: "docs_1", content: "" }]);
      return;
    }
    const copy = [...blocks];
    copy.splice(index, 1);
    setBlocks(copy);
  };

  return (
    <div style={{ padding: "40px 80px", maxWidth: "800px", margin: "0 auto", minHeight: "500px" }} onClick={() => {
      if (blocks.length === 0) {
        setBlocks([{ module: "docs_1", content: "" }]);
      }
    }}>
      {blocks.length === 0 ? (
        <div style={{ padding: "20px 0", color: "#9CA3AF", cursor: "text" }}>
          내용을 입력하려면 클릭하세요...
        </div>
      ) : (
        blocks.map((block, i) => (
          <DocsBlockEditor
            key={i}
            index={i}
            block={block}
            onChange={handleBlockChange}
            onAddBlock={handleAddBlock}
            onRemoveBlock={handleRemoveBlock}
          />
        ))
      )}
    </div>
  );
}
