"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useState, useMemo, useCallback } from "react";
import { SearchBar } from "@/components/apis/SearchBar";
import { ApiSection } from "@/components/apis/ApiSection";
import type { ApiItem } from "@/app/apis/mockData";
import { useDocsMyListQuery, useDocsMyPopularListQuery } from "@/app/docs/queries";
import type { DocsItem } from "@/app/docs/api";

const toApiItemType = (value?: string): ApiItem["type"] => {
  if (value === "CUSTOM") {
    return "CUSTOM";
  }
  return "ORIGINAL";
};

const toApiItem = (doc: DocsItem): ApiItem => ({
  id: String(doc.docsId ?? doc.id ?? ""),
  title: doc.title || "Untitled API",
  description: doc.description || "설명이 없습니다.",
  tags: [doc.type || "ORIGINAL"],
  type: toApiItemType(doc.type),
  author: doc.writer,
});

export default function MyDocsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ORIGINAL" | "CUSTOM">("ALL");
  const [sortType, setSortType] = useState<"LATEST" | "POPULAR">("LATEST");
  const typeParam = filter === "ALL" ? undefined : filter;

  const { data: latestData, isLoading: isLatestLoading, error: latestError } = useDocsMyListQuery(
    { type: typeParam, size: 20 },
    sortType === "LATEST"
  );
  const { data: popularData, isLoading: isPopularLoading, error: popularError } = useDocsMyPopularListQuery(
    { type: typeParam, size: 20 },
    sortType === "POPULAR"
  );

  const isLoading = sortType === "POPULAR" ? isPopularLoading : isLatestLoading;
  const activeError = sortType === "POPULAR" ? popularError : latestError;

  const myApis: ApiItem[] = useMemo(() => {
    const values = sortType === "POPULAR" ? popularData?.data.values : latestData?.data.values;
    if (!values) {
      return [];
    }
    return values.map(toApiItem);
  }, [latestData, popularData, sortType]);

  const searchItems = useCallback((items: ApiItem[]) => {
    if (!searchTerm) return items;
    const query = searchTerm.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query)
    );
  }, [searchTerm]);

  const filteredDocs = useMemo(() => {
    let items = myApis;
    if (filter === "ORIGINAL") {
      items = items.filter(item => item.type === "ORIGINAL");
    } else if (filter === "CUSTOM") {
      items = items.filter(item => item.type === "CUSTOM");
    }
    return searchItems(items);
  }, [filter, myApis, searchItems]);

  return (
    <Container>
      <DocsHeader title="내 문서" breadcrumb={["마이페이지"]} />

      <ContentWrapper>
        <Title>내 문서</Title>
        <Subtitle>내가 등록한 API 혹은 커스텀한 API의 문서를 확인할 수 있어요</Subtitle>

        <SearchSection>
          <SearchBar
            onSearch={setSearchTerm}
            onFilterChange={setFilter}
            onSortChange={setSortType}
            activeFilter={filter}
            activeSort={sortType}
            allowSortWhenAll
          />
        </SearchSection>

        {isLoading ? <StatusText>문서 목록을 불러오는 중입니다.</StatusText> : null}
        {activeError ? <ErrorText>{activeError instanceof Error ? activeError.message : "문서 목록을 불러오지 못했습니다."}</ErrorText> : null}
        {!isLoading && !activeError && filteredDocs.length > 0 ? (
          <ApiSection
            title={filter === "ALL" ? "전체 문서" : `${filter} API`}
            description={filter === "ALL" ? "회원님이 관리 중인 모든 API 문서입니다" : `${filter} API 문서 목록입니다`}
            items={filteredDocs}
            columns={3}
          />
        ) : (
          !isLoading && !activeError ? <EmptyState>문서가 존재하지 않습니다.</EmptyState> : null
        )}
      </ContentWrapper>
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const ContentWrapper = styled.div`
  padding: 0 24px 24px 24px;
`;

const Title = styled.h2`
  ${({ theme }) => applyTypography(theme, "Headline_1")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin-bottom: 12px;
`;

const Subtitle = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[400]};
  margin-bottom: 32px;
`;

const SearchSection = styled.div`
  margin-bottom: 40px;
`;

const EmptyState = styled.div`
  width: 100%;
  padding: 100px 0;
  text-align: center;
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[400]};
`;

const StatusText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[500]};
  margin-bottom: 20px;
`;

const ErrorText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: #d32f2f;
  margin-bottom: 20px;
`;
