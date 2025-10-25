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
  return (
    <Wrapper>
      <TopNav />
      <Body>
        <Sidebar>
          <DocsSidebar items = {testItems} editable={true} />
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

const Sidebar = styled.aside`
  width: 260px;
  background: ${({ theme }) => theme.colors.background};
  border-right: 1px solid ${({ theme }) => theme.colors.grey[200]};
  overflow-y: auto;
`;

const Content = styled.main`
  flex: 1;
  padding: 48px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.background};
`;
