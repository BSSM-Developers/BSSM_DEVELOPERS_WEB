"use client";

import { createPortal } from "react-dom";
import styled from "@emotion/styled";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { docsApi, type SidebarBlock, type DocsSideBarBlockRequest } from "@/app/docs/api";

interface AddToFolderModalProps {
  isOpen: boolean;
  sourceDocsId: string;
  sourceMappedId: string;
  sourceLabel: string;
  sourceMethod?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  sourceEndpoint?: string;
  onClose: () => void;
}

function toSidebarRequest(block: SidebarBlock): DocsSideBarBlockRequest {
  const req: DocsSideBarBlockRequest = {
    id: block.mappedId || block.id,
    label: block.label,
    module: block.module,
  };
  if (block.method) req.method = block.method;
  if (block.childrenItems?.length) {
    req.childrenItems = block.childrenItems.map(toSidebarRequest);
  }
  return req;
}

function collectLeafPages(blocks: SidebarBlock[]): Array<{ mappedId: string; module: string }> {
  const result: Array<{ mappedId: string; module: string }> = [];
  for (const block of blocks) {
    if ((block.module === "api" || block.module === "default") && (block.mappedId || block.id)) {
      result.push({ mappedId: block.mappedId || block.id, module: block.module });
    }
    if (block.childrenItems?.length) {
      result.push(...collectLeafPages(block.childrenItems));
    }
  }
  return result;
}

export function AddToFolderModal({
  isOpen,
  sourceDocsId,
  sourceMappedId,
  sourceLabel,
  sourceMethod,
  sourceEndpoint,
  onClose,
}: AddToFolderModalProps) {
  const [addingId, setAddingId] = useState<string | null>(null);
  const [doneIds, setDoneIds] = useState<Set<string>>(new Set());
  const [errorIds, setErrorIds] = useState<Set<string>>(new Set());

  const { data: foldersData, isLoading } = useQuery({
    queryKey: ["my-custom-folders-for-add"],
    queryFn: () => docsApi.getMyList({ type: "customize", size: 50 }),
    enabled: isOpen,
  });

  const folders = foldersData?.data?.values ?? [];

  const handleAdd = useCallback(
    async (targetDocsId: string) => {
      if (addingId || doneIds.has(targetDocsId)) return;
      setAddingId(targetDocsId);
      setErrorIds((prev) => {
        const next = new Set(prev);
        next.delete(targetDocsId);
        return next;
      });

      try {
        const [sidebarResp, detailResp] = await Promise.all([
          docsApi.getSidebar(targetDocsId, false),
          docsApi.getDetail(targetDocsId),
        ]);

        const existingBlocks = sidebarResp.data.blocks ?? [];
        const meta = detailResp.data;
        const leafPages = collectLeafPages(existingBlocks);

        const existingPageData = await Promise.all(
          leafPages.map(async ({ mappedId, module }) => {
            try {
              const resp = await docsApi.getPage(targetDocsId, mappedId);
              return {
                id: mappedId,
                module,
                endpoint: resp.data.endpoint,
                sourceDocsId: resp.data.sourceDocsId,
                sourceMappedId: resp.data.sourceMappedId,
                docsBlocks: resp.data.docsBlocks,
              };
            } catch {
              return { id: mappedId, module, endpoint: undefined, sourceDocsId: undefined, sourceMappedId: undefined, docsBlocks: [] };
            }
          })
        );

        const newMappedId = crypto.randomUUID();
        const newSidebarNode: DocsSideBarBlockRequest = {
          id: newMappedId,
          label: sourceLabel,
          module: "api",
          ...(sourceMethod ? { method: sourceMethod } : {}),
        };

        const newSidebarBlocks: DocsSideBarBlockRequest[] = [
          ...existingBlocks.map(toSidebarRequest),
          newSidebarNode,
        ];

        const existingPages = existingPageData.map((p) => {
          if (p.module === "api" && p.sourceDocsId && p.sourceMappedId) {
            return {
              id: p.id,
              ...(p.endpoint ? { endpoint: p.endpoint } : {}),
              sourceDocsId: p.sourceDocsId,
              sourceMappedId: p.sourceMappedId,
            };
          }
          return {
            id: p.id,
            blocks: (p.docsBlocks ?? []).map((b) => ({
              id: b.id,
              module: b.module,
              content: b.content ?? "",
            })),
          };
        });

        const newPage = {
          id: newMappedId,
          sourceDocsId,
          sourceMappedId,
          ...(sourceEndpoint ? { endpoint: sourceEndpoint } : {}),
        };

        await docsApi.replace(targetDocsId, {
          title: meta.title,
          description: meta.description ?? "",
          domain: meta.domain ?? "",
          repository_url: meta.repositoryUrl ?? meta.repository_url ?? "",
          auto_approval: meta.autoApproval ?? meta.auto_approval ?? false,
          sidebar: { blocks: newSidebarBlocks },
          docs_pages: [...existingPages, newPage],
        });

        setDoneIds((prev) => new Set([...prev, targetDocsId]));
      } catch (error) {
        console.error(error);
        setErrorIds((prev) => new Set([...prev, targetDocsId]));
      } finally {
        setAddingId(null);
      }
    },
    [addingId, doneIds, sourceDocsId, sourceEndpoint, sourceLabel, sourceMethod, sourceMappedId]
  );

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <Overlay onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderTop>
            <FolderIcon>🗂</FolderIcon>
            <HeaderText>
              <Title>폴더에 담기</Title>
              <Subtitle><em>{sourceLabel}</em>을(를) 담을 폴더집 선택</Subtitle>
            </HeaderText>
            <CloseBtn type="button" onClick={onClose} aria-label="닫기">✕</CloseBtn>
          </HeaderTop>
        </ModalHeader>

        <Body>
          {isLoading && <StatusText>폴더 목록을 불러오는 중...</StatusText>}
          {!isLoading && folders.length === 0 && (
            <StatusText>등록된 폴더집이 없습니다.</StatusText>
          )}
          <List>
            {folders.map((folder) => {
              const fid = folder.docsId;
              const isAdding = addingId === fid;
              const isDone = doneIds.has(fid);
              const isError = errorIds.has(fid);
              return (
                <Item key={fid} $done={isDone}>
                  <ItemAvatar>{folder.title.charAt(0).toUpperCase()}</ItemAvatar>
                  <ItemInfo>
                    <ItemTitle>{folder.title}</ItemTitle>
                    {folder.description && <ItemDesc>{folder.description}</ItemDesc>}
                  </ItemInfo>
                  <AddBtn
                    type="button"
                    $done={isDone}
                    $error={isError}
                    disabled={isAdding || !!addingId || isDone}
                    onClick={() => handleAdd(fid)}
                  >
                    {isAdding ? "담는 중…" : isDone ? "✓ 완료" : isError ? "재시도" : "담기"}
                  </AddBtn>
                </Item>
              );
            })}
          </List>
        </Body>
      </Dialog>
    </Overlay>,
    document.body
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(8, 16, 33, 0.55);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3500;
  padding: 20px;

  @media (min-width: 768px) {
    padding-left: 280px;
  }
`;

const Dialog = styled.div`
  width: min(480px, 100%);
  max-height: min(600px, calc(100vh - 40px));
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 32px 72px rgba(7, 18, 44, 0.28);
`;

const ModalHeader = styled.div`
  background: linear-gradient(135deg, #16335c 0%, #1e4a7a 100%);
  padding: 22px 24px 20px;
  flex-shrink: 0;
`;

const HeaderTop = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 14px;
`;

const FolderIcon = styled.span`
  font-size: 28px;
  line-height: 1;
  margin-top: 2px;
  flex-shrink: 0;
`;

const HeaderText = styled.div`
  flex: 1;
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0 0 3px;
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  letter-spacing: -0.4px;
`;

const Subtitle = styled.p`
  margin: 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);

  em {
    font-style: normal;
    color: rgba(255, 255, 255, 0.95);
    font-weight: 600;
  }
`;

const CloseBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: 14px;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;

  &:hover {
    background: rgba(255, 255, 255, 0.25);
  }
`;

const Body = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StatusText = styled.p`
  margin: 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #9ca3af;
  text-align: center;
  padding: 24px 0;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Item = styled.div<{ $done?: boolean }>`
  border: 1.5px solid ${({ $done }) => ($done ? "#d1fae5" : "#f0f2f5")};
  border-radius: 14px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: ${({ $done }) => ($done ? "#f0fdf4" : "#fafafa")};
  transition: border-color 0.2s, background 0.2s;

  &:hover {
    border-color: ${({ $done }) => ($done ? "#d1fae5" : "#d0d8e8")};
    background: ${({ $done }) => ($done ? "#f0fdf4" : "#f4f6fb")};
  }
`;

const ItemAvatar = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(135deg, #16335c 0%, #2563a8 100%);
  color: white;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ItemInfo = styled.div`
  min-width: 0;
  flex: 1;
`;

const ItemTitle = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #111827;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const ItemDesc = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AddBtn = styled.button<{ $done?: boolean; $error?: boolean }>`
  height: 32px;
  padding: 0 14px;
  border-radius: 999px;
  border: none;
  background: ${({ $done, $error }) =>
    $done ? "#d1fae5" : $error ? "#fee2e2" : "#16335c"};
  color: ${({ $done, $error }) =>
    $done ? "#065f46" : $error ? "#991b1b" : "white"};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.8 : 1)};
  flex-shrink: 0;
  white-space: nowrap;
  transition: filter 0.15s;

  &:hover:not(:disabled) {
    filter: brightness(0.95);
  }
`;
