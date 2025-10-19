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

  return (
    <div style={{ padding: "40px 80px", maxWidth: "800px", margin: "0 auto" }}>
      {blocks.map((block, i) => (
        <DocsBlockEditor
          key={i}
          index={i}
          block={block}
          onChange={handleBlockChange}
          onAddBlock={handleAddBlock}
        />
      ))}
    </div>
  );
}
