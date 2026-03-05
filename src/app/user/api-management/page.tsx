"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useConfirm } from "@/hooks/useConfirm";
import { docsApi, type DocsItem, type SidebarBlock } from "@/app/docs/api";
import { apiUseReasonApi, type ApiUsageByApiItem } from "@/app/apis/useReasonApi";
import { useSearchParams } from "next/navigation";

interface OwnedApiTarget {
  docsId: string;
  docsTitle: string;
  apiBlockId: string;
  mappedId: string;
  pageMappedId: string;
  apiLabel: string;
}

interface ManagedUsageItem extends ApiUsageByApiItem {
  queryApiId: string;
  sourceDocsId: string;
  sourceDocsTitle: string;
  sourceApiLabel: string;
}

const isNotFoundError = (message: string): boolean => {
  return message.includes("404") || message.includes("API를 찾을 수 없습니다");
};

const collectApiTargets = (docs: DocsItem, blocks: SidebarBlock[]): OwnedApiTarget[] => {
  const targets: OwnedApiTarget[] = [];

  const traverse = (items: SidebarBlock[], currentPageMappedId?: string) => {
    for (const block of items) {
      const mappedId = String(block.mappedId ?? block.id ?? "").trim();

      if (block.module === "api") {
        const pageMappedId = currentPageMappedId || mappedId;
        if (!pageMappedId || !mappedId) {
          continue;
        }
        targets.push({
          docsId: String(docs.docsId ?? ""),
          docsTitle: docs.title || "Untitled",
          apiBlockId: String(block.id ?? ""),
          mappedId,
          pageMappedId,
          apiLabel: block.label || "이름 없는 API",
        });
      }

      if (block.childrenItems?.length) {
        const nextPageMappedId = block.module === "collapse" ? mappedId : currentPageMappedId;
        traverse(block.childrenItems, nextPageMappedId);
      }
    }
  };

  traverse(blocks);
  return targets.filter(
    (target) =>
      Boolean(target.docsId) &&
      Boolean(target.apiBlockId) &&
      Boolean(target.mappedId) &&
      Boolean(target.pageMappedId)
  );
};

const extractApiCandidatesFromDocsPage = async (target: OwnedApiTarget): Promise<string[]> => {
  const candidates: string[] = [];

  try {
    const pageResponse = await docsApi.getPage(target.docsId, target.pageMappedId);
    const apiBlock = pageResponse.data.docsBlocks.find((block) => {
      if (block.module !== "api") {
        return false;
      }
      const candidate = block as { mappedId?: unknown };
      if (typeof candidate.mappedId === "string" && candidate.mappedId === target.mappedId) {
        return true;
      }
      return false;
    }) ?? pageResponse.data.docsBlocks.find((block) => block.module === "api");
    if (apiBlock?.content) {
      const parsed = JSON.parse(apiBlock.content) as { id?: unknown };
      if (typeof parsed.id === "string") {
        const normalized = parsed.id.trim();
        if (normalized.length > 0) {
          candidates.push(normalized);
        }
      }
    }

    const pageId = String(pageResponse.data.id ?? "").trim();
    if (pageId.length > 0) {
      candidates.push(pageId);
    }
  } catch {
    return [];
  }

  return candidates;
};

async function getUsageForTarget(target: OwnedApiTarget): Promise<ManagedUsageItem[]> {
  const candidates = [
    target.apiBlockId,
    target.mappedId,
    target.docsId,
    ...(await extractApiCandidatesFromDocsPage(target)),
  ].filter((value, index, array): value is string => {
    return Boolean(value) && array.indexOf(value) === index;
  });

  for (const apiId of candidates) {
    try {
      const response = await apiUseReasonApi.getUsageByApi(apiId, undefined, 50);
      const values = response.data.values ?? [];
      return values.map((item) => ({
        ...item,
        queryApiId: apiId,
        sourceDocsId: target.docsId,
        sourceDocsTitle: target.docsTitle,
        sourceApiLabel: target.apiLabel,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (isNotFoundError(message)) {
        continue;
      }
      throw error;
    }
  }

  return [];
}

export default function MyApiManagementPage() {
  const searchParams = useSearchParams();
  const selectedDocsIdFromQuery = searchParams.get("docsId")?.trim() || "";
  const { confirm, ConfirmDialog } = useConfirm();
  const [items, setItems] = useState<ManagedUsageItem[]>([]);
  const [ownedOriginalDocs, setOwnedOriginalDocs] = useState<DocsItem[]>([]);
  const [selectedDocsId, setSelectedDocsId] = useState(selectedDocsIdFromQuery);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      const docsListResponse = await docsApi.getMyList({ size: 50 });
      const docsValues = docsListResponse.data.values ?? [];
      const originalDocs = docsValues.filter((docs) => docs.type === "ORIGINAL");
      setOwnedOriginalDocs(originalDocs);

      const effectiveDocsId = selectedDocsIdFromQuery || selectedDocsId;
      const filteredDocs = effectiveDocsId
        ? originalDocs.filter((docs) => String(docs.docsId ?? "") === effectiveDocsId)
        : originalDocs;

      const allTargets: OwnedApiTarget[] = [];

      for (const docs of filteredDocs) {
        const docsId = String(docs.docsId ?? "");
        if (!docsId) {
          continue;
        }
        try {
          const sidebarResponse = await docsApi.getSidebar(docsId);
          const targets = collectApiTargets(docs, sidebarResponse.data.blocks ?? []);
          allTargets.push(...targets);
        } catch {
        }
      }

      const usageResults = await Promise.all(allTargets.map((target) => getUsageForTarget(target)));
      const merged = usageResults.flat();
      const dedup = new Map<string, ManagedUsageItem>();

      for (const item of merged) {
        const key = `${item.apiTokenId}-${item.apiUseReasonId}`;
        if (!dedup.has(key)) {
          dedup.set(key, item);
        }
      }

      setItems(Array.from(dedup.values()));
    } catch (error) {
      const message = error instanceof Error ? error.message : "API 사용 신청 목록을 불러오지 못했습니다.";
      setErrorMessage(message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDocsId, selectedDocsIdFromQuery]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (selectedDocsIdFromQuery) {
      setSelectedDocsId(selectedDocsIdFromQuery);
    }
  }, [selectedDocsIdFromQuery]);

  const handleDecision = useCallback(async (item: ManagedUsageItem, action: "approve" | "reject") => {
    const apiTargetId = String(item.apiTokenId ?? item.queryApiId ?? item.apiId ?? "").trim();
    const reasonId = String(item.apiUseReasonId ?? "").trim();

    if (!apiTargetId || !reasonId) {
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

    const processing = `${item.apiTokenId}-${item.apiUseReasonId}`;

    try {
      setProcessingKey(processing);
      if (action === "approve") {
        await apiUseReasonApi.approve(apiTargetId, reasonId);
      } else {
        await apiUseReasonApi.reject(apiTargetId, reasonId);
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
  }, [confirm, loadItems]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => Number(b.apiUseReasonId) - Number(a.apiUseReasonId));
  }, [items]);

  return (
    <Container>
      <DocsHeader title="내 API 관리" breadcrumb={["마이페이지"]} />

      <ContentWrapper>
        <HeaderRow>
          <TitleSection>
            <Title>내 API 관리</Title>
            <Subtitle>내 ORIGINAL API 문서의 사용 신청을 확인하고 승인/거절할 수 있어요</Subtitle>
          </TitleSection>
          <RefreshButton type="button" onClick={() => void loadItems()} disabled={isLoading}>
            새로고침
          </RefreshButton>
        </HeaderRow>
        <FilterRow>
          <FilterLabel>문서 선택</FilterLabel>
          <DocsSelect
            value={selectedDocsId}
            onChange={(event) => {
              setSelectedDocsId(event.target.value);
            }}
          >
            <option value="">전체 ORIGINAL 문서</option>
            {ownedOriginalDocs.map((docs) => (
              <option key={String(docs.docsId ?? "")} value={String(docs.docsId ?? "")}>
                {docs.title}
              </option>
            ))}
          </DocsSelect>
        </FilterRow>

        {isLoading ? <StatusText>사용 신청 목록을 불러오는 중입니다.</StatusText> : null}
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

        {!isLoading && !errorMessage ? (
          sortedItems.length > 0 ? (
            <RequestList>
              {sortedItems.map((item) => {
                const state = (item.apiUseState || "").toUpperCase();
                const actionKey = `${item.apiTokenId}-${item.apiUseReasonId}`;
                const requester = item.name || item.writer || (item.writerId ? String(item.writerId) : "-");
                return (
                  <RequestCard key={actionKey}>
                    <CardHeader>
                      <ApiName>{item.apiName || item.sourceApiLabel || "이름 없는 API"}</ApiName>
                      <StateBadge state={state}>{state || "UNKNOWN"}</StateBadge>
                    </CardHeader>

                    <MetaGrid>
                      <MetaLabel>요청자</MetaLabel>
                      <MetaValue>{requester}</MetaValue>

                      <MetaLabel>신청 API</MetaLabel>
                      <MetaValue>{item.sourceApiLabel}</MetaValue>

                      <MetaLabel>문서</MetaLabel>
                      <MetaValue>{item.sourceDocsTitle}</MetaValue>

                      <MetaLabel>엔드포인트</MetaLabel>
                      <MetaValue>{item.endpoint || "-"}</MetaValue>

                      <MetaLabel>메서드</MetaLabel>
                      <MetaValue>{item.apiMethod || "-"}</MetaValue>

                      <MetaLabel>신청 사유</MetaLabel>
                      <MetaValue>{item.apiUseReason || "-"}</MetaValue>
                    </MetaGrid>

                    {state === "PENDING" ? (
                      <ActionRow>
                        <ActionButton
                          type="button"
                          onClick={() => void handleDecision(item, "reject")}
                          disabled={processingKey === actionKey}
                        >
                          거절
                        </ActionButton>
                        <ActionButton
                          type="button"
                          primary
                          onClick={() => void handleDecision(item, "approve")}
                          disabled={processingKey === actionKey}
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

const DocsSelect = styled.select`
  height: 40px;
  min-width: 260px;
  border-radius: 8px;
  border: 1px solid ${({ theme }) => theme.colors.grey[300]};
  background: #ffffff;
  color: ${({ theme }) => theme.colors.grey[800]};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 600;
  padding: 0 12px;
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

const ApiName = styled.h3`
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
    if (state === "APPROVED") {
      return "#dcfce7";
    }
    if (state === "REJECTED") {
      return "#fee2e2";
    }
    return "#e0e7ff";
  }};
  color: ${({ state }) => {
    if (state === "APPROVED") {
      return "#166534";
    }
    if (state === "REJECTED") {
      return "#b91c1c";
    }
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
