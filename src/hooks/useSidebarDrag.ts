import { useState } from "react";
import { DragEndEvent, DragOverEvent, DragStartEvent, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import type { SidebarNode } from "@/components/ui/sidebarItem/types";
import { findParentId, removeNodeWithReturn, applySiblings } from "@/components/layout/treeUtils";
import { appendChild, insertAfter } from "@/components/layout/sidebarUtils";

type Node = SidebarNode & { id: string };

interface UseSidebarDragProps {
  effectiveItems: SidebarNode[];
  onChange: (items: SidebarNode[]) => void;
}

export const useSidebarDrag = ({ effectiveItems, onChange }: UseSidebarDragProps) => {
  const [overIntent, setOverIntent] = useState<{ id: string; mode: "sibling" | "child" } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,  // 더 엄격한 거리 제한
        delay: 100,    // 100ms 지연 추가
        tolerance: 5   // 허용 오차
      }
    })
  );

  const findNodeById = (list: Node[], id: string): Node | null => {
    for (const n of list) {
      if (n.id === id) return n;
      if (n.childrenItems) {
        const f = findNodeById(n.childrenItems as Node[], id);
        if (f) return f;
      }
    }
    return null;
  };

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

  const onDragStart = (evt: DragStartEvent) => {
    setOverIntent(null);
  };

  const onDragOver = (evt: DragOverEvent) => {
    const { over, active } = evt;
    if (!over) {
      setOverIntent(null);
      return;
    }
    const targetId = String(over.id);
    const target = findNodeById(effectiveItems as Node[], targetId);
    if (!target) {
      setOverIntent(null);
      return;
    }

    // 드래그되는 아이템 찾기
    const draggedItem = findNodeById(effectiveItems as Node[], String(active.id));

    // collapse 모듈 위에 드롭하려고 할 때, 드래그되는 아이템이 small이 아니면 자식 모드 차단
    if (target.module === "collapse") {
      const mode = draggedItem?.module === "small" ? "child" : "sibling";
      setOverIntent({ id: targetId, mode });
    } else {
      setOverIntent({ id: targetId, mode: "sibling" });
    }
  };


  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setOverIntent(null);
    if (!over || active.id === over.id) return;

    const targetId = String(over.id);

    // 1) 자식으로 넣기 (그룹 위에 드롭한 경우)
    if (overIntent?.id === targetId && overIntent.mode === "child") {
      const { tree: afterRemove, removed } =
        removeNodeWithReturn(effectiveItems as any, String(active.id));
      if (!removed) return;

      // small 모듈이 아니면 자식으로 추가 차단
      if (removed.module !== "small") return;

      const next = appendChild(afterRemove as any, targetId, removed as any);
      onChange(next as any);
      return;
    }

    const fromParent = findParentId(effectiveItems as any, String(active.id));
    const toParent   = findParentId(effectiveItems as any, String(over.id));

    // 2) 다른 부모로 이동 (형제로 삽입)
    if (fromParent !== toParent) {
      const { tree: afterRemove, removed } =
        removeNodeWithReturn(effectiveItems as any, String(active.id));
      if (!removed) return;
      const next = insertAfter(afterRemove as any, targetId, removed as any);
      onChange(next as any);
      return;
    }

    // 3) 같은 부모 내에서 정렬
    const siblings = getSiblings(fromParent);
    const fromIdx = siblings.findIndex(s => s.id === active.id);
    const toIdx   = siblings.findIndex(s => s.id === over.id);
    if (fromIdx < 0 || toIdx < 0) return;
    const moved = arrayMove(siblings, fromIdx, toIdx);
    const next  = applySiblings(effectiveItems as any, fromParent, moved as any);
    onChange(next as any);
  };

  return {
    sensors,
    onDragStart,
    onDragOver,
    onDragEnd,
    overIntent,
  };
};