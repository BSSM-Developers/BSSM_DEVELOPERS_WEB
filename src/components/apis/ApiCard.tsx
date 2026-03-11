"use client";

import styled from "@emotion/styled";
import { useRouter } from "next/navigation";
import { applyTypography } from "@/lib/themeHelper";

interface ApiCardProps {
  id: string;
  title: string;
  description: string;
  tags: string[];
  type?: string;
  logo?: string;
  onExplore?: () => void;
  onPrefetch?: () => void;
}

export function ApiCard({ id, title, description, tags, type, onExplore, onPrefetch }: ApiCardProps) {
  const router = useRouter();

  const handleExplore = () => {
    if (onExplore) {
      onExplore();
    } else {
      router.push(`/docs/${id}`);
    }
  };

  const dotType = type || tags[0];

  return (
    <CardContainer onMouseEnter={onPrefetch} onFocus={onPrefetch}>
      <CardHeader>
        <TypeIndicator>
          <Dot type={dotType} />
          {tags[0]}
        </TypeIndicator>
        <Title>{title}</Title>
        <Description>{description}</Description>
      </CardHeader>
      <CardFooter>
        <ButtonGroup>
          <ActionButton type="button" primary onClick={handleExplore}>
            자세히 보기
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
  justify-content: space-between;
  min-height: 240px;
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
  font-size: 11px;
  color: ${({ theme }) => theme.colors.grey[800]};
  margin-bottom: 8px;
`;

const Dot = styled.div<{ type: string }>`
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: ${({ type, theme }) => {
    switch (type) {
      case "INSERT": return theme.colors.grey[800];
      case "UPDATE":
      case "ORIGINAL":
        return theme.colors.bssmDarkBlue;
      case "DELETE": return theme.colors.bssmRed;
      case "BSM": return "#00C3BD";
      case "RE:MEDY": return "#FFB800";
      case "CUSTOM": return "#7C3AED";
      default: return theme.colors.grey[300];
    }
  }};
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
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ primary?: boolean }>`
  padding: 8px 16px;
  border-radius: 4px;
  ${({ theme }) => applyTypography(theme, "Body_4")};
  font-size: 12px;
  cursor: pointer;
  border: 1px solid ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : theme.colors.grey[300]};
  background: ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : "white"};
  color: ${({ theme, primary }) => primary ? "white" : theme.colors.grey[800]};
  transition: all 0.2s;

  &:hover {
    background: ${({ theme, primary }) => primary ? theme.colors.bssmDarkBlue : theme.colors.grey[50]};
    filter: ${({ primary }) => primary ? "brightness(1.1)" : "none"};
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
