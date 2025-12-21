"use client";

import styled from "@emotion/styled";
import { ApiParamsSection } from "./ApiParamsSection";

import type { ApiParam } from "@/types/docs";

interface ApiRequestSectionProps {
  headerParams?: ApiParam[];
  pathParams?: ApiParam[];
  queryParams?: ApiParam[];
  bodyParams?: ApiParam[];
  title?: string;
  editable?: boolean;
  onHeaderParamsChange?: (params: ApiParam[]) => void;
  onPathParamsChange?: (params: ApiParam[]) => void;
  onQueryParamsChange?: (params: ApiParam[]) => void;
  onBodyParamsChange?: (params: ApiParam[]) => void;
}

export function ApiRequestSection({
  headerParams = [],
  pathParams = [],
  queryParams = [],
  bodyParams = [],
  title = "Request",
  editable = false,
  onHeaderParamsChange,
  onPathParamsChange,
  onQueryParamsChange,
  onBodyParamsChange
}: ApiRequestSectionProps) {
  const hasHeaders = headerParams.length > 0 || editable;
  const hasPath = pathParams.length > 0 || editable;
  const hasQuery = queryParams.length > 0 || editable;
  const hasBody = bodyParams.length > 0 || editable;

  if (!hasHeaders && !hasPath && !hasQuery && !hasBody) return null;

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

      {hasPath && (
        <ApiParamsSection
          title="Path Params"
          params={pathParams}
          editable={editable}
          onParamsChange={onPathParamsChange}
        />
      )}

      {hasQuery && (
        <ApiParamsSection
          title="Query Params"
          params={queryParams}
          editable={editable}
          onParamsChange={onQueryParamsChange}
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