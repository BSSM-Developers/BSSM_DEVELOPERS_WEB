"use client";

import { DocsHeader } from "@/components/docs/DocsHeader";
import { applyTypography } from "@/lib/themeHelper";
import styled from "@emotion/styled";
import { useState } from "react";

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
  const [filter, setFilter] = useState<"Original" | "Custom">("Original");

  const filteredDocs = MOCK_MY_DOCS.filter(doc =>
    (filter === "Original" ? doc.isOriginal : !doc.isOriginal) &&
    (doc.title.includes(searchTerm) || doc.description.includes(searchTerm))
  );

  return (
    <Container>
      <DocsHeader title="내 문서" breadcrumb={["마이페이지"]} />

      <ContentWrapper>
        <Subtitle>내가 등록한 API 혹은 커스텀한 API의 문서를 확인할 수 있어요</Subtitle>

        <SearchSection>
          <SearchInput
            placeholder="검색어를 입력해주세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <SearchButton>검색</SearchButton>
        </SearchSection>

        <FilterSection>
          <FilterButton
            active={filter === "Original"}
            onClick={() => setFilter("Original")}
          >
            Original API
          </FilterButton>
          <FilterButton
            active={filter === "Custom"}
            onClick={() => setFilter("Custom")}
          >
            Custom API
          </FilterButton>
        </FilterSection>

        <DocGrid>
          {filteredDocs.map((doc) => (
            <DocCard key={doc.id}>
              <CardHeader>
                <TypeIndicator>
                  <Dot type={doc.type} />
                  {doc.type}
                </TypeIndicator>
                <CardTitle>{doc.title}</CardTitle>
                <CardDescription>{doc.description}</CardDescription>
              </CardHeader>
              <CardFooter>
                <ActionButton secondary>둘러보기</ActionButton>
                <ActionButton primary>사용하기</ActionButton>
              </CardFooter>
            </DocCard>
          ))}
        </DocGrid>
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

const Subtitle = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[400]};
  margin-bottom: 32px;
`;

const SearchSection = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
`;

const SearchInput = styled.input`
  flex: 1;
  height: 48px;
  padding: 0 16px;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 4px;
  ${({ theme }) => applyTypography(theme, "Body_1")};
  outline: none;

  &::placeholder {
    color: ${({ theme }) => theme.colors.grey[300]};
  }
`;

const SearchButton = styled.button`
  height: 48px;
  padding: 0 24px;
  background: ${({ theme }) => theme.colors.bssmDarkBlue};
  color: white;
  border: none;
  border-radius: 4px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  cursor: pointer;
  
  &:hover {
    filter: brightness(1.1);
  }
`;

const FilterSection = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 40px;
`;

const FilterButton = styled.button<{ active: boolean }>`
  padding: 6px 12px;
  border: 1px solid ${({ theme, active }) => active ? theme.colors.bssmDarkBlue : theme.colors.grey[400]};
  border-radius: 4px;
  background: ${({ theme, active }) => active ? theme.colors.bssmDarkBlue : "transparent"};
  color: ${({ theme, active }) => active ? "white" : theme.colors.grey[700]};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 11px;
  cursor: pointer;

  &:hover {
    background: ${({ theme, active }) => active ? theme.colors.bssmDarkBlue : theme.colors.grey[50]};
  }
`;

const DocGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DocCard = styled.div`
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: 240px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  }
`;

const CardHeader = styled.div``;

const TypeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 11px;
  color: ${({ theme }) => theme.colors.grey[800]};
  margin-bottom: 8px;
`;

const Dot = styled.div<{ type: "INSERT" | "UPDATE" | "DELETE" }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ type, theme }) =>
    type === "INSERT" ? theme.colors.grey[800] :
      type === "UPDATE" ? theme.colors.bssmBlue :
        theme.colors.bssmRed};
`;

const CardTitle = styled.h3`
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  font-size: 24px;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.colors.grey[900]};
`;

const CardDescription = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[700]};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
`;

const ActionButton = styled.button<{ primary?: boolean; secondary?: boolean }>`
  padding: 8px 16px;
  border-radius: 4px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 12px;
  cursor: pointer;
  border: 1px solid ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : theme.colors.grey[300]};
  background: ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : "white"};
  color: ${({ theme, primary }) => primary ? "white" : theme.colors.grey[800]};

  &:hover {
    background: ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : theme.colors.grey[50]};
    filter: ${({ primary }) => primary ? "brightness(1.1)" : "none"};
  }
`;
