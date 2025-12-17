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
  onTryClick?: () => void;
};

export function ApiDocModule({
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
  onTryClick
}: ApiDocModuleProps) {
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
        sampleCode={sampleCode}
        responseCode={responseCode}
        languages={languages}
        libraryOptions={libraryOptions}
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