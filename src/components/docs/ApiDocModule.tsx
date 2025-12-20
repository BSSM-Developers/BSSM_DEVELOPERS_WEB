"use client";

import styled from "@emotion/styled";
import { ApiBreadcrumb } from "./api/ApiBreadcrumb";
import { ApiHeader } from "./api/ApiHeader";
import { ApiRequestSection } from "./api/ApiRequestSection";
import { ApiResponseSection } from "./api/ApiResponseSection";
import { ApiCodeSection } from "./api/ApiCodeSection";
import type { HttpMethod } from "@/components/ui/httpMethod/HttpMethodTag";

type ApiDocModuleProps = {
  apiId: string;
  apiName: string;
  method: HttpMethod;
  endpoint: string;
  description: string;
  breadcrumb?: {
    category?: string;
    subcategory?: string;
  };
  headerParams?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  bodyParams?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  responseParams?: Array<{
    name: string;
    type: string;
    description: string;
    required?: boolean;
  }>;
  sampleCode?: string;
  responseCode?: string;
  languages?: string[];
  libraryOptions?: string[];
  baseUrl?: string;
  includeAuth?: boolean;
  authType?: 'bearer' | 'basic' | 'apikey';
  responseData?: any;
  responseStatus?: number;
  responseMessage?: string;
  onTryClick?: () => void;
  editable?: boolean;
  mappingEndpoint?: string;
  onHeaderChange?: (updated: { title: string; description: string; method: any; endpoint: string; mappingEndpoint: string }) => void;
  onHeaderParamsChange?: (params: any[]) => void;
  onBodyParamsChange?: (params: any[]) => void;
  onResponseParamsChange?: (params: any[]) => void;
};

export function ApiDocModule({
  apiId,
  apiName,
  method,
  endpoint,
  mappingEndpoint,
  description,
  breadcrumb,
  headerParams = [],
  bodyParams = [],
  responseParams = [],
  sampleCode,
  responseCode,
  languages,
  libraryOptions,
  baseUrl,
  includeAuth = true,
  authType = 'bearer',
  responseData,
  responseStatus = 200,
  responseMessage = "성공",
  onTryClick,
  editable = false,
  onHeaderChange,
  onHeaderParamsChange,
  onBodyParamsChange,
  onResponseParamsChange
}: ApiDocModuleProps) {
  // ApiDoc 객체 생성
  const apiDoc = {
    id: apiId,
    name: apiName,
    method,
    endpoint,
    mappingEndpoint,
    description,
    headerParams,
    bodyParams,
    responseParams
  };

  return (
    <Container>
      <ContentWrapper>
        <DocumentationContent>
          <ApiHeader
            title={apiName}
            description={description}
            method={method}
            endpoint={endpoint}
            mappingEndpoint={mappingEndpoint}
            onTryClick={onTryClick}
            editable={editable}
            onChange={onHeaderChange}
          />

          <ApiRequestSection
            headerParams={headerParams}
            bodyParams={bodyParams}
            editable={editable}
            onHeaderParamsChange={onHeaderParamsChange}
            onBodyParamsChange={onBodyParamsChange}
          />

          <ApiResponseSection
            responseParams={responseParams}
            editable={editable}
            onParamsChange={onResponseParamsChange}
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