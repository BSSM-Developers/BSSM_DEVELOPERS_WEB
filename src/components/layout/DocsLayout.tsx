"use client";

import styled from "@emotion/styled";
import { DocsSidebar } from "./DocsSidebar";
import { ApiDocModule } from "@/components/docs/ApiDocModule";
import { useState } from "react";
import { TopNav } from "./TopNav";
import { useDocsStore } from "@/store/docsStore";
import { apiDocsData } from "@/data/apiDocs";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";

const testItems: SidebarNode[] = [
  { id: "perseus", label: "페르세우스", module: "main" },
  { id: "getting-started", label: "시작하기", module: "default" },
  { id: "api-description", label: "API 설명", module: "default" },
  { id: "api-spec", label: "API 명세서", module: "collapse", childrenItems: [] },
  {
    id: "user",
    label: "user",
    module: "collapse",
    childrenItems: [
      { id: "user-add", label: "추가 정보 입력", module: "api", method: "POST" },
      { id: "user-profile", label: "프로필 조회", module: "api", method: "GET" }
    ]
  },
  {
    id: "auth",
    label: "auth",
    module: "collapse",
    childrenItems: [
      { id: "google-login", label: "구글 로그인", module: "api", method: "POST" },
      { id: "google-url", label: "구글 로그인 url 조회", module: "api", method: "GET" },
      { id: "token-refresh", label: "토큰 재발급", module: "api", method: "GET" },
      { id: "logout", label: "로그아웃", module: "api", method: "GET" }
    ]
  },
  {
    id: "fact",
    label: "fact",
    module: "collapse",
    childrenItems: [
      { id: "fact-create", label: "사실 작성", module: "api", method: "POST" },
      { id: "fact-delete", label: "사실 제거", module: "api", method: "DELETE" }
    ]
  },
  {
    id: "fact-update",
    label: "fact update",
    module: "collapse",
    childrenItems: [
      { id: "fact-update-create", label: "인지 왜곡 수정 글 작성", module: "api", method: "POST" },
      { id: "fact-update-view", label: "인지 왜곡 수정 글 조회", module: "api", method: "GET" }
    ]
  }
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const selectedDocId = useDocsStore((s: any) => s.selected)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  // 선택된 아이템이 API 문서인지 확인하고 해당 데이터 가져오기
  const selectedApiDoc = apiDocsData[selectedDocId];
  const isApiSelected = !!selectedApiDoc;

  return (
    <Wrapper>
      <TopNav />
      <Body>
        <Sidebar collapsed={sidebarCollapsed}>
          <SidebarHeader>
            <ToggleButton onClick={toggleSidebar}>
              {sidebarCollapsed ? "→" : "←"}
            </ToggleButton>
            {!sidebarCollapsed && <SidebarTitle>API 문서</SidebarTitle>}
          </SidebarHeader>
          {!sidebarCollapsed && <DocsSidebar items={testItems} editable={true} />}
        </Sidebar>
        <Content data-selected={selectedDocId}>
          {isApiSelected ? (
            <ApiDocModule
              apiId={selectedApiDoc.id}
              apiName={selectedApiDoc.name}
              method={selectedApiDoc.method}
              endpoint={selectedApiDoc.endpoint}
              description={selectedApiDoc.description}
              headerParams={selectedApiDoc.headerParams}
              bodyParams={selectedApiDoc.bodyParams}
              sampleCode={selectedApiDoc.sampleCode}
              responseCode={selectedApiDoc.responseCode}
            />
          ) : (
            children
          )}
        </Content>
      </Body>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`;

const Body = styled.div`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

const Sidebar = styled.aside<{ collapsed: boolean }>`
  width: ${({ collapsed }) => collapsed ? "48px" : "260px"};
  background: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.grey[200]};
  overflow-y: auto;
  transition: width 0.3s ease;
  display: flex;
  flex-direction: column;
`;

const SidebarHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid ${({ theme }) => theme.colors.grey[200]};
  gap: 8px;
`;

const ToggleButton = styled.button`
  width: 24px;
  height: 24px;
  border: 0;
  background: ${({ theme }) => theme.colors.grey[100]};
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.colors.grey[600]};

  &:hover {
    background: ${({ theme }) => theme.colors.grey[200]};
  }
`;

const SidebarTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.background};
`;

const DefaultContent = styled.div`
  padding: 48px;

  h2 {
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: 16px;
  }

  p {
    color: ${({ theme }) => theme.colors.grey[600]};
  }
`;
