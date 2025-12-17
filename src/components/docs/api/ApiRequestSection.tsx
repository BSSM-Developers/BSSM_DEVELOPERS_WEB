"use client";

import styled from "@emotion/styled";
import { ApiParamsSection } from "./ApiParamsSection";

interface ApiParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
}

interface ApiRequestSectionProps {
  headerParams?: ApiParam[];
  bodyParams?: ApiParam[];
  title?: string;
}

export function ApiRequestSection({
  headerParams = [],
  bodyParams = [],
  title = "Request"
}: ApiRequestSectionProps) {
  const hasParams = headerParams.length > 0 || bodyParams.length > 0;

  if (!hasParams) return null;

  return (
    <RequestSection>
      <SectionTitle>{title}</SectionTitle>

      <ApiParamsSection
        title="Header Params"
        params={headerParams}
      />

      <ApiParamsSection
        title="Body Params"
        params={bodyParams}
        large
      />
    </RequestSection>
  );
}

const RequestSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

const SectionTitle = styled.h2`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 500;
  font-size: 24px;
  color: #191F28;
  letter-spacing: -1.2px;
  margin: 0;
`;