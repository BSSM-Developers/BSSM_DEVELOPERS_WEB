"use client";

import styled from "@emotion/styled";
import { DocsSidebar } from "./DocsSidebar";
import { useState } from "react";
import { TopNav } from "./TopNav";

const testItems = [
  { id: "s-1", label: "시작하기", module: "default" } as any,
  { id: "s-2", label: "결제 이해하기", module: "api", method: "GET" } as any,
  {
    id: "s-3",
    label: "결제",
    module: "collapse",
    childrenItems: [
      { id: "s-3-1", label: "결제 개요", module: "small" } as any,
      { id: "s-3-2", label: "결제 API 가이드", module: "small" } as any,
    ],
  } as any,
];

export function DocsLayout({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<string>("시작하기");
  return (
    <Wrapper>
      <TopNav />
      <Body>
        <Sidebar>
          <DocsSidebar items = {testItems} onSelect={(key) => setSelected(key)} editable={true} />
        </Sidebar>
        <Content data-selected={selected}>{children}</Content>
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
