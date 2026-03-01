"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "@emotion/styled";
import { useParams, useRouter } from "next/navigation";
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
import { DocsBlockEditor } from "@/components/docs/DocsBlockEditor";
import { useConfirm } from "@/hooks/useConfirm";
import { useDocsStore } from "@/store/docsStore";
import { docsApi } from "@/app/docs/api";
import { useDocsSidebarQuery } from "@/app/docs/queries";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import type { ApiParam, DocsBlock } from "@/types/docs";
import { findNodeById, updateNode } from "@/components/layout/treeUtils";
import {
  buildPageSignature,
  buildSidebarSignature,
  collectPageTargetsFromSidebar,
  createDefaultBlocksByModule,
  inferMethodFromBlocks,
  nodesToSidebarBlockRequests,
  sidebarBlocksToNodes,
  toDocsPageBlockRequests,
  toEditorBlocksWithOptions,
} from "./helpers";

const ContentArea = styled.div`
  min-height: 500px;
  padding: 0 48px 120px;
  display: flex;
  flex-direction: column;
`;

const SaveButton = styled.button`
  position: fixed;
  right: 32px;
  bottom: 32px;
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
  z-index: 4000;
  box-shadow: 0 10px 24px rgba(22, 51, 92, 0.2);

  &:hover {
    filter: brightness(1.05);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  @media (max-width: 1280px) {
    right: 20px;
    bottom: 20px;
  }
`;

const EmptyText = styled.div`
  padding: 20px 0;
  color: #9ca3af;
`;

const LoadingBox = styled.div`
  padding: 40px;
  text-align: center;
  color: #6b7280;
`;

const ErrorBox = styled.div`
  padding: 40px;
  text-align: center;
  color: #ef4444;
`;

export default function DocsEditPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const selectedId = useDocsStore((state) => state.selected);
  const setSelected = useDocsStore((state) => state.setSelected);
  const { confirm, ConfirmDialog } = useConfirm();

  const { data: sidebarData, isLoading: sidebarLoading, error: sidebarError } = useDocsSidebarQuery(slug || "");

  const [sidebarItems, setSidebarItems] = useState<SidebarNode[]>([]);
  const [contentMap, setContentMap] = useState<Record<string, DocsBlock[]>>({});
  const [docsBlocks, setDocsBlocks] = useState<DocsBlock[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const initializedRef = useRef(false);
  const prevSelectedRef = useRef<string | null>(null);
  const docsBlocksRef = useRef<DocsBlock[]>([]);
  const contentMapRef = useRef<Record<string, DocsBlock[]>>({});
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
    return () => {
      if (sidebarUpdateTimeoutRef.current) {
        clearTimeout(sidebarUpdateTimeoutRef.current);
      }
    };
  }, []);

  const pageTargets = useMemo(() => collectPageTargetsFromSidebar(sidebarItems), [sidebarItems]);

  useEffect(() => {
    const hydrate = async () => {
      if (!slug || !sidebarData?.data?.blocks || initializedRef.current) {
        return;
      }

      const nodes = sidebarBlocksToNodes(sidebarData.data.blocks);
      const targets = collectPageTargetsFromSidebar(nodes);

      if (targets.length === 0) {
        setSidebarItems(nodes);
        setContentMap({});
        setDocsBlocks([]);
        contentMapRef.current = {};
        initialSidebarSignatureRef.current = buildSidebarSignature(nodes);
        initialPageSignatureByMappedIdRef.current = {};
        initializedRef.current = true;
        return;
      }

      const loadedContentMap: Record<string, DocsBlock[]> = {};
      const loadedSignatureMap: Record<string, string> = {};
      let normalizedNodes = nodes;

      await Promise.all(
        targets.map(async (target) => {
          try {
            const response = await docsApi.getPage(slug, target.mappedId);
            const blocks = toEditorBlocksWithOptions(response.data.docsBlocks, {
              preferredModule: target.module,
              method: target.method,
              label: target.label,
              id: target.mappedId,
            });
            loadedContentMap[target.mappedId] = blocks;
            loadedSignatureMap[target.mappedId] = buildPageSignature(blocks);

            if (target.module === "api") {
              const inferredMethod = inferMethodFromBlocks(blocks);
              if (inferredMethod && !target.method) {
                normalizedNodes = updateNode(normalizedNodes, target.mappedId, { method: inferredMethod });
              }
            }
          } catch {
            const fallback = createDefaultBlocksByModule(
              target.module,
              target.label,
              target.mappedId,
              target.method
            );
            loadedContentMap[target.mappedId] = fallback;
            loadedSignatureMap[target.mappedId] = buildPageSignature(fallback);
          }
        })
      );

      const firstMappedId = targets[0].mappedId;

      setSidebarItems(normalizedNodes);
      setContentMap(loadedContentMap);
      setSelected(firstMappedId);
      setDocsBlocks(loadedContentMap[firstMappedId] ?? []);
      contentMapRef.current = loadedContentMap;

      initialSidebarSignatureRef.current = buildSidebarSignature(normalizedNodes);
      initialPageSignatureByMappedIdRef.current = loadedSignatureMap;
      prevSelectedRef.current = firstMappedId;
      initializedRef.current = true;
    };

    void hydrate();
  }, [setSelected, sidebarData, slug]);

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
  }, [selectedId, sidebarItems]);

  const currentLabel = useMemo(() => {
    if (!selectedId) {
      return "문서 수정";
    }
    return pageTargets.find((target) => target.mappedId === selectedId)?.label || "문서 수정";
  }, [pageTargets, selectedId]);

  const validateApiParams = useCallback((params: ApiParam[] | undefined, typeLabel: string, apiName: string): string | null => {
    if (!params || params.length === 0) {
      return null;
    }

    for (const param of params) {
      if (!param.name || !param.description) {
        return `[${apiName}] ${typeLabel} 파라미터의 이름과 설명을 모두 채워주세요.`;
      }
    }

    return null;
  }, []);

  const validateBeforeSave = useCallback((blocksMap: Record<string, DocsBlock[]>): string | null => {
    let hasApiModule = false;
    const uniqueApis = new Set<string>();

    for (const target of pageTargets) {
      const blocks = blocksMap[target.mappedId] || [];
      for (const block of blocks) {
        if (block.module !== "api" || !block.apiData) {
          continue;
        }

        hasApiModule = true;
        const api = block.apiData;
        const apiName = api.name || target.label || "API 문서";

        if (!api.endpoint || !api.endpoint.trim()) {
          return `[${apiName}] 엔드포인트를 입력해주세요.`;
        }

        const methodEndpoint = `${api.method} ${api.endpoint}`;
        if (uniqueApis.has(methodEndpoint)) {
          return `중복된 API가 존재합니다: ${methodEndpoint}`;
        }
        uniqueApis.add(methodEndpoint);

        if (api.pathParams && api.pathParams.length > 0) {
          for (const pathParam of api.pathParams) {
            if (!pathParam.name) {
              continue;
            }
            if (!api.endpoint.includes(`{${pathParam.name}}`)) {
              return `[${apiName}] 선언된 Path 파라미터 '{${pathParam.name}}'가 엔드포인트 문자열에 존재하지 않습니다.`;
            }
          }
        }

        const hardCodedNumberRegex = /\/[0-9]+(\/|$)/;
        const hardCodedUuidRegex = /\/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(\/|$)/;
        if (hardCodedNumberRegex.test(api.endpoint) || hardCodedUuidRegex.test(api.endpoint)) {
          return `[${apiName}] 메인 엔드포인트 경로에 실제 파라미터 값을 직접 넣을 수 없습니다.`;
        }

        const parameterErrors = [
          validateApiParams(api.headerParams, "Header", apiName),
          validateApiParams(api.cookieParams, "Cookie", apiName),
          validateApiParams(api.pathParams, "Path", apiName),
          validateApiParams(api.queryParams, "Query", apiName),
          validateApiParams(api.bodyParams, "Body", apiName),
          validateApiParams(api.responseParams, "Response Body", apiName),
        ].filter(Boolean);

        if (parameterErrors.length > 0) {
          return parameterErrors[0] || null;
        }
      }
    }

    if (!hasApiModule) {
      return "최소 1개 이상의 API 문서(모듈)가 필요합니다.";
    }

    return null;
  }, [pageTargets, validateApiParams]);

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

  const handleSave = useCallback(async () => {
    if (!slug || isSaving) {
      return;
    }

    const mergedMap = {
      ...contentMap,
      ...(selectedId ? { [selectedId]: docsBlocksRef.current } : {}),
    };

    const validationError = validateBeforeSave(mergedMap);
    if (validationError) {
      await confirm({
        title: "검증 실패",
        message: validationError,
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    const targets = collectPageTargetsFromSidebar(sidebarItems);
    if (targets.length === 0) {
      await confirm({
        title: "저장 실패",
        message: "저장할 페이지가 없습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    const currentSidebarSignature = buildSidebarSignature(sidebarItems);
    const isSidebarChanged = currentSidebarSignature !== initialSidebarSignatureRef.current;

    const changedPages = targets
      .map((target) => {
        const blocks =
          mergedMap[target.mappedId] ??
          createDefaultBlocksByModule(target.module, target.label, target.mappedId, target.method);
        const signature = buildPageSignature(blocks);
        const hasChanged = initialPageSignatureByMappedIdRef.current[target.mappedId] !== signature;
        return {
          target,
          blocks,
          signature,
          hasChanged,
        };
      })
      .filter((entry) => entry.hasChanged);

    if (!isSidebarChanged && changedPages.length === 0) {
      await confirm({
        title: "변경 없음",
        message: "변경된 내용이 없습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    setIsSaving(true);
    try {
      if (isSidebarChanged) {
        await docsApi.updateSidebar(slug, nodesToSidebarBlockRequests(sidebarItems));
      }

      await Promise.all(
        changedPages.map((entry) =>
          docsApi.updatePage(slug, entry.target.mappedId, toDocsPageBlockRequests(entry.blocks))
        )
      );

      initialSidebarSignatureRef.current = currentSidebarSignature;
      initialPageSignatureByMappedIdRef.current = {
        ...initialPageSignatureByMappedIdRef.current,
        ...Object.fromEntries(changedPages.map((entry) => [entry.target.mappedId, entry.signature])),
      };

      await confirm({
        title: "저장 완료",
        message: "문서 수정사항이 저장되었습니다.",
        confirmText: "확인",
        hideCancel: true,
      });

      const targetId = selectedId || targets[0].mappedId;
      router.push(`/docs/${slug}/page/${targetId}`);
    } catch (error) {
      await confirm({
        title: "저장 실패",
        message: error instanceof Error ? error.message : "문서 저장에 실패했습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
    } finally {
      setIsSaving(false);
    }
  }, [confirm, contentMap, isSaving, router, selectedId, sidebarItems, slug, validateBeforeSave]);

  if (sidebarLoading) {
    return <LoadingBox>문서 정보를 불러오는 중입니다.</LoadingBox>;
  }

  if (sidebarError) {
    return <ErrorBox>{sidebarError instanceof Error ? sidebarError.message : "문서를 불러오지 못했습니다."}</ErrorBox>;
  }

  return (
    <DocsLayout
      showSidebar={true}
      sidebarItems={sidebarItems}
      onSidebarChange={setSidebarItems}
      projectName={sidebarItems[0]?.label || "문서 수정"}
      editable={true}
    >
      <DocsHeader title={currentLabel} breadcrumb={[sidebarItems[0]?.label || "문서"]} isApi={false} />

      <ContentArea
        onClick={() => {
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
        {docsBlocks.length === 0 ? (
          <EmptyText>내용을 입력하려면 클릭하세요...</EmptyText>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={docsBlocks.map((block) => String(block.id))} strategy={verticalListSortingStrategy}>
              {docsBlocks.map((block, index) => (
                <DocsBlockEditor
                  key={String(block.id)}
                  index={index}
                  block={block}
                  domain=""
                  disableApiVerification={true}
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

      <SaveButton type="button" onClick={() => void handleSave()} disabled={isSaving}>
        {isSaving ? "저장 중..." : "저장하기"}
      </SaveButton>

      {ConfirmDialog}
    </DocsLayout>
  );
}
