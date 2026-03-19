"use client";

import styled from "@emotion/styled";
import { applyTypography } from "@/lib/themeHelper";
import { useEffect, useRef, useState } from "react";

interface MyDocsCardProps {
  title: string;
  description: string;
  type: "ORIGINAL" | "CUSTOM";
  autoApproval: boolean | null;
  repositoryUrl: string;
  onExplore: () => void;
  onEditDocs: () => void;
  onEditInfo: () => void;
  onDelete: () => void;
  onManageUsage?: () => void;
  onPrefetch?: () => void;
}

export function MyDocsCard({
  title,
  description,
  type,
  autoApproval,
  repositoryUrl,
  onExplore,
  onEditDocs,
  onEditInfo,
  onDelete,
  onManageUsage,
  onPrefetch,
}: MyDocsCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <CardContainer
      onMouseEnter={onPrefetch}
      onFocus={onPrefetch}
    >
      <MenuContainer ref={menuRef}>
        <MenuTrigger type="button" onClick={() => setMenuOpen((prev) => !prev)}>
          ⋯
        </MenuTrigger>
        {menuOpen ? (
          <MenuPanel>
            <MenuItem
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onEditInfo();
              }}
            >
              정보 수정
            </MenuItem>
            <MenuDivider />
            <MenuItem
              type="button"
              danger
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              삭제
            </MenuItem>
          </MenuPanel>
        ) : null}
      </MenuContainer>
      <CardHeader>
        <TypeIndicator>
          <Dot type={type} />
          {type}
        </TypeIndicator>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </CardHeader>

      <MetaSection>
        <MetaRow>
          <MetaLabel>Auto Approval</MetaLabel>
          <MetaValue>{autoApproval === null ? "-" : String(autoApproval)}</MetaValue>
        </MetaRow>
        <MetaRow>
          <MetaLabel>레포지토리</MetaLabel>
          <MetaValue>{repositoryUrl || "-"}</MetaValue>
        </MetaRow>
      </MetaSection>

      <CardFooter>
        <ButtonGroup>
          <ActionButton type="button" onClick={onExplore}>
            자세히 보기
          </ActionButton>
          <ActionButton type="button" onClick={onEditDocs} primary>
            수정하기
          </ActionButton>
          {type === "ORIGINAL" && onManageUsage ? (
            <ActionButton type="button" onClick={onManageUsage}>
              신청 관리
            </ActionButton>
          ) : null}
        </ButtonGroup>
      </CardFooter>
    </CardContainer>
  );
}

const CardContainer = styled.div`
  position: relative;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.grey[200]};
  border-radius: 8px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  min-height: 280px;
  transition: transform 0.2s, box-shadow 0.2s;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.05);
  }
`;

const MenuContainer = styled.div`
  position: absolute;
  top: 14px;
  right: 14px;
  z-index: 30;
`;

const MenuTrigger = styled.button`
  width: 24px;
  height: 24px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: ${({ theme }) => theme.colors.grey[500]};
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: ${({ theme }) => theme.colors.grey[100]};
    color: ${({ theme }) => theme.colors.grey[700]};
  }
`;

const MenuPanel = styled.div`
  position: absolute;
  top: 30px;
  right: 0;
  width: 140px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: white;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const MenuItem = styled.button<{ danger?: boolean }>`
  height: 40px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: ${({ theme, danger }) => (danger ? theme.colors.bssmRed : theme.colors.grey[700])};
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-weight: 500;
  text-align: left;
  padding: 0 10px;
  cursor: pointer;

  &:hover {
    background: ${({ danger }) => (danger ? "#FEF2F2" : "#F3F4F6")};
  }
`;

const MenuDivider = styled.hr`
  margin: 4px 0;
  border: 0;
  height: 1px;
  background: #e5e7eb;
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
`;

const TypeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 12px;
  color: ${({ theme }) => theme.colors.grey[800]};
  margin-bottom: 8px;
`;

const Dot = styled.div<{ type: "ORIGINAL" | "CUSTOM" }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ type, theme }) => (type === "ORIGINAL" ? theme.colors.bssmDarkBlue : "#7C3AED")};
`;

const Title = styled.h3`
  ${({ theme }) => applyTypography(theme, "Headline_2")};
  font-size: 24px;
  margin-bottom: 12px;
  color: ${({ theme }) => theme.colors.grey[900]};
`;

const Description = styled.p`
  ${({ theme }) => applyTypography(theme, "Body_2")};
  color: ${({ theme }) => theme.colors.grey[700]};
  margin: 0;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
`;

const MetaSection = styled.div`
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const MetaRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const MetaLabel = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[500]};
`;

const MetaValue = styled.span`
  ${({ theme }) => applyTypography(theme, "Body_4")};
  color: ${({ theme }) => theme.colors.grey[800]};
  word-break: break-all;
`;

const CardFooter = styled.div`
  margin-top: auto;
  padding-top: 20px;
  display: flex;
  justify-content: flex-end;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ primary?: boolean; danger?: boolean }>`
  padding: 8px 14px;
  border-radius: 4px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 12px;
  cursor: pointer;
  border: 1px solid
    ${({ theme, primary, danger }) => {
      if (danger) {
        return theme.colors.bssmRed;
      }
      if (primary) {
        return theme.colors.bssmDarkBlue;
      }
      return theme.colors.grey[300];
    }};
  background: ${({ theme, primary, danger }) => {
    if (danger) {
      return theme.colors.bssmRed;
    }
    if (primary) {
      return theme.colors.bssmDarkBlue;
    }
    return "white";
  }};
  color: ${({ theme, primary, danger }) => {
    if (danger || primary) {
      return "white";
    }
    return theme.colors.grey[800];
  }};
  transition: all 0.2s;

  &:hover {
    filter: brightness(1.06);
  }
`;
