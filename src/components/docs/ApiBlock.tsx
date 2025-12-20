"use client";

import styled from "@emotion/styled";
import { ApiDocModule } from "./ApiDocModule";
import type { ApiDoc } from "@/types/docs";

interface ApiBlockProps {
  apiData: ApiDoc;
  editable?: boolean;
  onChange?: (updated: ApiDoc) => void;
}

export function ApiBlock({ apiData, editable = false, onChange }: ApiBlockProps) {
  const handleHeaderChange = (updated: any) => {
    onChange?.({
      ...apiData,
      name: updated.title,
      description: updated.description,
      method: updated.method,
      endpoint: updated.endpoint,
      mappingEndpoint: updated.mappingEndpoint
    });
  };

  return (
    <Container>
      <ApiDocModule
        apiId={apiData.id}
        apiName={apiData.name}
        method={apiData.method}
        endpoint={apiData.endpoint}
        mappingEndpoint={apiData.mappingEndpoint}
        description={apiData.description}
        headerParams={apiData.headerParams}
        bodyParams={apiData.bodyParams}
        responseParams={apiData.responseParams}
        sampleCode={apiData.sampleCode}
        responseCode={apiData.responseCode}
        editable={editable}
        onHeaderChange={handleHeaderChange}
        onHeaderParamsChange={(params) => onChange?.({ ...apiData, headerParams: params })}
        onBodyParamsChange={(params) => onChange?.({ ...apiData, bodyParams: params })}
        onResponseParamsChange={(params) => onChange?.({ ...apiData, responseParams: params })}
      />
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  margin: 20px 0;
`;