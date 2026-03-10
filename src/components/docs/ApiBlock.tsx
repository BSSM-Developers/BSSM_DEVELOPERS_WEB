"use client";

import styled from "@emotion/styled";
import { ApiDocModule } from "./ApiDocModule";
import type { ApiDoc } from "@/types/docs";
import type { HttpMethod } from "@/components/ui/httpMethod/HttpMethodTag";

interface ApiBlockProps {
  apiData: ApiDoc;
  domain?: string;
  editable?: boolean;
  disableVerification?: boolean;
  onChange?: (updated: ApiDoc) => void;
}

const extractEndpointPathParamNames = (endpoint: string): string[] => {
  const names: string[] = [];
  const dedup = new Set<string>();
  const matches = endpoint.matchAll(/\{([^{}\/]+)\}/g);

  for (const match of matches) {
    const rawName = match[1];
    const name = typeof rawName === "string" ? rawName.trim() : "";
    if (!name || dedup.has(name)) {
      continue;
    }
    dedup.add(name);
    names.push(name);
  }

  return names;
};

const syncPathParamsByEndpoint = (
  currentPathParams: ApiDoc["pathParams"],
  endpoint: string
): ApiDoc["pathParams"] => {
  const namesFromEndpoint = extractEndpointPathParamNames(endpoint);

  const current = currentPathParams ?? [];
  const currentByName = new Map<string, NonNullable<ApiDoc["pathParams"]>[number]>();
  for (const param of current) {
    const normalizedName = param.name.trim();
    if (!normalizedName || currentByName.has(normalizedName)) {
      continue;
    }
    currentByName.set(normalizedName, param);
  }

  const nextPathParams: NonNullable<ApiDoc["pathParams"]> = namesFromEndpoint.map((name) => {
    const existing = currentByName.get(name);
    if (existing) {
      return existing;
    }
    return {
      name,
      type: "string",
      description: "",
      required: true,
      example: "",
    };
  });

  return nextPathParams;
};

export function ApiBlock({ apiData, domain, editable = false, disableVerification = false, onChange }: ApiBlockProps) {
  const handleHeaderChange = (updated: { title: string; description: string; method: HttpMethod; endpoint: string; isVerified?: boolean }) => {
    const shouldSyncPathParams = updated.endpoint !== apiData.endpoint;
    const nextPathParams = shouldSyncPathParams
      ? syncPathParamsByEndpoint(apiData.pathParams, updated.endpoint)
      : apiData.pathParams;

    onChange?.({
      ...apiData,
      name: updated.title,
      description: updated.description,
      method: updated.method as ApiDoc['method'],
      endpoint: updated.endpoint,
      pathParams: nextPathParams,
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
        disableVerification={disableVerification}
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
