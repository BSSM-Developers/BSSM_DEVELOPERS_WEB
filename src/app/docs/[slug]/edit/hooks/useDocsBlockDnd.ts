"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type SetStateAction } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragCancelEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import type { DocsBlock } from "@/types/docs";

type UseDocsBlockDndParams = {
  docsBlocks: DocsBlock[];
  selectedBlockIds: string[];
  selectedBlockIdSet: Set<string>;
  setSelectedBlockIds: Dispatch<SetStateAction<string[]>>;
  setDocsBlocks: Dispatch<SetStateAction<DocsBlock[]>>;
};

export function useDocsBlockDnd({
  docsBlocks,
  selectedBlockIds,
  selectedBlockIdSet,
  setSelectedBlockIds,
  setDocsBlocks,
}: UseDocsBlockDndParams) {
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [groupDragOffset, setGroupDragOffset] = useState({ x: 0, y: 0 });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (!activeDragId) {
      return;
    }

    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "grabbing";

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      selection.removeAllRanges();
    }

    return () => {
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [activeDragId]);

  const resetDragVisualState = useCallback(() => {
    setActiveDragId(null);
    setGroupDragOffset({ x: 0, y: 0 });
  }, []);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const activeId = String(event.active.id);
    setSelectedBlockIds((prev) => (prev.includes(activeId) ? prev : [activeId]));
    setActiveDragId(activeId);
    setGroupDragOffset({ x: 0, y: 0 });
  }, [setSelectedBlockIds]);

  const handleDragMove = useCallback((event: DragMoveEvent) => {
    if (!activeDragId || selectedBlockIds.length <= 1 || !selectedBlockIdSet.has(activeDragId)) {
      return;
    }
    setGroupDragOffset(event.delta);
  }, [activeDragId, selectedBlockIdSet, selectedBlockIds.length]);

  const handleDragCancel = useCallback((_event: DragCancelEvent) => {
    resetDragVisualState();
  }, [resetDragVisualState]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      resetDragVisualState();
      return;
    }
    const activeId = String(active.id);
    const overId = String(over.id);

    setDocsBlocks((prev) => {
      const oldIndex = prev.findIndex((block) => String(block.id) === activeId);
      const newIndex = prev.findIndex((block) => String(block.id) === overId);
      if (oldIndex < 0 || newIndex < 0) {
        return prev;
      }

      const selectedSet = new Set(selectedBlockIds);
      if (!selectedSet.has(activeId) || selectedSet.size <= 1) {
        return arrayMove(prev, oldIndex, newIndex);
      }

      if (selectedSet.has(overId)) {
        return prev;
      }

      const movingBlocks = prev.filter((block) => selectedSet.has(String(block.id)));
      if (movingBlocks.length <= 1) {
        return arrayMove(prev, oldIndex, newIndex);
      }
      const remainingBlocks = prev.filter((block) => !selectedSet.has(String(block.id)));
      const remainingOverIndex = remainingBlocks.findIndex((block) => String(block.id) === overId);
      if (remainingOverIndex < 0) {
        return prev;
      }

      const insertIndex = oldIndex < newIndex ? remainingOverIndex + 1 : remainingOverIndex;
      const next = [...remainingBlocks];
      next.splice(insertIndex, 0, ...movingBlocks);
      return next;
    });
    resetDragVisualState();
  }, [resetDragVisualState, selectedBlockIds, setDocsBlocks]);

  const isGroupDragging = useMemo(
    () => Boolean(activeDragId && selectedBlockIds.length > 1 && selectedBlockIdSet.has(activeDragId)),
    [activeDragId, selectedBlockIdSet, selectedBlockIds.length]
  );

  return {
    sensors,
    activeDragId,
    groupDragOffset,
    isGroupDragging,
    handleDragStart,
    handleDragMove,
    handleDragCancel,
    handleDragEnd,
  };
}
