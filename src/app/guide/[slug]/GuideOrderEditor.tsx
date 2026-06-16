"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import styled from "@emotion/styled";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GuideSummary } from "../data";

interface Props {
  guides: GuideSummary[];
}

function SortableItem({ guide, index }: { guide: GuideSummary; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: guide.id });

  return (
    <Item
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
    >
      <Handle {...listeners} {...attributes}>⠿</Handle>
      <Num>{index + 1}</Num>
      <Label>{guide.title}</Label>
    </Item>
  );
}

export function GuideOrderEditor({ guides }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<GuideSummary[]>(guides);
  const [saving, setSaving] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((prev) => {
      const oldIndex = prev.findIndex((g) => g.id === active.id);
      const newIndex = prev.findIndex((g) => g.id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const handleOpen = () => {
    setItems(guides);
    setOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/dev-content/guide", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: items.map((g) => g.id) }),
      });
      if (!res.ok) throw new Error("저장 실패");
      setOpen(false);
      router.refresh();
    } catch {
      alert("순서 저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Trigger type="button" onClick={handleOpen}>순서 변경</Trigger>

      {open && (
        <Overlay onClick={() => setOpen(false)}>
          <Panel onClick={(e) => e.stopPropagation()}>
            <PanelHead>
              <strong>가이드 순서 변경</strong>
              <CloseBtn type="button" onClick={() => setOpen(false)}>✕</CloseBtn>
            </PanelHead>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={items.map((g) => g.id)} strategy={verticalListSortingStrategy}>
                <List>
                  {items.map((g, i) => (
                    <SortableItem key={g.id} guide={g} index={i} />
                  ))}
                </List>
              </SortableContext>
            </DndContext>

            <Actions>
              <CancelBtn type="button" onClick={() => setOpen(false)} disabled={saving}>취소</CancelBtn>
              <SaveBtn type="button" onClick={() => void handleSave()} disabled={saving}>
                {saving ? "저장 중..." : "저장"}
              </SaveBtn>
            </Actions>
          </Panel>
        </Overlay>
      )}
    </>
  );
}

const FONT = '"Spoqa Han Sans Neo", sans-serif';
const NAVY = "#16335C";

const Trigger = styled.button`
  height: 36px;
  padding: 0 14px;
  border-radius: 8px;
  border: 1px solid #d9dee7;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: #2f5fd4;
  font-size: 14px;
  font-weight: 600;
  font-family: ${FONT};
  background: #fff;
  cursor: pointer;
  &:hover { background: #f5f7ff; }
`;

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9000;
  background: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Panel = styled.div`
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.25);
  padding: 24px;
  width: 360px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 16px;
  font-family: ${FONT};
`;

const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #8b95a1;
  font-size: 16px;
  cursor: pointer;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e5e8eb;
  border-radius: 10px;
  background: #fff;
  cursor: default;
`;

const Handle = styled.span`
  color: #b0b8c1;
  font-size: 16px;
  cursor: grab;
  flex-shrink: 0;
  touch-action: none;
  &:active { cursor: grabbing; }
`;

const Num = styled.span`
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: ${NAVY};
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const Label = styled.span`
  flex: 1;
  font-size: 14px;
  font-weight: 500;
  color: #191f28;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;
`;

const BaseBtn = styled.button`
  flex: 1;
  height: 40px;
  border-radius: 8px;
  border: none;
  font-size: 14px;
  font-weight: 700;
  font-family: ${FONT};
  cursor: pointer;
  &:disabled { opacity: 0.6; cursor: not-allowed; }
`;

const CancelBtn = styled(BaseBtn)`
  background: #f2f4f6;
  color: #4e5968;
`;

const SaveBtn = styled(BaseBtn)`
  background: ${NAVY};
  color: #fff;
`;
