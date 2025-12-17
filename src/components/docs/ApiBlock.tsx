"use client";

import styled from "@emotion/styled";
import { ApiDocModule } from "./ApiDocModule";
import type { ApiDoc } from "@/types/docs";

interface ApiBlockProps {
  apiData: ApiDoc;
}

export function ApiBlock({ apiData }: ApiBlockProps) {
  return (
    <Container>
      <ApiDocModule
        apiId={apiData.id}
        apiName={apiData.name}
        method={apiData.method}
        endpoint={apiData.endpoint}
        description={apiData.description}
        headerParams={apiData.headerParams}
        bodyParams={apiData.bodyParams}
        sampleCode={apiData.sampleCode}
        responseCode={apiData.responseCode}
      />
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  margin: 20px 0;
`;