"use client";

import { createPortal } from "react-dom";
import styled from "@emotion/styled";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { docsApi } from "@/app/docs/api";

interface AddToFolderModalProps {
  isOpen: boolean;
  sourceDocsId: string;
  sourceMappedId: string;
  sourceLabel: string;
  sourceMethod?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  onClose: () => void;
}

export function AddToFolderModal({
  isOpen,
  sourceDocsId,
  sourceMappedId,
  sourceLabel,
  sourceMethod,
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
        const newMappedId = crypto.randomUUID();
        await docsApi.addPage(targetDocsId, {
          page: {
            id: newMappedId,
            sourceDocsId,
            sourceMappedId,
          },
          sidebarBlock: {
            id: newMappedId,
            label: sourceLabel,
            module: "api",
            ...(sourceMethod ? { method: sourceMethod } : {}),
          },
        });
        setDoneIds((prev) => new Set([...prev, targetDocsId]));
      } catch (error) {
        if (error instanceof Error && error.message.includes("(409")) {
          setDoneIds((prev) => new Set([...prev, targetDocsId]));
        } else {
          console.error(error);
          setErrorIds((prev) => new Set([...prev, targetDocsId]));
        }
      } finally {
        setAddingId(null);
      }
    },
    [addingId, doneIds, sourceDocsId, sourceLabel, sourceMethod, sourceMappedId]
  );

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <Overlay onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Dialog onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <HeaderLeft>
            <HeaderIcon>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16335c" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                <line x1="12" y1="11" x2="12" y2="17"/>
                <line x1="9" y1="14" x2="15" y2="14"/>
              </svg>
            </HeaderIcon>
            <HeaderText>
              <Title>폴더에 담기</Title>
              <Subtitle><em>{sourceLabel}</em>을(를) 담을 폴더집 선택</Subtitle>
            </HeaderText>
          </HeaderLeft>
          <CloseBtn type="button" onClick={onClose} aria-label="닫기">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </CloseBtn>
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
                    {isAdding ? "추가 중…" : isDone ? "추가됨" : isError ? "재시도" : "추가하기"}
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
  background: #ffffff;
  padding: 20px 20px 16px;
  border-bottom: 1px solid #f0f2f5;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const HeaderIcon = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #f0f4fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const HeaderText = styled.div`
  min-width: 0;
`;

const Title = styled.h2`
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 700;
  color: #16335c;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  letter-spacing: -0.3px;
`;

const Subtitle = styled.p`
  margin: 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 12px;
  color: #9ca3af;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;

  em {
    font-style: normal;
    color: #4b5563;
    font-weight: 600;
  }
`;

const CloseBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;

  &:hover {
    background: #e5e7eb;
    color: #374151;
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
  border: 1px solid #e9ecf2;
  border-radius: 12px;
  padding: 12px 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  background: #ffffff;
  transition: border-color 0.15s, background 0.15s;

  &:hover {
    border-color: #c8d3e8;
    background: #f8f9fc;
  }
`;

const ItemInfo = styled.div`
  min-width: 0;
  flex: 1;
`;

const ItemTitle = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: #1f2937;
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
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1.5px solid ${({ $done, $error }) =>
    $done ? "#9ca3af" : $error ? "#dc2626" : "#16335c"};
  background: ${({ $done, $error }) =>
    $done ? "transparent" : $error ? "#fef2f2" : "transparent"};
  color: ${({ $done, $error }) =>
    $done ? "#9ca3af" : $error ? "#dc2626" : "#16335c"};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: ${({ disabled }) => (disabled ? "not-allowed" : "pointer")};
  opacity: ${({ disabled }) => (disabled ? 0.6 : 1)};
  flex-shrink: 0;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    background: ${({ $done, $error }) =>
      $done ? "transparent" : $error ? "#fee2e2" : "#16335c"};
    color: ${({ $done, $error }) =>
      $done ? "#9ca3af" : $error ? "#dc2626" : "white"};
  }
`;
