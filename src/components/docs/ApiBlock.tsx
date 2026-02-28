"use client";

import styled from "@emotion/styled";
import { ApiDocModule } from "./ApiDocModule";
import type { ApiDoc } from "@/types/docs";
import type { HttpMethod } from "@/components/ui/httpMethod/HttpMethodTag";

interface ApiBlockProps {
  apiData: ApiDoc;
  domain?: string;
  editable?: boolean;
  onChange?: (updated: ApiDoc) => void;
}

export function ApiBlock({ apiData, domain, editable = false, onChange }: ApiBlockProps) {
  const handleHeaderChange = (updated: { title: string; description: string; method: HttpMethod; endpoint: string; isVerified?: boolean }) => {
    onChange?.({
      ...apiData,
      name: updated.title,
      description: updated.description,
      method: updated.method as ApiDoc['method'],
      endpoint: updated.endpoint,
      isVerified: updated.isVerified !== undefined ? updated.isVerified : apiData.isVerified
    });
  };

  return (
    <Container>
      <ApiDocModule
        apiId={apiData.id}
        apiName={apiData.name}
        domain={domain}
        method={apiData.method}
        endpoint={apiData.endpoint}
        description={apiData.description}
        headerParams={apiData.headerParams}
        cookieParams={apiData.cookieParams}
        pathParams={apiData.pathParams}
        queryParams={apiData.queryParams}
        bodyParams={apiData.bodyParams}
        responseParams={apiData.responseParams}
        sampleCode={apiData.sampleCode}
        responseCode={apiData.responseCode}
        editable={editable}
        onHeaderChange={handleHeaderChange}
        onHeaderParamsChange={(params) => onChange?.({ ...apiData, headerParams: params })}
        onCookieParamsChange={(params) => onChange?.({ ...apiData, cookieParams: params })}
        onPathParamsChange={(params) => onChange?.({ ...apiData, pathParams: params })}
        onQueryParamsChange={(params) => onChange?.({ ...apiData, queryParams: params })}
        onBodyParamsChange={(params) => onChange?.({ ...apiData, bodyParams: params })}
        onResponseParamsChange={(params) => onChange?.({ ...apiData, responseParams: params })}
        responseData={apiData.responseData}
        onResponseDataChange={(data) => onChange?.({ ...apiData, responseData: data })}
        responseStatus={apiData.responseStatus}
        onResponseStatusChange={(status) => onChange?.({ ...apiData, responseStatus: status })}
        responseMessage={apiData.responseMessage}
        onResponseMessageChange={(message) => onChange?.({ ...apiData, responseMessage: message })}
        isVerified={apiData.isVerified}
      />
    </Container>
  );
}

const Container = styled.div`
  width: 100%;
  margin: 20px 0;
`;