"use client";

import { useEffect, useMemo, useState } from "react";
import { DocsHeader } from "@/components/docs/DocsHeader";
import { BsdevLoader } from "@/components/common/BsdevLoader";
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
  const { ConfirmDialog } = useConfirm();
  const { data: user, isLoading: isUserLoading } = useUserQuery();
  const [isClient, setIsClient] = useState(false);
  const [activeFilter, setActiveFilter] = useState<ApiUseFilter>("ALL");
  const [items, setItems] = useState<ApiUsageByApiItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
              <Subtitle>전체 API 사용 신청을 상태별로 조회할 수 있어요</Subtitle>
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

        {isLoading ? <BsdevLoader label="목록을 불러오는 중입니다." size={52} minHeight="140px" /> : null}
        {errorMessage ? <ErrorText>{errorMessage}</ErrorText> : null}

        {!isLoading && !errorMessage ? (
          sortedItems.length > 0 ? (
            <List>
              {sortedItems.map((item) => {
                const state = (item.apiUseState || "").toUpperCase();
                const rowKey = createApiUseReasonRowKey(item);
                const requester = (() => {
                  const writerName = item.writer?.trim();
                  if (writerName) {
                    return writerName;
                  }
                  const name = item.name?.trim();
                  if (name) {
                    return name;
                  }
                  const writerId = String(item.writerId ?? "").trim();
                  if (writerId) {
                    return `사용자 #${writerId}`;
                  }
                  return "-";
                })();
                return (
                  <Card key={rowKey}>
                    <CardHeader>
                      <ApiName>{`요청 #${item.apiUseReasonId ?? "-"}`}</ApiName>
                      <StateBadge state={state}>{state || "UNKNOWN"}</StateBadge>
                    </CardHeader>

                    <MetaGrid>
                      <MetaLabel>요청자</MetaLabel>
                      <MetaValue>{requester}</MetaValue>
                      <MetaLabel>신청 사유</MetaLabel>
                      <MetaValue>{item.apiUseReason || "-"}</MetaValue>
                    </MetaGrid>

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
