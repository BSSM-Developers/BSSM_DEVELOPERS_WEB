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
import { docsApi, type DocsItem, type SidebarBlock } from "@/app/docs/api";
import { useDocsSidebarQuery } from "@/app/docs/queries";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import type { ApiParam, DocsBlock } from "@/types/docs";
import { findNodeById, findNodePathById, updateNode } from "@/components/layout/treeUtils";
import {
  buildPageSignatureWithSource,
  buildSidebarSignature,
  collectPageTargetsFromSidebar,
  createDefaultBlocksByModule,
  extractEndpointFromBlocks,
  inferMethodFromBlocks,
  nodesToSidebarBlockRequests,
  sidebarBlocksToNodes,
  SourcePageRef,
  toDocsPageBlockRequests,
  toEditorBlocksWithOptions,
} from "./helpers";
import { CustomApiOption, CustomApiPickerModal } from "./components/CustomApiPickerModal";

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

interface SourcePageMeta extends SourcePageRef {
  endpoint?: string;
}

const collectSourceMappedIdCandidates = (blocks: DocsBlock[], fallbackId?: string): string[] => {
  const candidates = new Set<string>();
  for (const block of blocks) {
    if (block.module !== "api") {
      continue;
    }
    const candidateId = block.apiData?.id?.trim();
    if (candidateId) {
      candidates.add(candidateId);
    }
  }
  if (fallbackId?.trim()) {
    candidates.add(fallbackId.trim());
  }
  return Array.from(candidates);
};

const collectApiOptionsFromSidebar = (
  docsId: string,
  docsTitle: string,
  blocks: SidebarBlock[]
): CustomApiOption[] => {
  const options: CustomApiOption[] = [];

  const walk = (itemsToWalk: SidebarBlock[], currentPageMappedId?: string) => {
    for (const item of itemsToWalk) {
      const mappedId = item.mappedId;
      if (item.module === "api" && mappedId) {
        options.push({
          key: `${docsId}:${mappedId}`,
          docsId,
          docsTitle,
          pageMappedId: currentPageMappedId || mappedId,
          mappedId,
          label: item.label || "이름 없는 API",
          method: item.method,
        });
      }
      if (item.childrenItems && item.childrenItems.length > 0) {
        const nextPageMappedId =
          item.module === "collapse" ? item.mappedId || item.id : currentPageMappedId;
        walk(item.childrenItems, nextPageMappedId);
      }
    }
  };

  walk(blocks);
  return options;
};

const getPageWithFallback = async (docsId: string, mappedId: string) => {
  try {
    return await docsApi.getPage(docsId, mappedId);
  } catch {
    return docsApi.getPublicPage(docsId, mappedId);
  }
};

const getSidebarWithFallback = async (docsId: string) => {
  try {
    return await docsApi.getSidebar(docsId, false);
  } catch {
    return docsApi.getSidebar(docsId, true);
  }
};

const resolveSourceRefFromPage = async (docsId: string, pageMappedId: string, apiMappedId: string) => {
  const candidates = Array.from(new Set([pageMappedId, apiMappedId].filter(Boolean)));
  for (const candidate of candidates) {
    try {
      const response = await getPageWithFallback(docsId, candidate);
      const sourceDocsId = response.data.sourceDocsId?.trim();
      const sourceMappedId = response.data.sourceMappedId?.trim();
      if (sourceDocsId && sourceMappedId) {
        return {
          sourceDocsId,
          sourceMappedId,
          endpoint: response.data.endpoint,
        } satisfies SourcePageMeta;
      }
    } catch {
      continue;
    }
  }
  return null;
};

const upsertApiNodeInSidebar = (
  sidebarItems: SidebarNode[],
  docsTitle: string,
  node: SidebarNode
): SidebarNode[] => {
  if (sidebarItems.length === 0) {
    return [
      {
        id: crypto.randomUUID(),
        label: docsTitle || "새 문서",
        module: "main_title",
        childrenItems: [node],
      },
    ];
  }

  const rootIndex = sidebarItems.findIndex((item) => item.module === "main_title");
  if (rootIndex >= 0) {
    const root = sidebarItems[rootIndex];
    const currentChildren = root.childrenItems ? [...root.childrenItems] : [];
    const next = [...sidebarItems];
    next[rootIndex] = { ...root, childrenItems: [...currentChildren, node] };
    return next;
  }

  return [...sidebarItems, node];
};

const applyProjectTitleToSidebar = (nodes: SidebarNode[], projectTitle: string): SidebarNode[] => {
  if (!projectTitle.trim()) {
    return nodes;
  }

  const rootIndex = nodes.findIndex((node) => node.module === "main_title");
  if (rootIndex < 0) {
    if (nodes.length === 0) {
      return [];
    }

    return [
      {
        id: crypto.randomUUID(),
        label: projectTitle,
        module: "main_title",
        childrenItems: nodes,
      },
    ];
  }

  const root = nodes[rootIndex];
  if (root.label === projectTitle) {
    return nodes;
  }

  const next = [...nodes];
  next[rootIndex] = { ...root, label: projectTitle };
  return next;
};

const insertSiblingNode = (
  items: SidebarNode[],
  targetId: string,
  node: SidebarNode
): { updated: SidebarNode[]; inserted: boolean } => {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item.id === targetId) {
      const next = [...items];
      next.splice(index + 1, 0, node);
      return { updated: next, inserted: true };
    }

    if (item.childrenItems && item.childrenItems.length > 0) {
      const childResult = insertSiblingNode(item.childrenItems, targetId, node);
      if (childResult.inserted) {
        const next = [...items];
        next[index] = { ...item, childrenItems: childResult.updated };
        return { updated: next, inserted: true };
      }
    }
  }

  return { updated: items, inserted: false };
};

const appendChildNode = (
  items: SidebarNode[],
  parentId: string,
  node: SidebarNode
): { updated: SidebarNode[]; inserted: boolean } => {
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (item.id === parentId) {
      const children = item.childrenItems ? [...item.childrenItems, node] : [node];
      const next = [...items];
      next[index] = { ...item, childrenItems: children };
      return { updated: next, inserted: true };
    }

    if (item.childrenItems && item.childrenItems.length > 0) {
      const childResult = appendChildNode(item.childrenItems, parentId, node);
      if (childResult.inserted) {
        const next = [...items];
        next[index] = { ...item, childrenItems: childResult.updated };
        return { updated: next, inserted: true };
      }
    }
  }

  return { updated: items, inserted: false };
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
  const [isApiPickerOpen, setIsApiPickerOpen] = useState(false);
  const [apiPickerLoading, setApiPickerLoading] = useState(false);
  const [apiPickerError, setApiPickerError] = useState("");
  const [apiPickerOptions, setApiPickerOptions] = useState<CustomApiOption[]>([]);
  const [pendingApiInsertIntent, setPendingApiInsertIntent] = useState<{
    mode: "sibling" | "child";
    targetId: string | null;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
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

  useEffect(() => {
    const fetchDocsMeta = async () => {
      if (!slug || docsMeta) {
        return;
      }
      try {
        const response = await docsApi.getMyList({ size: 100 });
        const values = response.data.values ?? [];
        const found = values.find((item) => String(item.docsId ?? item.id ?? "") === slug) ?? null;
        setDocsMeta(found);
      } catch {
        setDocsMeta(null);
      }
    };

    void fetchDocsMeta();
  }, [docsMeta, slug]);

  useEffect(() => {
    const hydrate = async () => {
      if (!slug || !sidebarData?.data?.blocks || initializedRef.current) {
        return;
      }

      let normalizedNodes = sidebarBlocksToNodes(sidebarData.data.blocks);
      if (isCustomDocs && effectiveProjectTitle) {
        normalizedNodes = applyProjectTitleToSidebar(normalizedNodes, effectiveProjectTitle);
      }

      const targets = collectPageTargetsFromSidebar(normalizedNodes);

      if (targets.length === 0) {
        setSidebarItems(normalizedNodes);
        setContentMap({});
        setSourcePageMap({});
        setSourcePageByPageIdMap({});
        setPageEndpointMap({});
        setDocsBlocks([]);
        contentMapRef.current = {};
        sourcePageMapRef.current = {};
        sourcePageByPageIdMapRef.current = {};
        pageEndpointMapRef.current = {};
        initialSidebarSignatureRef.current = buildSidebarSignature(normalizedNodes);
        initialPageSignatureByMappedIdRef.current = {};
        initializedRef.current = true;
        return;
      }

      const loadedContentMap: Record<string, DocsBlock[]> = {};
      const loadedSourceMap: Record<string, SourcePageMeta> = {};
      const loadedSourceByPageIdMap: Record<string, SourcePageMeta> = {};
      const loadedEndpointMap: Record<string, string> = {};
      const loadedSignatureMap: Record<string, string> = {};

      await Promise.all(
        targets.map(async (target) => {
          try {
            const response = await getPageWithFallback(slug, target.pageMappedId);
            const sourceDocsId = response.data.sourceDocsId?.trim();
            const sourceMappedId = response.data.sourceMappedId?.trim();
            if (sourceDocsId && sourceMappedId) {
              loadedSourceByPageIdMap[target.pageMappedId] = {
                sourceDocsId,
                sourceMappedId,
                endpoint: response.data.endpoint,
              };
            }

            let blocks = toEditorBlocksWithOptions(response.data.docsBlocks, {
              preferredModule: target.module,
              method: target.method,
              label: target.label,
              id: target.mappedId,
            });

            if (target.module === "api" && sourceDocsId && sourceMappedId) {
              loadedSourceMap[target.mappedId] = {
                sourceDocsId,
                sourceMappedId,
                endpoint: response.data.endpoint,
              };

              if (response.data.docsBlocks.length === 0) {
                try {
                  const sourcePageResponse = await getPageWithFallback(sourceDocsId, sourceMappedId);
                  blocks = toEditorBlocksWithOptions(sourcePageResponse.data.docsBlocks, {
                    preferredModule: target.module,
                    method: target.method,
                    label: target.label,
                    id: target.mappedId,
                  });
                  if (!loadedSourceMap[target.mappedId].endpoint && sourcePageResponse.data.endpoint) {
                    loadedSourceMap[target.mappedId].endpoint = sourcePageResponse.data.endpoint;
                  }
                } catch {
                  blocks = createDefaultBlocksByModule(
                    target.module,
                    target.label,
                    target.mappedId,
                    target.method
                  );
                }
              }
            }

            if (target.module === "api" && !loadedSourceMap[target.mappedId]) {
              const byPageSource = loadedSourceByPageIdMap[target.pageMappedId];
              if (byPageSource) {
                loadedSourceMap[target.mappedId] = byPageSource;
              }
            }

            if (target.module === "api" && !loadedSourceMap[target.mappedId]) {
              const recoveredSource = await resolveSourceRefFromPage(
                slug,
                target.pageMappedId,
                target.mappedId
              );
              if (recoveredSource) {
                loadedSourceMap[target.mappedId] = recoveredSource;
              }
            }

            if (blocks.length === 0) {
              blocks = createDefaultBlocksByModule(
                target.module,
                target.label,
                target.mappedId,
                target.method
              );
            }

            loadedContentMap[target.mappedId] = blocks;
            const extractedEndpoint =
              response.data.endpoint || extractEndpointFromBlocks(blocks, loadedSourceMap[target.mappedId]?.endpoint);
            if (extractedEndpoint) {
              loadedEndpointMap[target.mappedId] = extractedEndpoint;
            }
            loadedSignatureMap[target.mappedId] = buildPageSignatureWithSource(
              blocks,
              loadedSourceMap[target.mappedId]
            );

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
            loadedSignatureMap[target.mappedId] = buildPageSignatureWithSource(fallback);
          }
        })
      );

      const firstMappedId = targets[0].mappedId;

      setSidebarItems(normalizedNodes);
      setContentMap(loadedContentMap);
      setSourcePageMap(loadedSourceMap);
      setSourcePageByPageIdMap(loadedSourceByPageIdMap);
      setPageEndpointMap(loadedEndpointMap);
      setSelected(firstMappedId);
      setDocsBlocks(loadedContentMap[firstMappedId] ?? []);
      contentMapRef.current = loadedContentMap;
      sourcePageMapRef.current = loadedSourceMap;
      sourcePageByPageIdMapRef.current = loadedSourceByPageIdMap;
      pageEndpointMapRef.current = loadedEndpointMap;

      initialSidebarSignatureRef.current = buildSidebarSignature(normalizedNodes);
      initialPageSignatureByMappedIdRef.current = loadedSignatureMap;
      prevSelectedRef.current = firstMappedId;
      initializedRef.current = true;
    };

    void hydrate();
  }, [effectiveProjectTitle, isCustomDocs, setSelected, sidebarData, slug]);

  const resolveDocsMetaForReplace = useCallback(async () => {
    if (docsMeta) {
      return docsMeta;
    }

    if (!slug) {
      return null;
    }

    try {
      const response = await docsApi.getMyList({ size: 100 });
      const values = response.data.values ?? [];
      const found = values.find((item) => String(item.docsId ?? item.id ?? "") === slug) ?? null;
      if (found) {
        setDocsMeta(found);
      }
      return found;
    } catch {
      return null;
    }
  }, [docsMeta, slug]);

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

  const loadApiPickerOptions = useCallback(async () => {
    try {
      setApiPickerLoading(true);
      setApiPickerError("");

      const docsListResponse = await docsApi.getList();
      const docsValues = docsListResponse.data.values ?? [];

      const candidates = await Promise.all(
        docsValues.map(async (docsItem) => {
          const docsId = String(docsItem.docsId ?? "");
          if (!docsId || docsId === slug) {
            return [] as CustomApiOption[];
          }
          try {
            const sidebarResponse = await getSidebarWithFallback(docsId);
            return collectApiOptionsFromSidebar(
              docsId,
              docsItem.title || "문서",
              sidebarResponse.data.blocks ?? []
            );
          } catch {
            return [] as CustomApiOption[];
          }
        })
      );

      const dedup = new Map<string, CustomApiOption>();
      for (const option of candidates.flat()) {
        if (!dedup.has(option.key)) {
          dedup.set(option.key, option);
        }
      }

      const sorted = Array.from(dedup.values()).sort((a, b) => {
        if (a.docsTitle === b.docsTitle) {
          return a.label.localeCompare(b.label);
        }
        return a.docsTitle.localeCompare(b.docsTitle);
      });

      setApiPickerOptions(sorted);
    } catch (error) {
      setApiPickerError(error instanceof Error ? error.message : "API 목록을 불러오지 못했습니다.");
    } finally {
      setApiPickerLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    if (!isApiPickerOpen || apiPickerLoading || apiPickerOptions.length > 0 || apiPickerError) {
      return;
    }
    void loadApiPickerOptions();
  }, [apiPickerError, apiPickerLoading, apiPickerOptions.length, isApiPickerOpen, loadApiPickerOptions]);

  const handleSelectApiFromPicker = useCallback(async (option: CustomApiOption) => {
    try {
      const sourcePage = await getPageWithFallback(option.docsId, option.pageMappedId);
      const generatedMappedId = crypto.randomUUID();
      const blocks = toEditorBlocksWithOptions(sourcePage.data.docsBlocks ?? [], {
        preferredModule: "api",
        label: option.label,
        method: option.method,
        id: generatedMappedId,
      });

      const inferredMethod = inferMethodFromBlocks(blocks);
      const nextNode: SidebarNode = {
        id: generatedMappedId,
        label: option.label,
        module: "api",
        method: inferredMethod || option.method,
        childrenItems: [],
      };

      setSidebarItems((prev) => {
        if (pendingApiInsertIntent?.targetId) {
          if (pendingApiInsertIntent.mode === "child") {
            const childResult = appendChildNode(prev, pendingApiInsertIntent.targetId, nextNode);
            if (childResult.inserted) {
              return childResult.updated;
            }
          } else {
            const siblingResult = insertSiblingNode(prev, pendingApiInsertIntent.targetId, nextNode);
            if (siblingResult.inserted) {
              return siblingResult.updated;
            }
          }
        }
        return upsertApiNodeInSidebar(
          prev,
          effectiveProjectTitle || prev[0]?.label || "커스텀 문서",
          nextNode
        );
      });
      const nextContentMap = { ...contentMapRef.current, [generatedMappedId]: blocks };
      contentMapRef.current = nextContentMap;
      setContentMap(nextContentMap);

      const nextSourceMap = {
        ...sourcePageMapRef.current,
        [generatedMappedId]: {
          sourceDocsId: option.docsId,
          sourceMappedId: option.mappedId,
          endpoint: sourcePage.data.endpoint || extractEndpointFromBlocks(blocks),
        },
      };
      sourcePageMapRef.current = nextSourceMap;
      setSourcePageMap(nextSourceMap);

      const sourceByPageNext = {
        ...sourcePageByPageIdMapRef.current,
        [generatedMappedId]: {
          sourceDocsId: option.docsId,
          sourceMappedId: option.mappedId,
          endpoint: sourcePage.data.endpoint || extractEndpointFromBlocks(blocks),
        },
      };
      sourcePageByPageIdMapRef.current = sourceByPageNext;
      setSourcePageByPageIdMap(sourceByPageNext);

      const endpoint = sourcePage.data.endpoint || extractEndpointFromBlocks(blocks);
      if (endpoint) {
        const nextEndpointMap = { ...pageEndpointMapRef.current, [generatedMappedId]: endpoint };
        pageEndpointMapRef.current = nextEndpointMap;
        setPageEndpointMap(nextEndpointMap);
      }
      setPendingApiInsertIntent(null);
      setSelected(generatedMappedId);
      setDocsBlocks(blocks);
      setIsApiPickerOpen(false);
    } catch (error) {
      await confirm({
        title: "API 추가 실패",
        message:
          error instanceof Error
            ? `${error.message}\n(docsId: ${option.docsId}, mappedId: ${option.mappedId})`
            : `API를 불러오지 못했습니다.\n(docsId: ${option.docsId}, mappedId: ${option.mappedId})`,
        hideCancel: true,
      });
    }
  }, [confirm, effectiveProjectTitle, pendingApiInsertIntent, setSelected]);

  const getInitialSourceRef = useCallback((mappedId: string): SourcePageMeta | null => {
    const initialSignature = initialPageSignatureByMappedIdRef.current[mappedId];
    if (!initialSignature) {
      return null;
    }

    try {
      const parsed = JSON.parse(initialSignature) as {
        sourceDocsId?: string;
        sourceMappedId?: string;
      };
      if (parsed.sourceDocsId && parsed.sourceMappedId) {
        return {
          sourceDocsId: parsed.sourceDocsId,
          sourceMappedId: parsed.sourceMappedId,
        };
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  const hydrateMissingCustomSourceRefs = useCallback(
    async (targets: ReturnType<typeof collectPageTargetsFromSidebar>) => {
      if (!isCustomDocs || !slug) {
        return;
      }

      const missingTargets = targets.filter(
        (target) => target.module === "api" && !sourcePageMapRef.current[target.mappedId]
      );

      if (missingTargets.length === 0) {
        return;
      }

      const recoveredEntries = await Promise.all(
        missingTargets.map(async (target) => {
          const recovered = await resolveSourceRefFromPage(slug, target.pageMappedId, target.mappedId);
          if (!recovered) {
            return null;
          }
          return {
            mappedId: target.mappedId,
            value: recovered,
          };
        })
      );

      const validEntries: Array<{ mappedId: string; value: SourcePageMeta }> = [];
      for (const entry of recoveredEntries) {
        if (entry) {
          validEntries.push(entry);
        }
      }

      if (validEntries.length === 0) {
        return;
      }

      const nextSourceMap = { ...sourcePageMapRef.current };
      const nextSourceByPageIdMap = { ...sourcePageByPageIdMapRef.current };
      const nextEndpointMap = { ...pageEndpointMapRef.current };

      for (const entry of validEntries) {
        nextSourceMap[entry.mappedId] = entry.value;
        const target = targets.find((item) => item.mappedId === entry.mappedId);
        if (target) {
          nextSourceByPageIdMap[target.pageMappedId] = entry.value;
        }
        if (entry.value.endpoint) {
          nextEndpointMap[entry.mappedId] = entry.value.endpoint;
        }
      }

      sourcePageMapRef.current = nextSourceMap;
      setSourcePageMap(nextSourceMap);
      sourcePageByPageIdMapRef.current = nextSourceByPageIdMap;
      setSourcePageByPageIdMap(nextSourceByPageIdMap);
      pageEndpointMapRef.current = nextEndpointMap;
      setPageEndpointMap(nextEndpointMap);
    },
    [isCustomDocs, slug]
  );

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
        const signature = buildPageSignatureWithSource(blocks, sourcePageMapRef.current[target.mappedId]);
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

    if (!isCustomDocs) {
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
    } else {
      await hydrateMissingCustomSourceRefs(targets);
    }

    setIsSaving(true);
    try {
      if (isCustomDocs) {
        const docsMeta = await resolveDocsMetaForReplace();
        let sourceCatalogPromise: Promise<Map<string, string>> | null = null;
        const getSourceCatalog = () => {
          if (sourceCatalogPromise) {
            return sourceCatalogPromise;
          }
          sourceCatalogPromise = (async () => {
            const catalog = new Map<string, string>();
            const docsListResponse = await docsApi.getList();
            const docsValues = docsListResponse.data.values ?? [];
            await Promise.all(
              docsValues.map(async (docsItem) => {
                const docsId = String(docsItem.docsId ?? "");
                if (!docsId) {
                  return;
                }
                try {
                  const sidebarResponse = await getSidebarWithFallback(docsId);
                  const options = collectApiOptionsFromSidebar(
                    docsId,
                    docsItem.title || "문서",
                    sidebarResponse.data.blocks ?? []
                  );
                  for (const option of options) {
                    if (!catalog.has(option.mappedId)) {
                      catalog.set(option.mappedId, option.docsId);
                    }
                  }
                } catch {
                  return;
                }
              })
            );
            return catalog;
          })();
          return sourceCatalogPromise;
        };

        const unresolvedSourceTargets = targets.filter(
          (target) =>
            target.module === "api" &&
            !sourcePageMapRef.current[target.mappedId] &&
            !sourcePageByPageIdMapRef.current[target.pageMappedId]
        );

        if (unresolvedSourceTargets.length > 0) {
          const resolvedSourceEntries = await Promise.all(
            unresolvedSourceTargets.map(async (target) => {
              const recovered = await resolveSourceRefFromPage(slug, target.pageMappedId, target.mappedId);
              if (!recovered) {
                return null;
              }
              return { target, recovered };
            })
          );

          const nextSourceMap = { ...sourcePageMapRef.current };
          const nextSourceByPageIdMap = { ...sourcePageByPageIdMapRef.current };
          const nextEndpointMap = { ...pageEndpointMapRef.current };

          for (const entry of resolvedSourceEntries) {
            if (!entry) {
              continue;
            }
            nextSourceMap[entry.target.mappedId] = entry.recovered;
            nextSourceByPageIdMap[entry.target.pageMappedId] = entry.recovered;
            if (entry.recovered.endpoint) {
              nextEndpointMap[entry.target.mappedId] = entry.recovered.endpoint;
            }
          }

          sourcePageMapRef.current = nextSourceMap;
          setSourcePageMap(nextSourceMap);
          sourcePageByPageIdMapRef.current = nextSourceByPageIdMap;
          setSourcePageByPageIdMap(nextSourceByPageIdMap);
          pageEndpointMapRef.current = nextEndpointMap;
          setPageEndpointMap(nextEndpointMap);
        }

        const docsPagesByPageMappedId = new Map<string, {
          id: string;
          endpoint?: string;
          blocks?: ReturnType<typeof toDocsPageBlockRequests>;
          sourceDocsId?: string;
          sourceMappedId?: string;
        }>();

        for (const target of targets) {
          const pageMappedId = target.pageMappedId;
          const blocks =
            mergedMap[target.mappedId] ??
            createDefaultBlocksByModule(target.module, target.label, target.mappedId, target.method);
          const sourceRef = sourcePageMapRef.current[target.mappedId];
          const endpoint =
            pageEndpointMapRef.current[target.mappedId] ||
            extractEndpointFromBlocks(blocks, sourceRef?.endpoint);

          if (target.module === "api") {
            let resolvedSourceRef =
              sourceRef ||
              sourcePageByPageIdMapRef.current[target.pageMappedId] ||
              getInitialSourceRef(target.mappedId);
            if (!resolvedSourceRef) {
              const candidates = collectSourceMappedIdCandidates(blocks, target.mappedId);
              if (candidates.length > 0) {
                const sourceCatalog = await getSourceCatalog();
                for (const candidate of candidates) {
                  const sourceDocsIdFromCatalog = sourceCatalog.get(candidate);
                  if (sourceDocsIdFromCatalog) {
                    resolvedSourceRef = {
                      sourceDocsId: sourceDocsIdFromCatalog,
                      sourceMappedId: candidate,
                      endpoint,
                    };
                    break;
                  }
                }
              }
            }
            if (!resolvedSourceRef) {
              throw new Error(`[${target.label}] API 참조(sourceDocsId/sourceMappedId) 정보를 찾지 못했습니다.`);
            }
            docsPagesByPageMappedId.set(pageMappedId, {
              id: pageMappedId,
              ...(endpoint ? { endpoint } : {}),
              sourceDocsId: resolvedSourceRef.sourceDocsId,
              sourceMappedId: resolvedSourceRef.sourceMappedId,
            });
            continue;
          }

          docsPagesByPageMappedId.set(pageMappedId, {
            ...(docsPagesByPageMappedId.get(pageMappedId) || { id: pageMappedId }),
            blocks: toDocsPageBlockRequests(blocks),
          });
        }

        const docsPages = Array.from(docsPagesByPageMappedId.values());

        await docsApi.replace(slug, {
          title: sidebarItems[0]?.label || effectiveProjectTitle || docsMeta?.title || "문서",
          description: docsMeta?.description || "",
          domain: docsMeta?.domain || "",
          repository_url: docsMeta?.repositoryUrl || docsMeta?.repository_url || "",
          auto_approval: docsMeta?.autoApproval ?? docsMeta?.auto_approval ?? false,
          sidebar: {
            blocks: nodesToSidebarBlockRequests(sidebarItems),
          },
          docs_pages: docsPages,
        });
      } else {
        if (isSidebarChanged) {
          await docsApi.updateSidebar(slug, nodesToSidebarBlockRequests(sidebarItems));
        }

        await Promise.all(
          changedPages.map((entry) =>
            docsApi.updatePage(slug, entry.target.pageMappedId, toDocsPageBlockRequests(entry.blocks))
          )
        );
      }

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
  }, [
    confirm,
    contentMap,
    effectiveProjectTitle,
    isCustomDocs,
    isSaving,
    router,
    resolveDocsMetaForReplace,
    selectedId,
    sidebarItems,
    slug,
    getInitialSourceRef,
    hydrateMissingCustomSourceRefs,
    validateBeforeSave,
  ]);

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
              setPendingApiInsertIntent(intent);
              setIsApiPickerOpen(true);
              if (apiPickerOptions.length === 0 && !apiPickerLoading) {
                void loadApiPickerOptions();
              }
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
        onClose={() => {
          setIsApiPickerOpen(false);
          setPendingApiInsertIntent(null);
        }}
        onRefresh={() => void loadApiPickerOptions()}
        onSelect={(option) => void handleSelectApiFromPicker(option)}
      />
    </DocsLayout>
  );
}
