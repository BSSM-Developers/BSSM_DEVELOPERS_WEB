"use client";

import styled from "@emotion/styled";
import { useRouter } from "next/navigation";

interface ApiCardProps {
  id: string;
  title: string;
  description: string;
  tags: string[];
  logo?: string;
  onExplore?: () => void;
  onUse?: () => void;
}

export function ApiCard({ id, title, description, tags, logo, onExplore, onUse }: ApiCardProps) {
  const router = useRouter();

  const handleExplore = () => {
    if (onExplore) {
      onExplore();
    } else {
      router.push(`/docs/${id}`);
    }
  };

  return (
    <CardContainer>
      <CardHeader>
        <TagList>
          {tags.map((tag, index) => (
            <Tag key={index}>
              <TagDot />
              {tag}
            </Tag>
          ))}
        </TagList>
        <Title>{title}</Title>
      </CardHeader>

      <Description>{description}</Description>

      <CardFooter>
        <ButtonGroup>
          <ExploreButton onClick={handleExplore}>둘러보기</ExploreButton>
          <UseButton onClick={onUse}>사용하기</UseButton>
        </ButtonGroup>
      </CardFooter>
    </CardContainer>
  );
}

const CardContainer = styled.div`
  background: white;
  border: 1px solid #E5E7EB;
  border-radius: 4px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  height: 240px;
  transition: box-shadow 0.2s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }
`;

const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 12px;
`;

const TagList = styled.div`
  display: flex;
  gap: 8px;
`;

const Tag = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #191F28;
`;

const TagDot = styled.span`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #191F28;
`;

const Title = styled.h3`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #191F28;
  margin: 0;
  letter-spacing: -0.6px;
`;

const Description = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 14px;
  font-weight: 400;
  color: #4B5563;
  margin: 0;
  line-height: 1.5;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const CardFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: auto;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 8px;
`;

const Button = styled.button`
  height: 32px;
  padding: 0 16px;
  border-radius: 4px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;
`;

const ExploreButton = styled(Button)`
  background: white;
  border: 1px solid #E5E7EB;
  color: #191F28;

  &:hover {
    background: #F9FAFB;
    border-color: #D1D5DB;
  }
`;

const UseButton = styled(Button)`
  background: #16335C;
  border: 1px solid #16335C;
  color: white;

  &:hover {
    background: #1a3a68;
  }
`;
