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
  const [fabOpen, setFabOpen] = useState(false);

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

      <SpeedDial>
        {fabOpen && <FabBackdrop onClick={() => setFabOpen(false)} />}
        <SpeedDialList>
          <SpeedDialRow $open={fabOpen} style={{ transitionDelay: fabOpen ? "60ms" : "0ms" }}>
            <SpeedDialLabel onClick={() => { setFabOpen(false); setIsFolderOpen(true); }}>폴더에 담기</SpeedDialLabel>
            <SpeedDialDot type="button" onClick={() => { setFabOpen(false); setIsFolderOpen(true); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#16335c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
            </SpeedDialDot>
          </SpeedDialRow>
          <SpeedDialRow $open={fabOpen} style={{ transitionDelay: fabOpen ? "0ms" : "60ms" }}>
            <SpeedDialLabel onClick={() => { setFabOpen(false); setIsApplyOpen(true); }}>사용 신청</SpeedDialLabel>
            <SpeedDialDot type="button" $primary onClick={() => { setFabOpen(false); setIsApplyOpen(true); }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </SpeedDialDot>
          </SpeedDialRow>
        </SpeedDialList>
        <FabButton type="button" $open={fabOpen} onClick={() => setFabOpen(p => !p)}>
          {fabOpen
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          }
        </FabButton>
      </SpeedDial>

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

const SpeedDial = styled.div`
  position: fixed;
  right: 32px;
  bottom: 32px;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  z-index: 100;

  @media (max-width: 767px) {
    right: 16px;
    bottom: 16px;
  }
`;

const FabBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: -1;
`;

const SpeedDialList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
`;

const SpeedDialRow = styled.div<{ $open: boolean }>`
  display: flex;
  align-items: center;
  gap: 10px;
  opacity: ${({ $open }) => ($open ? 1 : 0)};
  transform: ${({ $open }) => ($open ? "translateY(0)" : "translateY(10px)")};
  pointer-events: ${({ $open }) => ($open ? "auto" : "none")};
  transition: opacity 0.2s ease, transform 0.2s ease;
`;

const SpeedDialLabel = styled.span`
  background: white;
  color: #16335c;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 700;
  padding: 6px 14px;
  border-radius: 999px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
`;

const SpeedDialDot = styled.button<{ $primary?: boolean }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: ${({ $primary }) => ($primary ? "none" : "1.5px solid #d0d8ea")};
  background: ${({ $primary }) => ($primary ? "#16335c" : "white")};
  box-shadow: 0 4px 14px rgba(22, 51, 92, 0.24);
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 6px;

  &:hover {
    filter: brightness(1.08);
  }
`;

const FabButton = styled.button<{ $open: boolean }>`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: none;
  background: #16335c;
  color: white;
  cursor: pointer;
  box-shadow: 0 6px 20px rgba(22, 51, 92, 0.32);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.22s ease;
  transform: ${({ $open }) => ($open ? "rotate(90deg)" : "rotate(0deg)")};

  &:hover {
    filter: brightness(1.1);
  }
`;
