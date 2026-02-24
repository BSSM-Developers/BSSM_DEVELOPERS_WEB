import { useState, useEffect, useRef, useCallback } from "react";
import { useDocsStore } from "@/store/docsStore";
import { DocsBlock } from "@/types/docs";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { Step } from "./types";
import { findNodeById, updateNode } from "@/components/layout/treeUtils";

export const useDocsEditor = (step: Step, title: string) => {
  const selectedId = useDocsStore((state) => state.selected);

  const [docsBlocks, setDocsBlocks] = useState<DocsBlock[]>([]);
  const [sidebarItems, setSidebarItems] = useState<SidebarNode[]>([]);
  const [contentMap, setContentMap] = useState<Record<string, DocsBlock[]>>({});

  const prevSelectedIdRef = useRef<string | null>(null);
  const docsBlocksRef = useRef(docsBlocks);
  const sidebarUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    docsBlocksRef.current = docsBlocks;
  }, [docsBlocks]);

  useEffect(() => {
    if (step === 'EDITOR' && sidebarItems.length === 0) {
      const initialItems: SidebarNode[] = [{
        id: 'draft-root',
        label: title || '새 문서',
        module: 'main',
        childrenItems: [{
          id: 'draft-doc',
          label: '시작하기',
          module: 'default',
          childrenItems: []
        }]
      }];
      setSidebarItems(initialItems);
      useDocsStore.setState({ selected: 'draft-doc' });
      setContentMap({
        'draft-doc': [{ id: Math.random().toString(36).substring(2, 11), module: "docs_1", content: "" }]
      });
    }
  }, [step, title, sidebarItems.length]);

  useEffect(() => {
    if (step !== 'EDITOR') return;

    const prevId = prevSelectedIdRef.current;
    const currentId = selectedId;

    if (prevId && prevId !== currentId) {
      setContentMap(prev => ({
        ...prev,
        [prevId]: docsBlocksRef.current
      }));
    }

    if (currentId && prevId !== currentId) {
      if (contentMap[currentId]) {
        setDocsBlocks(contentMap[currentId]);
      } else {
        const node = findNodeById(sidebarItems, currentId);

        if (node?.module === 'api') {
          const apiBlock: DocsBlock = {
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
          };
          setDocsBlocks([apiBlock]);
        } else {
          setDocsBlocks([{ id: Math.random().toString(36).substring(2, 11), module: "docs_1", content: "" }]);
        }
      }
    }

    prevSelectedIdRef.current = currentId;
  }, [selectedId, step, contentMap, sidebarItems]);

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

  const handleRemoveBlock = (index: number) => {
    setDocsBlocks(prev => {
      if (prev.length <= 1) {
        return [{ ...prev[0], module: "docs_1", content: "" }];
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
    handleRemoveBlock,
    handleFocusMove,
    saveCurrentBlock,
    contentMap,
    restoreEditorState
  };
};
