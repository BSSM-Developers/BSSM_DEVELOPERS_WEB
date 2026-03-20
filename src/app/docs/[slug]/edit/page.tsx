"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import { useConfirm } from "@/hooks/useConfirm";
import { useDocsStore } from "@/store/docsStore";
import { type DocsItem } from "@/app/docs/api";
import { useDocsSidebarQuery } from "@/app/docs/queries";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import type { DocsBlock } from "@/types/docs";
import { CustomApiPickerModal } from "./components/CustomApiPickerModal";
import { useDocsEditHydration } from "./hooks/useDocsEditHydration";
import { useDocsSelectionSync } from "./hooks/useDocsSelectionSync";
import { useCustomApiImport } from "./hooks/useCustomApiImport";
import { useDocsSave } from "./hooks/useDocsSave";
import { useDocsEditViewModel } from "./hooks/useDocsEditViewModel";
import type { SourcePageMeta } from "./hooks/shared";
import { useDocsBlockSelection } from "./hooks/useDocsBlockSelection";
import { useDocsBlockDnd } from "./hooks/useDocsBlockDnd";
import { useDocsBlockMutations } from "./hooks/useDocsBlockMutations";
import {
  DocsEditSaveButton as SaveButton,
  DocsEditFloatingActions as FloatingActions,
  DocsEditErrorBox as ErrorBox,
} from "./styles";
import { DocsEditBlocksContent } from "./components/DocsEditBlocksContent";

const filterRecordByKeys = <T,>(prev: Record<string, T>, keys: Set<string>) => {
  const next = Object.fromEntries(Object.entries(prev).filter(([key]) => keys.has(key)));
  const prevKeys = Object.keys(prev);
  const nextKeys = Object.keys(next);
  const isSame =
    prevKeys.length === nextKeys.length && prevKeys.every((key) => Object.prototype.hasOwnProperty.call(next, key));
  return isSame ? prev : next;
};

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

  const {
    pageTargets,
    currentLabel,
    breadcrumbPath,
    isReadonlyImportedApi,
    customSidebarModuleOptions,
  } = useDocsEditViewModel({
    sidebarItems,
    selectedId,
    effectiveProjectTitle,
    isCustomDocs,
  });

  useEffect(() => {
    const targetIds = new Set(pageTargets.map((target) => target.mappedId));
    const targetPageIds = new Set(pageTargets.map((target) => target.pageMappedId));

    setSourcePageMap((prev) => filterRecordByKeys(prev, targetIds));
    setSourcePageByPageIdMap((prev) => filterRecordByKeys(prev, targetPageIds));
    setPageEndpointMap((prev) => filterRecordByKeys(prev, targetIds));
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
    const tryFocus = () => {
      const directInput = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
        `input${selector}, textarea${selector}`
      );
      if (directInput) {
        directInput.focus();
        const valueLength = directInput.value?.length ?? 0;
        directInput.setSelectionRange?.(valueLength, valueLength);
        return true;
      }
      const codeMirrorContent = document.querySelector<HTMLElement>(`${selector} .cm-content`);
      if (codeMirrorContent) {
        codeMirrorContent.focus();
        return true;
      }
      return false;
    };

    if (tryFocus()) {
      return;
    }

    let retryCount = 0;
    const retryFocus = () => {
      if (tryFocus()) {
        return;
      }
      retryCount += 1;
      if (retryCount < 6) {
        requestAnimationFrame(retryFocus);
      }
    };
    requestAnimationFrame(retryFocus);
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

  const handleContentClick = useCallback(() => {
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) {
      const start = active.selectionStart ?? 0;
      const end = active.selectionEnd ?? 0;
      if (start !== end) {
        return;
      }
    }

    const selectedText = window.getSelection()?.toString() ?? "";
    if (selectedText.length > 0) {
      return;
    }

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

    handleAddBlock(-1);
  }, [
    docsBlocks,
    focusBlockById,
    handleAddBlock,
    isReadonlyImportedApi,
    selectedBlockIds.length,
    setSelectedBlockIds,
    suppressContentClickRef,
  ]);

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

      <DocsEditBlocksContent
        docsBlocks={docsBlocks}
        isReadonlyImportedApi={isReadonlyImportedApi}
        onMouseDownCapture={handleContentMouseDownCapture}
        onClick={handleContentClick}
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragCancel={handleDragCancel}
        onDragEnd={handleDragEnd}
        selectedBlockIdSet={selectedBlockIdSet}
        primarySelectedBlockId={primarySelectedBlockId}
        isGroupDragging={isGroupDragging}
        groupDragOffset={groupDragOffset}
        onChangeBlock={handleBlockChange}
        onAddBlock={handleAddBlock}
        onDuplicateBlock={handleDuplicateBlock}
        onRemoveBlock={handleRemoveBlock}
        onFocusMove={handleFocusMove}
        isMarqueeSelecting={isMarqueeSelecting}
        marqueeRect={marqueeRect}
      />

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
