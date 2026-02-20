/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use client";

import styled from "@emotion/styled";
import { ApiBreadcrumb } from "./api/ApiBreadcrumb";
import { ApiHeader } from "./api/ApiHeader";
import { ApiRequestSection } from "./api/ApiRequestSection";
import { ApiResponseSection } from "./api/ApiResponseSection";
import { ApiCodeSection } from "./api/ApiCodeSection";
import type { HttpMethod } from "@/components/ui/httpMethod/HttpMethodTag";
import type { ApiDoc, ApiParam } from "@/types/docs";

type ApiDocModuleProps = {
  apiId: string;
  apiName: string;
  domain?: string;
  method: HttpMethod;
  endpoint: string;
  mappingEndpoint?: string;
  description: string;
  breadcrumb?: {
    category?: string;
    subcategory?: string;
  };
  headerParams?: ApiParam[];
  cookieParams?: ApiParam[];
  pathParams?: ApiParam[];
  queryParams?: ApiParam[];
  bodyParams?: ApiParam[];
  responseParams?: ApiParam[];
  sampleCode?: string;
  responseCode?: string;
  languages?: string[];
  libraryOptions?: string[];
  baseUrl?: string;
  includeAuth?: boolean;
  authType?: 'bearer' | 'basic' | 'apikey';
  responseData?: unknown;
  responseStatus?: number;
  responseMessage?: string;
  onTryClick?: () => void;
  editable?: boolean;
  onHeaderChange?: (updated: unknown) => void;
  onHeaderParamsChange?: (params: ApiParam[]) => void;
  onCookieParamsChange?: (params: ApiParam[]) => void;
  onPathParamsChange?: (params: ApiParam[]) => void;
  onQueryParamsChange?: (params: ApiParam[]) => void;
  onBodyParamsChange?: (params: ApiParam[]) => void;
  onResponseParamsChange?: (params: ApiParam[]) => void;
  onResponseDataChange?: (data: unknown) => void;
  onResponseStatusChange?: (status: number) => void;
  onResponseMessageChange?: (message: string) => void;
};

export function ApiDocModule({
  apiId,
  apiName,
  domain,
  method,
  endpoint,
  mappingEndpoint,
  description,
  breadcrumb,
  headerParams = [],
  cookieParams = [],
  pathParams = [],
  queryParams = [],
  bodyParams = [],
  responseParams = [],
  sampleCode,
  responseCode,
  languages,
  libraryOptions,
  baseUrl,
  includeAuth = false,
  authType = 'bearer',
  responseData,
  responseStatus = 200,
  responseMessage = "성공",
  onTryClick,
  editable = false,
  onHeaderChange,
  onHeaderParamsChange,
  onCookieParamsChange,
  onPathParamsChange,
  onQueryParamsChange,
  onBodyParamsChange,
  onResponseParamsChange,
  onResponseDataChange,
  onResponseStatusChange,
  onResponseMessageChange
}: ApiDocModuleProps) {
  const apiDoc: ApiDoc = {
    id: apiId,
    name: apiName,
    method,
    endpoint,
    mappingEndpoint,
    description,
    headerParams,
    cookieParams,
    pathParams,
    queryParams,
    bodyParams,
    responseParams,
    responseData,
    responseStatus,
    responseMessage
  };

  return (
    <Container>
      <ContentWrapper>
        <DocumentationContent>
          <ApiHeader
            title={apiName}
            description={description}
            domain={domain}
            method={method}
            endpoint={endpoint}
            mappingEndpoint={mappingEndpoint}
            onTryClick={onTryClick}
            editable={editable}
            onChange={onHeaderChange}
          />

          <ApiRequestSection
            headerParams={headerParams}
            cookieParams={cookieParams}
            pathParams={pathParams}
            queryParams={queryParams}
            bodyParams={bodyParams}
            editable={editable}
            onHeaderParamsChange={onHeaderParamsChange}
            onCookieParamsChange={onCookieParamsChange}
            onPathParamsChange={onPathParamsChange}
            onQueryParamsChange={onQueryParamsChange}
            onBodyParamsChange={onBodyParamsChange}
          />

          <ApiResponseSection
            responseParams={responseParams}
            editable={editable}
            onParamsChange={onResponseParamsChange}
            status={responseStatus}
            message={responseMessage}
            responseData={responseData}
            onStatusChange={onResponseStatusChange}
            onMessageChange={onResponseMessageChange}
            onDataChange={onResponseDataChange}
          />
        </DocumentationContent>
      </ContentWrapper>

      <ApiCodeSection
        apiDoc={apiDoc}
        sampleCode={sampleCode}
        responseCode={responseCode}
        languages={languages as any}
        libraryOptions={libraryOptions as any}
        baseUrl={baseUrl}
        includeAuth={includeAuth}
        authType={authType}
        responseData={responseData}
        responseStatus={responseStatus}
        responseMessage={responseMessage}
      />
    </Container>
  );
}

const Container = styled.div`
  display: flex;
  gap: 40px;
  width: 100%;
  align-items: flex-start;

  @media (max-width: 1400px) {
    flex-direction: column;
    gap: 40px;
    align-items: stretch;
  }

  @media (max-width: 768px) {
    gap: 32px;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  flex: 1;
  max-width: 800px;
  width: 100%;

  @media (max-width: 1400px) {
    max-width: none;
  }
`;

const DocumentationContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;