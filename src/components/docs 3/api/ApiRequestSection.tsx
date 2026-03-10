"use client";

import styled from "@emotion/styled";
import { ApiParamsSection } from "./ApiParamsSection";

import type { ApiParam } from "@/types/docs";

interface ApiRequestSectionProps {
  headerParams?: ApiParam[];
  pathParams?: ApiParam[];
  queryParams?: ApiParam[];
  bodyParams?: ApiParam[];
  cookieParams?: ApiParam[];
  title?: string;
  editable?: boolean;
  onHeaderParamsChange?: (params: ApiParam[]) => void;
  onCookieParamsChange?: (params: ApiParam[]) => void;
  onPathParamsChange?: (params: ApiParam[]) => void;
  onQueryParamsChange?: (params: ApiParam[]) => void;
  onBodyParamsChange?: (params: ApiParam[]) => void;
}

export function ApiRequestSection({
  headerParams = [],
  pathParams = [],
  queryParams = [],
  bodyParams = [],
  cookieParams = [],
  title = "Request",
  editable = false,
  onHeaderParamsChange,
  onCookieParamsChange,
  onPathParamsChange,
  onQueryParamsChange,
  onBodyParamsChange
}: ApiRequestSectionProps) {
  const hasHeaders = headerParams.length > 0 || editable;
  const hasCookies = cookieParams.length > 0 || editable;
  const hasPath = pathParams.length > 0 || editable;
  const hasQuery = queryParams.length > 0 || editable;
  const hasBody = bodyParams.length > 0 || editable;

  if (!hasHeaders && !hasCookies && !hasPath && !hasQuery && !hasBody) return null;

  return (
    <RequestSection>
      <SectionTitle>{title}</SectionTitle>

      {hasHeaders && (
        <ApiParamsSection
          title="Header Params"
          params={headerParams}
          editable={editable}
          paramLocation="header"
          onParamsChange={onHeaderParamsChange}
        />
      )}

      {hasCookies && (
        <ApiParamsSection
          title="Cookie Params"
          params={cookieParams}
          editable={editable}
          paramLocation="cookie"
          onParamsChange={onCookieParamsChange}
        />
      )}

      {hasPath && (
        <ApiParamsSection
          title="Path Params"
          params={pathParams}
          editable={editable}
          paramLocation="path"
          onParamsChange={onPathParamsChange}
        />
      )}

      {hasQuery && (
        <ApiParamsSection
          title="Query Params"
          params={queryParams}
          editable={editable}
          paramLocation="query"
          onParamsChange={onQueryParamsChange}
        />
      )}

      {hasBody && (
        <ApiParamsSection
          title="Body Params"
          params={bodyParams}
          editable={editable}
          paramLocation="body"
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