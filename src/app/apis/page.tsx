/* eslint-disable */
"use client";

import styled from "@emotion/styled";
import { useState, useMemo } from "react";
import { TopNav } from "@/components/layout/TopNav";
import { SearchBar } from "@/components/apis/SearchBar";
import { ApiSection } from "@/components/apis/ApiSection";
import { type ApiItem } from "./mockData";
import { useDocsListQuery } from "@/app/docs/queries";

export default function ApiExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "ORIGINAL" | "CUSTOM">("ALL");
  const [sortType, setSortType] = useState<"LATEST" | "POPULAR">("LATEST");

  const { data: docsData, isLoading } = useDocsListQuery();

  // Transform docsData to ApiItem[]
  const realOriginalApis: ApiItem[] = useMemo(() => {
    if (!docsData || !Array.isArray(docsData)) return [];
    // The response structure might be { message, data: { values: [...] } } or just [...]
    // Based on previous code: response.data.values
    // But useDocsListQuery returns `docsApi.getList` which returns `fetchClient.get<unknown[]>("/docs")`
    // Wait, adminApi was `RequestListResponse`.
    // Let's check `docsApi.getList`. It returns `unknown[]`.
    // If the backend returns wrapped response, we need to adapt.

    // Assuming the response is the array of docs directly or wrapped
    const list = (docsData as any).values || (Array.isArray(docsData) ? docsData : []);

    return list.map((item: any) => ({
      id: item.docsId || Math.random().toString(),
      title: item.title || "Untitled API",
      description: item.description || "설명이 없습니다.",
      tags: [item.writer || "Unknown"],
      type: "ORIGINAL",
      author: item.writer || "Unknown"
    }));
  }, [docsData]);

  // 실제 데이터가 있으면 사용, 없으면 빈 값
  const displayOriginalApis = realOriginalApis;

  // 검색어 기반 필터링
  const searchItems = (items: ApiItem[]) => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.title.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.tags.some(tag => tag.toLowerCase().includes(query))
    );
  };

  // 전체 아이템 병합
  const allItems = useMemo(() => {
    return [...displayOriginalApis];
  }, [displayOriginalApis]);

  // 필터링된 리스트 (단일 뷰용)
  const filteredList = useMemo(() => {
    if (filterType === "ALL") return [];

    let items = allItems;

    // 타입 필터 적용
    if (filterType === "ORIGINAL") {
      items = items.filter(item => item.type !== "CUSTOM");
    } else if (filterType === "CUSTOM") {
      items = items.filter(item => item.type === "CUSTOM");
    }

    // 검색 적용
    items = searchItems(items);

    // 정렬 적용
    if (sortType === "POPULAR") {
      // 데모용 역순 정렬
      return [...items].reverse();
    }

    return items;
  }, [filterType, sortType, searchQuery, allItems]);

  // 기본 뷰용 섹션 데이터
  const displayPopular = useMemo(() => [], [searchQuery]);
  const displayOriginal = useMemo(() => searchItems(displayOriginalApis), [searchQuery, displayOriginalApis]);
  const displayCustom = useMemo(() => [], [searchQuery]);

  const isFilteredView = filterType !== "ALL";

  return (
    <PageContainer>
      <TopNav />
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
          // 필터링된 뷰: 단일 섹션
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
          // 기본 뷰: 다중 섹션
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
