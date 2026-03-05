"use client";

import styled from "@emotion/styled";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { SearchBar } from "@/components/apis/SearchBar";
import { ApiSection } from "@/components/apis/ApiSection";
import { ApiUseApplyModal } from "@/components/apis/ApiUseApplyModal";
import { type ApiItem } from "./mockData";
import { docsKeys, useDocsListQuery, useDocsPopularListQuery } from "@/app/docs/queries";
import { docsApi, type DocsItem, type SidebarBlock } from "@/app/docs/api";

const findFirstPageMappedId = (blocks: SidebarBlock[]): string | null => {
  for (const block of blocks) {
    const mappedId = String(block.mappedId ?? block.id ?? "").trim();
    if ((block.module === "api" || block.module === "default") && mappedId) {
      return mappedId;
    }
    if (block.childrenItems?.length) {
      const childMatched = findFirstPageMappedId(block.childrenItems);
      if (childMatched) {
        return childMatched;
      }
    }
  }
  return null;
};

const toApiType = (value?: string): ApiItem["type"] => {
  if (value === "CUSTOM" || value === "CUSTOMIZE") {
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
  const router = useRouter();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "ORIGINAL" | "CUSTOM">("ALL");
  const [sortType, setSortType] = useState<"LATEST" | "POPULAR">("LATEST");
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedApi, setSelectedApi] = useState<ApiItem | null>(null);

  const { data: docsData, isLoading } = useDocsListQuery();
  const { data: popularDocsData, isLoading: isPopularLoading } = useDocsPopularListQuery({ size: 20 });

  const realOriginalApis: ApiItem[] = useMemo(() => {
    const list = docsData?.data?.values;
    if (!list || !Array.isArray(list)) {
      return [];
    }
    return list.map(toApiItem);
  }, [docsData]);

  const realPopularApis: ApiItem[] = useMemo(() => {
    const list = popularDocsData?.data?.values;
    if (!list || !Array.isArray(list)) {
      return [];
    }
    return list.map(toApiItem);
  }, [popularDocsData]);

  const searchItems = useCallback((items: ApiItem[]) => {
    if (!searchQuery) {
      return items;
    }
    const query = searchQuery.toLowerCase();
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some((tag) => tag.toLowerCase().includes(query))
    );
  }, [searchQuery]);

  const allItems = useMemo(() => [...realOriginalApis], [realOriginalApis]);

  const filteredList = useMemo(() => {
    if (filterType === "ALL") {
      return [];
    }

    let items = allItems;

    if (filterType === "ORIGINAL") {
      items = items.filter((item) => item.type !== "CUSTOM");
    }

    if (filterType === "CUSTOM") {
      items = items.filter((item) => item.type === "CUSTOM");
    }

    const searchedItems = searchItems(items);

    if (sortType === "POPULAR") {
      return [...searchedItems].reverse();
    }

    return searchedItems;
  }, [allItems, filterType, searchItems, sortType]);

  const displayPopular = useMemo(() => searchItems(realPopularApis), [realPopularApis, searchItems]);
  const displayOriginal = useMemo(() => searchItems(realOriginalApis), [realOriginalApis, searchItems]);
  const displayCustom = useMemo(() => [], []);

  const isFilteredView = filterType !== "ALL";

  const handleUseClick = useCallback((item: ApiItem) => {
    setSelectedApi(item);
    setIsApplyOpen(true);
  }, []);

  const handlePrefetch = useCallback(
    async (item: ApiItem) => {
      const docsId = String(item.id ?? "").trim();
      if (!docsId) {
        return;
      }

      try {
        router.prefetch(`/docs/${docsId}`);
        const sidebar = await queryClient.fetchQuery({
          queryKey: docsKeys.sidebar(docsId),
          queryFn: () => docsApi.getSidebar(docsId),
          staleTime: 60 * 1000,
        });

        const firstPageMappedId = findFirstPageMappedId(sidebar.data.blocks ?? []);
        if (!firstPageMappedId) {
          return;
        }
        router.prefetch(`/docs/${docsId}/page/${firstPageMappedId}`);
      } catch {
        return;
      }
    },
    [queryClient, router]
  );

  const closeApplyModal = useCallback(() => {
    setIsApplyOpen(false);
  }, []);

  if (isLoading) {
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
              onPrefetch={handlePrefetch}
            />
          ) : (
            <EmptyState>검색 결과가 없습니다.</EmptyState>
          )
        ) : (
          <>
            {displayPopular.length > 0 ? (
            <ApiSection
              title="인기 API"
              description="최근 인기있는 API를 확인해보세요"
              items={displayPopular}
              onUse={handleUseClick}
              onPrefetch={handlePrefetch}
            />
            ) : isPopularLoading ? <EmptyState>인기 API를 불러오는 중입니다...</EmptyState> : null}

            {displayOriginal.length > 0 ? (
              <ApiSection
                title="ORIGINAL API"
                description="BSSM Developers에 등록된 최신 API를 확인해보세요"
                items={displayOriginal}
                onUse={handleUseClick}
                onPrefetch={handlePrefetch}
              />
            ) : null}

            {displayCustom.length > 0 ? (
              <ApiSection
                title="CUSTOM API"
                description="BSSM Developers에서 사용자가 커스텀한 최신 API를 확인해보세요"
                items={displayCustom}
                onUse={handleUseClick}
                onPrefetch={handlePrefetch}
              />
            ) : null}

            {displayPopular.length === 0 && displayOriginal.length === 0 && displayCustom.length === 0 ? (
              <EmptyState>검색 결과가 없습니다.</EmptyState>
            ) : null}
          </>
        )}

      </ContentWrapper>

      <ApiUseApplyModal
        isOpen={isApplyOpen}
        docsId={selectedApi?.id ?? null}
        docsTitle={selectedApi?.title}
        onClose={closeApplyModal}
      />
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
  color: #191f28;
  margin: 0;
  letter-spacing: -1.8px;
`;

const Subtitle = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 16px;
  font-weight: 400;
  color: #8b95a1;
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
  color: #8b95a1;
`;
