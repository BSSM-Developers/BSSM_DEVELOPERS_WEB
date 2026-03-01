"use client";

import styled from "@emotion/styled";
import { useParams } from "next/navigation";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockViewer } from "@/components/docs/DocsBlockViewer";
import { ApiUseApplyModal } from "@/components/apis/ApiUseApplyModal";
import { useDocsDetailQuery, useDocsPageQuery, useDocsSidebarQuery } from "@/app/docs/queries";
import { DocsBlock as DocsBlockType } from "@/types/docs";
import { SidebarBlock } from "@/app/docs/api";
import { useCallback, useState } from "react";

export default function DocsPageDetail() {
  const params = useParams();
  const slug = params?.slug as string;
  const id = params?.id as string;

  const [isApplyOpen, setIsApplyOpen] = useState(false);

  const { data: pageData, isLoading: isPageLoading, error: pageError } = useDocsPageQuery(slug || "", id || "");
  const { data: sidebarData } = useDocsSidebarQuery(slug || "");
  const { data: detailData } = useDocsDetailQuery(slug || "");

  const closeApplyModal = useCallback(() => {
    setIsApplyOpen(false);
  }, []);

  if (isPageLoading) {
    return (
      <LoadingBox>
        Loading...
      </LoadingBox>
    );
  }

  if (pageError) {
    return (
      <ErrorBox>
        조회 중 오류가 발생했습니다. 권한이 없거나 삭제된 문서일 수 있습니다.
      </ErrorBox>
    );
  }

  const findLabel = (blocks: SidebarBlock[], targetId: string): string | null => {
    for (const block of blocks) {
      if (block.mappedId === targetId || block.id === targetId) {
        return block.label;
      }
      if (block.childrenItems?.length) {
        const found = findLabel(block.childrenItems, targetId);
        if (found) {
          return found;
        }
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
      <ContentArea>
        {blocks.length > 0 ? (
          blocks.map((block: DocsBlockType, index: number) => (
            <DocsBlockViewer key={index} block={block} domain={detailData?.data?.domain} />
          ))
        ) : (
          <EmptyText>
            이 페이지에는 내용이 없습니다.
          </EmptyText>
        )}
      </ContentArea>

      <ApplyButton type="button" onClick={() => setIsApplyOpen(true)}>
        사용 신청
      </ApplyButton>

      <ApiUseApplyModal
        isOpen={isApplyOpen}
        docsId={slug || null}
        docsTitle={projectTitle}
        defaultMappedId={id}
        onClose={closeApplyModal}
      />
    </>
  );
}

const LoadingBox = styled.div`
  padding: 40px;
  text-align: center;
  color: #6b7280;
`;

const ErrorBox = styled.div`
  padding: 40px;
  text-align: center;
  color: #ef4444;
`;

const ContentArea = styled.div`
  min-height: 500px;
  padding: 0 48px 120px;
`;

const EmptyText = styled.div`
  padding: 20px 0;
  color: #9ca3af;
`;

const ApplyButton = styled.button`
  position: fixed;
  right: 32px;
  bottom: 32px;
  width: 132px;
  height: 48px;
  border-radius: 10px;
  border: none;
  background: #16335c;
  color: white;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  z-index: 100;
  box-shadow: 0 10px 24px rgba(22, 51, 92, 0.2);

  &:hover {
    filter: brightness(1.05);
  }
`;
