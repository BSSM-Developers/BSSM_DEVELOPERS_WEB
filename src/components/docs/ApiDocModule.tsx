"use client";

import styled from "@emotion/styled";
import { ApiBreadcrumb } from "./api/ApiBreadcrumb";
import { ApiHeader } from "./api/ApiHeader";
import { ApiRequestSection } from "./api/ApiRequestSection";
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
};

export function ApiDocModule({
  apiId,
  apiName,
  method,
  endpoint,
  description,
  breadcrumb,
  headerParams = [],
  bodyParams = [],
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
  onTryClick
}: ApiDocModuleProps) {
  // ApiDoc 객체 생성
  const apiDoc = {
    id: apiId,
    name: apiName,
    method,
    endpoint,
    description,
    headerParams,
    bodyParams
  };

  return (
    <Container>
      <ContentWrapper>
        <ApiBreadcrumb
          category={breadcrumb?.category}
          subcategory={breadcrumb?.subcategory}
        />

        <DocumentationContent>
          <ApiHeader
            title={apiName}
            description={description}
            method={method}
            endpoint={endpoint}
            onTryClick={onTryClick}
          />

          <ApiRequestSection
            headerParams={headerParams}
            bodyParams={bodyParams}
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
  gap: 32px;
  width: 100%;
  min-height: calc(100vh - 69px);
  overflow-y: auto;
  align-items: flex-start;

  @media (max-width: 1400px) {
    flex-direction: column;
    gap: 24px;
  }

  @media (max-width: 768px) {
    gap: 20px;
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  flex: 1;
  max-width: 700px;

  @media (max-width: 1400px) {
    max-width: none;
  }
`;

const DocumentationContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  width: 100%;
`;