"use client";

import { useEffect, useRef, useState } from "react";
import styled from "@emotion/styled";

export interface BsdevSelectOption {
  value: string;
  label: string;
  tag?: string; // 우측 약한 텍스트 뱃지 (예: "private" / "public")
}

interface BsdevSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: BsdevSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  leftSlot?: React.ReactNode; // 좌측 고정 칩(예: 계정 아바타)
  searchable?: boolean; // 옵션 검색창 표시 (기본: 옵션 8개 이상이면 자동)
  searchPlaceholder?: string;
  footer?: React.ReactNode; // 팝오버 하단 고정 슬롯
}

/**
 * BSDev 디자인 커스텀 셀렉트.
 * - 네이티브 <select> 대신 버튼 + 팝오버 목록
 * - 선택 항목 체크 표시, 호버 하이라이트, 라벨 플로팅
 */
export function BsdevSelect({
  label,
  value,
  onChange,
  options,
  placeholder = "선택해주세요",
  disabled,
  leftSlot,
  searchable,
  searchPlaceholder = "검색...",
  footer,
}: BsdevSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const hasValue = !!selected;
  // FloatingInput과 동일: focus(open) 또는 값이 있으면 라벨을 위로 띄우고 placeholder 노출
  const active = open || hasValue;

  // 검색창 노출: searchable 명시 또는 옵션 8개 이상이면 자동
  const showSearch = (searchable ?? options.length >= 8) && !disabled;
  const filtered = query.trim()
    ? options.filter((o) =>
        o.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : options;

  // 닫힐 때 검색어 초기화
  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  return (
    <Root ref={rootRef}>
      <Row>
        {leftSlot}
        <TriggerWrap>
          <FloatLabel active={active}>{label}</FloatLabel>
          <Trigger
            type="button"
            disabled={disabled}
            open={open}
            active={active}
            onClick={() => !disabled && setOpen((v) => !v)}
          >
            <TriggerText hasValue={hasValue}>
              {selected ? selected.label : active ? placeholder : ""}
            </TriggerText>
            {selected?.tag && <TriggerTag>{selected.tag}</TriggerTag>}
            <Chevron open={open}>▾</Chevron>
          </Trigger>
        </TriggerWrap>
      </Row>

      {open && !disabled && (
        <Popover role="listbox">
          {showSearch && (
            <SearchBox>
              <SearchInput
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={searchPlaceholder}
                onClick={(e) => e.stopPropagation()}
              />
            </SearchBox>
          )}
          {filtered.length === 0 && (
            <EmptyRow>{query ? "검색 결과가 없습니다" : "항목이 없습니다"}</EmptyRow>
          )}
          {filtered.map((opt) => {
            const isSel = opt.value === value;
            return (
              <OptionRow
                key={opt.value}
                role="option"
                aria-selected={isSel}
                selected={isSel}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
              >
                <Check>{isSel ? "✓" : ""}</Check>
                <OptionLabel>{opt.label}</OptionLabel>
                {opt.tag && <OptionTag selected={isSel}>{opt.tag}</OptionTag>}
              </OptionRow>
            );
          })}
          {footer && (
            <>
              <FooterDivider />
              <FooterSlot>{footer}</FooterSlot>
            </>
          )}
        </Popover>
      )}
    </Root>
  );
}

// ── styles ──────────────────────────────────────────────
const FONT = '"Spoqa Han Sans Neo", sans-serif';
const NAVY = "#16335C";

const Root = styled.div`
  position: relative;
  width: 100%;
`;

const Row = styled.div`
  display: flex;
  gap: 10px;
  align-items: stretch;
`;

const TriggerWrap = styled.div`
  position: relative;
  flex: 1;
  display: flex;
`;

const FloatLabel = styled.label<{ active: boolean }>`
  position: absolute;
  top: ${({ active }) => (active ? "10px" : "50%")};
  transform: ${({ active }) => (active ? "none" : "translateY(-50%)")};
  left: 16px;
  font-size: ${({ active }) => (active ? "12px" : "16px")};
  font-weight: ${({ active }) => (active ? 600 : 400)};
  color: ${({ active }) => (active ? NAVY : "#6B7280")};
  transition: all 0.18s ease;
  pointer-events: none;
  font-family: ${FONT};
  z-index: 1;
`;

const Trigger = styled.button<{ open: boolean; active: boolean }>`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 60px;
  padding: ${({ active }) => (active ? "24px 16px 10px" : "18px 16px")};
  border-radius: 14px;
  border: 1.5px solid ${({ open }) => (open ? NAVY : "#E5E8EB")};
  background: ${({ open }) => (open ? "#fff" : "#F9FAFB")};
  box-shadow: ${({ open }) => (open ? `0 0 0 3px rgba(22,51,92,0.12)` : "none")};
  cursor: pointer;
  transition: all 0.18s ease;
  font-family: ${FONT};

  &:hover {
    background: #fff;
    border-color: ${({ open }) => (open ? NAVY : "#D1D6DB")};
  }
  &:disabled {
    cursor: not-allowed;
    background: #F2F4F6;
    border: 1.5px dashed #D1D6DB;
    box-shadow: none;
  }
  &:disabled:hover {
    background: #F2F4F6;
    border-color: #D1D6DB;
  }
`;

const TriggerText = styled.span<{ hasValue: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: ${({ hasValue }) => (hasValue ? 600 : 400)};
  color: ${({ hasValue }) => (hasValue ? "#191F28" : "#8B95A1")};
  text-align: left;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const TriggerTag = styled.span`
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  color: #8b95a1;
  font-family: ${FONT};
`;

const Chevron = styled.span<{ open: boolean }>`
  color: #8b95a1;
  font-size: 14px;
  transition: transform 0.18s ease;
  transform: rotate(${({ open }) => (open ? "180deg" : "0deg")});
  flex-shrink: 0;
`;

const Popover = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  z-index: 50;
  background: #fff;
  border: 1px solid #e5e8eb;
  border-radius: 14px;
  box-shadow: 0 12px 32px rgba(16, 24, 40, 0.16);
  padding: 6px;
  max-height: 280px;
  overflow-y: auto;
  animation: bsdevPop 0.14s ease;

  @keyframes bsdevPop {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const SearchBox = styled.div`
  position: sticky;
  top: 0;
  background: #fff;
  padding: 4px 4px 8px;
  z-index: 1;
`;

const SearchInput = styled.input`
  width: 100%;
  border: 1px solid #e5e8eb;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  font-family: ${FONT};
  background: #f9fafb;
  color: #191f28;
  &::placeholder { color: #b0b8c1; }
  &:focus { outline: none; border-color: ${NAVY}; background: #fff; }
`;

const OptionRow = styled.div<{ selected: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 12px;
  border-radius: 10px;
  cursor: pointer;
  font-family: ${FONT};
  font-size: 15px;
  font-weight: ${({ selected }) => (selected ? 700 : 500)};
  color: ${({ selected }) => (selected ? "#fff" : "#333D4B")};
  background: ${({ selected }) => (selected ? NAVY : "transparent")};
  transition: background 0.12s ease;

  &:hover {
    background: ${({ selected }) => (selected ? NAVY : "#F2F4F6")};
  }
`;

const Check = styled.span`
  width: 16px;
  flex-shrink: 0;
  font-size: 13px;
  text-align: center;
`;

const OptionLabel = styled.span`
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const OptionTag = styled.span<{ selected: boolean }>`
  flex-shrink: 0;
  font-size: 12px;
  font-weight: 500;
  color: ${({ selected }) => (selected ? "rgba(255,255,255,0.7)" : "#B0B8C1")};
  font-family: ${FONT};
`;

const EmptyRow = styled.div`
  padding: 16px;
  text-align: center;
  color: #8b95a1;
  font-size: 14px;
  font-family: ${FONT};
`;

const FooterDivider = styled.div`
  height: 1px;
  background: #f0f2f4;
  margin: 4px 0;
`;

const FooterSlot = styled.div`
  padding: 4px 2px 2px;
`;
