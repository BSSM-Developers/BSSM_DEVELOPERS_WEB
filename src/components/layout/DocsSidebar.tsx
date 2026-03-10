"use client";

import styled from "@emotion/styled";
import { useEffect, useState, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { SidebarItem } from "@/components/ui/sidebarItem/SidebarItem";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { DndContext, useDroppable, DragOverlay } from "@dnd-kit/core";
import { SortableContext, useSortable } from "@dnd-kit/sortable";
import { verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSidebarDrag } from "@/hooks/useSidebarDrag";
import { createMutators, type Mutators } from "@/components/layout/sidebarUtils";
import { useConfirm } from "@/hooks/useConfirm";
import { findNodeById } from "@/components/layout/treeUtils";

export interface SidebarModuleOption {
  label: string;
  module: "default" | "collapse" | "main_title" | "api";
  method?: "GET" | "POST" | "DELETE" | "PUT" | "PATCH" | "UPDATE";
}

const DEFAULT_MODULE_OPTIONS: SidebarModuleOption[] = [
  { label: "기본", module: "default" },
  { label: "메인", module: "main_title" },
  { label: "그룹", module: "collapse" },
  { label: "API(GET)", module: "api", method: "GET" as const },
  { label: "API(POST)", module: "api", method: "POST" as const },
  { label: "API(DELETE)", module: "api", method: "DELETE" as const },
  { label: "API(PUT)", module: "api", method: "PUT" as const },
  { label: "API(PATCH)", module: "api", method: "PATCH" as const },
  { label: "API(UPDATE)", module: "api", method: "UPDATE" as const },
] as const;

type DocsSidebarProps = {
  items?: SidebarNode[];
  editable?: boolean;
  onChange?: (next: SidebarNode[]) => void;
  moduleOptions?: SidebarModuleOption[];
  onRequestAddApi?: (intent: { mode: "sibling" | "child"; targetId: string | null }) => void;
  disableApiRename?: boolean;
};

type Node = SidebarNode & { id: string };

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  flex: 1;
`;

const Nav = styled.nav`
  padding: 24px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;

const RootZone = styled.div<{ isOver: boolean }>`
  flex: 1;
  min-height: 100px;
  margin: 0 16px 24px;
  border-radius: 8px;
  transition: all 0.2s ease;
  ${({ isOver, theme }) => isOver && `
    background: rgba(22, 51, 92, 0.05);
    border: 2px dashed ${theme.colors.bssmDarkBlue || "#16335C"};
  `}
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

const PickerGroup = styled.div<{ anchor: { x: number; y: number } }>`
  position: fixed;
  top: ${({ anchor }) => anchor.y}px;
  left: ${({ anchor }) => anchor.x}px;
  display: flex;
  gap: 8px;
  align-items: flex-start;
  z-index: 1000;
`;

const Picker = styled.div`
  z-index: 1000;
  background: #fff;
  border: 1px solid #E5E7EB;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  padding: 8px;
  width: 140px;
  max-height: 250px;
  overflow-y: auto;
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

const PickerItemContent = styled.span`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const PickerArrow = styled.span`
  color: #9CA3AF;
  font-size: 12px;
`;

const DropTargetWrapper = styled.div<{
  isChildTarget: boolean;
  isSiblingTarget: boolean;
}>`
  position: relative;
  border-radius: 8px;
  transition: all 0.2s ease;

  ${({ isChildTarget, theme }) => isChildTarget && `
    background: rgba(22, 51, 92, 0.05);
    outline: 2px solid ${theme.colors.bssmDarkBlue || "#16335C"};
    outline-offset: -2px;
    box-shadow: 0 0 0 4px rgba(22, 51, 92, 0.1);
  `}
`;

const ChildDropIndicator = styled.div`
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  background: ${({ theme }) => theme.colors.bssmDarkBlue || "#16335C"};
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
  pointer-events: none;
  z-index: 10;

  &::before {
    content: "그룹에 넣기";
  }
`;

const SiblingDropIndicator = styled.div`
  position: absolute;
  bottom: -2px;
  left: 0;
  right: 0;
  height: 3px;
  background: ${({ theme }) => theme.colors.bssmDarkBlue || "#16335C"};
  border-radius: 2px;
  pointer-events: none;
  z-index: 10;
`;

const SortableNode = ({
  node,
  editable,
  mutators,
  overIntent,
  depth = 0,
  disableApiRename = false,
}: {
  node: Node;
  editable: boolean;
  mutators: Mutators;
  overIntent?: { id: string; mode: "sibling" | "child" } | null;
  depth?: number;
  disableApiRename?: boolean;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: node.id,
    disabled: !editable,
  });

  const isDropTarget = overIntent?.id === node.id;
  const isChildTarget = isDropTarget && overIntent?.mode === "child";
  const isSiblingTarget = isDropTarget && overIntent?.mode === "sibling";

  const style: React.CSSProperties = {
    transform: isChildTarget ? undefined : transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition: isChildTarget ? "none" : transition,
    zIndex: isDragging ? 1000 : undefined,
    opacity: isDragging ? 0.3 : 1,
    marginLeft: depth > 0 ? 16 : 0,
    paddingLeft: depth > 0 ? 8 : 0,
    borderLeft: depth > 0 ? "2px solid #E5E7EB" : "none",
    marginTop: depth > 0 ? 4 : 0,
  };
  const dndInteractionProps = editable ? { ...attributes, ...listeners } : undefined;

  return (
    <div ref={setNodeRef} style={style} {...dndInteractionProps} data-node-id={node.id}>
      <DropTargetWrapper
        isChildTarget={isChildTarget}
        isSiblingTarget={isSiblingTarget}
      >
        <SidebarItem
          node={node}
          editable={editable}
          mutators={mutators}
          renderChildren={false}
          disableApiRename={disableApiRename}
        />
        {isChildTarget && <ChildDropIndicator />}
        {isSiblingTarget && <SiblingDropIndicator />}
      </DropTargetWrapper>
      {node.childrenItems?.length ? (
        <SortableContext items={(node.childrenItems as Node[]).map(c => c.id)} strategy={verticalListSortingStrategy}>
          {(node.childrenItems as Node[]).map(child => (
            <SortableNode
              key={child.id}
              node={child}
              editable={editable}
              mutators={mutators}
              overIntent={overIntent}
              depth={depth + 1}
              disableApiRename={disableApiRename}
            />
          ))}
        </SortableContext>
      ) : null}
    </div>
  );
};

export function DocsSidebar({
  items = [],
  editable = false,
  onChange,
  moduleOptions = DEFAULT_MODULE_OPTIONS,
  onRequestAddApi,
  disableApiRename = false,
}: DocsSidebarProps) {
  const { confirm, ConfirmDialog } = useConfirm();
  const propItems = useMemo(() => Array.isArray(items) ? items : [], [items]);
  const [localItems, setLocalItems] = useState<SidebarNode[]>([]);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    setLocalItems(propItems);
  }, [propItems]);

  const effectiveItems = useMemo(() => isClient ? (editable && !onChange ? localItems : propItems) : [], [isClient, editable, onChange, localItems, propItems]);
  const [picker, setPicker] = useState<{
    open: boolean;
    anchor: { x: number; y: number } | null;
    mode: "sibling" | "child";
    targetId: string | null;
  }>({ open: false, anchor: null, mode: "sibling", targetId: null });
  const [apiMethodOpen, setApiMethodOpen] = useState(false);

  const groupedModuleOptions = useMemo(() => {
    const apiOptions = moduleOptions.filter((option) => option.module === "api" && option.method);
    const plainOptions = moduleOptions.filter((option) => option.module !== "api");
    return { apiOptions, plainOptions };
  }, [moduleOptions]);

  const openPicker = (e: React.MouseEvent, mode: "sibling" | "child", targetId: string | null) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setApiMethodOpen(false);
    setPicker({ open: true, anchor: { x: rect.right + 8, y: rect.top }, mode, targetId });
  };

  const closePicker = useCallback(() => {
    setApiMethodOpen(false);
    setPicker((prev) => ({ ...prev, open: false }));
  }, []);

  useEffect(() => {
    if (!picker.open) return;
    const handleClick = () => { closePicker(); };
    window.addEventListener("mousedown", handleClick);
    return () => window.removeEventListener("mousedown", handleClick);
  }, [picker.open, closePicker]);

  const { sensors, onDragStart, onDragOver, onDragEnd, overIntent, activeId } = useSidebarDrag({
    editable,
    effectiveItems,
    onChange: onChange || setLocalItems,
  });

  const baseMutators = useMemo(() => createMutators(effectiveItems, onChange, setLocalItems), [effectiveItems, onChange]);

  const mutators: Mutators = useMemo(() => ({
    ...baseMutators,
    remove: async (id: string) => {
      const isConfirmed = await confirm({
        title: "요소 삭제",
        message: "정말 이 요소를 삭제하시겠습니까?",
        confirmText: "삭제",
        cancelText: "취소"
      });
      if (isConfirmed) baseMutators.remove(id);
    }
  }), [baseMutators, confirm]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!editable) return;
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
    if (e.key === "n" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      const baseId = effectiveItems[effectiveItems.length - 1]?.id ?? "";
      mutators.addSibling(baseId, { label: "새 항목", module: "default" });
    }
  }, [editable, effectiveItems, mutators]);

  useEffect(() => {
    if (editable) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [editable, handleKeyDown]);

  const onPickModule = (opt: SidebarModuleOption) => {
    if (opt.module === "api" && onRequestAddApi) {
      onRequestAddApi({ mode: picker.mode, targetId: picker.targetId });
      closePicker();
      return;
    }

    const node: SidebarNode = { id: crypto.randomUUID(), label: opt.label, module: opt.module, childrenItems: [] };
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
      <SidebarContainer>
        <Nav>
          <SortableContext items={effectiveItems.map((n: Node) => n.id)}>
            {effectiveItems.map((node: Node) => (
              <SortableNode
                key={node.id}
                node={node}
                editable={editable}
                mutators={mutators}
                overIntent={overIntent}
                disableApiRename={disableApiRename}
              />
            ))}
          </SortableContext>
          {editable && (
            <AddButton onClick={(e) => openPicker(e, "sibling", effectiveItems[effectiveItems.length - 1]?.id ?? null)}>
              +
            </AddButton>
          )}
        </Nav>
        {editable && <RootDropZone />}
      </SidebarContainer>

      {isClient && typeof document !== "undefined" && createPortal(
        <DragOverlay dropAnimation={null}>
          {activeId ? (
            <div style={{ opacity: 0.8, cursor: "grabbing" }}>
              <SidebarItem
                key={activeId}
                node={findNodeById(effectiveItems as Node[], activeId) as Node}
                editable={false}
                mutators={mutators}
                renderChildren={false}
                disableApiRename={disableApiRename}
              />
            </div>
          ) : null}
        </DragOverlay>,
        document.body
      )}

      {isClient && typeof document !== "undefined" && picker.open && picker.anchor && createPortal(
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 999 }}
            onClick={closePicker}
          />
          <PickerGroup
            anchor={picker.anchor}
            onMouseDown={(e) => e.stopPropagation()}
            onMouseLeave={() => setApiMethodOpen(false)}
          >
            <Picker>
              {groupedModuleOptions.plainOptions.map((opt) => (
                <PickerItem
                  key={opt.label}
                  onClick={() => onPickModule(opt)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  {opt.label}
                </PickerItem>
              ))}
              {groupedModuleOptions.apiOptions.length > 0 && (
                <PickerItem
                  onMouseEnter={() => setApiMethodOpen(true)}
                  onClick={() => setApiMethodOpen((prev) => !prev)}
                >
                  <PickerItemContent>
                    API
                    <PickerArrow>▶</PickerArrow>
                  </PickerItemContent>
                </PickerItem>
              )}
            </Picker>
            {apiMethodOpen && groupedModuleOptions.apiOptions.length > 0 && (
              <Picker>
                {groupedModuleOptions.apiOptions.map((opt) => (
                  <PickerItem
                    key={`${opt.module}-${opt.method ?? opt.label}`}
                    onClick={() => onPickModule(opt)}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#F3F4F6")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                  >
                    {opt.method ?? opt.label}
                  </PickerItem>
                ))}
              </Picker>
            )}
          </PickerGroup>
        </>,
        document.body
      )
      }
      {ConfirmDialog}
    </DndContext>
  );
}

function RootDropZone() {
  const { isOver, setNodeRef } = useDroppable({
    id: "root-drop-zone",
  });
  return (
    <RootZone
      ref={setNodeRef}
      isOver={isOver}
    />
  );
}
