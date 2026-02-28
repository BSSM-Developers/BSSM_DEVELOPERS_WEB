"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useState, useMemo, useCallback } from "react";
import { SearchBar } from "@/components/apis/SearchBar";
import { ApiSection } from "@/components/apis/ApiSection";
import type { ApiItem } from "@/app/apis/mockData";

interface MyDoc {
  id: string;
  type: "INSERT" | "UPDATE" | "DELETE";
  title: string;
  description: string;
  isOriginal: boolean;
}

const MOCK_MY_DOCS: MyDoc[] = [
  { id: "1", type: "INSERT", title: "부마위키", description: "부산소프트웨어마이스터고등학교 학생들의 교내 위키 서비스 부마위키의 API입니다", isOriginal: true },
  { id: "2", type: "INSERT", title: "부마위키", description: "부산소프트웨어마이스터고등학교 학생들의 교내 위키 서비스 부마위키의 API입니다", isOriginal: true },
  { id: "3", type: "INSERT", title: "부마위키", description: "부산소프트웨어마이스터고등학교 학생들의 교내 위키 서비스 부마위키의 API입니다", isOriginal: true },
  { id: "4", type: "INSERT", title: "부마위키", description: "부산소프트웨어마이스터고등학교 학생들의 교내 위키 서비스 부마위키의 API입니다", isOriginal: true },
  { id: "5", type: "INSERT", title: "부마위키", description: "부산소프트웨어마이스터고등학교 학생들의 교내 위키 서비스 부마위키의 API입니다", isOriginal: true },
  { id: "6", type: "INSERT", title: "부마위키", description: "부산소프트웨어마이스터고등학교 학생들의 교내 위키 서비스 부마위키의 API입니다", isOriginal: true },
];

export default function MyDocsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ORIGINAL" | "CUSTOM">("ALL");
  const [sortType, setSortType] = useState<"LATEST" | "POPULAR">("LATEST");

  const myApis: ApiItem[] = useMemo(() => {
    return MOCK_MY_DOCS.map((doc) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
      tags: [doc.type],
      type: doc.type,
    }));
  }, []);

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
          />
        </SearchSection>

        {filteredDocs.length > 0 ? (
          <ApiSection
            title={filter === "ALL" ? "전체 문서" : `${filter} API`}
            description={filter === "ALL" ? "회원님이 관리 중인 모든 API 문서입니다" : `${filter} API 문서 목록입니다`}
            items={filteredDocs}
            columns={3}
          />
        ) : (
          <EmptyState>문서가 존재하지 않습니다.</EmptyState>
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
