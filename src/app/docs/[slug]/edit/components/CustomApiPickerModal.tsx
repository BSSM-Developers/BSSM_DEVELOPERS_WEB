"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";
import { HttpMethodTag } from "@/components/ui/httpMethod/HttpMethodTag";

export interface CustomApiOption {
  key: string;
  docsId: string;
  docsTitle: string;
  pageMappedId: string;
  mappedId: string;
  label: string;
  method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "UPDATE";
}

interface CustomApiPickerModalProps {
  isOpen: boolean;
  loading: boolean;
  error: string;
  options: CustomApiOption[];
  onClose: () => void;
  onRefresh: () => void;
  onSelect: (option: CustomApiOption) => void;
}

export function CustomApiPickerModal({
  isOpen,
  loading,
  error,
  options,
  onClose,
  onRefresh,
  onSelect,
}: CustomApiPickerModalProps) {
  const [keyword, setKeyword] = useState("");
  const [docsKeyword, setDocsKeyword] = useState("");
  const [selectedDocsId, setSelectedDocsId] = useState("");

  const groupedByDocs = useMemo(() => {
    const grouped = new Map<
      string,
      { docsId: string; docsTitle: string; apis: CustomApiOption[] }
    >();

    for (const option of options) {
      const current = grouped.get(option.docsId);
      if (current) {
        current.apis.push(option);
        continue;
      }
      grouped.set(option.docsId, {
        docsId: option.docsId,
        docsTitle: option.docsTitle,
        apis: [option],
      });
    }

    return Array.from(grouped.values()).sort((a, b) => {
      const titleCompare = a.docsTitle.localeCompare(b.docsTitle);
      if (titleCompare !== 0) {
        return titleCompare;
      }
      return a.docsId.localeCompare(b.docsId);
    });
  }, [options]);

  const filteredDocsGroups = useMemo(() => {
    const normalized = docsKeyword.trim().toLowerCase();
    if (!normalized) {
      return groupedByDocs;
    }
    return groupedByDocs.filter((group) => {
      const docsText = `${group.docsTitle} ${group.docsId}`.toLowerCase();
      return docsText.includes(normalized);
    });
  }, [docsKeyword, groupedByDocs]);

  const selectedDocsGroup = useMemo(() => {
    if (!selectedDocsId) {
      return filteredDocsGroups[0];
    }
    return filteredDocsGroups.find((item) => item.docsId === selectedDocsId) ?? filteredDocsGroups[0];
  }, [filteredDocsGroups, selectedDocsId]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    if (!filteredDocsGroups.length) {
      setSelectedDocsId("");
      return;
    }
    if (!selectedDocsId || !filteredDocsGroups.some((item) => item.docsId === selectedDocsId)) {
      setSelectedDocsId(filteredDocsGroups[0].docsId);
    }
  }, [filteredDocsGroups, isOpen, selectedDocsId]);

  const filtered = useMemo(() => {
    const normalized = keyword.trim().toLowerCase();
    const scopedOptions = selectedDocsGroup?.apis ?? [];
    if (!normalized) {
      return scopedOptions;
    }
    return scopedOptions.filter((option) => {
      const text = `${option.label} ${option.method ?? ""}`.toLowerCase();
      return text.includes(normalized);
    });
  }, [keyword, selectedDocsGroup]);

  if (!isOpen || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <Overlay onClick={onClose}>
      <Dialog onClick={(event) => event.stopPropagation()}>
        <Header>
          <Title>API 가져오기</Title>
          <CloseButton type="button" onClick={onClose}>닫기</CloseButton>
        </Header>

        <SearchInput
          placeholder="문서 이름 검색"
          value={docsKeyword}
          onChange={(event) => setDocsKeyword(event.target.value)}
        />

        <SearchInput
          placeholder="API 이름 또는 METHOD 검색"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />

        <ControlRow>
          <FieldGroup>
            <FieldLabel>문서 선택</FieldLabel>
            <DocsSelect
              value={selectedDocsId}
              onChange={(event) => setSelectedDocsId(event.target.value)}
            >
              {filteredDocsGroups.map((docs) => (
                <option key={docs.docsId} value={docs.docsId}>
                  {docs.docsTitle} ({docs.docsId.slice(-6)})
                </option>
              ))}
            </DocsSelect>
          </FieldGroup>
          <CountText>{selectedDocsGroup ? `${selectedDocsGroup.apis.length}개 API` : "0개 API"}</CountText>
        </ControlRow>

        <ControlRow>
          <CountText>검색 결과 {filtered.length}개</CountText>
          <RefreshButton type="button" onClick={onRefresh} disabled={loading}>
            {loading ? "불러오는 중..." : "새로고침"}
          </RefreshButton>
        </ControlRow>

        {error ? <StatusText error>{error}</StatusText> : null}
        {!error && groupedByDocs.length === 0 ? <StatusText>선택 가능한 API 문서가 없습니다.</StatusText> : null}
        {!error && groupedByDocs.length > 0 && filteredDocsGroups.length === 0 ? (
          <StatusText>문서 검색 결과가 없습니다.</StatusText>
        ) : null}
        {!error && filteredDocsGroups.length > 0 && filtered.length === 0 ? (
          <StatusText>선택한 문서에서 검색 결과가 없습니다.</StatusText>
        ) : null}

        <List>
          {filtered.map((option) => (
            <Item key={option.key}>
              <ItemContent>
                <ItemTitle>{option.label}</ItemTitle>
                <ItemMeta>
                  {option.docsTitle} ({option.docsId.slice(-6)})
                </ItemMeta>
              </ItemContent>
              <ItemAction>
                {option.method ? <HttpMethodTag method={option.method} size="small" /> : null}
                <SelectButton type="button" onClick={() => onSelect(option)}>
                  추가
                </SelectButton>
              </ItemAction>
            </Item>
          ))}
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
  width: min(780px, 100%);
  max-height: min(760px, calc(100vh - 40px));
  display: flex;
  flex-direction: column;
  gap: 14px;
  background: #ffffff;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 24px 56px rgba(17, 24, 39, 0.24);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
`;

const Title = styled.h2`
  margin: 0;
  font-size: 24px;
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

const SearchInput = styled.input`
  height: 42px;
  width: 100%;
  border-radius: 10px;
  border: 1px solid #d1d5db;
  padding: 0 12px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #111827;
  background: #ffffff;

  &:focus {
    outline: none;
    border-color: #16335c;
  }
`;

const ControlRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const FieldGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 300px;
`;

const FieldLabel = styled.span`
  color: #6b7280;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 600;
`;

const DocsSelect = styled.select`
  height: 34px;
  min-width: 240px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #ffffff;
  color: #111827;
  padding: 0 10px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 600;
`;

const CountText = styled.span`
  color: #6b7280;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 500;
`;

const RefreshButton = styled.button`
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #16335c;
  background: #16335c;
  color: #ffffff;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusText = styled.p<{ error?: boolean }>`
  margin: 0;
  color: ${({ error }) => (error ? "#dc2626" : "#6b7280")};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 500;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
  padding-right: 2px;
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

const ItemContent = styled.div`
  min-width: 0;
`;

const ItemTitle = styled.div`
  color: #111827;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
  word-break: break-word;
`;

const ItemMeta = styled.div`
  color: #6b7280;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 500;
  margin-top: 4px;
  word-break: break-word;
`;

const ItemAction = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
`;

const SelectButton = styled.button`
  height: 34px;
  padding: 0 12px;
  border-radius: 8px;
  border: 1px solid #16335c;
  background: #ffffff;
  color: #16335c;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
`;
