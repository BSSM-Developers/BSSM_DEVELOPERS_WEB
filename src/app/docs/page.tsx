"use client";

import { useEffect, useState } from "react";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsBlock } from "@/types/docs";
import { docsSubData, DocsSubEntry } from "./mock/docsSubData";
import { useDocsStore } from "@/store/docsStore";

type BlockWithId = DocsBlock & { id: string };

export default function DocsEditPage() {
  const selected = useDocsStore((s: any) => s.selected);
  const [blocks, setBlocks] = useState<BlockWithId[]>(docsSubData[0].blocks as BlockWithId[]);

  useEffect(() => {
    if (selected == null) return;
    if (typeof selected === "number") {
      setBlocks((docsSubData[selected]?.blocks as BlockWithId[]) ?? []);
      return;
    }
    const found: DocsSubEntry | undefined = docsSubData.find(d => d.id === String(selected));
    setBlocks((found?.blocks as BlockWithId[]) ?? []);
  }, [selected]);

  const handleBlockChange = (index: number, updated: DocsBlock) => {
    const copy = [...blocks];
    copy[index] = { ...copy[index], ...updated } as BlockWithId;
    setBlocks(copy);
    console.log(copy);
  };

  const handleAddBlock = (index: number, newBlock?: DocsBlock) => {
    const copy = [...blocks];
    const blockToInsert: BlockWithId = {
      id: crypto.randomUUID(),
      ...(newBlock ?? { module: "docs_1", content: "" }),
    } as BlockWithId;
    copy.splice(index + 1, 0, blockToInsert);
    setBlocks(copy);
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${blockToInsert.id}']`);
      el?.focus();
    }, 0);
    console.log(copy);
  };

  const handleRemoveBlock = (index: number) => {
    if (blocks.length === 0) return;
    const copy = [...blocks];
    const focusTargetId = index > 0 ? copy[index - 1]?.id : copy[index + 1]?.id;
    copy.splice(index, 1);
    setBlocks(copy);
    if (focusTargetId) {
      setTimeout(() => {
        const el = document.querySelector<HTMLInputElement>(`[data-block-id='${focusTargetId}']`);
        el?.focus();
      }, 0);
    }
    console.log(copy);
  };


  const handleFocusMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    const targetId = blocks[target]?.id;
    if (!targetId) return;
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${targetId}']`);
      el?.focus();
    }, 0);
  };

  return (
    <DocsLayout>
      <DocsHeader title="시작하기" breadcrumb={["가이드"]} />

      {blocks.map((block, i) => (
        <DocsBlockEditor
          key={block.id}
          index={i}
          block={block}
          onChange={(idx, updated) => handleBlockChange(idx, updated)}
          onAddBlock={handleAddBlock}
          onRemoveBlock={handleRemoveBlock}
          onFocusMove={handleFocusMove}
        />
      ))}
    </DocsLayout>
  );
}
