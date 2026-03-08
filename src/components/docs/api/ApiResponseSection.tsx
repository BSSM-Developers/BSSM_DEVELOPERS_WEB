"use client";

import styled from "@emotion/styled";
import { ApiParamsSection } from "./ApiParamsSection";

interface ApiParam {
  name: string;
  type: string;
  description: string;
  required?: boolean;
  example?: string;
}

interface ApiResponseSectionProps {
  responseParams?: ApiParam[];
  title?: string;
  editable?: boolean;
  onParamsChange?: (params: ApiParam[]) => void;
}

export function ApiResponseSection({
  responseParams = [],
  title = "Response",
  editable = false,
  onParamsChange
}: ApiResponseSectionProps) {
  const hasParams = responseParams.length > 0 || editable;

  if (!hasParams) return null;

  return (
    <ResponseSection>
      <SectionTitle>{title}</SectionTitle>
      <ApiParamsSection
        title="Response Body"
        params={responseParams}
        editable={editable}
        paramLocation="body"
        hideRequired={true}
        onParamsChange={onParamsChange}
      />
    </ResponseSection>
  );
}

const ResponseSection = styled.div`
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
