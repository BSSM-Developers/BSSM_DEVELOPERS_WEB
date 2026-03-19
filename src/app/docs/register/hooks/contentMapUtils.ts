import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import type { DocsBlock } from "@/types/docs";

const createDefaultApiBlocks = (node: SidebarNode): DocsBlock[] => [
  {
    id: crypto.randomUUID(),
    module: "api",
    apiData: {
      id: node.id,
      name: node.label || "API 문서",
      method: node.method || "GET",
      endpoint: "",
      description: "",
      responseStatus: 200,
      responseMessage: "OK",
    },
    content: "",
  },
];

export const flattenSidebarNodes = (nodes: SidebarNode[]): SidebarNode[] => {
  const result: SidebarNode[] = [];
  for (const node of nodes) {
    result.push(node);
    if (!node.childrenItems?.length) {
      continue;
    }
    result.push(...flattenSidebarNodes(node.childrenItems));
  }
  return result;
};

export const resolveContentMapWithApiDefaults = (
  sidebarItems: SidebarNode[],
  contentMap: Record<string, DocsBlock[]>,
  selectedId: string | null | undefined,
  currentDocsBlocks: DocsBlock[]
): Record<string, DocsBlock[]> => {
  const mergedMap: Record<string, DocsBlock[]> = { ...contentMap };

  if (selectedId) {
    mergedMap[selectedId] = currentDocsBlocks;
  }

  const allNodes = flattenSidebarNodes(sidebarItems);
  for (const node of allNodes) {
    if (node.module !== "api") {
      continue;
    }

    const nodeBlocks = mergedMap[node.id] ?? [];
    const hasValidApiBlock = nodeBlocks.some((block) => block.module === "api" && Boolean(block.apiData));
    if (hasValidApiBlock) {
      continue;
    }

    mergedMap[node.id] = createDefaultApiBlocks(node);
  }

  return mergedMap;
};
