"use client";

import styled from "@emotion/styled";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { DocsBlockViewer } from "@/components/docs/DocsBlockViewer";
import { CopyToLLMButton } from "@/components/docs/CopyToLLMButton";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import { useDocsPageQuery, useDocsSidebarQuery } from "@/app/docs/queries";
import { DocsBlock as DocsBlockType } from "@/types/docs";
import { SidebarBlock } from "@/app/docs/api";
import { useCallback, useEffect, useState } from "react";
import { useDocsStore } from "@/store/docsStore";

const ApiUseApplyModal = dynamic(
  () => import("@/components/apis/ApiUseApplyModal").then((module) => module.ApiUseApplyModal),
  { ssr: false }
);

const AddToFolderModal = dynamic(
  () => import("@/components/docs/AddToFolderModal").then((module) => module.AddToFolderModal),
  { ssr: false }
);

export default function DocsPageDetail() {
  const params = useParams();
  const slug = params?.slug as string;
  const id = params?.id as string;
  const setSelected = useDocsStore((state) => state.setSelected);

  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isFolderOpen, setIsFolderOpen] = useState(false);

  const { data: pageData, isLoading: isPageLoading, error: pageError } = useDocsPageQuery(slug || "", id || "");
  const { data: sidebarData } = useDocsSidebarQuery(slug || "");

  const closeApplyModal = useCallback(() => {
    setIsApplyOpen(false);
  }, []);

  const closeFolderModal = useCallback(() => {
    setIsFolderOpen(false);
  }, []);

  useEffect(() => {
    if (id) {
      setSelected(id);
    }
  }, [id, setSelected]);

  if (isPageLoading) {
    return <BsdevLoader label="문서 페이지를 불러오는 중입니다..." size={52} minHeight="160px" />;
  }

  if (pageError) {
    return (
      <ErrorBox>
        조회 중 오류가 발생했습니다. 권한이 없거나 삭제된 문서일 수 있습니다.
      </ErrorBox>
    );
  }

  const findPathLabels = (blocks: SidebarBlock[], targetId: string): string[] | null => {
    for (const block of blocks) {
      if (block.mappedId === targetId || block.id === targetId) {
        return [block.label];
      }
      if (block.childrenItems?.length) {
        const found = findPathLabels(block.childrenItems, targetId);
        if (found) {
          return [block.label, ...found];
        }
      }
    }
    return null;
  };

  const sidebarTitle = sidebarData?.data?.blocks?.[0]?.module === "main_title"
    ? sidebarData.data.blocks[0].label
    : null;

  const projectTitle = sidebarTitle || "Project";
  const selectedPathLabels = sidebarData?.data?.blocks ? findPathLabels(sidebarData.data.blocks, id) ?? [] : [];
  const displayTitle = selectedPathLabels.length > 0 ? selectedPathLabels[selectedPathLabels.length - 1] : "문서";
  const breadcrumb = selectedPathLabels.length > 1 ? selectedPathLabels.slice(0, -1) : [projectTitle];
  const blocks = pageData?.data?.docsBlocks || [];
  const pageVersion = pageData?.data?.version;

  const findSidebarNode = (sblocks: SidebarBlock[], targetId: string): SidebarBlock | null => {
    for (const b of sblocks) {
      if (b.mappedId === targetId || b.id === targetId) return b;
      if (b.childrenItems?.length) {
        const found = findSidebarNode(b.childrenItems, targetId);
        if (found) return found;
      }
    }
    return null;
  };

  const currentSidebarNode = sidebarData?.data?.blocks
    ? findSidebarNode(sidebarData.data.blocks, id)
    : null;
  const currentPageEndpoint = pageData?.data?.endpoint;
  const isApiPage = currentSidebarNode?.module === "api";

  return (
    <>
      <PageHeader>
        <DocsHeader title={displayTitle} breadcrumb={breadcrumb} isApi={false} />
        <HeaderActions>
          <CopyToLLMButton
            blocks={blocks}
            projectTitle={projectTitle}
            pageTitle={displayTitle}
            breadcrumb={breadcrumb}
          />
        </HeaderActions>
      </PageHeader>
      <ContentArea>
        {blocks.length > 0 ? (
          blocks.map((block: DocsBlockType, index: number) => (
            <DocsBlockViewer key={index} block={block} version={pageVersion} />
          ))
        ) : (
          <EmptyText>
            이 페이지에는 내용이 없습니다.
          </EmptyText>
        )}
      </ContentArea>

      <FloatingActions>
        {isApiPage && (
          <FolderButton type="button" onClick={() => setIsFolderOpen(true)}>
            폴더에 담기
          </FolderButton>
        )}
        <ApplyButton type="button" onClick={() => setIsApplyOpen(true)}>
          사용 신청
        </ApplyButton>
      </FloatingActions>

      {isApplyOpen ? (
        <ApiUseApplyModal
          isOpen={isApplyOpen}
          docsId={slug || null}
          docsTitle={projectTitle}
          defaultMappedId={id}
          onClose={closeApplyModal}
        />
      ) : null}

      {isFolderOpen ? (
        <AddToFolderModal
          isOpen={isFolderOpen}
          sourceDocsId={slug || ""}
          sourceMappedId={id || ""}
          sourceLabel={displayTitle}
          sourceMethod={currentSidebarNode?.method}
          sourceEndpoint={currentPageEndpoint}
          onClose={closeFolderModal}
        />
      ) : null}
    </>
  );
}

const PageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding-right: 48px;
`;

const HeaderActions = styled.div`
  padding-top: 2px;
  flex-shrink: 0;
`;

const ErrorBox = styled.div`
  padding: 40px;
  text-align: center;
  color: #ef4444;
`;

const ContentArea = styled.div`
  min-height: 500px;
  padding: 0 48px 0 28px;
`;

const EmptyText = styled.div`
  padding: 20px 0;
  color: #9ca3af;
`;

const FloatingActions = styled.div`
  position: fixed;
  right: 32px;
  bottom: 32px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: stretch;
  z-index: 100;

  @media (max-width: 767px) {
    right: 16px;
    bottom: 16px;
  }
`;

const ApplyButton = styled.button`
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
  box-shadow: 0 10px 24px rgba(22, 51, 92, 0.2);

  &:hover {
    filter: brightness(1.05);
  }
`;

const FolderButton = styled.button`
  width: 132px;
  height: 44px;
  border-radius: 10px;
  border: 2px solid #16335c;
  background: white;
  color: #16335c;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(22, 51, 92, 0.12);

  &:hover {
    background: #f0f4fa;
  }
`;
