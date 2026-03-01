import { useState, useEffect, useRef, useCallback } from "react";
import { useDocsStore } from "@/store/docsStore";
import { DocsBlock } from "@/types/docs";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { Step } from "./types";
import { findNodeById, updateNode } from "@/components/layout/treeUtils";
import { arrayMove } from "@dnd-kit/sortable";

export const useDocsEditor = (step: Step, title: string) => {
  const selectedId = useDocsStore((state) => state.selected);

  const [docsBlocks, setDocsBlocks] = useState<DocsBlock[]>([]);
  const [sidebarItems, setSidebarItems] = useState<SidebarNode[]>([]);
  const [contentMap, setContentMap] = useState<Record<string, DocsBlock[]>>({});

  const prevSelectedIdRef = useRef<string | null>(null);
  const docsBlocksRef = useRef(docsBlocks);
  const contentMapRef = useRef<Record<string, DocsBlock[]>>({});
  const sidebarUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    docsBlocksRef.current = docsBlocks;
  }, [docsBlocks]);

  useEffect(() => {
    contentMapRef.current = contentMap;
  }, [contentMap]);

  useEffect(() => {
    if (step === 'EDITOR' && sidebarItems.length === 0) {
      const initialItems: SidebarNode[] = [{
        id: 'draft-root',
        label: title || '새 문서',
        module: 'main_title',
        childrenItems: [{
          id: 'draft-doc',
          label: '시작하기',
          module: 'default',
          childrenItems: []
        }]
      }];
      setSidebarItems(initialItems);
      useDocsStore.setState({ selected: 'draft-doc' });
      const initialMap: Record<string, DocsBlock[]> = {
        'draft-doc': [{ id: Math.random().toString(36).substring(2, 11), module: "docs_1", content: "" }]
      };
      setContentMap(initialMap);
      contentMapRef.current = initialMap;
    }
  }, [step, title, sidebarItems.length]);

  useEffect(() => {
    if (step !== 'EDITOR') return;

    const prevId = prevSelectedIdRef.current;
    const currentId = selectedId;
    if (!currentId) {
      prevSelectedIdRef.current = null;
      return;
    }
    if (prevId === currentId) {
      return;
    }

    let nextMap = contentMapRef.current;
    let mapChanged = false;

    if (prevId && prevId !== currentId) {
      nextMap = {
        ...nextMap,
        [prevId]: docsBlocksRef.current
      };
      mapChanged = true;
    }

    let nextBlocks = nextMap[currentId];
    if (!nextBlocks) {
      const node = findNodeById(sidebarItems, currentId);

      if (node?.module === 'api') {
        nextBlocks = [{
          id: Math.random().toString(36).substring(2, 11),
          module: "api",
          apiData: {
            id: node.id,
            name: node.label,
            method: node.method || "GET",
            endpoint: "",
            description: "",
            responseStatus: 200,
            responseMessage: "OK"
          }
        }];
      } else {
        nextBlocks = [{ id: Math.random().toString(36).substring(2, 11), module: "docs_1", content: "" }];
      }
      nextMap = {
        ...nextMap,
        [currentId]: nextBlocks
      };
      mapChanged = true;
    }

    if (mapChanged) {
      contentMapRef.current = nextMap;
      setContentMap(nextMap);
    }

    setDocsBlocks(nextBlocks);
    prevSelectedIdRef.current = currentId;
  }, [selectedId, step, sidebarItems]);

  useEffect(() => {
    if (!selectedId || sidebarItems.length === 0) return;

    const node = findNodeById(sidebarItems, selectedId);
    if (!node) return;

    setDocsBlocks(prev => {
      if (prev.length === 0) return prev;
      const copy = [...prev];
      let changed = false;

      if (node.module === 'api') {
        const apiBlockIndex = copy.findIndex(b => b.module === 'api');
        if (apiBlockIndex !== -1 && copy[apiBlockIndex].apiData && copy[apiBlockIndex].apiData.name !== node.label) {
          copy[apiBlockIndex] = {
            ...copy[apiBlockIndex],
            apiData: { ...copy[apiBlockIndex].apiData!, name: node.label }
          };
          changed = true;
        }
      } else {
        const firstBlock = copy[0];
        if (firstBlock && firstBlock.module === 'headline_1' && firstBlock.content !== node.label) {
          copy[0] = { ...firstBlock, content: node.label };
          changed = true;
        }
      }

      return changed ? copy : prev;
    });
  }, [sidebarItems, selectedId]);

  const handleBlockChange = (index: number, updated: DocsBlock) => {
    setDocsBlocks(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], ...updated };

      if (selectedId) {
        const currentBlock = copy[index];
        let labelToUpdate = "";
        let methodToUpdate: "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | undefined;

        if (currentBlock.module === "api" && currentBlock.apiData) {
          labelToUpdate = currentBlock.apiData.name;
          const m = currentBlock.apiData.method;
          if (m !== "UPDATE") {
            methodToUpdate = m;
          }
        } else if (index === 0 && currentBlock.module !== "api") {
          if (currentBlock.module === "headline_1") {
            labelToUpdate = currentBlock.content || "";
          }
        }

        if (labelToUpdate) {
          if (sidebarUpdateTimeoutRef.current) {
            clearTimeout(sidebarUpdateTimeoutRef.current);
          }

          sidebarUpdateTimeoutRef.current = setTimeout(() => {
            setSidebarItems((prevItems) =>
              updateNode(prevItems, selectedId, {
                label: labelToUpdate,
                ...(methodToUpdate ? { method: methodToUpdate as "GET" | "POST" | "DELETE" | "PATCH" | "PUT" } : {})
              })
            );
          }, 300);
        }
      }

      return copy;
    });
  };

  const handleAddBlock = (index: number, newBlock?: DocsBlock) => {
    const blockId = Math.random().toString(36).substring(2, 11);
    const blockToInsert = {
      id: blockId,
      ...(newBlock ?? { module: "docs_1", content: "" }),
    } as DocsBlock;

    setDocsBlocks(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, blockToInsert);
      return copy;
    });

    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${blockId}']`);
      el?.focus();
    }, 0);
  };

  const handleDuplicateBlock = (index: number) => {
    const sourceBlock = docsBlocks[index];
    if (!sourceBlock) return;

    const newBlock = {
      ...sourceBlock,
      id: Math.random().toString(36).substring(2, 11)
    };

    setDocsBlocks(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, newBlock);
      return copy;
    });
  };

  const handleRemoveBlock = (index: number) => {
    setDocsBlocks(prev => {
      if (prev.length <= 1) {
        return [{ ...prev[0], id: Math.random().toString(36).substring(2, 11), module: "docs_1", content: "" }];
      }

      const copy = [...prev];
      const focusTargetId = index > 0 ? copy[index - 1]?.id : copy[index + 1]?.id;
      copy.splice(index, 1);

      if (focusTargetId) {
        setTimeout(() => {
          const el = document.querySelector<HTMLInputElement>(`[data-block-id='${focusTargetId}']`);
          el?.focus();
        }, 0);
      }

      return copy;
    });
  };

  const handleFocusMove = (index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    const targetId = docsBlocks[target]?.id;
    if (!targetId) return;
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement>(`[data-block-id='${targetId}']`);
      el?.focus();
    }, 0);
  };

  const handleMoveBlock = (activeId: string, overId: string) => {
    if (activeId === overId) return;

    setDocsBlocks((prev) => {
      const oldIndex = prev.findIndex((b) => b.id === activeId);
      const newIndex = prev.findIndex((b) => b.id === overId);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const saveCurrentBlock = () => {
    if (selectedId) {
      setContentMap(prev => ({
        ...prev,
        [selectedId]: docsBlocks
      }));
    }
  };

  const restoreEditorState = useCallback((blocks: DocsBlock[], items: SidebarNode[], map: Record<string, DocsBlock[]>) => {
    setDocsBlocks(blocks);
    setSidebarItems(items);
    setContentMap(map);
  }, []);

  return {
    docsBlocks,
    sidebarItems,
    setSidebarItems,
    handleBlockChange,
    handleAddBlock,
    handleDuplicateBlock,
    handleRemoveBlock,
    handleFocusMove,
    handleMoveBlock,
    saveCurrentBlock,
    contentMap,
    restoreEditorState
  };
};
