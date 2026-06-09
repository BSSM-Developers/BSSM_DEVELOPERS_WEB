"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";
import { HttpMethodTag } from "@/components/ui/httpMethod/HttpMethodTag";
import type { GitHubParsedEndpoint } from "@/app/user/github/api";

interface EndpointPickerModalProps {
  endpoints: GitHubParsedEndpoint[];
  /** 이미 추가된 "METHOD endpoint" 키 집합 (중복 방지) */
  usedKeys: Set<string>;
  onPick: (ep: GitHubParsedEndpoint) => void;
  onCustom: () => void;
  onClose: () => void;
}

const keyOf = (ep: { method: string; endpoint: string }) =>
  `${ep.method.toUpperCase()} ${ep.endpoint}`;

export function EndpointPickerModal({
  endpoints,
  usedKeys,
  onPick,
  onCustom,
  onClose,
}: EndpointPickerModalProps) {
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  // 이미 추가된 항목 제외 + 검색 필터
  const available = useMemo(() => {
    const notUsed = endpoints.filter((ep) => !usedKeys.has(keyOf(ep)));
    const q = query.trim().toLowerCase();
    if (!q) return notUsed;
    return notUsed.filter(
      (ep) =>
        ep.endpoint.toLowerCase().includes(q) ||
        ep.method.toLowerCase().includes(q)
    );
  }, [endpoints, usedKeys, query]);

  if (!mounted) return null;

  return createPortal(
    <Overlay>
      <Backdrop onClick={onClose} />
      <Modal role="dialog" aria-modal="true">
        <Header>
          <Title>엔드포인트 선택</Title>
          <CloseBtn onClick={onClose} aria-label="닫기">
            ×
          </CloseBtn>
        </Header>
        <Desc>레포지토리에서 분석된 엔드포인트를 선택해 API 문서를 추가하세요.</Desc>

        <SearchInput
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="메서드 또는 경로 검색..."
        />

        <List>
          {available.length === 0 && (
            <Empty>
              {query
                ? "검색 결과가 없습니다."
                : "추가할 수 있는 엔드포인트가 없습니다. (모두 추가됨)"}
            </Empty>
          )}
          {available.map((ep) => (
            <Item key={keyOf(ep)} onClick={() => onPick(ep)}>
              <HttpMethodTag
                method={
                  (["GET", "POST", "PUT", "DELETE", "PATCH"].includes(
                    ep.method.toUpperCase()
                  )
                    ? ep.method.toUpperCase()
                    : "GET") as "GET" | "POST" | "PUT" | "DELETE" | "PATCH"
                }
                size="small"
              />
              <Path>{ep.endpoint}</Path>
            </Item>
          ))}
        </List>

        <Footer>
          <CustomBtn onClick={onCustom}>직접 입력으로 추가</CustomBtn>
        </Footer>
      </Modal>
    </Overlay>,
    document.body
  );
}

// ── styles ──────────────────────────────────────────
const FONT = '"Spoqa Han Sans Neo", sans-serif';
const NAVY = "#16335C";

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(15, 17, 23, 0.45);
`;

const Modal = styled.div`
  position: relative;
  width: min(480px, calc(100vw - 32px));
  max-height: min(560px, calc(100vh - 64px));
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 48px rgba(0, 0, 0, 0.24);
  padding: 24px;
  font-family: ${FONT};
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h3`
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #191f28;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  font-size: 24px;
  line-height: 1;
  color: #8b95a1;
  cursor: pointer;
  padding: 0 4px;
`;

const Desc = styled.p`
  margin: 6px 0 16px;
  font-size: 13px;
  color: #6b7280;
`;

const SearchInput = styled.input`
  width: 100%;
  border: 1px solid #e5e8eb;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: ${FONT};
  background: #f9fafb;
  color: #191f28;
  margin-bottom: 12px;
  &::placeholder { color: #b0b8c1; }
  &:focus { outline: none; border-color: ${NAVY}; background: #fff; }
`;

const List = styled.div`
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 80px;
`;

const Item = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  text-align: left;
  padding: 12px;
  border: 1px solid #e5e8eb;
  border-radius: 10px;
  background: #fff;
  cursor: pointer;
  font-family: ${FONT};
  transition: all 0.12s ease;

  &:hover {
    border-color: ${NAVY};
    background: #f2f4f6;
  }
`;

const Path = styled.span`
  font-size: 14px;
  color: #191f28;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const Empty = styled.div`
  padding: 28px 0;
  text-align: center;
  color: #8b95a1;
  font-size: 14px;
`;

const Footer = styled.div`
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #eef0f3;
  display: flex;
  justify-content: center;
`;

const CustomBtn = styled.button`
  background: #f2f4f6;
  border: none;
  color: #4e5968;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  padding: 10px 18px;
  cursor: pointer;
  font-family: ${FONT};
  &:hover { background: #e8ebed; }
`;
