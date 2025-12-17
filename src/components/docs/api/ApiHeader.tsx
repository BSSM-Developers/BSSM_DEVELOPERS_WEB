"use client";

import styled from "@emotion/styled";
import { HttpMethodTag, type HttpMethod } from "@/components/ui/httpMethod/HttpMethodTag";

interface ApiHeaderProps {
  title: string;
  description?: string;
  method: HttpMethod;
  endpoint: string;
  onTryClick?: () => void;
}

export function ApiHeader({ title, description, method, endpoint, onTryClick }: ApiHeaderProps) {
  return (
    <HeaderSection>
      <TitleSection>
        <MainTitle>{title}</MainTitle>
        {description && <Subtitle>{description}</Subtitle>}
      </TitleSection>

      <EndpointSection>
        <HttpMethodTag method={method} />
        <EndpointPath>{endpoint}</EndpointPath>
        <TryButton onClick={onTryClick}>Try It!</TryButton>
      </EndpointSection>
    </HeaderSection>
  );
}

const HeaderSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 19px;
  width: 100%;
`;

const TitleSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  width: 100%;
`;

const MainTitle = styled.h1`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 700;
  font-size: 36px;
  color: #191F28;
  letter-spacing: -1.8px;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 28px;
    letter-spacing: -1.4px;
  }

  @media (max-width: 480px) {
    font-size: 24px;
    letter-spacing: -1.2px;
  }
`;

const Subtitle = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 300;
  font-size: 14px;
  color: #6B7684;
  letter-spacing: -0.7px;
  margin: 0;

  @media (max-width: 768px) {
    font-size: 13px;
  }
`;

const EndpointSection = styled.div`
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 0 12px;
  background: #F2F4F6;
  border-radius: 8px;
  height: 42px;
  width: 100%;

  @media (max-width: 768px) {
    gap: 12px;
    padding: 0 8px;
    height: 40px;
    flex-wrap: wrap;
    min-height: 42px;
  }

  @media (max-width: 480px) {
    flex-direction: column;
    align-items: stretch;
    padding: 12px;
    height: auto;
    gap: 8px;
  }
`;

const EndpointPath = styled.div`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 300;
  font-size: 14px;
  color: black;
  letter-spacing: -0.7px;
  flex: 1;

  @media (max-width: 768px) {
    font-size: 13px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
    word-break: break-all;
  }
`;

const TryButton = styled.button`
  background: #16335C;
  border-radius: 7px;
  box-shadow: 0px 0px 4px 0px rgba(0,0,0,0.25);
  border: none;
  width: 80px;
  height: 32px;
  font-family: "Flight Sans", sans-serif;
  font-weight: 700;
  font-size: 12px;
  color: white;
  text-align: center;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background: #1a3a68;
  }

  @media (max-width: 480px) {
    width: 100%;
    height: 36px;
    font-size: 14px;
  }
`;