"use client";

import styled from "@emotion/styled";
import { SidebarItem } from "../ui/sidebarItem/SidebarItem";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { useDocsStore } from "@/store/docsStore";

const defaultMenu: SidebarNode[] = [
  { label: "시작하기", module: "default" },
  { label: "결제 이해하기", module: "api", method: "GET" },
  { label: "결제 서비스", module: "main" },
  {
    label: "결제 이해하기",
    module: "collapse",
    childrenItems: [
      { label: "결제 개요", module: "small" },
      { label: "결제 API 가이드", module: "small" },
      { label: "결제 예시 코드", module: "small" },
    ],
  },
];

export function DocsSidebar({ onSelect, items = defaultMenu }: { onSelect?: (key: string) => void; items?: SidebarNode[] }) {
  const selected = useDocsStore((s: any) => s.selected);
  const setSelected = useDocsStore((s: any) => s.setSelected);
  const handleSelect = (key: string) => {
    setSelected(key);
    onSelect?.(key);
  };
  return (
    <Nav>
      {items.map((node, i) => (
        <SidebarItem
          key={i}
          label={node.label}
          module={node.module}
          method={node.method}
          childrenItems={node.childrenItems}
          onSelect={handleSelect}
          selected={selected}
          active={selected === node.label}
        />
      ))}
    </Nav>
  );
}

const Nav = styled.nav`
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;