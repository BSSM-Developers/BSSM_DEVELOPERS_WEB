"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  DndContext,
  closestCenter,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
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
import { findNodePathById } from "@/components/layout/treeUtils";
import {
  collectPageTargetsFromSidebar,
  createDefaultBlocksByModule,
} from "./helpers";
import { CustomApiPickerModal } from "./components/CustomApiPickerModal";
import { useDocsEditHydration } from "./hooks/useDocsEditHydration";
import { useDocsSelectionSync } from "./hooks/useDocsSelectionSync";
import { useCustomApiImport } from "./hooks/useCustomApiImport";
import { useDocsSave } from "./hooks/useDocsSave";
import type { SourcePageMeta } from "./hooks/shared";
import { useDocsBlockSelection } from "./hooks/useDocsBlockSelection";
import { useDocsBlockDnd } from "./hooks/useDocsBlockDnd";
import { useDocsBlockMutations } from "./hooks/useDocsBlockMutations";

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

const MarqueeSelectionBox = styled.div`
  position: fixed;
  border: 1px solid rgba(59, 130, 246, 0.8);
  background: rgba(59, 130, 246, 0.14);
  pointer-events: none;
  z-index: 5000;
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
    selectedBlockIds,
    setSelectedBlockIds,
    selectedBlockIdSet,
    primarySelectedBlockId,
    isMarqueeSelecting,
    marqueeRect,
    suppressContentClickRef,
    handleContentMouseDownCapture,
  } = useDocsBlockSelection({ docsBlocks, isReadonlyImportedApi });

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

  const focusBlockById = useCallback((blockId: string) => {
    const selector = `[data-block-id='${blockId}']`;
    const directInput = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      `input${selector}, textarea${selector}`
    );
    if (directInput) {
      directInput.focus();
      return;
    }
    const codeMirrorContent = document.querySelector<HTMLElement>(`${selector} .cm-content`);
    codeMirrorContent?.focus();
  }, []);

  const {
    handleBlockChange,
    handleAddBlock,
    handleDuplicateBlock,
    handleRemoveBlock,
    handleFocusMove,
  } = useDocsBlockMutations({
    docsBlocks,
    selectedBlockIds,
    selectedId,
    sidebarItems,
    setDocsBlocks,
    setSelectedBlockIds,
    setSidebarItems,
    sidebarUpdateTimeoutRef,
    focusBlockById,
  });

  const {
    sensors,
    groupDragOffset,
    isGroupDragging,
    handleDragStart,
    handleDragMove,
    handleDragCancel,
    handleDragEnd,
  } = useDocsBlockDnd({
    docsBlocks,
    selectedBlockIds,
    selectedBlockIdSet,
    setSelectedBlockIds,
    setDocsBlocks,
  });

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
        onMouseDownCapture={handleContentMouseDownCapture}
        onClick={() => {
          if (suppressContentClickRef.current) {
            suppressContentClickRef.current = false;
            return;
          }
          if (selectedBlockIds.length > 0) {
            setSelectedBlockIds([]);
            return;
          }
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
                focusBlockById(lastId);
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
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragMove={handleDragMove}
            onDragCancel={handleDragCancel}
            onDragEnd={handleDragEnd}
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
                  onChange={handleBlockChange}
                  onAddBlock={handleAddBlock}
                  onDuplicateBlock={handleDuplicateBlock}
                  onRemoveBlock={handleRemoveBlock}
                  onFocusMove={handleFocusMove}
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
