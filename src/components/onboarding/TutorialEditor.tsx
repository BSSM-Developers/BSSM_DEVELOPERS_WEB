"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";
import { usePathname } from "next/navigation";
import type { TutorialStep } from "./Spotlight";
import {
  getStepsForPath,
  saveStepsForPath,
  resetPath,
  normalizePath,
} from "@/lib/tutorialStore";
import { getRegistrySteps } from "@/lib/tutorialRegistry";
import { buildSelector, isUnique } from "@/lib/domSelector";

type Mode = "list" | "picking" | "text";

// dev 편집 패널이 자기 자신을 대상으로 잡지 않도록 식별용 속성
const EDITOR_ATTR = "data-tutorial-editor";

export function TutorialEditor() {
  const pathname = usePathname();
  const pathKey = useMemo(() => normalizePath(pathname || "/"), [pathname]);

  const [mounted, setMounted] = useState(false);
  const [mode, setMode] = useState<Mode>("list");
  const [steps, setSteps] = useState<TutorialStep[]>([]);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 작성 중 임시 스텝
  const [draftSelector, setDraftSelector] = useState<string | null>(null);
  const [draftRect, setDraftRect] = useState<DOMRect | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    setSteps(getStepsForPath(pathKey, getRegistrySteps(pathKey)));
  }, [pathKey]);

  const persist = (next: TutorialStep[]) => {
    setSteps(next);
    saveStepsForPath(pathKey, next);
  };

  // ── picking: 클릭으로 대상 요소 선택 ──
  useEffect(() => {
    if (mode !== "picking") return;

    const isEditorEl = (el: Element | null) =>
      !!el?.closest(`[${EDITOR_ATTR}]`);

    const onMove = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isEditorEl(el)) {
        setDraftRect(null);
        return;
      }
      setDraftRect(el.getBoundingClientRect());
    };

    const onClick = (e: MouseEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      if (!el || isEditorEl(el)) return;
      e.preventDefault();
      e.stopPropagation();
      const sel = buildSelector(el);
      if (!sel || !isUnique(sel)) {
        alert(
          "이 요소의 안정적인 셀렉터를 만들 수 없습니다. 다른(더 고유한) 요소를 선택해주세요."
        );
        return;
      }
      setDraftSelector(sel);
      setDraftRect(el.getBoundingClientRect());
      setMode("text");
    };

    document.addEventListener("mousemove", onMove, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("mousemove", onMove, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [mode]);

  if (!mounted) return null;

  const startAdd = () => {
    setDraftSelector(null);
    setDraftRect(null);
    setTitle("");
    setBody("");
    setMode("picking");
  };

  const saveDraft = () => {
    if (!draftSelector) return;
    if (!title.trim()) {
      alert("제목을 입력해주세요.");
      return;
    }
    persist([...steps, { selector: draftSelector, title: title.trim(), body: body.trim() }]);
    setMode("list");
  };

  const removeStep = (i: number) => {
    persist(steps.filter((_, idx) => idx !== i));
  };

  const handleDrop = (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) return;
    const next = [...steps];
    const [removed] = next.splice(dragIndex, 1);
    next.splice(targetIndex, 0, removed);
    persist(next);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const resetAll = () => {
    if (!confirm("이 페이지 튜토리얼을 코드 기본값으로 되돌릴까요? (오버라이드 삭제)")) return;
    resetPath(pathKey);
    setSteps(getStepsForPath(pathKey, getRegistrySteps(pathKey)));
  };

  const copyJson = () => {
    navigator.clipboard?.writeText(JSON.stringify(steps, null, 2));
    alert("스텝 JSON을 클립보드에 복사했습니다. 코드의 fallback steps에 붙여넣을 수 있어요.");
  };

  return createPortal(
    <>
      {/* picking 중 대상 하이라이트 미리보기 */}
      {(mode === "picking" || mode === "text") && draftRect && (
        <Preview
          style={{
            top: draftRect.top - 4,
            left: draftRect.left - 4,
            width: draftRect.width + 8,
            height: draftRect.height + 8,
          }}
        />
      )}

      {/* picking 안내 배너 */}
      {mode === "picking" && (
        <PickHint {...{ [EDITOR_ATTR]: "" }}>
          하이라이트할 요소를 클릭하세요 · <button onClick={() => setMode("list")}>취소</button>
        </PickHint>
      )}

      {/* 편집 패널 */}
      <Panel {...{ [EDITOR_ATTR]: "" }}>
        <PanelHead>
          <strong>튜토리얼 편집</strong>
          <PathTag>{pathKey}</PathTag>
        </PanelHead>

        {mode === "text" ? (
          <Form>
            <FieldLabel>대상</FieldLabel>
            <Code>{draftSelector}</Code>
            <FieldLabel>제목</FieldLabel>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="예: GitHub 계정을 연동해보세요" autoFocus />
            <FieldLabel>설명</FieldLabel>
            <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="박스에 들어갈 안내 문구" rows={3} />
            <Row>
              <Primary onClick={saveDraft}>끝내기 (스텝 추가)</Primary>
              <Ghost onClick={() => setMode("list")}>취소</Ghost>
            </Row>
          </Form>
        ) : (
          <>
            <List>
              {steps.length === 0 && <Empty>이 페이지에 튜토리얼이 없습니다.</Empty>}
              {steps.map((s, i) => (
                <Item
                  key={i}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={(e) => { e.preventDefault(); setDragOverIndex(i); }}
                  onDrop={() => handleDrop(i)}
                  onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                  style={{
                    opacity: dragIndex === i ? 0.4 : 1,
                    borderColor: dragOverIndex === i && dragIndex !== i ? "#16335C" : undefined,
                    borderWidth: dragOverIndex === i && dragIndex !== i ? 2 : undefined,
                  }}
                >
                  <DragHandle title="드래그로 순서 변경">⠿</DragHandle>
                  <ItemNum>{i + 1}</ItemNum>
                  <ItemBody>
                    <ItemTitle>{s.title}</ItemTitle>
                    <ItemSel>{s.selector}</ItemSel>
                  </ItemBody>
                  <Del onClick={() => removeStep(i)}>삭제</Del>
                </Item>
              ))}
            </List>
            <Row>
              <Primary onClick={startAdd}>+ 튜토리얼 추가</Primary>
            </Row>
            <Row>
              <Ghost onClick={copyJson} disabled={steps.length === 0}>JSON 복사</Ghost>
              <Ghost onClick={resetAll}>초기화</Ghost>
            </Row>
          </>
        )}
      </Panel>
    </>,
    document.body
  );
}

// ── styles ──────────────────────────────────────────
const FONT = '"Spoqa Han Sans Neo", sans-serif';
const NAVY = "#16335C";

const Panel = styled.div`
  position: fixed;
  top: 80px;
  right: 20px;
  width: 320px;
  max-height: calc(100vh - 120px);
  overflow-y: auto;
  z-index: 12000;
  background: #fff;
  border: 1px solid #e5e8eb;
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.22);
  padding: 16px;
  font-family: ${FONT};
`;

const PanelHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  font-size: 15px;
`;

const PathTag = styled.span`
  font-size: 11px;
  color: #8b95a1;
  background: #f2f4f6;
  padding: 3px 8px;
  border-radius: 6px;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const Empty = styled.div`
  color: #8b95a1;
  font-size: 13px;
  padding: 16px 0;
  text-align: center;
`;

const Item = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px;
  border: 1px solid #e5e8eb;
  border-radius: 10px;
`;

const ItemNum = styled.span`
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  border-radius: 50%;
  background: ${NAVY};
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ItemBody = styled.div`
  flex: 1;
  min-width: 0;
`;
const ItemTitle = styled.div`
  font-size: 13px;
  font-weight: 600;
  color: #191f28;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;
const ItemSel = styled.div`
  font-size: 11px;
  color: #8b95a1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const DragHandle = styled.span`
  color: #b0b8c1;
  font-size: 14px;
  cursor: grab;
  flex-shrink: 0;
  user-select: none;
  &:active { cursor: grabbing; }
`;

const Del = styled.button`
  background: none;
  border: none;
  color: #e6333f;
  font-size: 12px;
  cursor: pointer;
  flex-shrink: 0;
`;

const Row = styled.div`
  display: flex;
  gap: 8px;
  margin-top: 8px;
`;

const Primary = styled.button`
  flex: 1;
  background: ${NAVY};
  color: #fff;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  font-family: ${FONT};
`;

const Ghost = styled.button`
  flex: 1;
  background: #f2f4f6;
  color: #4e5968;
  border: none;
  border-radius: 8px;
  padding: 10px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: ${FONT};
  &:disabled { opacity: 0.5; cursor: not-allowed; }
`;

const Form = styled.div`
  display: flex;
  flex-direction: column;
`;
const FieldLabel = styled.label`
  font-size: 12px;
  font-weight: 600;
  color: #4e5968;
  margin: 8px 0 4px;
`;
const Code = styled.code`
  font-size: 11px;
  background: #f2f4f6;
  padding: 6px 8px;
  border-radius: 6px;
  color: ${NAVY};
  word-break: break-all;
`;
const Input = styled.input`
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  padding: 9px 10px;
  font-size: 14px;
  font-family: ${FONT};
  background: #ffffff;
  color: #191f28;
  &::placeholder { color: #b0b8c1; }
  &:focus { outline: none; border-color: ${NAVY}; }
`;
const Textarea = styled.textarea`
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  padding: 9px 10px;
  font-size: 14px;
  font-family: ${FONT};
  background: #ffffff;
  color: #191f28;
  resize: vertical;
  &::placeholder { color: #b0b8c1; }
  &:focus { outline: none; border-color: ${NAVY}; }
`;

const Preview = styled.div`
  position: fixed;
  z-index: 11999;
  border: 2px solid ${NAVY};
  border-radius: 8px;
  background: rgba(22, 51, 92, 0.12);
  pointer-events: none;
`;

const PickHint = styled.div`
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 12001;
  background: ${NAVY};
  color: #fff;
  padding: 10px 18px;
  border-radius: 999px;
  font-size: 13px;
  font-family: ${FONT};
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
  button {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: #fff;
    border-radius: 6px;
    padding: 3px 10px;
    margin-left: 6px;
    cursor: pointer;
    font-family: ${FONT};
  }
`;
