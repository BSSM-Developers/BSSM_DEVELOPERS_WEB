"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import { sidebarModules } from "./modules";
import type { SidebarNode } from "./types";
import { useDocsStore } from "@/store/docsStore";

type Mutators = {
  addSibling: (targetId: string, node: Omit<SidebarNode,"id">) => void;
  addChild: (parentId: string, node: Omit<SidebarNode,"id">) => void;
  rename: (id: string, label: string) => void;
  remove: (id: string) => void;
};

type SidebarItemProps = {
  node: SidebarNode;
  editable: boolean;
  mutators: Mutators;
  renderChildren?: boolean;
};

export function SidebarItem({ node, editable, mutators, renderChildren = true }: SidebarItemProps) {
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(node.label);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const selectedDocId = useDocsStore((s: any) => s.selected)
  const isFolder = node.module === "collapse";
  const childHasActive = (node.childrenItems ?? []).some(c => c.id === selectedDocId);
  const isActive = selectedDocId === node.id || childHasActive;

  const handleClick = () => {
    if (isFolder) setOpen(p => !p);
    else if (editable) setRenaming(true);
  };

  const commitRename = () => {
    if (!editable) return;
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
    const newNode = { ...node, label: `${node.label} 복사` };
    delete (newNode as any).id;
    mutators.addSibling(node.id, newNode);
    closeContextMenu();
  };

  return (
    <>
      <ItemWrapper module={(node.module ?? "default") as keyof typeof sidebarModules} active={isActive} onClick={handleClick} onContextMenu={handleContextMenu}>
        {editable && (
          <DeleteButton
            aria-label="delete"
            onClick={(e) => { e.stopPropagation(); if (confirm("삭제하시겠습니까?")) mutators.remove(node.id); }}
          >
            –
          </DeleteButton>
        )}
        {renaming ? (
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => {
              const composing = (e.nativeEvent as any)?.isComposing || (e as any).keyCode === 229;
              if (composing) return;
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setRenaming(false);
            }}
            onBlur={commitRename}
            autoFocus
            style={{ width: "100%", background: "transparent", color: "inherit", border: 0, outline: "none" }}
          />
        ) : (
          <>
            <Label onClick={(e) => { if (editable) { e.stopPropagation(); setRenaming(true); useDocsStore.setState({ selected: node.id }); } }}>{node.label}</Label>
            {node.module === "api" && node.method && (
              <MethodBadge method={node.method}>{node.method}</MethodBadge>
            )}
          </>
        )}
      </ItemWrapper>

      {renderChildren && isFolder && open && (node.childrenItems?.length ?? 0) > 0 && (
        <SubMenu>
          {node.childrenItems!.map(child => (
            <SidebarItem
              key={child.id}
              node={child}
              editable={editable}
              mutators={mutators}
              renderChildren={renderChildren}
            />
          ))}
        </SubMenu>
      )}

      {contextMenu && (
        <>
          <ContextMenuBackdrop onClick={closeContextMenu} />
          <ContextMenu style={{ top: contextMenu.y, left: contextMenu.x }}>
            <ContextMenuItem onClick={() => { setRenaming(true); closeContextMenu(); }}>
              이름 변경
            </ContextMenuItem>
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
                if (confirm("삭제하시겠습니까?")) mutators.remove(node.id);
                closeContextMenu();
              }}
              danger
            >
              삭제
            </ContextMenuItem>
          </ContextMenu>
        </>
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
  ${({ theme, module }) => sidebarModules[module].base({ theme })};
  ${({ theme, module, active }) => active && sidebarModules[module].active({ theme })};
`;

const Label = styled.span` flex: 1; `;

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
const SubMenu = styled.div` display: flex; flex-direction: column; margin-left: 16px; `;

const MethodBadge = styled.span<{ method: "GET" | "POST" | "DELETE" | "PUT" | "PATCH" }>`
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  background: ${({ method }) => {
    switch (method) {
      case "GET": return "#10B981";
      case "POST": return "#3B82F6";
      case "DELETE": return "#EF4444";
      case "PUT": return "#F59E0B";
      case "PATCH": return "#8B5CF6";
      default: return "#6B7280";
    }
  }};
  color: white;
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