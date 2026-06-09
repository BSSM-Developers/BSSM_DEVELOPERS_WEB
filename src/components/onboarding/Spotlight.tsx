"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";

export interface TutorialStep {
  selector: string; // [data-tour="..."] 형태 또는 임의 CSS 셀렉터
  title: string;
  body: string;
}

interface SpotlightProps {
  steps: TutorialStep[];
  stepIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  open: boolean;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PAD = 8; // 하이라이트 여백
const BOX_W = 320;
const BOX_GAP = 14;

export function Spotlight({
  steps,
  stepIndex,
  onNext,
  onPrev,
  onSkip,
  open,
}: SpotlightProps) {
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const pollRef = useRef<number | null>(null);

  useEffect(() => setMounted(true), []);

  const step = steps[stepIndex];

  // 대상 요소 위치 추적 (스크롤/리사이즈/지연 렌더 대응)
  useLayoutEffect(() => {
    if (!open || !step) return;
    let alive = true;
    let tries = 0;

    const measure = () => {
      const el = document.querySelector(step.selector) as HTMLElement | null;
      if (el) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 || r.height > 0) {
          if (alive)
            setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
          // 화면 밖이면 보이게
          if (r.top < 0 || r.bottom > window.innerHeight) {
            el.scrollIntoView({ behavior: "smooth", block: "center" });
          }
          return true;
        }
      }
      return false;
    };

    // 즉시 + 폴링(대상이 늦게 렌더될 수 있음). 일정 횟수 실패 시 자동 다음.
    if (!measure()) {
      pollRef.current = window.setInterval(() => {
        tries += 1;
        if (measure() || tries > 20) {
          if (pollRef.current) window.clearInterval(pollRef.current);
          pollRef.current = null;
          if (tries > 20 && alive) onNext(); // 대상 못 찾음 → 스킵
        }
      }, 100);
    }

    const onScrollResize = () => measure();
    window.addEventListener("scroll", onScrollResize, true);
    window.addEventListener("resize", onScrollResize);
    const ro = new ResizeObserver(onScrollResize);
    ro.observe(document.body);

    return () => {
      alive = false;
      if (pollRef.current) window.clearInterval(pollRef.current);
      window.removeEventListener("scroll", onScrollResize, true);
      window.removeEventListener("resize", onScrollResize);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step?.selector]);

  if (!mounted || !open || !step || !rect) return null;

  const isLast = stepIndex === steps.length - 1;
  const isFirst = stepIndex === 0;

  // 설명 박스 위치: 대상 아래 우선, 공간 부족하면 위
  const spaceBelow = window.innerHeight - (rect.top + rect.height);
  const placeBelow = spaceBelow > 200;
  const boxTop = placeBelow
    ? rect.top + rect.height + BOX_GAP
    : Math.max(16, rect.top - BOX_GAP - 180);
  let boxLeft = rect.left + rect.width / 2 - BOX_W / 2;
  boxLeft = Math.max(16, Math.min(boxLeft, window.innerWidth - BOX_W - 16));

  return createPortal(
    <Root>
      {/* 둥근 구멍 + 바깥 전체 어둠(box-shadow) + 하이라이트 테두리 */}
      <Hole
        style={{
          top: rect.top - PAD,
          left: rect.left - PAD,
          width: rect.width + PAD * 2,
          height: rect.height + PAD * 2,
        }}
      />

      {/* 설명 박스 */}
      <Box style={{ top: boxTop, left: boxLeft, width: BOX_W }}>
        <Title>{step.title}</Title>
        <Body>{step.body}</Body>
        <Footer>
          <Counter>
            {stepIndex + 1} / {steps.length}
          </Counter>
          <Buttons>
            <SkipBtn onClick={onSkip}>건너뛰기</SkipBtn>
            {!isFirst && <GhostBtn onClick={onPrev}>이전</GhostBtn>}
            <PrimaryBtn onClick={onNext}>{isLast ? "완료" : "다음"}</PrimaryBtn>
          </Buttons>
        </Footer>
      </Box>
    </Root>,
    document.body
  );
}

// ── styles ──────────────────────────────────────────
const NAVY = "#16335C";
const FONT = '"Spoqa Han Sans Neo", sans-serif';

const Root = styled.div`
  position: fixed;
  inset: 0;
  z-index: 10000;
  /* 배경(하이라이트 외 영역) 클릭이 뒤 요소로 전달되지 않도록 */
  pointer-events: auto;
`;

// 단계 전환 시 구멍(어둠/하이라이트)이 새 위치로 부드럽게 이동
const EASE = "cubic-bezier(0.4, 0, 0.2, 1)";
const MOVE = `0.55s ${EASE}`;

// 둥근 모서리 구멍: 요소 영역만 밝게 두고, 거대한 box-shadow로 화면 전체를 어둡게.
// 테두리(border)와 radius가 함께 적용돼 구멍 모서리가 둥글게 보인다.
const Hole = styled.div`
  position: fixed;
  border-radius: 14px;
  border: 2px solid ${NAVY};
  box-shadow: 0 0 0 4px rgba(22, 51, 92, 0.25),
    0 0 0 9999px rgba(15, 17, 23, 0.62);
  pointer-events: none;
  transition: top ${MOVE}, left ${MOVE}, width ${MOVE}, height ${MOVE};
`;

const Box = styled.div`
  position: fixed;
  z-index: 10001;
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
  padding: 20px;
  font-family: ${FONT};
  /* 설명 박스도 새 위치로 부드럽게 이동 */
  transition: top ${MOVE}, left ${MOVE};
  animation: tourPop 0.35s ${EASE};
  @keyframes tourPop {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const Title = styled.h3`
  margin: 0 0 8px;
  font-size: 16px;
  font-weight: 800;
  color: #191f28;
`;

const Body = styled.p`
  margin: 0 0 18px;
  font-size: 14px;
  line-height: 1.6;
  color: #4e5968;
  white-space: pre-line;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Counter = styled.span`
  font-size: 12px;
  color: #8b95a1;
  font-variant-numeric: tabular-nums;
`;

const Buttons = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
`;

const SkipBtn = styled.button`
  background: none;
  border: none;
  color: #8b95a1;
  font-size: 13px;
  cursor: pointer;
  font-family: ${FONT};
  padding: 6px 4px;
`;

const GhostBtn = styled.button`
  background: #f2f4f6;
  border: none;
  color: #4e5968;
  font-size: 13px;
  font-weight: 600;
  border-radius: 8px;
  padding: 8px 14px;
  cursor: pointer;
  font-family: ${FONT};
`;

const PrimaryBtn = styled.button`
  background: ${NAVY};
  border: none;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  border-radius: 8px;
  padding: 8px 16px;
  cursor: pointer;
  font-family: ${FONT};
  &:hover { background: #1a3a68; }
`;
