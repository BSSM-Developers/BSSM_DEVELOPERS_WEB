"use client";

import styled from "@emotion/styled";
import { SidebarItem } from "../ui/SidebarItem";

export function DocsSidebar() {
  return (
    <Nav>
      <Section>
        <SectionTitle>시작하기</SectionTitle>
        <SidebarItem label="환경 설정하기" />
        <SidebarItem label="LLMs로 결제 연동하기" />
        <SidebarItem label="마이크로서비스하기" />
      </Section>

      <Section>
        <SectionTitle>결제 서비스</SectionTitle>
        <SidebarItem label="결제 이해하기" nestedItems={["결제 요청", "결제 확인", "결제 취소"]} />
      </Section>
    </Nav>
  );
}

const Nav = styled.nav`
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const Section = styled.div``;

const SectionTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.grey[700]};
  margin-bottom: 8px;
`;
