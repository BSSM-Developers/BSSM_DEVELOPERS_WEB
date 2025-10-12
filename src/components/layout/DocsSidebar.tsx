"use client";

import styled from "@emotion/styled";
import { SidebarItem } from "../ui/sidebarItem/SidebarItem";

export function DocsSidebar() {
  return (
    <Nav>
      <SidebarItem label = "시작하기" module = "default" active/>
      <SidebarItem label = "결제 이해하기" module = "api" method="GET"/>
      <SidebarItem label = "결제 서비스" module= "main"/>
      <SidebarItem
        label="결제 이해하기"
        module="collapse"
        childrenItems={[
          { label: "결제 개요", module: "small"},
          { label: "결제 API 가이드", module: "small"},
          { label: "결제 예시 코드", module: "small"},
        ]}
      />
    </Nav>
  );
}

const Nav = styled.nav`
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;