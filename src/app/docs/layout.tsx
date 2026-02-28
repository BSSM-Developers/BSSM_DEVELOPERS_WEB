"use client";

import { useDocsDetailQuery, useDocsListQuery, useDocsSidebarQuery } from "@/app/docs/queries";
import { usePathname, useParams } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { SidebarNode } from "@/components/ui/sidebarItem/types";
import { DocsLayout } from "@/components/layout/DocsLayout";
import { SidebarBlock } from "./api";

export default function Layout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const slug = params?.slug as string;
  const { data: docsListData } = useDocsListQuery();
  const { data: sidebarData } = useDocsSidebarQuery(slug || "");

  const [sidebarItems, setSidebarItems] = useState<SidebarNode[]>([]);
  const pathname = usePathname();
  const isRegisterPage = pathname === "/docs/register";

  const mapSidebarBlocks = useCallback((blocks: SidebarBlock[]): SidebarNode[] => {
    return blocks.map(block => ({
      id: block.mappedId || block.id,
      label: block.label,
      module: block.module,
      method: block.method,
      childrenItems: block.childrenItems ? mapSidebarBlocks(block.childrenItems) : []
    }));
  }, []);

  useEffect(() => {
    if (slug && sidebarData?.data?.blocks) {
      setSidebarItems(mapSidebarBlocks(sidebarData.data.blocks));
      return;
    }

    if (docsListData?.data?.values) {
      const items = docsListData.data.values.map((doc) => ({
        id: String(doc.docsId || doc.id),
        label: doc.title,
        module: "default",
        childrenItems: []
      }));

      setSidebarItems([{
        id: "root",
        label: "문서 목록",
        module: "main_title",
        childrenItems: items
      }]);
    }
  }, [docsListData, sidebarData, slug, mapSidebarBlocks]);

  const { data: detailData } = useDocsDetailQuery(slug || "");
  const sidebarTitle = sidebarData?.data?.blocks?.[0]?.module === "main_title"
    ? sidebarData.data.blocks[0].label
    : null;

  if (isRegisterPage) {
    return <>{children}</>;
  }

  return (
    <DocsLayout
      sidebarItems={sidebarItems}
      showSidebar={true}
      projectName={sidebarTitle || detailData?.data?.title || "BSSM Developers"}
    >
      {children}
    </DocsLayout>
  );
}
