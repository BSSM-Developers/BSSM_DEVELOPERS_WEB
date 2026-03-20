import styled from "@emotion/styled";
import { ApiHeader } from "./api/ApiHeader";
import { ApiRequestSection } from "./api/ApiRequestSection";
import { ApiResponseSection } from "./api/ApiResponseSection";
import { ApiCodeSection } from "./api/ApiCodeSection";
import { useConfirm } from "@/hooks/useConfirm";
import type { HttpMethod } from "@/components/ui/httpMethod/HttpMethodTag";
import type { ApiDoc, ApiParam } from "@/types/docs";

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
    responseData: initialResponseData,
    responseStatus: initialResponseStatus,
    responseMessage: initialResponseMessage,
    isVerified
  };

  const handleTryIt = async () => {
    if (onTryClick) {
      onTryClick();
      return;
    }
    await confirm({
      title: "공지사항",
      message: "아직 준비중인 기능입니다! 조금만 기다려주세요!",
      hideCancel: true,
    });
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
          <BottomGap />
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

const BottomGap = styled.div`
  height: 80px;
  flex-shrink: 0;
`;
