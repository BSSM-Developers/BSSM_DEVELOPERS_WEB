"use client";

import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import { SidebarItem } from "@/components/ui/sidebarItem/SidebarItem";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { DndContext, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { findParentId, removeNodeWithReturn, applySiblings } from "@/components/layout/treeUtils";

const MODULE_OPTIONS = [
  { label: "기본", module: "default" },
  { label: "그룹", module: "collapse" },
  { label: "메인", module: "main" },
  { label: "스몰", module: "small" },
  { label: "API(GET)", module: "api", method: "GET" as const },
] as const;

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
  editable?: boolean;
  onChange?: (next: SidebarNode[]) => void;
};

const SortableNode = ({ node, editable, mutators }: { node: any; editable: boolean; mutators: any }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });
  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 1000 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <SidebarItem node={node} editable={editable} mutators={mutators} renderChildren={false} />
      {node.childrenItems?.length ? (
        <div style={{ marginLeft: 16 }}>
          <SortableContext items={node.childrenItems.map((c: any) => c.id)}>
            {node.childrenItems.map((child: any) => (
              <SortableNode key={child.id} node={child} editable={editable} mutators={mutators} />
            ))}
          </SortableContext>
        </div>
      ) : null}
    </div>
  );
}

export function DocsSidebar({ 
  items = [],
  editable = false, onChange
 }: DocsSidebarProps) {
  const propItems = Array.isArray(items) ? items : [];
  const [localItems, setLocalItems] = useState<SidebarNode[]>(propItems);
  useEffect(() => { setLocalItems(propItems); }, [propItems]);
  const effectiveItems = editable && !onChange ? localItems : propItems;
  const [picker, setPicker] = useState<{
    open: boolean;
    anchor: { x: number; y: number } | null;
    mode: "sibling" | "child";
    targetId: string | null;
  }>({ open: false, anchor: null, mode: "sibling", targetId: null });

  const openPicker = (e: React.MouseEvent, mode: "sibling" | "child", targetId: string | null) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setPicker({ open: true, anchor: { x: rect.right + 8, y: rect.top }, mode, targetId });
  };

  const closePicker = () => setPicker(p => ({ ...p, open: false }));

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const getSiblings = (parentId: string | null): (SidebarNode & { id: string })[] => {
    if (parentId === null) return (effectiveItems as any);
    const stack: any[] = [...(effectiveItems as any)];
    while (stack.length) {
      const n = stack.pop();
      if (n.id === parentId) return (n.childrenItems ?? []) as any;
      if (n.childrenItems) stack.push(...n.childrenItems);
    }
    return [] as any;
  };

  const onDragEnd = (_evt: DragEndEvent) => {
    const { active, over } = _evt;
    if (!over || active.id === over.id) return;

    const fromParent = findParentId(effectiveItems as any, String(active.id));
    const toParent = findParentId(effectiveItems as any, String(over.id));
    if (fromParent !== toParent) return;

    const siblings = getSiblings(fromParent);
    const fromIdx = siblings.findIndex((s) => s.id === active.id);
    const toIdx = siblings.findIndex((s) => s.id === over.id);
    if (fromIdx < 0 || toIdx < 0) return;
    
    const moved = arrayMove(siblings, fromIdx, toIdx) as any;
    const next = applySiblings(effectiveItems as any, fromParent, moved as any) as any;
    (onChange ? onChange : setLocalItems)(next);
  };

  const onPickModule = (opt: { label: string; module: any; method?: "GET" | "POST" | "DELETE" }) => {
    const node: any = { label: opt.label, module: opt.module };
    if (opt.method) node.method = opt.method;
    if (picker.mode === "child" && picker.targetId) {
      mutators.addChild(picker.targetId, node);
    } else {
      const baseId = picker.targetId ?? effectiveItems[effectiveItems.length - 1]?.id ?? "";
      mutators.addSibling(baseId, node);
    }
    closePicker();
  };

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
    <Nav>
        <SortableContext items={effectiveItems.map((n: any) => n.id)}>
          {effectiveItems.map((node: any) => (
            <SortableNode key={node.id} node={node} editable={editable} mutators={mutators} />
          ))}
        </SortableContext>
        {editable && (
          <AddButton onClick={(e) => openPicker(e, "sibling", effectiveItems[effectiveItems.length - 1]?.id ?? null)}>
            +
          </AddButton>
        )}
        {picker.open && <Backdrop onClick={closePicker} />}
        {picker.open && picker.anchor && (
          <Picker anchor={picker.anchor}>
            {MODULE_OPTIONS.map((opt) => (
              <PickerItem
                key={opt.label}
                onClick={() => onPickModule(opt as any)}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                {opt.label}
              </PickerItem>
            ))}
          </Picker>
        )}
        
    </Nav>
    </DndContext>
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

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 999;
  background: transparent;
`;

const Picker = styled.div`
  position: fixed;
  top: ${({ anchor }: { anchor: { x: number; y: number } }) => anchor.y}px;
  left: ${({ anchor }: { anchor: { x: number; y: number } }) => anchor.x}px;
  z-index: 1000;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 8px;
  width: 140px;
`;

const PickerItem = styled.button`
  width: 100%;
  text-align: left;
  padding: 8px 10px;
  background: transparent;
  border: 0;
  cursor: pointer;
  color: #4B5563;
  border-radius: 8px;
`;