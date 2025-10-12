"use client";

import styled from "@emotion/styled";
import { DocsHeader } from "./DocsHeader";

interface DocsLayoutProps {
  title: string;
  children: React.ReactNode;
}

export function DocsLayout({ title, children }: DocsLayoutProps) {
  return (
    <Wrapper>
      <Content>
        <DocsHeader title={title} />
        {children}
      </Content>
    </Wrapper>
  );
}

const Wrapper = styled.main`
  flex: 1;
  padding: 80px 120px;
  background: ${({ theme }) => theme.colors.background};
  overflow-y: auto;
`;

const Content = styled.div`
  max-width: 960px;
  margin: 0 auto;
`;
