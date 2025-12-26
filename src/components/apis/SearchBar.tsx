"use client";

import styled from "@emotion/styled";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  onFilterChange?: (filter: "ALL" | "ORIGINAL" | "CUSTOM") => void;
  onSortChange?: (sort: "LATEST" | "POPULAR") => void;
  activeFilter?: "ALL" | "ORIGINAL" | "CUSTOM";
  activeSort?: "LATEST" | "POPULAR";
}

export function SearchBar({
  onSearch,
  onFilterChange,
  onSortChange,
  activeFilter = "ALL",
  activeSort = "LATEST"
}: SearchBarProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const filterButtonRef = useRef<HTMLButtonElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  const isSortEnabled = activeFilter !== "ALL";

  useEffect(() => {
    if (isFilterOpen && filterButtonRef.current) {
      const rect = filterButtonRef.current.getBoundingClientRect();
      setCoords({
        top: rect.bottom + window.scrollY + 8,
        left: rect.right + window.scrollX - 200 // 오른쪽 정렬
      });
    }
  }, [isFilterOpen]);

  const handleFilterClick = (filter: "ALL" | "ORIGINAL" | "CUSTOM") => {
    // 토글 로직: 이미 선택된 필터를 클릭하면 해제(ALL로 변경)
    const newFilter = activeFilter === filter ? "ALL" : filter;
    onFilterChange?.(newFilter);
  };

  const handleSortClick = (sort: "LATEST" | "POPULAR") => {
    if (!isSortEnabled) return;
    onSortChange?.(sort);
  };

  return (
    <Container>
      <InputWrapper>
        <Input
          placeholder="검색어를 입력해주세요"
          onChange={(e) => onSearch?.(e.target.value)}
        />
      </InputWrapper>
      <ButtonGroup>
        <SearchButton>검색</SearchButton>
        <FilterButton
          ref={filterButtonRef}
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          isActive={isFilterOpen || activeFilter !== "ALL"}
        >
          필터
        </FilterButton>
      </ButtonGroup>

      {isFilterOpen && createPortal(
        <>
          <Backdrop onClick={() => setIsFilterOpen(false)} />
          <FilterPopup style={{ top: coords.top, left: coords.left }}>
            <PopupSection>
              <SectionTitle>API 유형</SectionTitle>
              <ToggleGroup>
                <ToggleButton
                  active={activeFilter === "ORIGINAL"}
                  onClick={() => handleFilterClick("ORIGINAL")}
                >
                  Original API
                </ToggleButton>
                <ToggleButton
                  active={activeFilter === "CUSTOM"}
                  onClick={() => handleFilterClick("CUSTOM")}
                >
                  Custom API
                </ToggleButton>
              </ToggleGroup>
            </PopupSection>

            <Divider />

            <PopupSection>
              <SectionTitle style={{ opacity: isSortEnabled ? 1 : 0.5 }}>정렬</SectionTitle>
              <SortGroup>
                <SortOption
                  active={activeSort === "LATEST"}
                  disabled={!isSortEnabled}
                  onClick={() => handleSortClick("LATEST")}
                >
                  최신순
                </SortOption>
                <SortOption
                  active={activeSort === "POPULAR"}
                  disabled={!isSortEnabled}
                  onClick={() => handleSortClick("POPULAR")}
                >
                  인기순
                </SortOption>
              </SortGroup>
            </PopupSection>
          </FilterPopup>
        </>,
        document.body
      )}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  gap: 8px;
  width: 100%;
  height: 48px;
`;

const InputWrapper = styled.div`
  flex: 1;
  position: relative;
`;

const Input = styled.input`
  width: 100%;
  height: 100%;
  padding: 0 20px;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  color: #191F28;
  outline: none;
  background: white;

  &::placeholder {
    color: #9CA3AF;
  }

  &:focus {
    border-color: #16335C;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  height: 100%;
  padding: 0 24px;
  border-radius: 4px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
`;

const SearchButton = styled(Button)`
  background: #16335C;
  border: 1px solid #16335C;
  color: white;

  &:hover {
    background: #1a3a68;
  }
`;

const FilterButton = styled(Button) <{ isActive?: boolean }>`
  background: ${({ isActive }) => isActive ? "#F3F4F6" : "white"};
  border: 1px solid #E5E7EB;
  color: #191F28;

  &:hover {
    background: #F9FAFB;
    border-color: #D1D5DB;
  }
`;

const Backdrop = styled.div`
  position: fixed;
  inset: 0;
  z-index: 99;
  background: transparent;
`;

const FilterPopup = styled.div`
  position: absolute;
  width: 200px;
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 100;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const PopupSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const SectionTitle = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #8B95A1;
`;

const ToggleGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const ToggleButton = styled.button<{ active: boolean }>`
  padding: 8px 12px;
  border-radius: 4px;
  border: 1px solid ${({ active }) => active ? "#16335C" : "#E5E7EB"};
  background: ${({ active }) => active ? "#F0F7FF" : "white"};
  color: ${({ active }) => active ? "#16335C" : "#4B5563"};
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;

  &:hover {
    background: ${({ active }) => active ? "#F0F7FF" : "#F9FAFB"};
  }
`;

const Divider = styled.div`
  height: 1px;
  background: #E5E7EB;
  width: 100%;
`;

const SortGroup = styled.div`
  display: flex;
  gap: 12px;
`;

const SortOption = styled.button<{ active: boolean; disabled?: boolean }>`
  background: none;
  border: none;
  padding: 0;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: ${({ active }) => active ? "700" : "400"};
  color: ${({ active, disabled }) =>
    disabled ? "#D1D5DB" :
      active ? "#191F28" : "#8B95A1"};
  cursor: ${({ disabled }) => disabled ? "not-allowed" : "pointer"};

  &:hover {
    color: ${({ disabled, active }) =>
    disabled ? "#D1D5DB" :
      active ? "#191F28" : "#191F28"};
  }
`;
