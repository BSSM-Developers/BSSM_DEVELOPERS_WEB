"use client";

import styled from "@emotion/styled";
import { HttpMethodTag } from "@/components/ui/httpMethod/HttpMethodTag";

type ParamItemProps = {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  className?: string;
};

export function ParamItem({ name, type, description, required = false, className }: ParamItemProps) {
  return (
    <Container className={className}>
      <ParamInfo>
        <ParamHeader>
          <NameTag>{name}</NameTag>
          <TypeText>{type}</TypeText>
        </ParamHeader>
        <DescriptionWrapper>
          <Description>{description}</Description>
        </DescriptionWrapper>
      </ParamInfo>
      {required && <RequiredText>required</RequiredText>}
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px 0 0;
  width: 100%;
  max-width: 850px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 0;
  }
`;

const ParamInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 9px;
  flex: 1;
  min-width: 0;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

const ParamHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;

  @media (max-width: 768px) {
    flex-wrap: wrap;
    gap: 8px;
  }
`;

const NameTag = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 8px;
  min-width: 72px;
  height: 24px;
  border-radius: 3px;
  background: #F7FBFF;
  color: #58A6FF;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 500;
  font-size: 12px;
  text-align: center;
  letter-spacing: -0.6px;
  white-space: nowrap;

  @media (max-width: 768px) {
    min-width: 60px;
    font-size: 11px;
  }
`;

const TypeText = styled.span`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #8B95A1;
  letter-spacing: -0.7px;
  white-space: pre;
`;

const DescriptionWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0 0 3px;
  width: 100%;
`;

const Description = styled.div`
  flex: 1;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: #8B95A1;
  letter-spacing: -0.7px;
`;

const RequiredText = styled.span`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 500;
  font-size: 12px;
  color: #F06820;
  text-align: center;
  letter-spacing: -0.6px;
  white-space: pre;
`;