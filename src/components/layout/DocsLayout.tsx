"use client";

import styled from "@emotion/styled";
import { DocsSidebar } from "./DocsSidebar";
import { useState } from "react";
import { TopNav } from "./TopNav";
import { useDocsStore } from "@/store/docsStore";

const testItems = [
  { id: "doc-1", label: "시작하기", module: "default" } as any,
  {
    id: "group-1",
    label: "개발자",
    module: "collapse",
    childrenItems: [
      { id: "doc-2", label: "박동현", module: "small" } as any,
      { id: "doc-3", label: "류승찬", module: "small" } as any,
    ],
  } as any,
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const selectedDocId = useDocsStore((s: any) => s.selected)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => setSidebarCollapsed(prev => !prev);

  return (
    <Wrapper>
      <TopNav />
      <Body>
        <Sidebar collapsed={sidebarCollapsed}>
          <SidebarHeader>
            <ToggleButton onClick={toggleSidebar}>
              {sidebarCollapsed ? "→" : "←"}
            </ToggleButton>
            {!sidebarCollapsed && <SidebarTitle>문서</SidebarTitle>}
          </SidebarHeader>
          {!sidebarCollapsed && <DocsSidebar items = {testItems} editable={true} />}
        </Sidebar>
        <Content data-selected={selectedDocId}>{children}</Content>
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
  padding: 48px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.background};
`;
