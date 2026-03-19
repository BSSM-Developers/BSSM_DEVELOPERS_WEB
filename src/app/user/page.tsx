"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { BsdevLoader } from "@/components/common/BsdevLoader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { SearchBar } from "@/components/apis/SearchBar";
import { useDocsMyListQuery, useDocsMyPopularListQuery, useDeleteDocsMutation, useUpdateDocsMutation } from "@/app/docs/queries";
import type { DocsItem } from "@/app/docs/api";
import { useConfirm } from "@/hooks/useConfirm";
import { MyDocsCard } from "./components/MyDocsCard";
import { MyDocsEditModal, type MyDocsEditFormValue } from "./components/MyDocsEditModal";

const normalizeDocType = (value?: string): "ORIGINAL" | "CUSTOM" => {
  if (value === "CUSTOM" || value === "CUSTOMIZE") {
    return "CUSTOM";
  }
  return "ORIGINAL";
};

const getDocsId = (doc: DocsItem): string | null => {
  const rawId = doc.docsId ?? doc.id;
  if (!rawId) {
    return null;
  }
  return String(rawId);
};

const toEditFormValue = (doc: DocsItem): MyDocsEditFormValue => ({
  title: doc.title || "",
  description: doc.description || "",
  domain: doc.domain || "",
  repositoryUrl: doc.repositoryUrl || doc.repository_url || "",
});

export default function MyDocsPage() {
  const router = useRouter();
  const { confirm, ConfirmDialog } = useConfirm();
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ORIGINAL" | "CUSTOM">("ALL");
  const [sortType, setSortType] = useState<"LATEST" | "POPULAR">("LATEST");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<DocsItem | null>(null);

  const updateDocsMutation = useUpdateDocsMutation();
  const deleteDocsMutation = useDeleteDocsMutation();

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

  const docs = useMemo(() => {
    const values = sortType === "POPULAR" ? popularData?.data.values : latestData?.data.values;
    if (!values) {
      return [];
    }
    return values;
  }, [latestData, popularData, sortType]);

  const searchItems = useCallback(
    (items: DocsItem[]) => {
      if (!searchTerm) {
        return items;
      }
      const query = searchTerm.toLowerCase();
      return items.filter((item) => {
        return (
          item.title.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query) ||
          (item.domain || "").toLowerCase().includes(query) ||
          (item.repositoryUrl || item.repository_url || "").toLowerCase().includes(query)
        );
      });
    },
    [searchTerm]
  );

  const filteredDocs = useMemo(() => {
    let items = docs;
    if (filter === "ORIGINAL") {
      items = items.filter((item) => normalizeDocType(item.type) === "ORIGINAL");
    } else if (filter === "CUSTOM") {
      items = items.filter((item) => normalizeDocType(item.type) === "CUSTOM");
    }
    return searchItems(items);
  }, [docs, filter, searchItems]);

  const handleExplore = useCallback(
    (doc: DocsItem) => {
      const docsId = getDocsId(doc);
      if (!docsId) {
        return;
      }
      router.push(`/docs/${docsId}`);
    },
    [router]
  );

  const handleOpenEdit = useCallback((doc: DocsItem) => {
    setSelectedDoc(doc);
    setIsEditOpen(true);
  }, []);

  const handleOpenDocsEditor = useCallback(
    (doc: DocsItem) => {
      const docsId = getDocsId(doc);
      if (!docsId) {
        return;
      }
      const normalizedType = normalizeDocType(doc.type);
      const title = encodeURIComponent(doc.title || "");
      router.push(`/docs/${docsId}/edit?type=${normalizedType}&title=${title}`);
    },
    [router]
  );

  const handleOpenUsageManagement = useCallback(
    (doc: DocsItem) => {
      const docsId = getDocsId(doc);
      if (!docsId) {
        return;
      }
      router.push(`/user/api-management?docsId=${encodeURIComponent(docsId)}`);
    },
    [router]
  );

  const handlePrefetchDocRoutes = useCallback(
    (doc: DocsItem) => {
      const docsId = getDocsId(doc);
      if (!docsId) {
        return;
      }
      router.prefetch(`/docs/${docsId}`);
      const normalizedType = normalizeDocType(doc.type);
      const title = encodeURIComponent(doc.title || "");
      router.prefetch(`/docs/${docsId}/edit?type=${normalizedType}&title=${title}`);
      if (normalizedType === "ORIGINAL") {
        router.prefetch(`/user/api-management?docsId=${encodeURIComponent(docsId)}`);
      }
    },
    [router]
  );

  const handleCloseEdit = useCallback(() => {
    setIsEditOpen(false);
  }, []);

  const handleEditSubmit = useCallback(
    async (value: MyDocsEditFormValue) => {
      if (!selectedDoc) {
        return;
      }

      if (!value.title || !value.description || !value.domain || !value.repositoryUrl) {
        await confirm({
          title: "입력 필요",
          message: "제목, 설명, 도메인, 레포지토리 URL을 모두 입력해주세요.",
          confirmText: "확인",
          hideCancel: true,
        });
        return;
      }

      const docsId = getDocsId(selectedDoc);
      if (!docsId) {
        await confirm({
          title: "수정 실패",
          message: "문서 ID를 찾을 수 없습니다.",
          confirmText: "확인",
          hideCancel: true,
        });
        return;
      }

      try {
        await updateDocsMutation.mutateAsync({ docsId, data: value });
        setIsEditOpen(false);
        await confirm({
          title: "수정 완료",
          message: "문서 정보가 수정되었습니다.",
          confirmText: "확인",
          hideCancel: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "문서 수정에 실패했습니다.";
        await confirm({
          title: "수정 실패",
          message,
          confirmText: "확인",
          hideCancel: true,
        });
      }
    },
    [confirm, selectedDoc, updateDocsMutation]
  );

  const handleDelete = useCallback(
    async (doc: DocsItem) => {
      const docsId = getDocsId(doc);
      if (!docsId) {
        await confirm({
          title: "삭제 실패",
          message: "문서 ID를 찾을 수 없습니다.",
          confirmText: "확인",
          hideCancel: true,
        });
        return;
      }

      const agreed = await confirm({
        title: "문서 삭제",
        message: `${doc.title} 문서를 삭제할까요?`,
        confirmText: "삭제",
        cancelText: "취소",
      });
      if (!agreed) {
        return;
      }

      try {
        await deleteDocsMutation.mutateAsync(docsId);
        if (selectedDoc && getDocsId(selectedDoc) === docsId) {
          setIsEditOpen(false);
        }
        await confirm({
          title: "삭제 완료",
          message: "문서가 삭제되었습니다.",
          confirmText: "확인",
          hideCancel: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "문서 삭제에 실패했습니다.";
        await confirm({
          title: "삭제 실패",
          message,
          confirmText: "확인",
          hideCancel: true,
        });
      }
    },
    [confirm, deleteDocsMutation, selectedDoc]
  );

  return (
    <Container>
      <DocsHeader title="내 문서" breadcrumb={["마이페이지"]} />

      <ContentWrapper>
        <Title>내 문서</Title>
        <Subtitle>내가 등록한 API 혹은 커스텀한 API의 문서를 확인하고 관리할 수 있어요</Subtitle>

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

        {isLoading ? <BsdevLoader label="문서 목록을 불러오는 중입니다." size={52} minHeight="140px" /> : null}
        {activeError ? (
          <ErrorText>{activeError instanceof Error ? activeError.message : "문서 목록을 불러오지 못했습니다."}</ErrorText>
        ) : null}
        {!isLoading && !activeError && filteredDocs.length > 0 ? (
          <Section>
            <SectionTitle>{filter === "ALL" ? "전체 문서" : `${filter} API`}</SectionTitle>
            <SectionDescription>
              {filter === "ALL" ? "회원님이 관리 중인 모든 API 문서입니다" : `${filter} API 문서 목록입니다`}
            </SectionDescription>
            <Grid>
              {filteredDocs.map((doc) => {
                const docsId = getDocsId(doc);
                if (!docsId) {
                  return null;
                }
                return (
                  <MyDocsCard
                    key={docsId}
                    title={doc.title || "Untitled API"}
                    description={doc.description || "설명이 없습니다."}
                    type={normalizeDocType(doc.type)}
                    autoApproval={doc.autoApproval ?? doc.auto_approval ?? null}
                    repositoryUrl={doc.repositoryUrl || doc.repository_url || ""}
                    onExplore={() => handleExplore(doc)}
                    onEditDocs={() => handleOpenDocsEditor(doc)}
                    onEditInfo={() => handleOpenEdit(doc)}
                    onDelete={() => void handleDelete(doc)}
                    onManageUsage={normalizeDocType(doc.type) === "ORIGINAL" ? () => handleOpenUsageManagement(doc) : undefined}
                    onPrefetch={() => handlePrefetchDocRoutes(doc)}
                  />
                );
              })}
            </Grid>
          </Section>
        ) : !isLoading && !activeError ? (
          <EmptyState>문서가 존재하지 않습니다.</EmptyState>
        ) : null}
      </ContentWrapper>

      <MyDocsEditModal
        isOpen={isEditOpen}
        isSubmitting={updateDocsMutation.isPending}
        initialValue={selectedDoc ? toEditFormValue(selectedDoc) : null}
        onClose={handleCloseEdit}
        onSubmit={handleEditSubmit}
      />
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

const Section = styled.section`
  display: flex;
  flex-direction: column;
`;

const SectionTitle = styled.h3`
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  color: ${({ theme }) => theme.colors.grey[900]};
  margin: 0;
`;

const SectionDescription = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};
  margin: 8px 0 20px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 20px;

  @media (max-width: 1280px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 860px) {
    grid-template-columns: 1fr;
  }
`;

const EmptyState = styled.div`
  width: 100%;
  padding: 100px 0;
  text-align: center;
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[400]};
`;

const ErrorText = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: #d32f2f;
  margin-bottom: 20px;
`;
