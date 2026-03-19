"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from "react";
import type { DocsBlock } from "@/types/docs";

export type MarqueeRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

type UseDocsBlockSelectionParams = {
  docsBlocks: DocsBlock[];
  isReadonlyImportedApi: boolean;
};

const createMarqueeRect = (startX: number, startY: number, endX: number, endY: number): MarqueeRect => ({
  left: Math.min(startX, endX),
  top: Math.min(startY, endY),
  width: Math.abs(endX - startX),
  height: Math.abs(endY - startY),
});

const intersectsRect = (a: MarqueeRect, b: DOMRect): boolean => {
  if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) {
    return false;
  }
  const aRight = a.left + a.width;
  const aBottom = a.top + a.height;
  const bRight = b.left + b.width;
  const bBottom = b.top + b.height;
  return a.left < bRight && aRight > b.left && a.top < bBottom && aBottom > b.top;
};

export function useDocsBlockSelection({ docsBlocks, isReadonlyImportedApi }: UseDocsBlockSelectionParams) {
  const [selectedBlockIds, setSelectedBlockIds] = useState<string[]>([]);
  const [isMarqueeSelecting, setIsMarqueeSelecting] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState<MarqueeRect | null>(null);
  const marqueeStartRef = useRef<{ x: number; y: number } | null>(null);
  const suppressContentClickRef = useRef(false);

  useEffect(() => {
    const validIds = new Set(docsBlocks.map((block) => String(block.id)));
    setSelectedBlockIds((prev) => prev.filter((blockId) => validIds.has(blockId)));
  }, [docsBlocks]);

  useEffect(() => {
    if (selectedBlockIds.length === 0) {
      return;
    }

    const selectedSet = new Set(selectedBlockIds);
    const handlePointerDownCapture = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const isTextEditingTarget = Boolean(
        target.closest("input, textarea, [contenteditable='true'], .cm-editor, .cm-content, .cm-line")
      );
      if (isTextEditingTarget) {
        return;
      }

      const blockRoot = target.closest<HTMLElement>("[data-docs-block-root='true']");
      const clickedBlockId = blockRoot?.dataset.blockId;
      const clickedInsideSelectedBlock = Boolean(clickedBlockId && selectedSet.has(clickedBlockId));
      const clickedHandleControls = Boolean(target.closest(".gutter-controls"));
      if (clickedInsideSelectedBlock && clickedHandleControls) {
        return;
      }

      setSelectedBlockIds([]);
    };

    window.addEventListener("pointerdown", handlePointerDownCapture, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDownCapture, true);
    };
  }, [selectedBlockIds]);

  useEffect(() => {
    if (!isMarqueeSelecting) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const start = marqueeStartRef.current;
      if (!start) {
        return;
      }

      const nextRect = createMarqueeRect(start.x, start.y, event.clientX, event.clientY);
      setMarqueeRect(nextRect);

      const didMove = nextRect.width > 6 || nextRect.height > 6;
      if (!didMove) {
        return;
      }

      suppressContentClickRef.current = true;

      const nextSelected = docsBlocks
        .filter((block) => {
          const root = document.querySelector<HTMLElement>(
            `[data-docs-block-root='true'][data-block-id='${String(block.id)}']`
          );
          if (!root) {
            return false;
          }
          return intersectsRect(nextRect, root.getBoundingClientRect());
        })
        .map((block) => String(block.id));

      setSelectedBlockIds(nextSelected);
    };

    const handleMouseUp = () => {
      marqueeStartRef.current = null;
      setIsMarqueeSelecting(false);
      setMarqueeRect(null);
    };

    const previousUserSelect = document.body.style.userSelect;
    document.body.style.userSelect = "none";
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [docsBlocks, isMarqueeSelecting]);

  const handleContentMouseDownCapture = useCallback((event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || isReadonlyImportedApi) {
      return;
    }
    const target = event.target as HTMLElement;
    const startedInsideBlock = Boolean(target.closest("[data-docs-block-root='true']"));
    if (startedInsideBlock) {
      return;
    }
    const isInteractiveTarget = Boolean(
      target.closest(
        "input, textarea, button, [role='button'], [contenteditable='true'], .cm-editor, .cm-content, .gutter-controls"
      )
    );
    if (isInteractiveTarget) {
      return;
    }

    marqueeStartRef.current = { x: event.clientX, y: event.clientY };
    setIsMarqueeSelecting(true);
    setMarqueeRect(createMarqueeRect(event.clientX, event.clientY, event.clientX, event.clientY));
  }, [isReadonlyImportedApi]);

  const selectedBlockIdSet = useMemo(() => new Set(selectedBlockIds), [selectedBlockIds]);
  const primarySelectedBlockId = useMemo(() => {
    for (const block of docsBlocks) {
      const blockId = String(block.id);
      if (selectedBlockIdSet.has(blockId)) {
        return blockId;
      }
    }
    return null;
  }, [docsBlocks, selectedBlockIdSet]);

  return {
    selectedBlockIds,
    setSelectedBlockIds,
    selectedBlockIdSet,
    primarySelectedBlockId,
    isMarqueeSelecting,
    marqueeRect,
    suppressContentClickRef,
    handleContentMouseDownCapture,
  };
}
