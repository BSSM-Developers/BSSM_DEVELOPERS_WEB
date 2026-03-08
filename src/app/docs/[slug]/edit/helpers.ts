import type { DocsPageBlockRequest, DocsSideBarBlockRequest, SidebarBlock } from "@/app/docs/api";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import type { ApiDoc, DocsBlock } from "@/types/docs";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "UPDATE";

interface RawPageBlock {
  id?: string;
  module?: string;
  content?: string;
}

export interface EditableDocsPageBlock {
  id: string;
  module: string;
  content: string;
}

export interface PageTarget {
  id: string;
  mappedId: string;
  pageMappedId: string;
  label: string;
  module?: SidebarNode["module"];
  method?: HttpMethod;
}

export interface MetaFormValue {
  title: string;
  description: string;
  domain: string;
  repositoryUrl: string;
  autoApproval: boolean;
}

export interface InitialSnapshot {
  meta: MetaFormValue;
  sidebarSignature: string;
  pageSignatureByMappedId: Record<string, string>;
}

export interface SourcePageRef {
  sourceDocsId: string;
  sourceMappedId: string;
}

const parseApiDataFromContent = (content?: string): ApiDoc | null => {
  if (!content || !content.trim().startsWith("{")) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(content);
    if (
      typeof parsed === "object" &&
      parsed !== null &&
      "method" in parsed &&
      "endpoint" in parsed &&
      typeof (parsed as { method: unknown }).method === "string" &&
      typeof (parsed as { endpoint: unknown }).endpoint === "string"
    ) {
      return parsed as ApiDoc;
    }
    return null;
  } catch {
    return null;
  }
};

const toHttpMethod = (value?: string): HttpMethod | undefined => {
  if (
    value === "GET" ||
    value === "POST" ||
    value === "PUT" ||
    value === "PATCH" ||
    value === "DELETE" ||
    value === "UPDATE"
  ) {
    return value;
  }
  return undefined;
};

const createDefaultApiData = (id: string, label?: string, method?: HttpMethod): ApiDoc => ({
  id,
  name: label || "새 API",
  method: method || "GET",
  endpoint: "",
  description: "",
  responseStatus: 200,
  responseMessage: "OK",
});

const normalizeContent = (block: DocsBlock): string => {
  if (block.module === "api" && block.apiData) {
    return JSON.stringify(block.apiData);
  }
  if (block.module === "image") {
    return block.imageSrc || "";
  }
  if (block.module === "list") {
    if (block.listItems && block.listItems.length > 0) {
      return block.listItems.join("\n");
    }
    return block.content || "";
  }
  return block.content || "";
};

export const toEditorBlocks = (blocks: RawPageBlock[]): DocsBlock[] => {
  return toEditorBlocksWithOptions(blocks);
};

export const toEditorBlocksWithOptions = (
  blocks: RawPageBlock[],
  options?: { preferredModule?: SidebarNode["module"]; method?: HttpMethod; label?: string; id?: string }
): DocsBlock[] => {
  const mapped: DocsBlock[] = blocks.map((block, index): DocsBlock => {
    const safeId = typeof block.id === "string" && block.id ? block.id : `block-${index + 1}`;
    const safeModule = typeof block.module === "string" && block.module ? block.module : "docs_1";
    const safeContent = typeof block.content === "string" ? block.content : "";

    if (safeModule === "api") {
      const parsedApiData = parseApiDataFromContent(safeContent);
      return {
        id: safeId,
        module: "api",
        apiData: parsedApiData || createDefaultApiData(safeId, options?.label, options?.method),
        content: safeContent,
      };
    }

    if (safeModule === "image") {
      return {
        id: safeId,
        module: "image",
        imageSrc: safeContent,
        content: safeContent,
      };
    }

    return {
      id: safeId,
      module: safeModule as DocsBlock["module"],
      content: safeContent,
    };
  });

  if (options?.preferredModule === "api") {
    const hasApiBlock = mapped.some((block) => block.module === "api");
    if (!hasApiBlock) {
      const fallbackId = options.id || crypto.randomUUID();
      const legacyBlock = mapped[0];
      const legacyApiData = legacyBlock?.content ? parseApiDataFromContent(legacyBlock.content) : null;
      return [
        {
          id: fallbackId,
          module: "api",
          apiData:
            legacyApiData || createDefaultApiData(fallbackId, options.label, toHttpMethod(options.method)),
          content: legacyBlock?.content || "",
        },
      ];
    }
  }

  return mapped;
};

export const inferMethodFromBlocks = (blocks: DocsBlock[]): HttpMethod | undefined => {
  for (const block of blocks) {
    if (block.module === "api" && block.apiData?.method) {
      const normalized = toHttpMethod(block.apiData.method);
      if (normalized) {
        return normalized;
      }
    }
  }
  return undefined;
};

export const createDefaultBlocksByModule = (
  module: SidebarNode["module"] | undefined,
  label: string,
  mappedId: string,
  method?: HttpMethod
): DocsBlock[] => {
  if (module === "api") {
    return [
      {
        id: crypto.randomUUID(),
        module: "api",
        apiData: createDefaultApiData(mappedId || crypto.randomUUID(), label, toHttpMethod(method)),
        content: "",
      },
    ];
  }
  return [{ id: crypto.randomUUID(), module: "docs_1", content: "" }];
};

export const toEditableSidebarBlocks = (blocks: SidebarBlock[]): DocsSideBarBlockRequest[] => {
  return blocks.map((block) => ({
    id: block.mappedId || block.id,
    label: block.label,
    module: block.module,
    method: block.method,
    childrenItems: block.childrenItems ? toEditableSidebarBlocks(block.childrenItems) : undefined,
  }));
};

export const collectPageTargets = (blocks: DocsSideBarBlockRequest[]): PageTarget[] => {
  const targets: PageTarget[] = [];

  const walk = (items: DocsSideBarBlockRequest[], currentPageMappedId?: string) => {
    for (const item of items) {
      if (item.module === "default" || item.module === "api") {
        const pageMappedId =
          item.module === "api" ? currentPageMappedId || item.id : item.id;
        targets.push({
          id: item.id,
          mappedId: item.id,
          pageMappedId,
          label: item.label,
          module: item.module,
          method: item.method,
        });
      }

      if (item.childrenItems && item.childrenItems.length > 0) {
        const nextPageMappedId = item.module === "collapse" ? item.id : currentPageMappedId;
        walk(item.childrenItems, nextPageMappedId);
      }
    }
  };

  walk(blocks);
  return targets;
};

export const parseSidebarBlocksJson = (value: string): DocsSideBarBlockRequest[] => {
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    throw new Error("sideBarBlocks JSON 형식이 올바르지 않습니다.");
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error("sideBarBlocks는 배열이어야 합니다.");
  }

  const normalizeItem = (item: unknown, index: number): DocsSideBarBlockRequest => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`sideBarBlocks[${index}]가 객체가 아닙니다.`);
    }

    const candidate = item as {
      id?: unknown;
      label?: unknown;
      module?: unknown;
      method?: unknown;
      childrenItems?: unknown;
    };

    if (typeof candidate.id !== "string" || !candidate.id.trim()) {
      throw new Error(`sideBarBlocks[${index}].id가 올바르지 않습니다.`);
    }

    if (typeof candidate.label !== "string" || !candidate.label.trim()) {
      throw new Error(`sideBarBlocks[${index}].label이 올바르지 않습니다.`);
    }

    if (
      candidate.module !== "main_title" &&
      candidate.module !== "default" &&
      candidate.module !== "collapse" &&
      candidate.module !== "api"
    ) {
      throw new Error(`sideBarBlocks[${index}].module이 올바르지 않습니다.`);
    }

    const children = Array.isArray(candidate.childrenItems)
      ? candidate.childrenItems.map((child, childIndex) => normalizeItem(child, childIndex))
      : undefined;

    return {
      id: candidate.id.trim(),
      label: candidate.label.trim(),
      module: candidate.module,
      method:
        candidate.method === "GET" ||
        candidate.method === "POST" ||
        candidate.method === "DELETE" ||
        candidate.method === "PUT" ||
        candidate.method === "PATCH" ||
        candidate.method === "UPDATE"
          ? candidate.method
          : undefined,
      childrenItems: children,
    };
  };

  return parsedValue.map((item, index) => normalizeItem(item, index));
};

export const parseDocsPageBlocksJson = (value: string): EditableDocsPageBlock[] => {
  let parsedValue: unknown;
  try {
    parsedValue = JSON.parse(value);
  } catch {
    throw new Error("docsBlocks JSON 형식이 올바르지 않습니다.");
  }

  if (!Array.isArray(parsedValue)) {
    throw new Error("docsBlocks는 배열이어야 합니다.");
  }

  return parsedValue.map((item, index) => {
    if (typeof item !== "object" || item === null) {
      throw new Error(`docsBlocks[${index}]가 객체가 아닙니다.`);
    }

    const candidate = item as { id?: unknown; module?: unknown; content?: unknown };

    if (typeof candidate.id !== "string" || !candidate.id.trim()) {
      throw new Error(`docsBlocks[${index}].id가 올바르지 않습니다.`);
    }

    if (typeof candidate.module !== "string" || !candidate.module.trim()) {
      throw new Error(`docsBlocks[${index}].module이 올바르지 않습니다.`);
    }

    return {
      id: candidate.id.trim(),
      module: candidate.module.trim(),
      content: typeof candidate.content === "string" ? candidate.content : "",
    };
  });
};

export const toDocsPageBlockRequests = (blocks: DocsBlock[]): DocsPageBlockRequest[] => {
  return blocks.map((block, index) => {
    const safeId = typeof block.id === "string" && block.id ? block.id : `block-${index + 1}`;
    return {
      id: safeId,
      module: block.module,
      content: normalizeContent(block),
    };
  });
};

export const buildPageSignature = (blocks: DocsBlock[]): string => {
  return JSON.stringify(toDocsPageBlockRequests(blocks));
};

export const buildPageSignatureWithSource = (blocks: DocsBlock[], sourceRef?: SourcePageRef): string => {
  if (sourceRef) {
    return JSON.stringify({
      sourceDocsId: sourceRef.sourceDocsId,
      sourceMappedId: sourceRef.sourceMappedId,
    });
  }
  return buildPageSignature(blocks);
};

export const sidebarBlocksToNodes = (blocks: SidebarBlock[]): SidebarNode[] => {
  return blocks.map((block) => ({
    id: block.mappedId || block.id,
    label: block.label,
    module: block.module,
    method: block.method,
    childrenItems: block.childrenItems ? sidebarBlocksToNodes(block.childrenItems) : [],
  }));
};

export const nodesToSidebarBlockRequests = (nodes: SidebarNode[]): DocsSideBarBlockRequest[] => {
  return nodes.map((node) => ({
    id: node.id,
    label: node.label,
    module: (node.module || "default") as DocsSideBarBlockRequest["module"],
    method: node.method,
    childrenItems:
      node.childrenItems && node.childrenItems.length > 0
        ? nodesToSidebarBlockRequests(node.childrenItems)
        : undefined,
  }));
};

export const buildSidebarSignature = (nodes: SidebarNode[]): string => {
  return JSON.stringify(nodesToSidebarBlockRequests(nodes));
};

export const collectPageTargetsFromSidebar = (nodes: SidebarNode[]): PageTarget[] => {
  const targets: PageTarget[] = [];

  const walk = (items: SidebarNode[], currentPageMappedId?: string) => {
    for (const item of items) {
      if (item.module === "default" || item.module === "api") {
        const pageMappedId =
          item.module === "api" ? currentPageMappedId || item.id : item.id;
        targets.push({
          id: item.id,
          mappedId: item.id,
          pageMappedId,
          label: item.label,
          module: item.module,
          method: item.method,
        });
      }
      if (item.childrenItems && item.childrenItems.length > 0) {
        const nextPageMappedId = item.module === "collapse" ? item.id : currentPageMappedId;
        walk(item.childrenItems, nextPageMappedId);
      }
    }
  };

  walk(nodes);
  return targets;
};

export const createMetaValue = (
  title: string,
  description: string,
  domain: string,
  repositoryUrl: string,
  autoApproval: boolean
): MetaFormValue => ({
  title: title.trim(),
  description: description.trim(),
  domain: domain.trim(),
  repositoryUrl: repositoryUrl.trim(),
  autoApproval,
});

export const extractEndpointFromBlocks = (blocks: DocsBlock[], fallbackEndpoint?: string): string | undefined => {
  const apiBlock = blocks.find((block) => block.module === "api" && block.apiData?.endpoint);
  if (apiBlock?.apiData?.endpoint) {
    return apiBlock.apiData.endpoint;
  }
  if (fallbackEndpoint && fallbackEndpoint.trim()) {
    return fallbackEndpoint;
  }
  return undefined;
};
