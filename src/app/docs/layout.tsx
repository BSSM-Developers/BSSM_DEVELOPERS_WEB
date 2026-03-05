"use client";

import { docsApi, SidebarBlock } from "@/app/docs/api";
import { useDocsListQuery, useDocsSidebarQuery } from "@/app/docs/queries";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { SidebarNode } from "@/components/ui/sidebarItem/types";
import { DocsLayout } from "@/components/layout/DocsLayout";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "UPDATE";

const toHttpMethod = (value: unknown): HttpMethod | undefined => {
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

const inferMethodFromBlockContent = (content?: string): HttpMethod | undefined => {
  if (!content || !content.trim().startsWith("{")) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(content) as { method?: unknown };
    return toHttpMethod(parsed.method);
  } catch {
    return undefined;
  }
};

const collectApiTargetsMissingMethod = (blocks: SidebarBlock[]): Array<{ mappedId: string }> => {
  const targets: Array<{ mappedId: string }> = [];

  const walk = (items: SidebarBlock[]) => {
    for (const item of items) {
      if (item.module === "api" && !item.method && item.mappedId) {
        targets.push({ mappedId: item.mappedId });
      }
      if (item.childrenItems && item.childrenItems.length > 0) {
        walk(item.childrenItems);
      }
    }
  };

  walk(blocks);
  return targets;
};

const applyMethodMapToNodes = (
  nodes: SidebarNode[],
  methodMap: Record<string, HttpMethod>
): SidebarNode[] => {
  return nodes.map((node) => ({
    ...node,
    method: node.method || methodMap[node.id] || node.method,
    childrenItems: node.childrenItems ? applyMethodMapToNodes(node.childrenItems, methodMap) : [],
  }));
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const params = useParams();
  const slug = params?.slug as string;
  const isRegisterPage = pathname === "/docs/register";
  const isEditPage = pathname?.includes("/edit");
  const shouldFetchLayoutData = !isRegisterPage && !isEditPage;
  const { data: docsListData } = useDocsListQuery(shouldFetchLayoutData);
  const { data: sidebarData } = useDocsSidebarQuery(shouldFetchLayoutData ? slug || "" : "");

  const [sidebarItems, setSidebarItems] = useState<SidebarNode[]>([]);

  const mapSidebarBlocks = useCallback((blocks: SidebarBlock[]): SidebarNode[] => {
    return blocks.map(block => ({
      id: block.mappedId || block.id,
      label: block.label,
      module: block.module,
      path:
        slug && block.mappedId && (block.module === "default" || block.module === "api")
          ? `/docs/${slug}/page/${block.mappedId}`
          : undefined,
      method: block.method,
      childrenItems: block.childrenItems ? mapSidebarBlocks(block.childrenItems) : []
    }));
  }, [slug]);

  useEffect(() => {
    if (!shouldFetchLayoutData) {
      return;
    }
    if (slug && sidebarData?.data?.blocks) {
      setSidebarItems(mapSidebarBlocks(sidebarData.data.blocks));
      return;
    }

    if (docsListData?.data?.values) {
      const items = docsListData.data.values.map((doc) => ({
        id: String(doc.docsId || doc.id),
        label: doc.title,
        module: "default",
        path: `/docs/${String(doc.docsId || doc.id)}`,
        childrenItems: []
      }));

      setSidebarItems([{
        id: "root",
        label: "문서 목록",
        module: "main_title",
        childrenItems: items
      }]);
    }
  }, [docsListData, mapSidebarBlocks, shouldFetchLayoutData, sidebarData, slug]);

  useEffect(() => {
    if (!shouldFetchLayoutData) {
      return;
    }
    const enrichApiMethods = async () => {
      if (!slug || !sidebarData?.data?.blocks) {
        return;
      }

      const targets = collectApiTargetsMissingMethod(sidebarData.data.blocks);
      if (targets.length === 0) {
        return;
      }

      const entries = await Promise.all(
        targets.map(async (target) => {
          try {
            const response = await docsApi.getPage(slug, target.mappedId);
            const apiBlock = response.data.docsBlocks.find((block) => block.module === "api");
            return [target.mappedId, inferMethodFromBlockContent(apiBlock?.content)] as const;
          } catch {
            return [target.mappedId, undefined] as const;
          }
        })
      );

      const methodMap: Record<string, HttpMethod> = {};
      for (const [mappedId, method] of entries) {
        if (method) {
          methodMap[mappedId] = method;
        }
      }

      if (Object.keys(methodMap).length === 0) {
        return;
      }

      setSidebarItems((prev) => applyMethodMapToNodes(prev, methodMap));
    };

    void enrichApiMethods();
  }, [shouldFetchLayoutData, sidebarData, slug]);

  const sidebarTitle = sidebarData?.data?.blocks?.[0]?.module === "main_title"
    ? sidebarData.data.blocks[0].label
    : null;

  if (isRegisterPage || isEditPage) {
    return <>{children}</>;
  }

  return (
    <DocsLayout
      sidebarItems={sidebarItems}
      showSidebar={true}
      projectName={sidebarTitle || "BSSM Developers"}
    >
      {children}
    </DocsLayout>
  );
}
