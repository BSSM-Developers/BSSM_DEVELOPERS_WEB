"use client";

import styled from "@emotion/styled";
// import { DocsSidebar } from "./DocsSidebar";
import { TopNav } from "./TopNav";

export function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <Wrapper>
      <TopNav />
      <Body>
        {/* <Sidebar>
          <DocsSidebar />
        </Sidebar>
        <Content>{children}</Content> */}
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
  background: ${({ theme }) => theme.colors.grey[100]};
  border-right: 1px solid ${({ theme }) => theme.colors.grey[300]};
  overflow-y: auto;
`;

const Content = styled.main`
  flex: 1;
  padding: 48px;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.background};
`;
