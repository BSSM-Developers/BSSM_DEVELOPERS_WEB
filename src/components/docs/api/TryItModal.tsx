"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import styled from "@emotion/styled";
import { tokenApi } from "@/app/user/tokens/api";
import { HttpMethodTag } from "@/components/ui/httpMethod/HttpMethodTag";
import type { ApiDoc, ApiParam } from "@/types/docs";

interface TryItModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiDoc: ApiDoc;
}

type ParamValues = Record<string, string>;

const PROXY_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://proxy.bssm-dev.com"
    : "https://stg-proxy.bssm-dev.com";

function initParamValues(params: ApiParam[] | undefined): ParamValues {
  if (!params) return {};
  return Object.fromEntries(params.map((p) => [p.name, p.example ?? ""]));
}

function initBodyText(bodyParams: ApiParam[] | undefined): string {
  if (!bodyParams || bodyParams.length === 0) return "";
  const examples: Record<string, unknown> = {};
  for (const p of bodyParams) {
    if (p.name) examples[p.name] = p.example ?? "";
  }
  return JSON.stringify(examples, null, 2);
}

function buildEndpointWithParams(
  endpoint: string,
  pathValues: ParamValues,
  queryValues: ParamValues
): string {
  let resolved = endpoint;
  for (const [key, value] of Object.entries(pathValues)) {
    resolved = resolved.replace(`{${key}}`, encodeURIComponent(value));
  }

  const queryEntries = Object.entries(queryValues).filter(([, v]) => v !== "");
  if (queryEntries.length > 0) {
    const qs = queryEntries
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join("&");
    resolved += (resolved.includes("?") ? "&" : "?") + qs;
  }
  return resolved;
}

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return "#0CA678";
  if (status >= 400 && status < 500) return "#F59F00";
  if (status >= 500) return "#FA5252";
  return "#6B7684";
}

export function TryItModal({ isOpen, onClose, apiDoc }: TryItModalProps) {
  const [mounted, setMounted] = useState(false);

  const [tokenUUID, setTokenUUID] = useState<string | null>(null);
  const [tokenError, setTokenError] = useState<string | null>(null);
  const [isLoadingToken, setIsLoadingToken] = useState(false);

  const [pathValues, setPathValues] = useState<ParamValues>(() =>
    initParamValues(apiDoc.pathParams)
  );
  const [queryValues, setQueryValues] = useState<ParamValues>(() =>
    initParamValues(apiDoc.queryParams)
  );
  const [headerValues, setHeaderValues] = useState<ParamValues>(() =>
    initParamValues(apiDoc.headerParams)
  );
  const [bodyText, setBodyText] = useState<string>(() =>
    initBodyText(apiDoc.bodyParams)
  );

  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    body: unknown;
  } | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchToken = useCallback(async () => {
    setIsLoadingToken(true);
    setTokenError(null);
    setTokenUUID(null);
    try {
      const data = await tokenApi.getTryItToken(apiDoc.id);
      setTokenUUID(data.tokenUUID);
    } catch (err) {
      setTokenError(
        err instanceof Error ? err.message : "토큰 조회에 실패했습니다."
      );
    } finally {
      setIsLoadingToken(false);
    }
  }, [apiDoc.id]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setResponse(null);
      setRequestError(null);
      setPathValues(initParamValues(apiDoc.pathParams));
      setQueryValues(initParamValues(apiDoc.queryParams));
      setHeaderValues(initParamValues(apiDoc.headerParams));
      setBodyText(initBodyText(apiDoc.bodyParams));
      fetchToken();
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen, apiDoc, fetchToken]);

  const handleSend = async () => {
    if (!tokenUUID || isSending) return;

    setIsSending(true);
    setResponse(null);
    setRequestError(null);

    try {
      const resolvedEndpoint = buildEndpointWithParams(
        apiDoc.endpoint,
        pathValues,
        queryValues
      );

      const normalizedBase = PROXY_BASE_URL.replace(/\/$/, "");
      const normalizedPath = resolvedEndpoint.startsWith("/")
        ? resolvedEndpoint
        : `/${resolvedEndpoint}`;
      const targetUrl = `${normalizedBase}${normalizedPath}`;

      const requestHeaders: Record<string, string> = {
        "bssm-dev-token": tokenUUID,
      };

      for (const [k, v] of Object.entries(headerValues)) {
        if (k && v) requestHeaders[k] = v;
      }

      const hasBody =
        bodyText.trim() &&
        apiDoc.method !== "GET" &&
        apiDoc.method !== "DELETE";

      if (hasBody) {
        requestHeaders["Content-Type"] = "application/json";
      }

      const res = await fetch(targetUrl, {
        method: apiDoc.method,
        headers: requestHeaders,
        body: hasBody ? bodyText.trim() : undefined,
      });

      const contentType = res.headers.get("content-type") ?? "";
      let responseBody: unknown;
      if (contentType.includes("application/json")) {
        responseBody = await res.json();
      } else {
        responseBody = await res.text();
      }

      setResponse({
        status: res.status,
        statusText: res.statusText,
        body: responseBody,
      });
    } catch (err) {
      setRequestError(
        err instanceof Error ? err.message : "요청 중 오류가 발생했습니다."
      );
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const hasPathParams = apiDoc.pathParams && apiDoc.pathParams.length > 0;
  const hasQueryParams = apiDoc.queryParams && apiDoc.queryParams.length > 0;
  const hasHeaderParams = apiDoc.headerParams && apiDoc.headerParams.length > 0;
  const hasBodyParams =
    apiDoc.bodyParams &&
    apiDoc.bodyParams.length > 0 &&
    apiDoc.method !== "GET";

  return createPortal(
    <Overlay>
      <Backdrop onClick={onClose} />
      <ModalContainer>
        <ModalHeader>
          <ModalTitle>Try It</ModalTitle>
          <CloseButton onClick={onClose} aria-label="닫기">✕</CloseButton>
        </ModalHeader>

        <EndpointBar>
          <HttpMethodTag method={apiDoc.method} />
          <EndpointText>{apiDoc.endpoint}</EndpointText>
        </EndpointBar>

        {isLoadingToken && <TokenStatus>토큰 불러오는 중...</TokenStatus>}
        {tokenError && (
          <TokenErrorBanner>
            토큰 조회 실패: {tokenError}
            <RetryButton onClick={fetchToken}>재시도</RetryButton>
          </TokenErrorBanner>
        )}

        <ParamArea>
          {hasPathParams && (
            <ParamGroup>
              <ParamGroupTitle>Path Params</ParamGroupTitle>
              {apiDoc.pathParams!.map((p) => (
                <ParamRow key={p.name}>
                  <ParamLabel>
                    {p.name}
                    {p.required && <Required>*</Required>}
                  </ParamLabel>
                  <ParamInput
                    placeholder={p.example ?? p.description}
                    value={pathValues[p.name] ?? ""}
                    onChange={(e) =>
                      setPathValues((prev) => ({
                        ...prev,
                        [p.name]: e.target.value,
                      }))
                    }
                  />
                </ParamRow>
              ))}
            </ParamGroup>
          )}

          {hasQueryParams && (
            <ParamGroup>
              <ParamGroupTitle>Query Params</ParamGroupTitle>
              {apiDoc.queryParams!.map((p) => (
                <ParamRow key={p.name}>
                  <ParamLabel>
                    {p.name}
                    {p.required && <Required>*</Required>}
                  </ParamLabel>
                  <ParamInput
                    placeholder={p.example ?? p.description}
                    value={queryValues[p.name] ?? ""}
                    onChange={(e) =>
                      setQueryValues((prev) => ({
                        ...prev,
                        [p.name]: e.target.value,
                      }))
                    }
                  />
                </ParamRow>
              ))}
            </ParamGroup>
          )}

          {hasHeaderParams && (
            <ParamGroup>
              <ParamGroupTitle>Header Params</ParamGroupTitle>
              {apiDoc.headerParams!.map((p) => (
                <ParamRow key={p.name}>
                  <ParamLabel>
                    {p.name}
                    {p.required && <Required>*</Required>}
                  </ParamLabel>
                  <ParamInput
                    placeholder={p.example ?? p.description}
                    value={headerValues[p.name] ?? ""}
                    onChange={(e) =>
                      setHeaderValues((prev) => ({
                        ...prev,
                        [p.name]: e.target.value,
                      }))
                    }
                  />
                </ParamRow>
              ))}
            </ParamGroup>
          )}

          {hasBodyParams && (
            <ParamGroup>
              <ParamGroupTitle>Body</ParamGroupTitle>
              <BodyTextarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="JSON body"
                spellCheck={false}
              />
            </ParamGroup>
          )}
        </ParamArea>

        <SendButton
          onClick={handleSend}
          disabled={!tokenUUID || isSending}
        >
          {isSending ? "요청 중..." : "요청 보내기"}
        </SendButton>

        {requestError && <ErrorText>{requestError}</ErrorText>}

        {response && (
          <ResponseArea>
            <ResponseHeader>
              <ResponseStatus color={statusColor(response.status)}>
                {response.status} {response.statusText}
              </ResponseStatus>
            </ResponseHeader>
            <ResponseBody>
              {typeof response.body === "string"
                ? response.body
                : JSON.stringify(response.body, null, 2)}
            </ResponseBody>
          </ResponseArea>
        )}
      </ModalContainer>
    </Overlay>,
    document.body
  );
}

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(4px);
  animation: fadeIn 0.15s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContainer = styled.div`
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 560px;
  max-height: 88vh;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: slideUp 0.15s ease-out;

  @keyframes slideUp {
    from { transform: translateY(12px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  @media (max-width: 600px) {
    max-width: 100%;
    max-height: 100dvh;
    border-radius: 12px 12px 0 0;
    align-self: flex-end;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #E5E7EB;
  flex-shrink: 0;
`;

const ModalTitle = styled.h2`
  font-family: "Flight Sans", sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: #191F28;
  margin: 0;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 18px;
  color: #6B7684;
  cursor: pointer;
  padding: 4px;
  line-height: 1;
  &:hover { color: #191F28; }
`;

const EndpointBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 24px;
  background: #F8FAFC;
  border-bottom: 1px solid #E5E7EB;
  flex-shrink: 0;
`;

const EndpointText = styled.span`
  font-family: "Spoqa Han Sans Neo", monospace;
  font-size: 13px;
  color: #374151;
  word-break: break-all;
`;

const TokenStatus = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #6B7684;
  padding: 8px 24px 0;
  margin: 0;
  flex-shrink: 0;
`;

const TokenErrorBanner = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 24px;
  background: #FFF4F4;
  border-bottom: 1px solid #FFA8A8;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #E03131;
  flex-shrink: 0;
`;

const RetryButton = styled.button`
  background: none;
  border: 1px solid #E03131;
  border-radius: 4px;
  color: #E03131;
  font-size: 12px;
  padding: 2px 8px;
  cursor: pointer;
  margin-left: auto;
`;

const ParamArea = styled.div`
  padding: 16px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ParamGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ParamGroupTitle = styled.h3`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #6B7684;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  margin: 0 0 4px;
`;

const ParamRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`;

const ParamLabel = styled.label`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #374151;
  min-width: 120px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 3px;
`;

const Required = styled.span`
  color: #FA5252;
  font-size: 12px;
`;

const ParamInput = styled.input`
  flex: 1;
  height: 32px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 0 10px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #191F28;
  outline: none;
  background: white;

  &:focus {
    border-color: #16335C;
    box-shadow: 0 0 0 2px rgba(22, 51, 92, 0.12);
  }
`;

const BodyTextarea = styled.textarea`
  width: 100%;
  min-height: 120px;
  border: 1px solid #E5E7EB;
  border-radius: 6px;
  padding: 10px;
  font-family: "Spoqa Han Sans Neo", monospace;
  font-size: 13px;
  color: #191F28;
  outline: none;
  resize: vertical;
  background: white;
  box-sizing: border-box;

  &:focus {
    border-color: #16335C;
    box-shadow: 0 0 0 2px rgba(22, 51, 92, 0.12);
  }
`;

const SendButton = styled.button`
  margin: 0 24px 16px;
  height: 40px;
  background: #16335C;
  color: white;
  border: none;
  border-radius: 8px;
  font-family: "Flight Sans", sans-serif;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:not(:disabled):hover {
    background: #1a3a68;
  }
`;

const ErrorText = styled.p`
  margin: 0 24px 12px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #FA5252;
  flex-shrink: 0;
`;

const ResponseArea = styled.div`
  margin: 0 24px 20px;
  border: 1px solid #E5E7EB;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
`;

const ResponseHeader = styled.div`
  padding: 8px 14px;
  background: #F8FAFC;
  border-bottom: 1px solid #E5E7EB;
`;

const ResponseStatus = styled.span<{ color: string }>`
  font-family: "Flight Sans", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: ${({ color }) => color};
`;

const ResponseBody = styled.pre`
  margin: 0;
  padding: 12px 14px;
  font-family: "Spoqa Han Sans Neo", monospace;
  font-size: 12px;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  background: white;
`;
