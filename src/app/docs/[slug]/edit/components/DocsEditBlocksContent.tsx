"use client";

import type { MouseEventHandler } from "react";
import { DndContext, closestCenter, type DndContextProps } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { DocsBlock } from "@/types/docs";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsBlockViewer } from "@/components/docs/DocsBlockViewer";
import {
  DocsEditContentArea as ContentArea,
  DocsEditEmptyText as EmptyText,
  DocsEditReadonlyNotice as ReadonlyNotice,
  DocsEditMarqueeSelectionBox as MarqueeSelectionBox,
} from "../styles";
import type { MarqueeRect } from "../hooks/useDocsBlockSelection";

type DocsEditBlocksContentProps = {
  docsBlocks: DocsBlock[];
  isReadonlyImportedApi: boolean;
  onMouseDownCapture: MouseEventHandler<HTMLDivElement>;
  onClick: MouseEventHandler<HTMLDivElement>;
  sensors: DndContextProps["sensors"];
  onDragStart: NonNullable<DndContextProps["onDragStart"]>;
  onDragMove: NonNullable<DndContextProps["onDragMove"]>;
  onDragCancel: NonNullable<DndContextProps["onDragCancel"]>;
  onDragEnd: NonNullable<DndContextProps["onDragEnd"]>;
  selectedBlockIdSet: Set<string>;
  primarySelectedBlockId: string | null;
  isGroupDragging: boolean;
  groupDragOffset: { x: number; y: number };
  onChangeBlock: (index: number, updated: DocsBlock) => void;
  onAddBlock: (index: number, newBlock?: DocsBlock) => void;
  onDuplicateBlock: (index: number) => void;
  onRemoveBlock: (index: number) => void;
  onFocusMove: (index: number, direction: "up" | "down") => void;
  isMarqueeSelecting: boolean;
  marqueeRect: MarqueeRect | null;
};

export function DocsEditBlocksContent({
  docsBlocks,
  isReadonlyImportedApi,
  onMouseDownCapture,
  onClick,
  sensors,
  onDragStart,
  onDragMove,
  onDragCancel,
  onDragEnd,
  selectedBlockIdSet,
  primarySelectedBlockId,
  isGroupDragging,
  groupDragOffset,
  onChangeBlock,
  onAddBlock,
  onDuplicateBlock,
  onRemoveBlock,
  onFocusMove,
  isMarqueeSelecting,
  marqueeRect,
}: DocsEditBlocksContentProps) {
  return (
    <ContentArea onMouseDownCapture={onMouseDownCapture} onClick={onClick}>
      {isReadonlyImportedApi ? (
        <ReadonlyNotice>가져온 API 문서는 참조 전용입니다. 내용 수정은 원본 문서에서 진행해주세요.</ReadonlyNotice>
      ) : null}
      {docsBlocks.length === 0 ? (
        <EmptyText>내용을 입력하려면 클릭하세요...</EmptyText>
      ) : isReadonlyImportedApi ? (
        docsBlocks.map((block, index) => (
          <DocsBlockViewer key={String(block.id) || `${index}`} block={block} />
        ))
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={onDragStart}
          onDragMove={onDragMove}
          onDragCancel={onDragCancel}
          onDragEnd={onDragEnd}
        >
          <SortableContext items={docsBlocks.map((block) => String(block.id))} strategy={verticalListSortingStrategy}>
            {docsBlocks.map((block, index) => {
              const blockId = String(block.id);
              const isSelected = selectedBlockIdSet.has(blockId);
              const isPrimarySelected = primarySelectedBlockId === blockId;
              const showGroupDragGhost = isGroupDragging && isSelected && !isPrimarySelected;
              return (
                <DocsBlockEditor
                  key={blockId}
                  index={index}
                  block={block}
                  domain=""
                  onChange={onChangeBlock}
                  onAddBlock={onAddBlock}
                  onDuplicateBlock={onDuplicateBlock}
                  onRemoveBlock={onRemoveBlock}
                  onFocusMove={onFocusMove}
                  isSelected={isSelected}
                  isPrimarySelected={isPrimarySelected}
                  groupDragOffset={showGroupDragGhost ? groupDragOffset : null}
                />
              );
            })}
          </SortableContext>
        </DndContext>
      )}
      {isMarqueeSelecting && marqueeRect ? (
        <MarqueeSelectionBox
          style={{
            left: marqueeRect.left,
            top: marqueeRect.top,
            width: marqueeRect.width,
            height: marqueeRect.height,
          }}
        />
      ) : null}
    </ContentArea>
  );
}
