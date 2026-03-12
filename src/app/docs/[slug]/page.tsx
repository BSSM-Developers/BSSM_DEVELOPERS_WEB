"use client";

import { useParams, useRouter } from "next/navigation";
import { useDocsSidebarQuery } from "@/app/docs/queries";
import { useEffect } from "react";
import { SidebarBlock } from "@/app/docs/api";
import { useDocsStore } from "@/store/docsStore";
import { BsdevLoader } from "@/components/common/BsdevLoader";

export default function DocsProjectPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const setSelected = useDocsStore((state) => state.setSelected);

  const { data: sidebarData, isLoading: isSidebarLoading, error: sidebarError } = useDocsSidebarQuery(slug || "");

  useEffect(() => {
    if (sidebarData?.data?.blocks) {
      const findFirstPage = (items: SidebarBlock[]): string | null => {
        for (const item of items) {
          const isPage = item.module === "api" || item.module === "default";
          const targetId = item.mappedId || item.id;
          if (isPage && targetId) return targetId;
          if (item.childrenItems?.length) {
            const result = findFirstPage(item.childrenItems);
            if (result) return result;
          }
        }
        return null;
      };

      const firstId = findFirstPage(sidebarData.data.blocks);
      if (firstId) {
        setSelected(firstId);
        router.replace(`/docs/${slug}/page/${firstId}`);
      }
    }
  }, [router, setSelected, sidebarData, slug]);

  if (isSidebarLoading) {
    return <BsdevLoader fullScreen label="문서 정보를 불러오는 중입니다..." />;
  }

  if (sidebarError) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#EF4444" }}>
        조회 중 오류가 발생했습니다. 권한이 없거나 삭제된 문서일 수 있습니다.
      </div>
    );
  }

  return <BsdevLoader label="문서 내용을 불러오는 중입니다..." size={52} minHeight="160px" />;
}
