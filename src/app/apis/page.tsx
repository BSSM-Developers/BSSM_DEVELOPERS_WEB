"use client";

import styled from "@emotion/styled";
import { keyframes } from "@emotion/react";
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { SearchBar } from "@/components/apis/SearchBar";
import { ApiSection } from "@/components/apis/ApiSection";
import { type ApiItem } from "./mockData";
import { useDocsListQuery, useDocsPopularListQuery } from "@/app/docs/queries";
import type { DocsItem } from "@/app/docs/api";
import { createPortal } from "react-dom";
import { tokenApi, type ApiTokenListItem } from "@/app/user/tokens/api";
import { apiUseReasonApi } from "./useReasonApi";

const toApiType = (value?: string): ApiItem["type"] => {
  if (value === "CUSTOM") {
    return "CUSTOM";
  }
  return "ORIGINAL";
};

const toApiItem = (item: DocsItem): ApiItem => ({
  id: String(item.docsId ?? item.id ?? ""),
  title: item.title || "Untitled API",
  description: item.description || "설명이 없습니다.",
  tags: [item.writer || "Unknown"],
  type: toApiType(item.type),
  author: item.writer || "Unknown",
});

export default function ApiExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "ORIGINAL" | "CUSTOM">("ALL");
  const [sortType, setSortType] = useState<"LATEST" | "POPULAR">("LATEST");
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null);
  const [tokens, setTokens] = useState<ApiTokenListItem[]>([]);
  const [isTokensLoading, setIsTokensLoading] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const [selectedTokenId, setSelectedTokenId] = useState("");
  const [apiUseReason, setApiUseReason] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applySuccessMessage, setApplySuccessMessage] = useState("");
  const [isTokenMenuOpen, setIsTokenMenuOpen] = useState(false);
  const tokenMenuRef = useRef<HTMLDivElement>(null);

  const { data: docsData, isLoading } = useDocsListQuery();
  const { data: popularDocsData, isLoading: isPopularLoading } = useDocsPopularListQuery({ size: 20 });

  const realOriginalApis: ApiItem[] = useMemo(() => {
    const list = docsData?.data?.values;
    if (!list || !Array.isArray(list)) return [];
    return list.map(toApiItem);
  }, [docsData]);

  const displayOriginalApis = realOriginalApis;
  const realPopularApis: ApiItem[] = useMemo(() => {
    const list = popularDocsData?.data?.values;
    if (!list || !Array.isArray(list)) {
      return [];
    }
    return list.map(toApiItem);
  }, [popularDocsData]);

  const searchItems = useCallback((items: ApiItem[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const allItems = useMemo(() => {
    return [...displayOriginalApis];
  }, [displayOriginalApis]);

  const filteredList = useMemo(() => {
    if (filterType === "ALL") return [];

    let items = allItems;

    if (filterType === "ORIGINAL") {
      items = items.filter(item => item.type !== "CUSTOM");
    } else if (filterType === "CUSTOM") {
      items = items.filter(item => item.type === "CUSTOM");
    }

    items = searchItems(items);

    if (sortType === "POPULAR") {
      return [...items].reverse();
    }

    return items;
  }, [filterType, sortType, searchItems, allItems]);

  const displayPopular = useMemo(() => searchItems(realPopularApis), [realPopularApis, searchItems]);
  const displayOriginal = useMemo(() => searchItems(displayOriginalApis), [searchItems, displayOriginalApis]);
  const displayCustom = useMemo(() => [], []);

  const isFilteredView = filterType !== "ALL";
  const hasTokens = tokens.length > 0;
  const selectedToken = useMemo(
    () => tokens.find((token) => String(token.apiTokenId) === selectedTokenId) ?? null,
    [selectedTokenId, tokens]
  );

  const handleUseClick = useCallback((item: ApiItem) => {
    setSelectedApi(item);
    setIsApplyOpen(true);
    setSelectedTokenId("");
    setApiUseReason("");
    setSubmitError("");
    setApplySuccessMessage("");
    setIsTokenMenuOpen(false);
  }, []);

  const closeApplyModal = useCallback(() => {
    setIsApplyOpen(false);
    setSubmitError("");
    setIsTokenMenuOpen(false);
  }, []);

  useEffect(() => {
    if (!isApplyOpen) {
      return;
    }
    const loadTokenOptions = async () => {
      try {
        setIsTokensLoading(true);
        setTokenError("");
        const response = await tokenApi.getList(undefined, 50);
        setTokens(response.values);
      } catch (error) {
        setTokenError(error instanceof Error ? error.message : "토큰 목록을 불러오지 못했습니다.");
      } finally {
        setIsTokensLoading(false);
      }
    };
    void loadTokenOptions();
  }, [isApplyOpen]);

  useEffect(() => {
    if (!isTokenMenuOpen) {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!tokenMenuRef.current || tokenMenuRef.current.contains(event.target as Node)) {
        return;
      }
      setIsTokenMenuOpen(false);
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsTokenMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isTokenMenuOpen]);

  const handleApplySubmit = useCallback(async () => {
    if (!selectedApi) {
      return;
    }
    if (!selectedTokenId || !selectedToken) {
      setSubmitError("사용할 토큰을 선택해주세요.");
      return;
    }
    if (!apiUseReason.trim()) {
      setSubmitError("API 사용 목적을 입력해주세요.");
      return;
    }

    try {
      setIsSubmitting(true);
      setSubmitError("");
      await apiUseReasonApi.create(selectedToken.apiTokenId, selectedApi.id, apiUseReason.trim());
      setApplySuccessMessage("API 사용 신청이 완료되었습니다.");
      setIsApplyOpen(false);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "API 사용 신청에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  }, [apiUseReason, selectedApi, selectedToken, selectedTokenId]);

  if (isLoading || isPopularLoading) {
    return (
      <PageContainer>
        <ContentWrapper>
          <PageHeader>
            <Title>API 둘러보기</Title>
            <Subtitle>학생들이 공유한 API를 자유롭게 둘러볼 수 있습니다</Subtitle>
          </PageHeader>
          <EmptyState>데이터를 불러오는 중입니다...</EmptyState>
        </ContentWrapper>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ContentWrapper>
        <PageHeader>
          <Title>API 둘러보기</Title>
          <Subtitle>학생들이 공유한 API를 자유롭게 둘러볼 수 있습니다</Subtitle>
        </PageHeader>

        <SearchSection>
          <SearchBar
            onSearch={setSearchQuery}
            onFilterChange={setFilterType}
            onSortChange={setSortType}
            activeFilter={filterType}
            activeSort={sortType}
          />
        </SearchSection>

        {isFilteredView ? (
          filteredList.length > 0 ? (
            <ApiSection
              title={`${filterType} API`}
              description={`${filterType} API 목록입니다`}
              items={filteredList}
              onUse={handleUseClick}
            />
          ) : (
            <EmptyState>검색 결과가 없습니다.</EmptyState>
          )
        ) : (
          <>
            {displayPopular.length > 0 && (
              <ApiSection
                title="인기 API"
                description="최근 인기있는 API를 확인해보세요"
                items={displayPopular}
                onUse={handleUseClick}
              />
            )}

            {displayOriginal.length > 0 && (
              <ApiSection
                title="ORIGINAL API"
                description="BSSM Developers에 등록된 최신 API를 확인해보세요"
                items={displayOriginal}
                onUse={handleUseClick}
              />
            )}

            {displayCustom.length > 0 && (
              <ApiSection
                title="CUSTOM API"
                description="BSSM Developers에서 사용자가 커스텀한 최신 API를 확인해보세요"
                items={displayCustom}
                onUse={handleUseClick}
              />
            )}

            {displayPopular.length === 0 && displayOriginal.length === 0 && displayCustom.length === 0 && (
              <EmptyState>검색 결과가 없습니다.</EmptyState>
            )}
          </>
        )}

        {applySuccessMessage ? <SuccessMessage>{applySuccessMessage}</SuccessMessage> : null}
      </ContentWrapper>

      {isApplyOpen && selectedApi && typeof document !== "undefined" ? createPortal(
        <ModalOverlay onClick={closeApplyModal}>
          <ModalCard onClick={(e) => e.stopPropagation()}>
            <ModalTitle>API 사용 신청</ModalTitle>
            <ModalDescription>API 사용 신청 정보를 작성해주세요.</ModalDescription>

            <Field>
              <FieldLabel>신청 대상 API</FieldLabel>
              <StaticValue>{selectedApi.title}</StaticValue>
            </Field>

            <Field>
              <FieldLabel>사용할 토큰</FieldLabel>
              <TokenSelectContainer ref={tokenMenuRef}>
                <TokenSelectTrigger
                  type="button"
                  onClick={() => {
                    if (isTokensLoading || !hasTokens) {
                      return;
                    }
                    setIsTokenMenuOpen((prev) => !prev);
                  }}
                  disabled={isTokensLoading || !hasTokens}
                  aria-expanded={isTokenMenuOpen}
                >
                  <TokenTriggerText hasValue={Boolean(selectedToken)}>
                    {isTokensLoading
                      ? "토큰 불러오는 중..."
                      : selectedToken
                        ? `${selectedToken.apiTokenName} (${selectedToken.apiTokenClientId})`
                        : hasTokens
                          ? "토큰을 선택해주세요"
                          : "발급된 토큰이 없습니다"}
                  </TokenTriggerText>
                  <TokenArrow isOpen={isTokenMenuOpen}>▼</TokenArrow>
                </TokenSelectTrigger>
                {isTokenMenuOpen && hasTokens ? (
                  <TokenSelectMenu role="listbox">
                    {tokens.map((token) => {
                      const value = String(token.apiTokenId);
                      const isSelected = value === selectedTokenId;
                      return (
                        <TokenSelectOption
                          key={token.apiTokenId}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          selected={isSelected}
                          onClick={() => {
                            setSelectedTokenId(value);
                            setIsTokenMenuOpen(false);
                          }}
                        >
                          <span>{token.apiTokenName}</span>
                          <TokenClientId>{token.apiTokenClientId}</TokenClientId>
                        </TokenSelectOption>
                      );
                    })}
                  </TokenSelectMenu>
                ) : null}
              </TokenSelectContainer>
              {tokenError ? <InlineError>{tokenError}</InlineError> : null}
            </Field>

            <Field>
              <FieldLabel>사용 목적</FieldLabel>
              <ReasonInput
                value={apiUseReason}
                onChange={(e) => setApiUseReason(e.target.value)}
                placeholder="예: 앱에서 사용자 프로필 조회 기능 제공을 위해 사용합니다."
                rows={5}
              />
            </Field>

            {submitError ? <InlineError>{submitError}</InlineError> : null}

            <ActionRow>
              <ModalButton type="button" onClick={closeApplyModal}>
                취소
              </ModalButton>
              <ModalButton
                type="button"
                primary
                onClick={() => void handleApplySubmit()}
                disabled={isSubmitting}
              >
                {isSubmitting ? "신청 중..." : "신청하기"}
              </ModalButton>
            </ActionRow>
          </ModalCard>
        </ModalOverlay>,
        document.body
      ) : null}
    </PageContainer>
  );
}

const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: white;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ContentWrapper = styled.div`
  width: 100%;
  max-width: 1400px;
  padding: 60px 20px 100px 20px;
  display: flex;
  flex-direction: column;
`;

const PageHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 36px;
  font-weight: 700;
  color: #191F28;
  margin: 0;
  letter-spacing: -1.8px;
`;

const Subtitle = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #8B95A1;
  margin: 0;
  letter-spacing: -0.8px;
`;

const SearchSection = styled.div`
  margin-bottom: 60px;
`;

const EmptyState = styled.div`
  width: 100%;
  padding: 100px 0;
  text-align: center;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 16px;
  color: #8B95A1;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1200;
  padding: 20px;
`;

const modalDropDown = keyframes`
  from {
    opacity: 0;
    transform: translateY(-44px) scale(0.985);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const ModalCard = styled.div`
  width: 100%;
  max-width: 560px;
  background: white;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  padding: 24px;
  animation: ${modalDropDown} 460ms cubic-bezier(0.16, 1, 0.3, 1);
`;

const ModalTitle = styled.h2`
  margin: 0 0 8px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #111827;
`;

const ModalDescription = styled.p`
  margin: 0 0 20px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #6b7280;
`;

const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
`;

const FieldLabel = styled.label`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #374151;
`;

const StaticValue = styled.div`
  height: 42px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: #f9fafb;
  padding: 0 12px;
  display: flex;
  align-items: center;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #111827;
`;

const TokenSelectContainer = styled.div`
  position: relative;
`;

const TokenSelectTrigger = styled.button`
  width: 100%;
  height: 42px;
  border-radius: 8px;
  border: 1px solid #d1d5db;
  padding: 0 12px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  cursor: pointer;

  &:disabled {
    background: #f3f4f6;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    border-color: #16335c;
    box-shadow: 0 0 0 2px rgba(22, 51, 92, 0.12);
  }
`;

const TokenTriggerText = styled.span<{ hasValue: boolean }>`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: ${({ hasValue }) => (hasValue ? "#111827" : "#6b7280")};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const TokenArrow = styled.span<{ isOpen: boolean }>`
  font-size: 12px;
  color: #6b7280;
  transform: ${({ isOpen }) => (isOpen ? "rotate(180deg)" : "rotate(0deg)")};
  transition: transform 180ms ease;
`;

const TokenSelectMenu = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(15, 23, 42, 0.14);
  z-index: 20;
  max-height: 240px;
  overflow: auto;
`;

const TokenSelectOption = styled.button<{ selected: boolean }>`
  width: 100%;
  border: none;
  background: ${({ selected }) => (selected ? "rgba(22, 51, 92, 0.08)" : "white")};
  padding: 11px 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #111827;
  cursor: pointer;

  &:hover {
    background: rgba(22, 51, 92, 0.08);
  }
`;

const TokenClientId = styled.span`
  color: #6b7280;
  font-size: 12px;
  flex-shrink: 0;
`;

const ReasonInput = styled.textarea`
  border-radius: 8px;
  border: 1px solid #d1d5db;
  background: white;
  padding: 12px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #111827;
  outline: none;
  resize: vertical;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    border-color: #16335c;
  }
`;

const InlineError = styled.p`
  margin: 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #dc2626;
`;

const ActionRow = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
`;

const ModalButton = styled.button<{ primary?: boolean }>`
  height: 38px;
  border-radius: 8px;
  padding: 0 14px;
  border: 1px solid ${({ primary }) => primary ? "#16335c" : "#d1d5db"};
  background: ${({ primary }) => primary ? "#16335c" : "white"};
  color: ${({ primary }) => primary ? "white" : "#374151"};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const SuccessMessage = styled.div`
  margin-top: -20px;
  margin-bottom: 30px;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
  border-radius: 8px;
  padding: 10px 12px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 600;
`;
