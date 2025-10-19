"use client";

import styled from "@emotion/styled";
import { SidebarItem } from "../ui/sidebarItem/SidebarItem";
import { useDocsStore } from "@/store/docsStore";

export function DocsSidebar({ onSelect }: { onSelect?: (key: string) => void }) {
  const selected = useDocsStore((s: any) => s.selected);
  const setSelected = useDocsStore((s: any) => s.setSelected);
  const handleSelect = (key: string) => {
    setSelected(key);
    onSelect?.(key);
  };
  return (
    <Nav>
      <SidebarItem label = "시작하기" module = "default" active={selected === "시작하기"} selected={selected} onSelect={handleSelect}/>
      <SidebarItem label = "결제 이해하기" module = "api" method="GET" active={selected === "결제 이해하기"} selected={selected} onSelect={handleSelect}/>
      <SidebarItem label = "결제 서비스" module= "main" active={selected === "결제 서비스"} selected={selected} onSelect={handleSelect}/>
      <SidebarItem
        label="결제 이해하기"
        module="collapse"
        childrenItems={[
          { label: "결제 개요", module: "small"},
          { label: "결제 API 가이드", module: "small"},
          { label: "결제 예시 코드", module: "small"},
        ]}
        onSelect={handleSelect}
        selected={selected}
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