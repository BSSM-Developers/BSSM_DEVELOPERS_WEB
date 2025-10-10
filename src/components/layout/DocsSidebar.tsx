"use client";

import styled from "@emotion/styled";
import { SidebarItem } from "../ui/sidebarItem/SidebarItem";

export function DocsSidebar() {
  return (
    <Nav>
      <SidebarItem label = "시작하기" module = "default" active/>
      <SidebarItem label = "결제 이해하기" module = "api" method="GET"/>
      <SidebarItem label = "결제 서비스" module= "main"/>
      <SidebarItem label = "테스트" module = "collapse" open/>
      <SidebarItem label = "테스트 서비스" module = "small"/>
    </Nav>
  );
}

const Nav = styled.nav`
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;