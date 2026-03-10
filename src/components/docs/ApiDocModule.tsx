import { useState } from "react";
import styled from "@emotion/styled";
import { ApiHeader } from "./api/ApiHeader";
import { ApiRequestSection } from "./api/ApiRequestSection";
import { ApiResponseSection } from "./api/ApiResponseSection";
import { ApiCodeSection } from "./api/ApiCodeSection";
import { useConfirm } from "@/hooks/useConfirm";
import type { HttpMethod } from "@/components/ui/httpMethod/HttpMethodTag";
import type { ApiDoc, ApiParam } from "@/types/docs";
import { generateParamExamples, extractParams } from "@/utils/apiUtils/paramUtils";

type ApiDocModuleProps = {
  apiId: string;
  apiName: string;
  domain?: string;
  method: HttpMethod;
  endpoint: string;
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
  isVerified?: boolean;
  onTryClick?: () => void;
  editable?: boolean;
  onHeaderChange?: (updated: { title: string; description: string; method: HttpMethod; endpoint: string; isVerified?: boolean }) => void;
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
  description,
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
  responseData: initialResponseData,
  responseStatus: initialResponseStatus = 200,
  responseMessage: initialResponseMessage = "성공",
  isVerified = false,
  onTryClick,
  editable = false,
  onHeaderChange,
  onHeaderParamsChange,
  onCookieParamsChange,
  onPathParamsChange,
  onQueryParamsChange,
  onBodyParamsChange,
  onResponseParamsChange
}: ApiDocModuleProps) {
  const [executionResult, setExecutionResult] = useState<{
    status: number;
    message: string;
    data: unknown;
  } | null>(null);
  const { confirm, ConfirmDialog } = useConfirm();

  const apiDoc: ApiDoc = {
    id: apiId,
    name: apiName,
    method,
    endpoint,
    description,
    headerParams,
    cookieParams,
    pathParams,
    queryParams,
    bodyParams,
    responseParams,
    responseData: executionResult?.data || initialResponseData,
    responseStatus: executionResult?.status || initialResponseStatus,
    responseMessage: executionResult?.message || initialResponseMessage,
    isVerified
  };

  const handleTryIt = async () => {
    if (onTryClick) {
      onTryClick();
      return;
    }

    if (!domain || !endpoint) {
      await confirm({ title: "실행 불가", message: "도메인 또는 엔드포인트 정보가 없습니다.", hideCancel: true });
      return;
    }

    try {
      const params = extractParams(apiDoc);
      const examples = {
        header: generateParamExamples(params.headerParams),
        cookie: generateParamExamples(params.cookieParams),
        body: generateParamExamples(params.bodyParams),
        query: generateParamExamples(params.queryParams),
        path: generateParamExamples(params.pathParams)
      };

      if (Object.keys(examples.cookie).length > 0) {
        const cookieString = Object.entries(examples.cookie)
          .map(([k, v]) => `${k}=${v}`)
          .join('; ');
        examples.header['Cookie'] = cookieString;
      }

      let finalEndpoint = endpoint;
      Object.entries(examples.path).forEach(([key, value]) => {
        finalEndpoint = finalEndpoint.replace(`{${key}}`, String(value));
      });

      const cleanDomain = domain.replace(/\/$/, "");
      const cleanEndpoint = finalEndpoint.startsWith("/") ? finalEndpoint : `/${finalEndpoint}`;
      let url = `${cleanDomain}${cleanEndpoint}`;

      if (Object.keys(examples.query).length > 0) {
        const queryString = new URLSearchParams(examples.query as Record<string, string>).toString();
        url += (url.includes('?') ? '&' : '?') + queryString;
      }

      const res = await fetch('/api/try', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUrl: url,
          method,
          headers: examples.header,
          body: ['POST', 'PUT', 'PATCH'].includes(method) ? examples.body : undefined
        }),
      });

      if (!res.ok) {
        const errorData = { error: "Proxy request failed" };
        setExecutionResult({
          status: res.status,
          message: "전송 실패",
          data: errorData
        });
        await confirm({ title: "실행 실패", message: `요청 전송 중 오류가 발생했습니다. (Status: ${res.status})`, hideCancel: true });
        return;
      }

      const data = await res.json();
      const status = data.status;
      const success = status >= 200 && status < 300;

      setExecutionResult({
        status,
        message: success ? "성공" : "오류",
        data: data.data || data
      });

      await confirm({
        title: success ? "실행 성공" : "실행 결과",
        message: success ? "API 요청이 성공적으로 처리되었습니다." : `API 요청이 ${status} 오류를 반환했습니다.`,
        hideCancel: true
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setExecutionResult({
        status: 500,
        message: "네트워크 오류",
        data: { error: errorMsg }
      });
      await confirm({ title: "네트워크 오류", message: `서버와 통신하는 중 오류가 발생했습니다: ${errorMsg}`, hideCancel: true });
    }
  };

  const checkMissing = () => {
    if (!editable || !pathParams || pathParams.length === 0) return [];
    const missing = new Set<string>();
    for (const p of pathParams) {
      if (!p.name) continue;
      const t = `{${p.name}}`;
      if (endpoint && !endpoint.includes(t)) missing.add(p.name);
    }
    return Array.from(missing);
  };

  const missingPathParams = checkMissing();

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
            onTryClick={editable ? undefined : handleTryIt}
            editable={editable}
            missingPathParams={missingPathParams.map(p => `{${p}}`)}
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
          />
        </DocumentationContent>
      </ContentWrapper>
      {ConfirmDialog}

      <ApiCodeSection
        apiDoc={apiDoc}
        sampleCode={sampleCode}
        responseCode={responseCode}
        languages={languages as string[]}
        libraryOptions={libraryOptions as string[]}
        baseUrl={baseUrl}
        includeAuth={includeAuth}
        authType={authType}
        responseData={apiDoc.responseData}
        responseStatus={apiDoc.responseStatus}
        responseMessage={apiDoc.responseMessage}
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
  width: 100%;
`;

const DocumentationContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
`;
