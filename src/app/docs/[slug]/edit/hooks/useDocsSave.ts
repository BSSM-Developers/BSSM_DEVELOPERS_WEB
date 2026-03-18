import { useCallback, useState, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { docsApi, type DocsItem } from "@/app/docs/api";
import type { ApiParam, DocsBlock } from "@/types/docs";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import {
  buildPageSignatureWithSource,
  buildSidebarSignature,
  collectPageTargetsFromSidebar,
  createDefaultBlocksByModule,
  extractEndpointFromBlocks,
  nodesToSidebarBlockRequests,
  toDocsPageBlockRequests,
  type PageTarget,
} from "../helpers";
import {
  collectApiOptionsFromSidebar,
  collectSourceMappedIdCandidates,
  getSidebarWithFallback,
  resolveSourceRefFromPage,
  type SourcePageMeta,
} from "./shared";

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  hideCancel?: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

interface UseDocsSaveParams {
  slug: string;
  isCustomDocs: boolean;
  effectiveProjectTitle: string;
  sidebarItems: SidebarNode[];
  contentMap: Record<string, DocsBlock[]>;
  selectedId: string | null;
  pageTargets: PageTarget[];
  docsMeta: DocsItem | null;
  setDocsMeta: Dispatch<SetStateAction<DocsItem | null>>;
  docsBlocksRef: MutableRefObject<DocsBlock[]>;
  sourcePageMapRef: MutableRefObject<Record<string, SourcePageMeta>>;
  sourcePageByPageIdMapRef: MutableRefObject<Record<string, SourcePageMeta>>;
  pageEndpointMapRef: MutableRefObject<Record<string, string>>;
  initialSidebarSignatureRef: MutableRefObject<string>;
  initialPageSignatureByMappedIdRef: MutableRefObject<Record<string, string>>;
  setSourcePageMap: Dispatch<SetStateAction<Record<string, SourcePageMeta>>>;
  setSourcePageByPageIdMap: Dispatch<SetStateAction<Record<string, SourcePageMeta>>>;
  setPageEndpointMap: Dispatch<SetStateAction<Record<string, string>>>;
  confirm: ConfirmFn;
  router: { push: (href: string) => void };
}

export const useDocsSave = ({
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
}: UseDocsSaveParams) => {
  const [isSaving, setIsSaving] = useState(false);

  const resolveDocsTitleFromSidebar = useCallback((items: SidebarNode[]): string => {
    const mainTitleNode = items.find((item) => item.module === "main_title");
    const mainTitle = mainTitleNode?.label?.trim();
    if (mainTitle) {
      return mainTitle;
    }
    const firstLabel = items[0]?.label?.trim();
    if (firstLabel) {
      return firstLabel;
    }
    return "";
  }, []);

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

  const resolveDocsMetaForReplace = useCallback(async () => {
    if (docsMeta?.domain?.trim()) {
      return docsMeta;
    }

    if (!slug) {
      return null;
    }

    try {
      const response = await docsApi.getDetail(slug);
      setDocsMeta(response.data);
      return response.data;
    } catch {
      return docsMeta;
    }
  }, [docsMeta, setDocsMeta, slug]);

  const resolveMetaFields = useCallback((meta: DocsItem | null) => {
    const description = meta?.description || "";
    const domain = meta?.domain?.trim() || "";
    const repositoryUrl = meta?.repositoryUrl || meta?.repository_url || "";
    return { description, domain, repositoryUrl };
  }, []);

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
  }, [initialPageSignatureByMappedIdRef]);

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
    [isCustomDocs, pageEndpointMapRef, setPageEndpointMap, setSourcePageByPageIdMap, setSourcePageMap, slug, sourcePageByPageIdMapRef, sourcePageMapRef]
  );

  const handleSave = useCallback(async () => {
    if (!slug || isSaving) {
      return;
    }

    const mergedMap = {
      ...contentMap,
      ...(selectedId ? { [selectedId]: docsBlocksRef.current } : {}),
    };

    const targets = collectPageTargetsFromSidebar(sidebarItems);
    const resolvedDocsTitle =
      resolveDocsTitleFromSidebar(sidebarItems) ||
      effectiveProjectTitle ||
      docsMeta?.title ||
      "문서";
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
        const resolvedDocsMeta = await resolveDocsMetaForReplace();
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

        const { description, domain, repositoryUrl } = resolveMetaFields(resolvedDocsMeta);
        await docsApi.replace(slug, {
          title: resolvedDocsTitle,
          description,
          domain,
          repository_url: repositoryUrl,
          auto_approval: resolvedDocsMeta?.autoApproval ?? resolvedDocsMeta?.auto_approval ?? false,
          sidebar: {
            blocks: nodesToSidebarBlockRequests(sidebarItems),
          },
          docs_pages: docsPages,
        });
      } else {
        const resolvedDocsMeta = docsMeta || (await resolveDocsMetaForReplace());
        const shouldReplaceForTitle = Boolean(resolvedDocsMeta && resolvedDocsMeta.title !== resolvedDocsTitle);
        if (shouldReplaceForTitle && resolvedDocsMeta) {
          const docsPagesByPageMappedId = new Map<string, {
            id: string;
            endpoint?: string;
            blocks?: ReturnType<typeof toDocsPageBlockRequests>;
          }>();

          for (const target of targets) {
            const pageMappedId = target.pageMappedId;
            const blocks =
              mergedMap[target.mappedId] ??
              createDefaultBlocksByModule(target.module, target.label, target.mappedId, target.method);
            const endpoint = extractEndpointFromBlocks(blocks);
            docsPagesByPageMappedId.set(pageMappedId, {
              ...(docsPagesByPageMappedId.get(pageMappedId) || { id: pageMappedId }),
              ...(endpoint ? { endpoint } : {}),
              blocks: toDocsPageBlockRequests(blocks),
            });
          }

          const { description, domain, repositoryUrl } = resolveMetaFields(resolvedDocsMeta);
          await docsApi.replace(slug, {
            title: resolvedDocsTitle,
            description,
            domain,
            repository_url: repositoryUrl,
            auto_approval: resolvedDocsMeta?.autoApproval ?? resolvedDocsMeta?.auto_approval ?? false,
            sidebar: {
              blocks: nodesToSidebarBlockRequests(sidebarItems),
            },
            docs_pages: Array.from(docsPagesByPageMappedId.values()),
          });
          setDocsMeta({ ...resolvedDocsMeta, title: resolvedDocsTitle });
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
    docsBlocksRef,
    effectiveProjectTitle,
    getInitialSourceRef,
    hydrateMissingCustomSourceRefs,
    initialPageSignatureByMappedIdRef,
    initialSidebarSignatureRef,
    isCustomDocs,
    isSaving,
    pageEndpointMapRef,
    resolveDocsMetaForReplace,
    resolveMetaFields,
    resolveDocsTitleFromSidebar,
    router,
    selectedId,
    setDocsMeta,
    setPageEndpointMap,
    setSourcePageByPageIdMap,
    setSourcePageMap,
    sidebarItems,
    slug,
    sourcePageByPageIdMapRef,
    sourcePageMapRef,
    validateBeforeSave,
  ]);

  return {
    isSaving,
    handleSave,
  };
};
