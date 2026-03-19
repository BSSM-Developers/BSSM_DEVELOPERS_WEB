import { useCallback, useEffect, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import type { DocsBlock } from "@/types/docs";
import { docsApi } from "@/app/docs/api";
import { toEditorBlocksWithOptions, inferMethodFromBlocks, extractEndpointFromBlocks } from "../helpers";
import type { CustomApiOption } from "../components/CustomApiPickerModal";
import {
  appendChildNode,
  collectApiOptionsFromSidebar,
  getPageWithFallback,
  getSidebarWithFallback,
  insertSiblingNode,
  type SourcePageMeta,
  upsertApiNodeInSidebar,
} from "./shared";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

interface ApiInsertIntent {
  mode: "sibling" | "child";
  targetId: string | null;
}

interface UseCustomApiImportParams {
  slug: string;
  effectiveProjectTitle: string;
  setSelected: (id: string) => void;
  confirm: ConfirmFn;
  setSidebarItems: Dispatch<SetStateAction<SidebarNode[]>>;
  setContentMap: Dispatch<SetStateAction<Record<string, DocsBlock[]>>>;
  setDocsBlocks: Dispatch<SetStateAction<DocsBlock[]>>;
  setSourcePageMap: Dispatch<SetStateAction<Record<string, SourcePageMeta>>>;
  setSourcePageByPageIdMap: Dispatch<SetStateAction<Record<string, SourcePageMeta>>>;
  setPageEndpointMap: Dispatch<SetStateAction<Record<string, string>>>;
  contentMapRef: MutableRefObject<Record<string, DocsBlock[]>>;
  sourcePageMapRef: MutableRefObject<Record<string, SourcePageMeta>>;
  sourcePageByPageIdMapRef: MutableRefObject<Record<string, SourcePageMeta>>;
  pageEndpointMapRef: MutableRefObject<Record<string, string>>;
}

export const useCustomApiImport = ({
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
}: UseCustomApiImportParams) => {
  const [isApiPickerOpen, setIsApiPickerOpen] = useState(false);
  const [apiPickerLoading, setApiPickerLoading] = useState(false);
  const [apiPickerError, setApiPickerError] = useState("");
  const [apiPickerOptions, setApiPickerOptions] = useState<CustomApiOption[]>([]);
  const [pendingApiInsertIntent, setPendingApiInsertIntent] = useState<ApiInsertIntent | null>(null);

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
  }, [
    confirm,
    contentMapRef,
    effectiveProjectTitle,
    pageEndpointMapRef,
    pendingApiInsertIntent,
    setContentMap,
    setDocsBlocks,
    setPageEndpointMap,
    setSelected,
    setSidebarItems,
    setSourcePageByPageIdMap,
    setSourcePageMap,
    sourcePageByPageIdMapRef,
    sourcePageMapRef,
  ]);

  const openApiPicker = useCallback((intent: ApiInsertIntent) => {
    setPendingApiInsertIntent(intent);
    setIsApiPickerOpen(true);
    if (apiPickerOptions.length === 0 && !apiPickerLoading) {
      void loadApiPickerOptions();
    }
  }, [apiPickerLoading, apiPickerOptions.length, loadApiPickerOptions]);

  const closeApiPicker = useCallback(() => {
    setIsApiPickerOpen(false);
    setPendingApiInsertIntent(null);
  }, []);

  return {
    isApiPickerOpen,
    apiPickerLoading,
    apiPickerError,
    apiPickerOptions,
    openApiPicker,
    closeApiPicker,
    loadApiPickerOptions,
    handleSelectApiFromPicker,
  };
};
