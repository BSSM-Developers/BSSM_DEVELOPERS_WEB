"use client";

import styled from "@emotion/styled";
import { useState, useMemo, useCallback } from "react";
import { SearchBar } from "@/components/apis/SearchBar";
import { ApiSection } from "@/components/apis/ApiSection";
import { type ApiItem } from "./mockData";
import { useDocsListQuery, useDocsPopularListQuery } from "@/app/docs/queries";
import type { DocsItem } from "@/app/docs/api";

const toApiType = (value?: string): ApiItem["type"] => {
  if (value === "CUSTOM") {
    return "CUSTOM";
  }
  return "ORIGINAL";
};

const toApiItem = (item: DocsItem): ApiItem => ({
  id: String(item.docsId || item.id || ""),
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
              />
            )}

            {displayOriginal.length > 0 && (
              <ApiSection
                title="ORIGINAL API"
                description="BSSM Developers에 등록된 최신 API를 확인해보세요"
                items={displayOriginal}
              />
            )}

            {displayCustom.length > 0 && (
              <ApiSection
                title="CUSTOM API"
                description="BSSM Developers에서 사용자가 커스텀한 최신 API를 확인해보세요"
                items={displayCustom}
              />
            )}

            {displayPopular.length === 0 && displayOriginal.length === 0 && displayCustom.length === 0 && (
              <EmptyState>검색 결과가 없습니다.</EmptyState>
            )}
          </>
        )}
      </ContentWrapper>
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
