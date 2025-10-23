"use client";

import { useState } from "react";
import styled from "@emotion/styled";
import { sidebarModules } from "./modules";
import type { SidebarNode } from "./types";

type Mutators = {
  addSibling: (targetId: string, node: Omit<SidebarNode,"id">) => void;
  addChild: (parentId: string, node: Omit<SidebarNode,"id">) => void;
  rename: (id: string, label: string) => void;
  remove: (id: string) => void;
};

type SidebarItemProps = {
  node: SidebarNode;
  selected: string | null;
  onSelect: (label: string) => void;
  editable: boolean;
  mutators: Mutators;
};

export function SidebarItem({ node, selected, onSelect, editable, mutators }: SidebarItemProps) {
  const [open, setOpen] = useState(true);
  const [renaming, setRenaming] = useState(false);
  const [label, setLabel] = useState(node.label);

  const isFolder = node.module === "collapse";
  const childHasActive = (node.childrenItems ?? []).some(c => c.label === selected);
  const isActive = selected === node.label || childHasActive;

  const handleClick = () => {
    if (isFolder) setOpen(p => !p);
    else if (editable) setRenaming(true);
    else onSelect(node.label);
  };

  const commitRename = () => {
    if (!editable) return;
    if (label.trim() && label !== node.label) mutators.rename(node.id, label.trim());
    setRenaming(false);
  };

  return (
    <>
      <ItemWrapper module={(node.module ?? "default") as keyof typeof sidebarModules} active={isActive} onClick={handleClick}>
        {editable && (
          <DeleteButton
            aria-label="delete"
            onClick={(e) => { e.stopPropagation(); if (confirm("삭제할까요?")) mutators.remove(node.id); }}
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
          <Label onClick={(e) => { if (editable) { e.stopPropagation(); setRenaming(true); } }}>{node.label}</Label>
        )}
      </ItemWrapper>

      {isFolder && open && (node.childrenItems?.length ?? 0) > 0 && (
        <SubMenu>
          {node.childrenItems!.map(child => (
            <SidebarItem
              key={child.id}
              node={child}
              selected={selected}
              onSelect={onSelect}
              editable={editable}
              mutators={mutators}
            />
          ))}
        </SubMenu>
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