"use client";

import { useState } from "react";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsBlock } from "@/types/docs";

type BlockWithId = DocsBlock & { id: string };

export default function DocsEditPage() {
  const [blocks, setBlocks] = useState<BlockWithId[]>([
    { id: "init-1", module: "headline_1", content: "시작하기" },
    { id: "init-2", module: "space" },
    {
      id: "init-3",
      module: "docs_1",
      content: "테스트 환경 주의점, 방화벽 설정, 지원 플랫폼 및 브라우저를 알아보세요",
    },
    { id: "init-4", module: "space" },
    { id: "init-5", module: "big_space" },
    { id: "init-6", module: "headline_2", content: "테스트 환경" },
    { id: "init-7", module: "space" },
    { id: "init-8", module: "space" },
    { id: "init-9", module: "space" },
    {
      id: "init-10",
      module: "docs_1",
      content:
        "BSSM Developers는 개발자의 편의를 위해 라이브 환경과 비슷한 테스트 환경을 제공하고 있어요",
    },
    {
      id: "init-11",
      module: "docs_1",
      content: "테스트 환경과 라이브 환경이 다른 점은 아래 표에서 확인해주세요",
    },
  ]);

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
