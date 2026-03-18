import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import type { DocsBlock } from "@/types/docs";
import { findNodeById } from "@/components/layout/treeUtils";
import { createDefaultBlocksByModule } from "../helpers";

interface UseDocsSelectionSyncParams {
  initializedRef: MutableRefObject<boolean>;
  prevSelectedRef: MutableRefObject<string | null>;
  docsBlocksRef: MutableRefObject<DocsBlock[]>;
  contentMapRef: MutableRefObject<Record<string, DocsBlock[]>>;
  selectedId: string | null;
  sidebarItems: SidebarNode[];
  setContentMap: Dispatch<SetStateAction<Record<string, DocsBlock[]>>>;
  setDocsBlocks: Dispatch<SetStateAction<DocsBlock[]>>;
}

export const useDocsSelectionSync = ({
  initializedRef,
  prevSelectedRef,
  docsBlocksRef,
  contentMapRef,
  selectedId,
  sidebarItems,
  setContentMap,
  setDocsBlocks,
}: UseDocsSelectionSyncParams) => {
  useEffect(() => {
    if (!initializedRef.current || !selectedId) {
      return;
    }

    if (prevSelectedRef.current === selectedId) {
      return;
    }

    const prevId = prevSelectedRef.current;
    let nextMap = contentMapRef.current;
    let mapChanged = false;

    if (prevId && prevId !== selectedId) {
      nextMap = { ...nextMap, [prevId]: docsBlocksRef.current };
      mapChanged = true;
    }

    let selectedBlocks = nextMap[selectedId];
    if (!selectedBlocks) {
      const selectedNode = findNodeById(sidebarItems, selectedId);
      selectedBlocks = createDefaultBlocksByModule(
        selectedNode?.module,
        selectedNode?.label || "새 문서",
        selectedId,
        selectedNode?.method
      );
      nextMap = { ...nextMap, [selectedId]: selectedBlocks };
      mapChanged = true;
    }

    if (mapChanged) {
      contentMapRef.current = nextMap;
      setContentMap(nextMap);
    }

    setDocsBlocks(selectedBlocks);
    prevSelectedRef.current = selectedId;
  }, [contentMapRef, docsBlocksRef, initializedRef, prevSelectedRef, selectedId, setContentMap, setDocsBlocks, sidebarItems]);
};
