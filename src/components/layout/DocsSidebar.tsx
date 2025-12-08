"use client";

import styled from "@emotion/styled";
import { useEffect, useState, useCallback } from "react";
import { SidebarItem } from "@/components/ui/sidebarItem/SidebarItem";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { DndContext } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSidebarDrag } from "@/hooks/useSidebarDrag";
import { createMutators, type Mutators } from "@/components/layout/sidebarUtils";

const MODULE_OPTIONS = [
  { label: "기본", module: "default" },
  { label: "그룹", module: "collapse" },
  { label: "메인", module: "main" },
  { label: "스몰", module: "small" },
  { label: "API(GET)", module: "api", method: "GET" as const },
  { label: "API(POST)", module: "api", method: "POST" as const },
  { label: "API(DELETE)", module: "api", method: "DELETE" as const },
  { label: "API(PUT)", module: "api", method: "PUT" as const },
  { label: "API(PATCH)", module: "api", method: "PATCH" as const },
] as const;



type DocsSidebarProps = {
  items?: SidebarNode[];
  editable?: boolean;
  onChange?: (next: SidebarNode[]) => void;
};

type Node = SidebarNode & { id: string };

const SortableNode = ({
  node,
  editable,
  mutators,
  overIntent
}: {
  node: Node;
  editable: boolean;
  mutators: Mutators;
  overIntent?: { id: string; mode: "sibling" | "child" } | null;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: node.id });

  const isDropTarget = overIntent?.id === node.id;
  const isChildTarget = isDropTarget && overIntent?.mode === "child";
  const isSiblingTarget = isDropTarget && overIntent?.mode === "sibling";

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    zIndex: isDragging ? 1000 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners} data-node-id={node.id}>
      <DropTargetWrapper
        isChildTarget={isChildTarget}
        isSiblingTarget={isSiblingTarget}
      >
        <SidebarItem node={node} editable={editable} mutators={mutators} renderChildren={false} />
        {isChildTarget && <ChildDropIndicator />}
        {isSiblingTarget && <SiblingDropIndicator />}
      </DropTargetWrapper>
      {node.childrenItems?.length ? (
        <SortableContext items={(node.childrenItems as Node[]).map(c => c.id)} strategy={verticalListSortingStrategy}>
          {(node.childrenItems as Node[]).map(child => (
            <SortableNode key={child.id} node={child} editable={editable} mutators={mutators} overIntent={overIntent} />
          ))}
        </SortableContext>
      ) : null}
    </div>
  );
};

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

  const { sensors, onDragStart, onDragOver, onDragEnd, overIntent } = useSidebarDrag({
    effectiveItems,
    onChange: onChange || setLocalItems,
  });

  const mutators = createMutators(effectiveItems, onChange, setLocalItems);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!editable) return;

    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

    switch (e.key) {
      case 'Delete':
        // TODO: 현재 선택된 아이템 삭제 (추후 selection 상태 관리 필요)
        break;
      case 'n':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          const baseId = effectiveItems[effectiveItems.length - 1]?.id ?? "";
          mutators.addSibling(baseId, { label: "새 항목", module: "default" });
        }
        break;
      case 'd':
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          // TODO: 현재 선택된 아이템 복제
        }
        break;
    }
  }, [editable, effectiveItems, mutators]);

  useEffect(() => {
    if (editable) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [editable, handleKeyDown]);

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
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver}>
    <Nav>
        <SortableContext items={effectiveItems.map((n: any) => n.id)}>
          {effectiveItems.map((node: any) => (
            <SortableNode key={node.id} node={node} editable={editable} mutators={mutators} overIntent={overIntent} />
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

const DropTargetWrapper = styled.div<{
  isChildTarget: boolean;
  isSiblingTarget: boolean;
}>`
  position: relative;
  border-radius: 8px;
  transition: all 0.2s ease;

  ${({ isChildTarget }) => isChildTarget && `
    background: rgba(59, 130, 246, 0.1);
    border: 2px solid #3B82F6;
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
  `}

  ${({ isSiblingTarget }) => isSiblingTarget && `
    background: rgba(16, 185, 129, 0.1);
    border: 2px solid #10B981;
  `}
`;

const ChildDropIndicator = styled.div`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  background: #3B82F6;
  color: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  pointer-events: none;
  z-index: 10;

  &::before {
    content: "자식으로 추가";
  }
`;

const SiblingDropIndicator = styled.div`
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 4px;
  background: #10B981;
  border-radius: 2px;
  pointer-events: none;
  z-index: 10;

  &::after {
    content: "형제로 추가";
    position: absolute;
    bottom: 6px;
    right: 8px;
    background: #10B981;
    color: white;
    padding: 2px 6px;
    border-radius: 4px;
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;
  }
`;