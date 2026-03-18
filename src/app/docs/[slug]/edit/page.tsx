"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { SidebarModuleOption } from "@/components/layout/DocsSidebar";
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { DocsBlockViewer } from "@/components/docs/DocsBlockViewer";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import { useConfirm } from "@/hooks/useConfirm";
import { useDocsStore } from "@/store/docsStore";
import { type DocsItem } from "@/app/docs/api";
import { useDocsSidebarQuery } from "@/app/docs/queries";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import type { DocsBlock } from "@/types/docs";
import { findNodeById, findNodePathById, updateNode } from "@/components/layout/treeUtils";
import {
  collectPageTargetsFromSidebar,
  createDefaultBlocksByModule,
  inferMethodFromBlocks,
} from "./helpers";
import { CustomApiPickerModal } from "./components/CustomApiPickerModal";
import { useDocsEditHydration } from "./hooks/useDocsEditHydration";
import { useDocsSelectionSync } from "./hooks/useDocsSelectionSync";
import { useCustomApiImport } from "./hooks/useCustomApiImport";
import { useDocsSave } from "./hooks/useDocsSave";
import type { SourcePageMeta } from "./hooks/shared";

const ContentArea = styled.div`
  min-height: 500px;
  padding: 0 48px 120px;
  display: flex;
  flex-direction: column;
`;

const SaveButton = styled.button`
  width: 132px;
  height: 48px;
  border-radius: 10px;
  border: none;
  background: #16335c;
  color: white;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 10px 24px rgba(22, 51, 92, 0.2);

  &:hover {
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FloatingActions = styled.div`
  position: fixed;
  right: 32px;
  bottom: 32px;
  display: flex;
  align-items: center;
  gap: 10px;
  z-index: 4000;

  @media (max-width: 1280px) {
    right: 20px;
    bottom: 20px;
  }
`;

const EmptyText = styled.div`
  padding: 20px 0;
  color: #9ca3af;
`;

const ReadonlyNotice = styled.div`
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 600;
`;

const ErrorBox = styled.div`
  padding: 40px;
  text-align: center;
  color: #ef4444;
`;

export default function DocsEditPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const docsTypeFromQuery = searchParams.get("type");
  const docsTitleFromQuery = searchParams.get("title")?.trim() || "";

  const selectedId = useDocsStore((state) => state.selected);
  const setSelected = useDocsStore((state) => state.setSelected);
  const { confirm, ConfirmDialog } = useConfirm();

  const { data: sidebarData, isLoading: sidebarLoading, error: sidebarError } = useDocsSidebarQuery(slug || "");

  const [sidebarItems, setSidebarItems] = useState<SidebarNode[]>([]);
  const [contentMap, setContentMap] = useState<Record<string, DocsBlock[]>>({});
  const [docsBlocks, setDocsBlocks] = useState<DocsBlock[]>([]);
  const [sourcePageMap, setSourcePageMap] = useState<Record<string, SourcePageMeta>>({});
  const [sourcePageByPageIdMap, setSourcePageByPageIdMap] = useState<Record<string, SourcePageMeta>>({});
  const [pageEndpointMap, setPageEndpointMap] = useState<Record<string, string>>({});
  const [docsMeta, setDocsMeta] = useState<DocsItem | null>(null);

  const isCustomDocs =
    docsTypeFromQuery === "CUSTOM" ||
    docsTypeFromQuery === "CUSTOMIZE" ||
    docsMeta?.type === "CUSTOM" ||
    docsMeta?.type === "CUSTOMIZE";
  const effectiveProjectTitle = docsTitleFromQuery || docsMeta?.title || "";
  const initializedRef = useRef(false);
  const prevSelectedRef = useRef<string | null>(null);
  const docsBlocksRef = useRef<DocsBlock[]>([]);
  const contentMapRef = useRef<Record<string, DocsBlock[]>>({});
  const sourcePageMapRef = useRef<Record<string, SourcePageMeta>>({});
  const sourcePageByPageIdMapRef = useRef<Record<string, SourcePageMeta>>({});
  const pageEndpointMapRef = useRef<Record<string, string>>({});
  const sidebarUpdateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialSidebarSignatureRef = useRef("");
  const initialPageSignatureByMappedIdRef = useRef<Record<string, string>>({});

  useEffect(() => {
    docsBlocksRef.current = docsBlocks;
  }, [docsBlocks]);

  useEffect(() => {
    contentMapRef.current = contentMap;
  }, [contentMap]);

  useEffect(() => {
    sourcePageMapRef.current = sourcePageMap;
  }, [sourcePageMap]);

  useEffect(() => {
    sourcePageByPageIdMapRef.current = sourcePageByPageIdMap;
  }, [sourcePageByPageIdMap]);

  useEffect(() => {
    pageEndpointMapRef.current = pageEndpointMap;
  }, [pageEndpointMap]);

  useEffect(() => {
    return () => {
      if (sidebarUpdateTimeoutRef.current) {
        clearTimeout(sidebarUpdateTimeoutRef.current);
      }
    };
  }, []);

  const pageTargets = useMemo(() => collectPageTargetsFromSidebar(sidebarItems), [sidebarItems]);
  const customSidebarModuleOptions = useMemo<SidebarModuleOption[]>(
    () => [
      { label: "문서", module: "default" },
      { label: "그룹", module: "collapse" },
      { label: "API", module: "api" },
    ],
    []
  );

  useEffect(() => {
    const targetIds = new Set(pageTargets.map((target) => target.mappedId));

      setSourcePageMap((prev) => {
        const next = Object.fromEntries(
          Object.entries(prev).filter(([mappedId]) => targetIds.has(mappedId))
        );
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const isSame =
        prevKeys.length === nextKeys.length && prevKeys.every((key) => Object.prototype.hasOwnProperty.call(next, key));
        return isSame ? prev : next;
      });

      const targetPageIds = new Set(pageTargets.map((target) => target.pageMappedId));
      setSourcePageByPageIdMap((prev) => {
        const next = Object.fromEntries(
          Object.entries(prev).filter(([pageId]) => targetPageIds.has(pageId))
        );
        const prevKeys = Object.keys(prev);
        const nextKeys = Object.keys(next);
        const isSame =
          prevKeys.length === nextKeys.length && prevKeys.every((key) => Object.prototype.hasOwnProperty.call(next, key));
        return isSame ? prev : next;
      });

      setPageEndpointMap((prev) => {
      const next = Object.fromEntries(
        Object.entries(prev).filter(([mappedId]) => targetIds.has(mappedId))
      );
      const prevKeys = Object.keys(prev);
      const nextKeys = Object.keys(next);
      const isSame =
        prevKeys.length === nextKeys.length && prevKeys.every((key) => Object.prototype.hasOwnProperty.call(next, key));
      return isSame ? prev : next;
    });
  }, [pageTargets]);

  useDocsEditHydration({
    slug,
    sidebarData,
    isCustomDocs,
    effectiveProjectTitle,
    setSelected,
    docsMeta,
    setDocsMeta,
    setSidebarItems,
    setContentMap,
    setSourcePageMap,
    setSourcePageByPageIdMap,
    setPageEndpointMap,
    setDocsBlocks,
    initializedRef,
    prevSelectedRef,
    contentMapRef,
    sourcePageMapRef,
    sourcePageByPageIdMapRef,
    pageEndpointMapRef,
    initialSidebarSignatureRef,
    initialPageSignatureByMappedIdRef,
  });

  useDocsSelectionSync({
    initializedRef,
    prevSelectedRef,
    docsBlocksRef,
    contentMapRef,
    selectedId,
    sidebarItems,
    setContentMap,
    setDocsBlocks,
  });

  const selectedPathLabels = useMemo(() => {
    if (!selectedId) {
      return [];
    }
    return findNodePathById(sidebarItems, selectedId)?.map((node) => node.label).filter((label) => Boolean(label)) ?? [];
  }, [selectedId, sidebarItems]);
  const currentLabel = useMemo(() => {
    if (selectedPathLabels.length > 0) {
      return selectedPathLabels[selectedPathLabels.length - 1];
    }
    if (!selectedId) {
      return "문서 수정";
    }
    return pageTargets.find((target) => target.mappedId === selectedId)?.label || "문서 수정";
  }, [pageTargets, selectedId, selectedPathLabels]);
  const breadcrumbPath = useMemo(() => {
    if (selectedPathLabels.length > 1) {
      return selectedPathLabels.slice(0, -1);
    }
    return [sidebarItems[0]?.label || effectiveProjectTitle || "문서"];
  }, [effectiveProjectTitle, selectedPathLabels, sidebarItems]);
  const selectedTarget = useMemo(
    () => pageTargets.find((target) => target.mappedId === selectedId),
    [pageTargets, selectedId]
  );
  const isReadonlyImportedApi = Boolean(
    isCustomDocs && selectedTarget?.module === "api"
  );

  const {
    isApiPickerOpen,
    apiPickerLoading,
    apiPickerError,
    apiPickerOptions,
    openApiPicker,
    closeApiPicker,
    loadApiPickerOptions,
    handleSelectApiFromPicker,
  } = useCustomApiImport({
    slug,
    effectiveProjectTitle,
    setSelected,
    confirm,
    setSidebarItems,
    setContentMap,
    setDocsBlocks,
    setSourcePageMap,
    setSourcePageByPageIdMap,
    setPageEndpointMap,
    contentMapRef,
    sourcePageMapRef,
    sourcePageByPageIdMapRef,
    pageEndpointMapRef,
  });

  const { isSaving, handleSave } = useDocsSave({
    slug,
    isCustomDocs,
    effectiveProjectTitle,
    sidebarItems,
    contentMap,
    selectedId,
    pageTargets,
    docsMeta,
    setDocsMeta,
    docsBlocksRef,
    sourcePageMapRef,
    sourcePageByPageIdMapRef,
    pageEndpointMapRef,
    initialSidebarSignatureRef,
    initialPageSignatureByMappedIdRef,
    setSourcePageMap,
    setSourcePageByPageIdMap,
    setPageEndpointMap,
    confirm,
    router,
  });

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
  }, [selectedId, sidebarItems]);

  const handleAddBlock = useCallback((index: number, newBlock?: DocsBlock) => {
    const blockId = crypto.randomUUID();
    const blockToInsert = { id: blockId, ...(newBlock ?? { module: "docs_1", content: "" }) } as DocsBlock;
    setDocsBlocks((prev) => {
      const copy = [...prev];
      copy.splice(index + 1, 0, blockToInsert);
      return copy;
    });

    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-block-id='${blockId}']`);
      el?.focus();
    }, 0);
  }, []);

  const handleDuplicateBlock = useCallback((index: number) => {
    setDocsBlocks((prev) => {
      const source = prev[index];
      if (!source) {
        return prev;
      }
      const copy = [...prev];
      copy.splice(index + 1, 0, { ...source, id: crypto.randomUUID() });
      return copy;
    });
  }, []);

  const handleRemoveBlock = useCallback((index: number) => {
    setDocsBlocks((prev) => {
      if (prev.length <= 1) {
        return [{ id: crypto.randomUUID(), module: "docs_1", content: "" }];
      }
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }, []);

  const handleFocusMove = useCallback((index: number, direction: "up" | "down") => {
    const target = direction === "up" ? index - 1 : index + 1;
    const targetId = docsBlocks[target]?.id;
    if (!targetId) {
      return;
    }
    setTimeout(() => {
      const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[data-block-id='${targetId}']`);
      el?.focus();
    }, 0);
  }, [docsBlocks]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setDocsBlocks((prev) => {
      const oldIndex = prev.findIndex((block) => String(block.id) === String(active.id));
      const newIndex = prev.findIndex((block) => String(block.id) === String(over.id));
      if (oldIndex < 0 || newIndex < 0) {
        return prev;
      }
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  if (sidebarLoading) {
    return <BsdevLoader label="문서 정보를 불러오는 중입니다." size={52} minHeight="160px" />;
  }

  if (sidebarError) {
    return <ErrorBox>{sidebarError instanceof Error ? sidebarError.message : "문서를 불러오지 못했습니다."}</ErrorBox>;
  }

  return (
    <DocsLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      onSidebarChange={setSidebarItems}
      projectName={sidebarItems[0]?.label || effectiveProjectTitle || "문서 수정"}
      editable={true}
      sidebarModuleOptions={isCustomDocs ? customSidebarModuleOptions : undefined}
      disableApiRename={isCustomDocs}
      onRequestAddApi={
        isCustomDocs
          ? (intent) => {
              openApiPicker(intent);
            }
          : undefined
      }
    >
      <DocsHeader
        title={currentLabel}
        breadcrumb={breadcrumbPath}
        isApi={false}
      />

      <ContentArea
        onClick={() => {
          if (isReadonlyImportedApi) {
            return;
          }
          if (docsBlocks.length > 0) {
            const lastBlock = docsBlocks[docsBlocks.length - 1];
            const isTextBlock =
              lastBlock.module === "docs_1" ||
              lastBlock.module === "list" ||
              lastBlock.module === "headline_1" ||
              lastBlock.module === "headline_2";

            if (isTextBlock && (lastBlock.content || "") === "") {
              const lastId = String(lastBlock.id || "");
              if (lastId) {
                const el = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
                  `[data-block-id='${lastId}']`
                );
                el?.focus();
              }
              return;
            }

            handleAddBlock(docsBlocks.length);
            return;
          }

          if (docsBlocks.length === 0) {
            handleAddBlock(-1);
          }
        }}
      >
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
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={docsBlocks.map((block) => String(block.id))} strategy={verticalListSortingStrategy}>
              {docsBlocks.map((block, index) => (
                <DocsBlockEditor
                  key={String(block.id)}
                  index={index}
                  block={block}
                  domain=""
                  onChange={handleBlockChange}
                  onAddBlock={handleAddBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                  onRemoveBlock={handleRemoveBlock}
                  onFocusMove={handleFocusMove}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}
      </ContentArea>

      <FloatingActions>
        <SaveButton type="button" onClick={() => void handleSave()} disabled={isSaving}>
          {isSaving ? "저장 중..." : "저장하기"}
        </SaveButton>
      </FloatingActions>

      {ConfirmDialog}
      <CustomApiPickerModal
        isOpen={isApiPickerOpen}
        loading={apiPickerLoading}
        error={apiPickerError}
        options={apiPickerOptions}
        onClose={closeApiPicker}
        onRefresh={() => void loadApiPickerOptions()}
        onSelect={(option) => void handleSelectApiFromPicker(option)}
      />
    </DocsLayout>
  );
}
