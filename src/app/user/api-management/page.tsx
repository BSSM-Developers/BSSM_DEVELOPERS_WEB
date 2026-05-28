"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useConfirm } from "@/hooks/useConfirm";
import { apiUseReasonApi, type ApiUseReasonMineItem } from "@/app/apis/useReasonApi";
import { docsApi, type DocsItem } from "@/app/docs/api";
import { useSearchParams } from "next/navigation";

export default function MyApiManagementPage() {
  const searchParams = useSearchParams();
  const selectedDocsIdFromQuery = searchParams.get("docsId")?.trim() || "";
  const { confirm, ConfirmDialog } = useConfirm();
  const [items, setItems] = useState<ApiUseReasonMineItem[]>([]);
  const [ownedOriginalDocs, setOwnedOriginalDocs] = useState<DocsItem[]>([]);
  const [selectedDocsId, setSelectedDocsId] = useState(selectedDocsIdFromQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingKey, setProcessingKey] = useState<string | null>(null);
  const [isDocsMenuOpen, setIsDocsMenuOpen] = useState(false);
  const docsSelectRef = useRef<HTMLDivElement>(null);

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const docsListResponse = await docsApi.getMyList({ size: 50 });
      const docsValues = docsListResponse.data.values ?? [];
      const originalDocs = docsValues.filter((docs) => docs.type === "ORIGINAL");
      setOwnedOriginalDocs(originalDocs);

      const effectiveDocsId = selectedDocsIdFromQuery || selectedDocsId || undefined;
      const response = await apiUseReasonApi.getMyDocs(undefined, 50, effectiveDocsId);
      setItems(response.data.values ?? []);
    } catch (error) {
      const message = error instanceof Error ? error.message : "사용 신청 목록을 불러오지 못했습니다.";
      setErrorMessage(message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDocsId, selectedDocsIdFromQuery]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => Number(b.apiUseReasonId) - Number(a.apiUseReasonId));
  }, [items]);

  const handleDecision = useCallback(
    async (item: ApiUseReasonMineItem, action: "approve" | "reject") => {
      const reasonId = String(item.apiUseReasonId ?? "").trim();
      if (!reasonId) {
        await confirm({
          title: "처리 실패",
          message: "요청 식별자 정보가 올바르지 않습니다.",
          confirmText: "확인",
          hideCancel: true,
        });
        return;
      }

      const shouldContinue = await confirm({
        title: action === "approve" ? "사용 신청 승인" : "사용 신청 거절",
        message: action === "approve" ? "선택한 요청을 승인할까요?" : "선택한 요청을 거절할까요?",
        confirmText: action === "approve" ? "승인" : "거절",
        cancelText: "취소",
      });

      if (!shouldContinue) {
        return;
      }

      try {
        setProcessingKey(reasonId);
        if (action === "approve") {
          await apiUseReasonApi.approveByReasonId(reasonId);
        } else {
          await apiUseReasonApi.rejectByReasonId(reasonId);
        }

        await confirm({
          title: "처리 완료",
          message: action === "approve" ? "요청이 승인되었습니다." : "요청이 거절되었습니다.",
          confirmText: "확인",
          hideCancel: true,
        });

        await loadItems();
      } catch (error) {
        const message = error instanceof Error ? error.message : "요청 처리에 실패했습니다.";
        await confirm({
          title: "처리 실패",
          message,
          confirmText: "확인",
          hideCancel: true,
        });
      } finally {
        setProcessingKey(null);
      }
    },
    [confirm, loadItems]
  );

  useEffect(() => {
    if (selectedDocsIdFromQuery) {
      setSelectedDocsId(selectedDocsIdFromQuery);
    }
  }, [selectedDocsIdFromQuery]);

  useEffect(() => {
    if (!isDocsMenuOpen) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (!docsSelectRef.current?.contains(event.target)) {
        setIsDocsMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isDocsMenuOpen]);

  const selectedDocsLabel = useMemo(() => {
    if (!selectedDocsId) return "전체 API 문서";
    const found = ownedOriginalDocs.find((docs) => String(docs.docsId ?? "") === selectedDocsId);
    return found?.title || "전체 API 문서";
  }, [ownedOriginalDocs, selectedDocsId]);

  return (
    <Container>
      <DocsHeader title="사용 신청 관리" breadcrumb={["마이페이지"]} />

      <ContentWrapper>
        <HeaderRow>
          <TitleSection>
            <Title>사용 신청 관리</Title>
            <Subtitle>내 API 문서의 사용 신청을 확인하고 승인/거절할 수 있어요</Subtitle>
          </TitleSection>
          <RefreshButton type="button" onClick={() => void loadItems()} disabled={isLoading}>
            새로고침
          </RefreshButton>
        </HeaderRow>
        <FilterRow>
          <FilterLabel>문서 선택</FilterLabel>
          <DocsSelectContainer ref={docsSelectRef}>
            <DocsSelectTrigger
              type="button"
              aria-haspopup="listbox"
              aria-expanded={isDocsMenuOpen}
              onClick={() => setIsDocsMenuOpen((prev) => !prev)}
            >
              <DocsSelectValue>{selectedDocsLabel}</DocsSelectValue>
              <DocsSelectArrow open={isDocsMenuOpen}>▲</DocsSelectArrow>
            </DocsSelectTrigger>
            {isDocsMenuOpen ? (
              <DocsOptionList role="listbox" aria-label="문서 선택">
                <DocsOptionButton
                  type="button"
                  role="option"
                  $selected={selectedDocsId === ""}
                  aria-selected={selectedDocsId === ""}
                  onClick={() => { setSelectedDocsId(""); setIsDocsMenuOpen(false); }}
                >
                  전체 API 문서
                </DocsOptionButton>
                {ownedOriginalDocs.map((docs) => {
                  const docsId = String(docs.docsId ?? "");
                  return (
                    <DocsOptionButton
                      key={docsId}
                      type="button"
                      role="option"
                      $selected={selectedDocsId === docsId}
                      aria-selected={selectedDocsId === docsId}
                      onClick={() => { setSelectedDocsId(docsId); setIsDocsMenuOpen(false); }}
                    >
                      {docs.title}
                    </DocsOptionButton>
                  );
                })}
              </DocsOptionList>
            ) : null}
          </DocsSelectContainer>
        </FilterRow>

        {isLoading ? <BsdevLoader label="사용 신청 목록을 불러오는 중입니다." size={52} minHeight="140px" /> : null}
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

        {!isLoading && !errorMessage ? (
          sortedItems.length > 0 ? (
            <RequestList>
              {sortedItems.map((item) => {
                const state = (item.apiUseState || "").toUpperCase();
                const reasonId = String(item.apiUseReasonId ?? "");
                return (
                  <RequestCard key={reasonId}>
                    <CardHeader>
                      <RequestLabel>신청 #{reasonId}</RequestLabel>
                      <StateBadge state={state}>
                        {state === "APPROVED" ? "승인됨" : state === "REJECTED" ? "거절됨" : state === "PENDING" ? "대기중" : state || "알 수 없음"}
                      </StateBadge>
                    </CardHeader>

                    <MetaGrid>
                      <MetaLabel>요청자</MetaLabel>
                      <MetaValue>{item.writerId ? `사용자 #${item.writerId}` : "-"}</MetaValue>

                      <MetaLabel>신청 사유</MetaLabel>
                      <MetaValue>{item.apiUseReason || "-"}</MetaValue>
                    </MetaGrid>

                    {state === "PENDING" ? (
                      <ActionRow>
                        <ActionButton
                          type="button"
                          onClick={() => void handleDecision(item, "reject")}
                          disabled={processingKey === reasonId}
                        >
                          거절
                        </ActionButton>
                        <ActionButton
                          type="button"
                          primary
                          onClick={() => void handleDecision(item, "approve")}
                          disabled={processingKey === reasonId}
                        >
                          승인
                        </ActionButton>
                      </ActionRow>
                    ) : null}
                  </RequestCard>
                );
              })}
            </RequestList>
          ) : (
            <StatusText>접수된 사용 신청이 없습니다.</StatusText>
          )
        ) : null}
      </ContentWrapper>
      {ConfirmDialog}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ContentWrapper = styled.div`
  padding: 0 24px 24px;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 24px;
`;

const TitleSection = styled.div``;

const Title = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[500]};
`;

const RefreshButton = styled.button`
  height: 40px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  background: white;
  color: ${({ theme }) => theme.colors.grey[700]};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const FilterRow = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
`;

const FilterLabel = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[600]};
  font-weight: 700;
`;

const DocsSelectContainer = styled.div`
  position: relative;
  min-width: 260px;
`;

const DocsSelectTrigger = styled.button`
  width: 100%;
  height: 40px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  background: #ffffff;
  color: ${({ theme }) => theme.colors.grey[800]};
  padding: 0 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  cursor: pointer;
`;

const DocsSelectValue = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DocsSelectArrow = styled.span<{ open: boolean }>`
  color: ${({ theme }) => theme.colors.grey[500]};
  font-size: 12px;
  transform: ${({ open }) => (open ? "rotate(0deg)" : "rotate(180deg)")};
  transition: transform 0.15s ease;
`;

const DocsOptionList = styled.div`
  position: absolute;
  z-index: 40;
  top: calc(100% + 6px);
  left: 0;
  width: 100%;
  border-radius: 10px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
  overflow: hidden;
`;

const DocsOptionButton = styled.button<{ $selected: boolean }>`
  width: 100%;
  text-align: left;
  padding: 10px 12px;
  border: none;
  background: ${({ $selected }) => ($selected ? "rgba(22, 51, 92, 0.08)" : "#ffffff")};
  color: ${({ theme }) => theme.colors.grey[800]};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #f3f4f6;
  }
`;

const RequestList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const RequestCard = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 10px;
  padding: 14px;
  background: white;
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
`;

const RequestLabel = styled.h3`
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  margin: 0;
  color: ${({ theme }) => theme.colors.grey[900]};
`;

const StateBadge = styled.span<{ state: string }>`
  padding: 4px 10px;
  border-radius: 999px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 12px;
  font-weight: 700;
  background: ${({ state }) => {
    if (state === "APPROVED") return "#dcfce7";
    if (state === "REJECTED") return "#fee2e2";
    return "#e0e7ff";
  }};
  color: ${({ state }) => {
    if (state === "APPROVED") return "#166534";
    if (state === "REJECTED") return "#b91c1c";
    return "#1d4ed8";
  }};
`;

const MetaGrid = styled.div`
  display: grid;
  grid-template-columns: 100px minmax(0, 1fr);
  row-gap: 6px;
  column-gap: 10px;
`;

const MetaLabel = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[600]};
  font-weight: 700;
`;

const MetaValue = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[700]};
  word-break: break-all;
`;

const ActionRow = styled.div`
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
  gap: 8px;
`;

const ActionButton = styled.button<{ primary?: boolean }>`
  height: 34px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid ${({ primary }) => (primary ? "#16335c" : "#d1d5db")};
  background: ${({ primary }) => (primary ? "#16335c" : "white")};
  color: ${({ primary }) => (primary ? "white" : "#374151")};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[500]};
  margin: 0;
`;

const ErrorText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: #d32f2f;
  margin: 0;
`;
