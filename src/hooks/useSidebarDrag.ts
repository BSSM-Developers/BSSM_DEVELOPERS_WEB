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
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overIntent, setOverIntent] = useState<{ id: string; mode: "sibling" | "child" } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 10,
        delay: 100,
        tolerance: 5
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

  const getSiblings = (parentId: string | null): SidebarNode[] => {
    if (parentId === null) return effectiveItems;
    const stack: SidebarNode[] = [...effectiveItems];
    while (stack.length) {
      const n = stack.pop();
      if (!n) continue;
      if (n.id === parentId) return n.childrenItems ?? [];
      if (n.childrenItems) stack.push(...n.childrenItems);
    }
    return [];
  };

  const onDragStart = (evt: DragStartEvent) => {
    setActiveId(String(evt.active.id));
    setOverIntent(null);
  };

  const onDragOver = (evt: DragOverEvent) => {
    const { over, active } = evt;
    if (!over) {
      setOverIntent(null);
      return;
    }
    const targetId = String(over.id);

    // root drop zone handling
    if (targetId === 'root-drop-zone') {
      setOverIntent({ id: targetId, mode: "sibling" });
      return;
    }

    const target = findNodeById(effectiveItems as Node[], targetId);
    if (!target) {
      setOverIntent(null);
      return;
    }

    const draggedItem = findNodeById(effectiveItems as Node[], String(active.id));
    const tMod = target.module;
    const dMod = draggedItem?.module;
    let mode: "sibling" | "child" = "sibling";

    if (tMod === "main" && dMod !== "main") {
      mode = "child";
    } else if (tMod === "collapse" && dMod !== "main" && dMod !== "collapse") {
      mode = "child";
    }

    setOverIntent({ id: targetId, mode });
  };


  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveId(null);
    setOverIntent(null);
    if (!over || active.id === over.id) return;

    const targetId = String(over.id);

    // root-drop-zone: push to very end of root level
    if (targetId === 'root-drop-zone') {
      const { tree: afterRemove, removed } = removeNodeWithReturn(effectiveItems, String(active.id));
      if (!removed) return;
      const next = [...afterRemove, removed];
      onChange(next);
      return;
    }

    if (overIntent?.id === targetId && overIntent.mode === "child") {
      const { tree: afterRemove, removed } =
        removeNodeWithReturn(effectiveItems, String(active.id));
      if (!removed) return;

      const rMod = removed.module;
      const targetNode = findNodeById(effectiveItems as Node[], targetId);
      const tMod = targetNode?.module;

      let canAddChild = false;
      if (tMod === "main" && rMod !== "main") canAddChild = true;
      if (tMod === "collapse" && rMod !== "main" && rMod !== "collapse") canAddChild = true;

      if (!canAddChild) return;

      const next = appendChild(afterRemove, targetId, removed);
      onChange(next);
      return;
    }

    const fromParent = findParentId(effectiveItems, String(active.id));
    const toParent = findParentId(effectiveItems, String(over.id));

    if (fromParent !== toParent) {
      const { tree: afterRemove, removed } =
        removeNodeWithReturn(effectiveItems, String(active.id));
      if (!removed) return;
      const next = insertAfter(afterRemove, targetId, removed);
      onChange(next);
      return;
    }

    const siblings = getSiblings(fromParent);
    const fromIdx = siblings.findIndex(s => String(s.id) === String(active.id));
    const toIdx = siblings.findIndex(s => String(s.id) === String(over.id));
    if (fromIdx < 0 || toIdx < 0) return;
    const moved = arrayMove(siblings, fromIdx, toIdx);
    const next = applySiblings(effectiveItems, fromParent, moved);
    onChange(next);
  };

  return {
    sensors,
    onDragStart,
    onDragOver,
    onDragEnd,
    activeId,
    overIntent,
  };
};