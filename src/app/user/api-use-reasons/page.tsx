"use client";

import { useEffect, useMemo, useState } from "react";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { useConfirm } from "@/hooks/useConfirm";
import { useUserQuery } from "@/app/user/queries";
import { apiUseReasonApi, type ApiUsageByApiItem } from "@/app/apis/useReasonApi";
import {
  createApiUseReasonRowKey,
  FILTER_OPTIONS,
  type ApiUseFilter,
  isAdminRole,
  sortApiUseReasonItems,
} from "./model";
import {
  ActionButton,
  ActionRow,
  ApiName,
  Card,
  CardHeader,
  Container,
  ContentWrapper,
  ErrorText,
  FilterButton,
  FilterRow,
  HeaderRow,
  List,
  MetaGrid,
  MetaLabel,
  MetaValue,
  RefreshButton,
  StateBadge,
  StatusText,
  Subtitle,
  Title,
  TitleGroup,
} from "./styles";

export default function AdminApiUseReasonsPage() {
  const { confirm, ConfirmDialog } = useConfirm();
  const { data: user, isLoading: isUserLoading } = useUserQuery();
  const [isClient, setIsClient] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ApiUseFilter>("ALL");
  const [items, setItems] = useState<ApiUsageByApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [processingKey, setProcessingKey] = useState<string | null>(null);

  const isAdmin = isAdminRole(user?.role);

  const loadItems = async (filter: ApiUseFilter) => {
    try {
      setIsLoading(true);
      setErrorMessage("");
      const response = await apiUseReasonApi.getAll(filter === "ALL" ? undefined : filter, undefined, 50);
      setItems(response.data.values ?? []);
    } catch (loadError) {
      const message =
        loadError instanceof Error ? loadError.message : "사용 신청 목록을 불러오지 못했습니다.";
      setErrorMessage(message);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient || !isAdmin) {
      return;
    }
    void loadItems(activeFilter);
  }, [activeFilter, isAdmin, isClient]);

  const sortedItems = useMemo(() => sortApiUseReasonItems(items), [items]);

  const handleDecision = async (item: ApiUsageByApiItem, action: "approve" | "reject") => {
    const tokenId = Number(item.apiTokenId);
    const reasonId = Number(item.apiUseReasonId);
    if (!Number.isFinite(tokenId) || !Number.isFinite(reasonId)) {
      await confirm({
        title: "처리 실패",
        message: "요청 식별자 정보가 올바르지 않습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
      return;
    }

    const agreed = await confirm({
      title: action === "approve" ? "사용 신청 승인" : "사용 신청 거절",
      message: action === "approve" ? "선택한 신청을 승인할까요?" : "선택한 신청을 거절할까요?",
      confirmText: action === "approve" ? "승인" : "거절",
      cancelText: "취소",
    });
    if (!agreed) {
      return;
    }

    try {
      setProcessingKey(`${tokenId}-${reasonId}`);
      if (action === "approve") {
        await apiUseReasonApi.approve(tokenId, reasonId);
      } else {
        await apiUseReasonApi.reject(tokenId, reasonId);
      }
      await confirm({
        title: "처리 완료",
        message: action === "approve" ? "요청이 승인되었습니다." : "요청이 거절되었습니다.",
        confirmText: "확인",
        hideCancel: true,
      });
      await loadItems(activeFilter);
    } catch (decisionError) {
      const message = decisionError instanceof Error ? decisionError.message : "요청 처리에 실패했습니다.";
      await confirm({
        title: "처리 실패",
        message,
        confirmText: "확인",
        hideCancel: true,
      });
    } finally {
      setProcessingKey(null);
    }
  };

  if (!isClient || isUserLoading) {
    return (
      <Container>
        <DocsHeader title="전체 사용 신청 관리" breadcrumb={["마이페이지"]} />
        <ContentWrapper>
          <StatusText>권한을 확인하는 중입니다.</StatusText>
        </ContentWrapper>
        {ConfirmDialog}
      </Container>
    );
  }

  if (!isAdmin) {
    return (
      <Container>
        <DocsHeader title="전체 사용 신청 관리" breadcrumb={["마이페이지"]} />
        <ContentWrapper>
          <StatusText>관리자만 접근할 수 있습니다.</StatusText>
        </ContentWrapper>
        {ConfirmDialog}
      </Container>
    );
  }

  return (
    <Container>
      <DocsHeader title="전체 사용 신청 관리" breadcrumb={["마이페이지"]} />
      <ContentWrapper>
        <HeaderRow>
          <TitleGroup>
            <Title>전체 사용 신청 관리</Title>
            <Subtitle>전체 API 사용 신청을 상태별로 조회하고 승인/거절할 수 있어요</Subtitle>
          </TitleGroup>
          <RefreshButton type="button" onClick={() => void loadItems(activeFilter)} disabled={isLoading}>
            새로고침
          </RefreshButton>
        </HeaderRow>

        <FilterRow>
          {FILTER_OPTIONS.map((option) => (
            <FilterButton
              key={option.key}
              type="button"
              active={option.key === activeFilter}
              onClick={() => setActiveFilter(option.key)}
            >
              {option.label}
            </FilterButton>
          ))}
        </FilterRow>

        {isLoading ? <StatusText>목록을 불러오는 중입니다.</StatusText> : null}
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

        {!isLoading && !errorMessage ? (
          sortedItems.length > 0 ? (
            <List>
              {sortedItems.map((item) => {
                const state = (item.apiUseState || "").toUpperCase();
                const rowKey = createApiUseReasonRowKey(item);
                return (
                  <Card key={rowKey}>
                    <CardHeader>
                      <ApiName>{`요청 #${item.apiUseReasonId ?? "-"}`}</ApiName>
                      <StateBadge state={state}>{state || "UNKNOWN"}</StateBadge>
                    </CardHeader>

                    <MetaGrid>
                      <MetaLabel>apiUseReasonId</MetaLabel>
                      <MetaValue>{item.apiUseReasonId ?? "-"}</MetaValue>
                      <MetaLabel>writerId</MetaLabel>
                      <MetaValue>{item.writerId ?? "-"}</MetaValue>
                      <MetaLabel>신청 사유</MetaLabel>
                      <MetaValue>{item.apiUseReason || "-"}</MetaValue>
                    </MetaGrid>

                    {state === "PENDING" ? (
                      <ActionRow>
                        <ActionButton
                          type="button"
                          onClick={() => void handleDecision(item, "reject")}
                          disabled={processingKey === rowKey}
                        >
                          거절
                        </ActionButton>
                        <ActionButton
                          type="button"
                          primary
                          onClick={() => void handleDecision(item, "approve")}
                          disabled={processingKey === rowKey}
                        >
                          승인
                        </ActionButton>
                      </ActionRow>
                    ) : null}
                  </Card>
                );
              })}
            </List>
          ) : (
            <StatusText>조회된 신청 내역이 없습니다.</StatusText>
          )
        ) : null}
      </ContentWrapper>
      {ConfirmDialog}
    </Container>
  );
}
