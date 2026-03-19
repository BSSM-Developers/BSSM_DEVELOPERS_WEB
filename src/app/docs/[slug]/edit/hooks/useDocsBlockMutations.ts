"use client";

import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { DocsBlock } from "@/types/docs";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { findNodeById, updateNode } from "@/components/layout/treeUtils";
import { inferMethodFromBlocks } from "../helpers";

type UseDocsBlockMutationsParams = {
  docsBlocks: DocsBlock[];
  selectedBlockIds: string[];
  selectedId: string | null;
  sidebarItems: SidebarNode[];
  setDocsBlocks: Dispatch<SetStateAction<DocsBlock[]>>;
  setSelectedBlockIds: Dispatch<SetStateAction<string[]>>;
  setSidebarItems: Dispatch<SetStateAction<SidebarNode[]>>;
  sidebarUpdateTimeoutRef: MutableRefObject<ReturnType<typeof setTimeout> | null>;
  focusBlockById: (blockId: string) => void;
};

export function useDocsBlockMutations({
  docsBlocks,
  selectedBlockIds,
  selectedId,
  sidebarItems,
  setDocsBlocks,
  setSelectedBlockIds,
  setSidebarItems,
  sidebarUpdateTimeoutRef,
  focusBlockById,
}: UseDocsBlockMutationsParams) {
  const handleBlockChange = useCallback((index: number, updated: DocsBlock) => {
    setDocsBlocks((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updated };

      if (selectedId) {
        const currentBlock = copy[index];
        let labelToUpdate = "";
        let methodToUpdate: SidebarNode["method"] | undefined;

        if (currentBlock.module === "api" && currentBlock.apiData) {
          labelToUpdate = currentBlock.apiData.name || "";
          methodToUpdate = currentBlock.apiData.method;
        } else if (index === 0 && currentBlock.module === "headline_1") {
          labelToUpdate = currentBlock.content || "";
        }

        if (labelToUpdate || methodToUpdate) {
          if (sidebarUpdateTimeoutRef.current) {
            clearTimeout(sidebarUpdateTimeoutRef.current);
          }

          sidebarUpdateTimeoutRef.current = setTimeout(() => {
            setSidebarItems((prevItems) =>
              updateNode(prevItems, selectedId, {
                ...(labelToUpdate ? { label: labelToUpdate } : {}),
                ...(methodToUpdate ? { method: methodToUpdate } : {}),
              })
            );
          }, 250);
        } else {
          const selectedNode = findNodeById(sidebarItems, selectedId);
          if (selectedNode?.module === "api") {
            const inferredMethod = inferMethodFromBlocks(copy);
            if (inferredMethod && selectedNode.method !== inferredMethod) {
              setSidebarItems((prevItems) => updateNode(prevItems, selectedId, { method: inferredMethod }));
            }
          }
        }
      }

      return copy;
    });
  }, [selectedId, setDocsBlocks, setSidebarItems, sidebarItems, sidebarUpdateTimeoutRef]);

  const handleAddBlock = useCallback((index: number, newBlock?: DocsBlock) => {
    const blockId = crypto.randomUUID();
    const blockToInsert = { id: blockId, ...(newBlock ?? { module: "docs_1", content: "" }) } as DocsBlock;
    setDocsBlocks((prev) => {
      const copy = [...prev];
      const target = copy[index];
      const selectedSet = new Set(selectedBlockIds);
      const shouldApplyToSelection =
        selectedSet.size > 1 &&
        target &&
        selectedSet.has(String(target.id));

      if (!shouldApplyToSelection) {
        copy.splice(index + 1, 0, blockToInsert);
        return copy;
      }

      const selectedIndexes = copy
        .map((block, i) => (selectedSet.has(String(block.id)) ? i : -1))
        .filter((i) => i >= 0);
      const lastSelectedIndex = selectedIndexes[selectedIndexes.length - 1] ?? index;
      copy.splice(lastSelectedIndex + 1, 0, blockToInsert);
      return copy;
    });

    setTimeout(() => {
      focusBlockById(blockId);
    }, 0);
  }, [focusBlockById, selectedBlockIds, setDocsBlocks]);

  const handleDuplicateBlock = useCallback((index: number) => {
    let nextSelectedIds: string[] = [];
    setDocsBlocks((prev) => {
      const source = prev[index];
      if (!source) {
        return prev;
      }

      const selectedSet = new Set(selectedBlockIds);
      const shouldApplyToSelection = selectedSet.size > 1 && selectedSet.has(String(source.id));
      const selectedIndexes = shouldApplyToSelection
        ? prev.map((block, i) => (selectedSet.has(String(block.id)) ? i : -1)).filter((i) => i >= 0)
        : [index];
      const sourceBlocks = selectedIndexes.map((i) => prev[i]).filter(Boolean);
      const duplicatedBlocks = sourceBlocks.map((block) => ({ ...block, id: crypto.randomUUID() }));
      nextSelectedIds = duplicatedBlocks.map((block) => String(block.id));

      const copy = [...prev];
      const insertIndex = selectedIndexes[selectedIndexes.length - 1] ?? index;
      copy.splice(insertIndex + 1, 0, ...duplicatedBlocks);
      return copy;
    });

    if (nextSelectedIds.length > 0) {
      setSelectedBlockIds(nextSelectedIds);
    }
  }, [selectedBlockIds, setDocsBlocks, setSelectedBlockIds]);

  const handleRemoveBlock = useCallback((index: number) => {
    let shouldClearSelection = false;
    setDocsBlocks((prev) => {
      if (prev.length <= 1) {
        shouldClearSelection = true;
        return [{ id: crypto.randomUUID(), module: "docs_1", content: "" }];
      }

      const target = prev[index];
      if (!target) {
        return prev;
      }

      const selectedSet = new Set(selectedBlockIds);
      const shouldApplyToSelection = selectedSet.size > 1 && selectedSet.has(String(target.id));
      if (!shouldApplyToSelection) {
        const copy = [...prev];
        copy.splice(index, 1);
        shouldClearSelection = selectedSet.has(String(target.id));
        return copy;
      }

      const next = prev.filter((block) => !selectedSet.has(String(block.id)));
      shouldClearSelection = true;
      return next.length > 0 ? next : [{ id: crypto.randomUUID(), module: "docs_1", content: "" }];
    });

    if (shouldClearSelection) {
      setSelectedBlockIds([]);
    }
  }, [selectedBlockIds, setDocsBlocks, setSelectedBlockIds]);

  const handleFocusMove = useCallback((index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    const targetId = docsBlocks[target]?.id;
    if (!targetId) {
      return;
    }
    setTimeout(() => {
      focusBlockById(targetId);
    }, 0);
  }, [docsBlocks, focusBlockById]);

  return {
    handleBlockChange,
    handleAddBlock,
    handleDuplicateBlock,
    handleRemoveBlock,
    handleFocusMove,
  };
}
