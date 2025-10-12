"use client";

import { useState, useEffect } from "react";
import styled from "@emotion/styled";
import { sidebarModules } from "./modules";
import { ChevronDown, ChevronRight } from "lucide-react";

type ModuleType = keyof typeof sidebarModules;

interface SidebarChild {
  label: string;
  module?: ModuleType;
  method?: "GET" | "POST" | "DELETE";
}

interface SidebarItemProps {
  label: string;
  module?: ModuleType;
  method?: "GET" | "POST" | "DELETE";
  active?: boolean;
  childrenItems?: SidebarChild[];
}

export function SidebarItem({
  label,
  module = "default",
  method,
  active = false,
  childrenItems = [],
}: SidebarItemProps) {

  const hasChevron = module === "collapse";
  const [open, setOpen] = useState(true);

  const handleToggle = () => {
    if (hasChevron) setOpen((prev) => !prev);
  };

  return (
    <>
      <ItemWrapper module={module} active={active} onClick={handleToggle}>
        <Label>{label}</Label>

        {hasChevron &&
          (open ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}

        {module === "api" && method && (
          <MethodTag method={method}>{method}</MethodTag>
        )}
      </ItemWrapper>

      {hasChevron && open && childrenItems.length > 0 && (
        <SubMenu>
          {childrenItems.map((child, i) => (
            <SidebarItem
              key={i}
              label={child.label}
              module={child.module}
              method={child.method}
            />
          ))}
        </SubMenu>
      )}
    </>
  );
}

const ItemWrapper = styled.div<{ module: ModuleType; active: boolean }>`
  display: flex;
  align-items: center;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;

  ${({ theme, module }) => sidebarModules[module].base({ theme })};
  ${({ theme, module, active }) =>
    active && sidebarModules[module].active({ theme })};
`;

const Label = styled.span`
  flex: 1;
`;

const MethodTag = styled.span<{ method: string }>`
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  padding: 2px 6px;
  color: #fff;
  background-color: ${({ method }) =>
    ({
      GET: "#19B26B",
      POST: "#F06820",
      DELETE: "#F14437",
    }[method] ?? "#9CA3AF")};
`;

const SubMenu = styled.div`
  display: flex;
  flex-direction: column;
`;
