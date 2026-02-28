"use client";

import { useParams } from "next/navigation";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockViewer } from "@/components/docs/DocsBlockViewer";
import { useDocsDetailQuery, useDocsPageQuery, useDocsSidebarQuery } from "@/app/docs/queries";
import { DocsBlock as DocsBlockType } from "@/types/docs";
import { SidebarBlock } from "@/app/docs/api";

export default function DocsPageDetail() {
  const params = useParams();
  const slug = params?.slug as string;
  const id = params?.id as string;

  const { data: pageData, isLoading: isPageLoading, error: pageError } = useDocsPageQuery(slug || "", id || "");
  const { data: sidebarData } = useDocsSidebarQuery(slug || "");
  const { data: detailData } = useDocsDetailQuery(slug || "");

  if (isPageLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>
        Loading...
      </div>
    );
  }

  if (pageError) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#EF4444" }}>
        조회 중 오류가 발생했습니다. 권한이 없거나 삭제된 문서일 수 있습니다.
      </div>
    );
  }

  const findLabel = (blocks: SidebarBlock[], targetId: string): string | null => {
    for (const b of blocks) {
      if (b.mappedId === targetId || b.id === targetId) return b.label;
      if (b.childrenItems?.length) {
        const found = findLabel(b.childrenItems, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const sidebarTitle = sidebarData?.data?.blocks?.[0]?.module === "main_title"
    ? sidebarData.data.blocks[0].label
    : null;

  const projectTitle = sidebarTitle || detailData?.data?.title || "Project";
  const pageLabel = sidebarData?.data?.blocks ? findLabel(sidebarData.data.blocks, id) : null;
  const displayTitle = pageLabel || "문서";
  const blocks = pageData?.data?.docsBlocks || [];

  return (
    <>
      <DocsHeader title={displayTitle} breadcrumb={[projectTitle]} isApi={false} />
      <div style={{ minHeight: "500px", paddingBottom: "100px", paddingLeft: "48px" }}>
        {blocks.length > 0 ? (
          blocks.map((block: DocsBlockType, i: number) => (
            <DocsBlockViewer key={i} block={block} domain={detailData?.data?.domain} />
          ))
        ) : (
          <div style={{ padding: "20px 0", color: "#9CA3AF" }}>
            이 페이지에는 내용이 없습니다.
          </div>
        )}
      </div>
    </>
  );
}
