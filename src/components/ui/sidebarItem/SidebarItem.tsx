"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, usePathname } from "next/navigation";
import styled from "@emotion/styled";
import { sidebarModules } from "./modules";
import type { SidebarNode } from "./types";
import { useDocsStore } from "@/store/docsStore";
import { HttpMethodTag } from "@/components/ui/httpMethod/HttpMethodTag";
import { startRouteTransitionLoading } from "@/components/common/routeTransitionSignal";

interface Mutators {
  addSibling: (targetId: string, node: Omit<SidebarNode, "id">) => void;
  addChild: (parentId: string, node: Omit<SidebarNode, "id">) => void;
  rename: (id: string, label: string) => void;
  remove: (id: string) => void;
}

interface SidebarItemProps {
  node: SidebarNode;
  editable: boolean;
  mutators: Mutators;
  renderChildren?: boolean;
  disableApiRename?: boolean;
}

export function SidebarItem({
  node,
  editable,
  mutators,
  renderChildren = true,
  disableApiRename = false,
}: SidebarItemProps) {
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(node.label);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const selectedId = useDocsStore((state) => state.selected);
  const setSelected = useDocsStore((state) => state.setSelected);
  const isFolder = node.module === "collapse" || node.module === "main" || node.module === "main_title";
  const canRename = editable && !(disableApiRename && node.module === "api");

  const router = useRouter();
  const pathname = usePathname();
  const hasPathInTree = (current: SidebarNode): boolean => {
    if (current.path) {
      return true;
    }
    return (current.childrenItems ?? []).some((child) => hasPathInTree(child));
  };

  const matchesPath = (path: string): boolean => {
    if (!pathname) {
      return false;
    }
    if (path === "/user") {
      return pathname === "/user";
    }
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const routeActiveInTree = (current: SidebarNode): boolean => {
    if (current.path && matchesPath(current.path)) {
      return true;
    }
    return (current.childrenItems ?? []).some((child) => routeActiveInTree(child));
  };

  const selectedActiveInTree = (current: SidebarNode): boolean => {
    if (current.id === selectedId) {
      return true;
    }
    return (current.childrenItems ?? []).some((child) => selectedActiveInTree(child));
  };

  const isPathTree = hasPathInTree(node);
  const isActive = isPathTree ? routeActiveInTree(node) : selectedActiveInTree(node);

  const handleClick = () => {
    setSelected(node.id);

    if (isFolder) {
      setOpen(p => !p);
      return;
    }

    if (node.path) {
      if (matchesPath(node.path)) {
        return;
      }
      startRouteTransitionLoading();
      router.push(node.path);
      return;
    }

    if (pathname?.includes('/docs/register') || pathname?.includes('/edit')) {
      return;
    }
  };

  const commitRename = () => {
    if (!canRename) return;
    if (label.trim() && label !== node.label) mutators.rename(node.id, label.trim());
    setRenaming(false);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (!editable) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const duplicateItem = () => {
    const rest: Omit<SidebarNode, "id"> = {
      label: node.label,
      module: node.module,
      path: node.path,
      method: node.method,
      childrenItems: node.childrenItems,
    };
    const newNode = { ...rest, label: `${node.label} 복사` };
    mutators.addSibling(node.id, newNode);
    closeContextMenu();
  };

  return (
    <>
      <ItemWrapper
        module={(node.module ?? "default") as keyof typeof sidebarModules}
        active={isActive}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        onDoubleClick={() => { if (canRename) setRenaming(true); }}
      >
        {editable && (
          <DeleteButton
            aria-label="delete"
            onClick={(e) => { e.stopPropagation(); mutators.remove(node.id); }}
          >
            –
          </DeleteButton>
        )}
        {renaming ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.nativeEvent.isComposing || e.keyCode === 229) return;
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            onBlur={commitRename}
            autoFocus
            style={{ width: "100%", background: "transparent", color: "inherit", border: 0, outline: "none" }}
          />
        ) : (
          <>
            <Label>{node.label}</Label>
            {node.module === "api" && node.method && (
              <HttpMethodTag method={node.method as "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "UPDATE"} size="small" />
            )}
          </>
        )}
      </ItemWrapper>

      {renderChildren && isFolder && open && (node.childrenItems?.length ?? 0) > 0 && (
        <SubMenu isMain={node.module === "main"}>
          {node.childrenItems!.map(child => (
            <SidebarItem
              key={child.id}
              node={child}
              editable={editable}
              mutators={mutators}
              renderChildren={renderChildren}
              disableApiRename={disableApiRename}
            />
          ))}
        </SubMenu>
      )}

      {contextMenu && typeof document !== "undefined" && createPortal(
        <>
          <ContextMenuBackdrop onClick={closeContextMenu} />
          <ContextMenu style={{ top: contextMenu.y, left: contextMenu.x }}>
            {canRename ? (
              <ContextMenuItem onClick={() => { setRenaming(true); closeContextMenu(); }}>
                이름 변경
              </ContextMenuItem>
            ) : null}
            <ContextMenuItem onClick={duplicateItem}>
              복제
            </ContextMenuItem>
            {isFolder && (
              <ContextMenuItem onClick={() => {
                mutators.addChild(node.id, { label: "새 항목", module: "default" });
                closeContextMenu();
              }}>
                하위 항목 추가
              </ContextMenuItem>
            )}
            <ContextMenuDivider />
            <ContextMenuItem
              onClick={() => {
                mutators.remove(node.id);
                closeContextMenu();
              }}
              danger
            >
              삭제
            </ContextMenuItem>
          </ContextMenu>
        </>,
        document.body
      )}
    </>
  );
}

const ItemWrapper = styled.div<{ module: keyof typeof sidebarModules; active: boolean }>`
  display: flex;
  align-items: center;
  border-radius: 8px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  overflow: hidden;
  ${({ theme, module }) => sidebarModules[module].base({ theme })};
  ${({ theme, module, active }) => active && sidebarModules[module].active({ theme })};
`;

const Label = styled.span`
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DeleteButton = styled.button`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 0;
  margin-right: 8px;
  background: rgba(255, 59, 48, 0.12);
  color: #F14437;
  font-size: 12px;
  line-height: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
`;

const SubMenu = styled.div<{ isMain?: boolean }>`
  display: flex;
  flex-direction: column;
  margin-left: ${({ isMain }) => isMain ? "0px" : "16px"};
  padding-left: ${({ isMain }) => isMain ? "0px" : "16px"};
  border-left: ${({ isMain, theme }) => isMain ? "none" : `2px solid ${theme.colors.grey[200] || "#E5E7EB"}`};
  margin-top: ${({ isMain }) => isMain ? "8px" : "4px"};
  gap: 2px;
`;

const ContextMenuBackdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  background: transparent;
`;

const ContextMenu = styled.div`
  position: fixed;
  z-index: 1000;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  padding: 4px;
  min-width: 140px;
`;

const ContextMenuItem = styled.button<{ danger?: boolean }>`
  width: 100%;
  text-align: left;
  padding: 8px 12px;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: ${({ danger }) => danger ? "#EF4444" : "#374151"};
  border-radius: 4px;
  font-size: 14px;

  &:hover {
    background: ${({ danger }) => danger ? "#FEF2F2" : "#F3F4F6"};
  }
`;

const ContextMenuDivider = styled.hr`
  margin: 4px 0;
  border: 0;
  height: 1px;
  background: #E5E7EB;
`;
