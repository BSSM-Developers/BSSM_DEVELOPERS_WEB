"use client";

import styled from "@emotion/styled";
import { applyTypography } from "@/lib/themeHelper";

interface MyDocsCardProps {
  title: string;
  description: string;
  type: "ORIGINAL" | "CUSTOM";
  autoApproval: boolean | null;
  repositoryUrl: string;
  onExplore: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function MyDocsCard({
  title,
  description,
  type,
  autoApproval,
  repositoryUrl,
  onExplore,
  onEdit,
  onDelete,
}: MyDocsCardProps) {
  return (
    <CardContainer>
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
            둘러보기
          </ActionButton>
          <ActionButton type="button" onClick={onEdit} primary>
            정보 수정
          </ActionButton>
          <ActionButton type="button" onClick={onDelete} danger>
            삭제
          </ActionButton>
        </ButtonGroup>
      </CardFooter>
    </CardContainer>
  );
}

const CardContainer = styled.div`
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
