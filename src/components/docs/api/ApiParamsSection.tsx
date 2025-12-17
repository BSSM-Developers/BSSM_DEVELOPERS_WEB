"use client";

import styled from "@emotion/styled";
import { ParamItem } from "@/components/ui/param/ParamItem";

interface ApiParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

interface ApiParamsSectionProps {
  title: string;
  params: ApiParam[];
  large?: boolean;
}

export function ApiParamsSection({ title, params, large = false }: ApiParamsSectionProps) {
  if (params.length === 0) return null;

  return (
    <ParamSection>
      <ParamSectionTitle>{title}</ParamSectionTitle>
      <ParamCard large={large}>
        {large ? (
          <ParamList>
            {params.map((param, index) => (
              <ParamItem
                key={index}
                name={param.name}
                type={param.type}
                description={param.description}
                required={param.required}
              />
            ))}
          </ParamList>
        ) : (
          params.map((param, index) => (
            <ParamItem
              key={index}
              name={param.name}
              type={param.type}
              description={param.description}
              required={param.required}
            />
          ))
        )}
      </ParamCard>
    </ParamSection>
  );
}

const ParamSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;

const ParamSectionTitle = styled.h3`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 400;
  font-size: 14px;
  color: black;
  letter-spacing: -0.7px;
  margin: 0;
`;

const ParamCard = styled.div<{ large?: boolean }>`
  background: white;
  border-radius: 8px;
  box-shadow: 0px 0px 1px 0px rgba(0,0,0,0.25);
  padding: 12px 16px 10px 16px;
  width: 100%;
  min-height: ${({ large }) => large ? "240px" : "100px"};
  display: flex;
  flex-direction: column;
  align-items: center;

  @media (max-width: 768px) {
    padding: 10px 12px;
    min-height: ${({ large }) => large ? "180px" : "80px"};
  }

  @media (max-width: 480px) {
    padding: 8px;
    min-height: ${({ large }) => large ? "140px" : "70px"};
  }
`;

const ParamList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  margin-top: 12px;
`;