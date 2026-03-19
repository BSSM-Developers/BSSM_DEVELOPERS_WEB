import { docsApi, type SidebarBlock } from "@/app/docs/api";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import type { DocsBlock } from "@/types/docs";
import type { SourcePageRef } from "../helpers";
import type { CustomApiOption } from "../components/CustomApiPickerModal";

export interface SourcePageMeta extends SourcePageRef {
  endpoint?: string;
}

export const collectSourceMappedIdCandidates = (blocks: DocsBlock[], fallbackId?: string): string[] => {
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

export const collectApiOptionsFromSidebar = (
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

export const getPageWithFallback = async (docsId: string, mappedId: string) => {
  try {
    return await docsApi.getPage(docsId, mappedId);
  } catch {
    return docsApi.getPublicPage(docsId, mappedId);
  }
};

export const getSidebarWithFallback = async (docsId: string) => {
  try {
    return await docsApi.getSidebar(docsId, false);
  } catch {
    return docsApi.getSidebar(docsId, true);
  }
};

export const resolveSourceRefFromPage = async (docsId: string, pageMappedId: string, apiMappedId: string) => {
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

export const upsertApiNodeInSidebar = (
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

export const applyProjectTitleToSidebar = (nodes: SidebarNode[], projectTitle: string): SidebarNode[] => {
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

export const insertSiblingNode = (
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

export const appendChildNode = (
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
