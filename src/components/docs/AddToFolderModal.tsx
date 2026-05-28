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
    queryFn: () => docsApi.getMyList({ type: "custom", size: 50 }),
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
    <Overlay
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <Dialog onClick={(e) => e.stopPropagation()}>
        <Header>
          <Title>폴더에 담기</Title>
          <CloseButton type="button" onClick={onClose}>닫기</CloseButton>
        </Header>
        <Desc>
          <strong>{sourceLabel}</strong>을(를) 담을 폴더집을 선택하세요.
        </Desc>

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
              <Item key={fid}>
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
                  {isAdding ? "담는 중..." : isDone ? "완료" : isError ? "재시도" : "담기"}
                </AddBtn>
              </Item>
            );
          })}
        </List>
      </Dialog>
    </Overlay>,
    document.body
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3500;
  padding: 20px;
`;

const Dialog = styled.div`
  width: min(520px, 100%);
  max-height: min(640px, calc(100vh - 40px));
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #ffffff;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 24px 56px rgba(17, 24, 39, 0.24);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #111827;
  font-family: "Spoqa Han Sans Neo", sans-serif;
`;

const CloseButton = styled.button`
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  color: #374151;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
`;

const Desc = styled.p`
  margin: 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #6b7280;

  strong {
    color: #111827;
    font-weight: 700;
  }
`;

const StatusText = styled.p`
  margin: 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #9ca3af;
  text-align: center;
  padding: 16px 0;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
`;

const Item = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const ItemInfo = styled.div`
  min-width: 0;
  flex: 1;
`;

const ItemTitle = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #111827;
`;

const ItemDesc = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #6b7280;
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AddBtn = styled.button<{ $done?: boolean; $error?: boolean }>`
  height: 34px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid ${({ $done, $error }) =>
    $done ? "#0CA678" : $error ? "#FA5252" : "#16335C"};
  background: ${({ $done, $error }) =>
    $done ? "#0CA678" : $error ? "#FA5252" : "#16335C"};
  color: white;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.7 : 1)};
  flex-shrink: 0;
  transition: background 0.15s;
  white-space: nowrap;
`;
