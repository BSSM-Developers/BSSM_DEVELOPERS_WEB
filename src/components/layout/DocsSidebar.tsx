"use client";

import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { SidebarItem } from "@/components/ui/sidebarItem/SidebarItem";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";

const insertAfter = (list: SidebarNode[], targetId: string, node: Omit<SidebarNode,"id">): SidebarNode[] => {
  const id = crypto.randomUUID();
  const walk = (xs: SidebarNode[]): SidebarNode[] => {
    const i = xs.findIndex(x => x.id === targetId);
    if (i >= 0) {
      const copy = [...xs];
      copy.splice(i + 1, 0, { id, ...node });
      return copy;
    }
    return xs.map(x => ({
      ...x,
      childrenItems: x.childrenItems ? walk(x.childrenItems) : undefined,
    }));
  };
  return walk(list);
};

const appendChild = (list: SidebarNode[], parentId: string, node: Omit<SidebarNode,"id">): SidebarNode[] => {
  const id = crypto.randomUUID();
  const walk = (xs: SidebarNode[]): SidebarNode[] =>
    xs.map(x =>
      x.id === parentId
        ? { ...x, childrenItems: [ ...(x.childrenItems ?? []), { id, ...node } ] }
        : { ...x, childrenItems: x.childrenItems ? walk(x.childrenItems) : undefined }
    );
  return walk(list);
};

const renameNode = (list: SidebarNode[], id: string, label: string): SidebarNode[] =>
  list.map(x =>
    x.id === id
      ? { ...x, label }
      : { ...x, childrenItems: x.childrenItems ? renameNode(x.childrenItems, id, label) : undefined }
  );

const removeNode = (list: SidebarNode[], id: string): SidebarNode[] =>
  list
    .filter(x => x.id !== id)
    .map(x => ({ ...x, childrenItems: x.childrenItems ? removeNode(x.childrenItems, id) : undefined }));

type DocsSidebarProps = {
  items?: SidebarNode[];
  selected?: string | null;
  onSelect?: (label: string) => void;
  editable?: boolean;
  onChange?: (next: SidebarNode[]) => void;
};

export function DocsSidebar({ 
  items = [],
  selected = null, 
  onSelect, editable = false, onChange
 }: DocsSidebarProps) {
  const propItems = Array.isArray(items) ? items : [];
  const [localItems, setLocalItems] = useState<SidebarNode[]>(propItems);
  useEffect(() => { setLocalItems(propItems); }, [propItems]);
  const effectiveItems = editable && !onChange ? localItems : propItems;
  const safeOnSelect = onSelect ?? (() => {});
  const mutators = {
    addSibling: (targetId: string, node: Omit<SidebarNode,"id">) =>
      (onChange ? onChange : setLocalItems)(insertAfter(effectiveItems, targetId, node)),
    addChild: (parentId: string, node: Omit<SidebarNode,"id">) =>
      (onChange ? onChange : setLocalItems)(appendChild(effectiveItems, parentId, node)),
    rename: (id: string, label: string) =>
      (onChange ? onChange : setLocalItems)(renameNode(effectiveItems, id, label)),
    remove: (id: string) =>
      (onChange ? onChange : setLocalItems)(removeNode(effectiveItems, id)),
  };

  return (
    <Nav>
      {effectiveItems.map(node => (
        <SidebarItem
          key={(node as any).id ?? node.label}
          node={node}
          selected={selected}
          onSelect={safeOnSelect}
          editable={editable}
          mutators={mutators}
        />
      ))}
      {editable && (
        <AddButton onClick={() => mutators.addSibling(effectiveItems[effectiveItems.length - 1]?.id ?? "", { label: "새 항목", module: "small" })}>
          +
        </AddButton>
      )}
    </Nav>
  );
}

const Nav = styled.nav`
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const AddButton = styled.button`
  margin-top: 12px;
  height: 51px;
  border-radius: 12px;
  border: 2px solid ${({ theme }) => theme.colors.bssmDarkBlue};
  color: ${({ theme }) => theme.colors.bssmDarkBlue};
  font-size: 24px;
  background: transparent;
  cursor: pointer;
`;