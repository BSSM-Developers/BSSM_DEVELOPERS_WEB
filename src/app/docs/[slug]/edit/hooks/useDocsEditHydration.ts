import { useEffect, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { docsApi, type DocsItem, type SidebarResponse } from "@/app/docs/api";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import type { DocsBlock } from "@/types/docs";
import {
  buildPageSignatureWithSource,
  buildSidebarSignature,
  collectPageTargetsFromSidebar,
  createDefaultBlocksByModule,
  extractEndpointFromBlocks,
  inferMethodFromBlocks,
  sidebarBlocksToNodes,
  toEditorBlocksWithOptions,
} from "../helpers";
import {
  applyProjectTitleToSidebar,
  getPageWithFallback,
  resolveSourceRefFromPage,
  type SourcePageMeta,
} from "./shared";
import { updateNode } from "@/components/layout/treeUtils";

interface UseDocsEditHydrationParams {
  slug: string;
  sidebarData?: SidebarResponse;
  isCustomDocs: boolean;
  effectiveProjectTitle: string;
  setSelected: (id: string) => void;
  docsMeta: DocsItem | null;
  setDocsMeta: Dispatch<SetStateAction<DocsItem | null>>;
  setSidebarItems: Dispatch<SetStateAction<SidebarNode[]>>;
  setContentMap: Dispatch<SetStateAction<Record<string, DocsBlock[]>>>;
  setSourcePageMap: Dispatch<SetStateAction<Record<string, SourcePageMeta>>>;
  setSourcePageByPageIdMap: Dispatch<SetStateAction<Record<string, SourcePageMeta>>>;
  setPageEndpointMap: Dispatch<SetStateAction<Record<string, string>>>;
  setDocsBlocks: Dispatch<SetStateAction<DocsBlock[]>>;
  initializedRef: MutableRefObject<boolean>;
  prevSelectedRef: MutableRefObject<string | null>;
  contentMapRef: MutableRefObject<Record<string, DocsBlock[]>>;
  sourcePageMapRef: MutableRefObject<Record<string, SourcePageMeta>>;
  sourcePageByPageIdMapRef: MutableRefObject<Record<string, SourcePageMeta>>;
  pageEndpointMapRef: MutableRefObject<Record<string, string>>;
  initialSidebarSignatureRef: MutableRefObject<string>;
  initialPageSignatureByMappedIdRef: MutableRefObject<Record<string, string>>;
}

export const useDocsEditHydration = ({
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
}: UseDocsEditHydrationParams) => {
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
  }, [docsMeta, setDocsMeta, slug]);

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
  }, [
    contentMapRef,
    effectiveProjectTitle,
    initialPageSignatureByMappedIdRef,
    initialSidebarSignatureRef,
    initializedRef,
    isCustomDocs,
    pageEndpointMapRef,
    prevSelectedRef,
    setContentMap,
    setDocsBlocks,
    setDocsMeta,
    setPageEndpointMap,
    setSelected,
    setSidebarItems,
    setSourcePageByPageIdMap,
    setSourcePageMap,
    sidebarData,
    slug,
    sourcePageByPageIdMapRef,
    sourcePageMapRef,
  ]);
};
