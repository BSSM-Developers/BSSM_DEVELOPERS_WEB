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
  editable?: boolean;
  onHeaderParamsChange?: (params: ApiParam[]) => void;
  onBodyParamsChange?: (params: ApiParam[]) => void;
}

export function ApiRequestSection({
  headerParams = [],
  bodyParams = [],
  title = "Request",
  editable = false,
  onHeaderParamsChange,
  onBodyParamsChange
}: ApiRequestSectionProps) {
  const hasHeaders = headerParams.length > 0 || editable;
  const hasBody = bodyParams.length > 0 || editable;

  if (!hasHeaders && !hasBody) return null;

  return (
    <RequestSection>
      <SectionTitle>{title}</SectionTitle>

      {hasHeaders && (
        <ApiParamsSection
          title="Header Params"
          params={headerParams}
          editable={editable}
          onParamsChange={onHeaderParamsChange}
        />
      )}

      {hasBody && (
        <ApiParamsSection
          title="Body Params"
          params={bodyParams}
          large
          editable={editable}
          onParamsChange={onBodyParamsChange}
        />
      )}
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