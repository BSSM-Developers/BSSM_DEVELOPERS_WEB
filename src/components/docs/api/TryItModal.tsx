"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
type ParamTab = "params" | "body" | "headers";

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
  const obj: Record<string, unknown> = {};
  for (const p of bodyParams) {
    if (p.name) obj[p.name] = p.example ?? "";
  }
  return JSON.stringify(obj, null, 2);
}

function highlightJson(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(
      /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g,
      (match) => {
        if (/^"/.test(match)) {
          if (/:$/.test(match)) {
            return `<span style="color:#79B8FF">${match}</span>`;
          }
          return `<span style="color:#9ECBFF">${match}</span>`;
        }
        if (/true|false/.test(match)) {
          return `<span style="color:#F97583">${match}</span>`;
        }
        if (/null/.test(match)) {
          return `<span style="color:#B392F0">${match}</span>`;
        }
        return `<span style="color:#F8C555">${match}</span>`;
      }
    );
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

function statusInfo(status: number): { text: string; bg: string; fg: string } {
  if (status >= 200 && status < 300)
    return { text: "2xx", bg: "#DCFCE7", fg: "#166534" };
  if (status >= 400 && status < 500)
    return { text: "4xx", bg: "#FEF3C7", fg: "#92400E" };
  if (status >= 500)
    return { text: "5xx", bg: "#FEE2E2", fg: "#991B1B" };
  return { text: "---", bg: "#F2F4F6", fg: "#4E5968" };
}

const MIN_W = 600;
const MIN_H = 400;
const DEFAULT_W = 1000;
const DEFAULT_H = 760;

type ResizeEdge = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const EDGE_CURSOR: Record<ResizeEdge, string> = {
  n: "ns-resize", s: "ns-resize",
  e: "ew-resize", w: "ew-resize",
  ne: "nesw-resize", sw: "nesw-resize",
  nw: "nwse-resize", se: "nwse-resize",
};

export function TryItModal({ isOpen, onClose, apiDoc }: TryItModalProps) {
  const [mounted, setMounted] = useState(false);
  const [modalRect, setModalRect] = useState({ width: DEFAULT_W, height: DEFAULT_H, top: 0, left: 0 });
  const dragRef = useRef<{
    edge: ResizeEdge;
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startTop: number;
    startLeft: number;
  } | null>(null);

  const handleMoveStart = useCallback(
    (e: React.MouseEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      e.preventDefault();
      const startX = e.clientX;
      const startY = e.clientY;
      const startTop = modalRect.top;
      const startLeft = modalRect.left;
      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";

      const onMouseMove = (ev: MouseEvent) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        setModalRect((prev) => ({
          ...prev,
          top: Math.max(0, Math.min(startTop + dy, window.innerHeight - prev.height)),
          left: Math.max(0, Math.min(startLeft + dx, window.innerWidth - prev.width)),
        }));
      };

      const onMouseUp = () => {
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [modalRect]
  );

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, edge: ResizeEdge) => {
      e.preventDefault();
      dragRef.current = {
        edge,
        startX: e.clientX,
        startY: e.clientY,
        startW: modalRect.width,
        startH: modalRect.height,
        startTop: modalRect.top,
        startLeft: modalRect.left,
      };
      document.body.style.userSelect = "none";
      document.body.style.cursor = EDGE_CURSOR[edge];

      const onMouseMove = (ev: MouseEvent) => {
        if (!dragRef.current) return;
        const { edge: ed, startX, startY, startW, startH, startTop, startLeft } = dragRef.current;
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;

        setModalRect((prev) => {
          let { width, height, top, left } = prev;

          if (ed === "e" || ed === "ne" || ed === "se") {
            width = Math.max(MIN_W, Math.min(startW + dx, window.innerWidth - startLeft - 8));
          }
          if (ed === "w" || ed === "nw" || ed === "sw") {
            const newW = Math.max(MIN_W, Math.min(startW - dx, startLeft + startW - 8));
            left = startLeft + startW - newW;
            width = newW;
          }
          if (ed === "s" || ed === "se" || ed === "sw") {
            height = Math.max(MIN_H, Math.min(startH + dy, window.innerHeight - startTop - 8));
          }
          if (ed === "n" || ed === "ne" || ed === "nw") {
            const newH = Math.max(MIN_H, Math.min(startH - dy, startTop + startH - 8));
            top = startTop + startH - newH;
            height = newH;
          }

          return { width, height, top, left };
        });
      };

      const onMouseUp = () => {
        dragRef.current = null;
        document.body.style.userSelect = "";
        document.body.style.cursor = "";
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    },
    [modalRect]
  );

  const [splitRatio, setSplitRatio] = useState<number | null>(null);
  const requestAreaRef = useRef<HTMLDivElement>(null);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  const handleDividerMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const containerH = splitContainerRef.current?.getBoundingClientRect().height ?? 400;
    const requestH = requestAreaRef.current?.getBoundingClientRect().height ?? 200;
    const startRatio = requestH / containerH;
    const startY = e.clientY;

    document.body.style.userSelect = "none";
    document.body.style.cursor = "ns-resize";

    const onMouseMove = (ev: MouseEvent) => {
      const dy = ev.clientY - startY;
      setSplitRatio(Math.max(0.1, Math.min(0.85, startRatio + dy / containerH)));
    };

    const onMouseUp = () => {
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

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
  const [bodyText, setBodyText] = useState(() => initBodyText(apiDoc.bodyParams));

  const pathCount = apiDoc.pathParams?.length ?? 0;
  const queryCount = apiDoc.queryParams?.length ?? 0;
  const headerCount = apiDoc.headerParams?.length ?? 0;
  const bodyCount = apiDoc.bodyParams?.length ?? 0;
  const paramsCount = pathCount + queryCount;
  const hasBody = bodyCount > 0 && apiDoc.method !== "GET";

  const getDefaultTab = (): ParamTab => {
    if (paramsCount > 0) return "params";
    if (hasBody) return "body";
    if (headerCount > 0) return "headers";
    return "params";
  };

  const [activeTab, setActiveTab] = useState<ParamTab>(getDefaultTab);
  const [isSending, setIsSending] = useState(false);
  const [response, setResponse] = useState<{
    status: number;
    statusText: string;
    body: unknown;
    time?: number;
  } | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  useEffect(() => { setMounted(true); }, []);

  const fetchToken = useCallback(async () => {
    setIsLoadingToken(true);
    setTokenError(null);
    setTokenUUID(null);
    try {
      const data = await tokenApi.getTryItToken(apiDoc.id);
      setTokenUUID(data.tokenUUID);
    } catch (err) {
      setTokenError(err instanceof Error ? err.message : "토큰 조회 실패");
    } finally {
      setIsLoadingToken(false);
    }
  }, [apiDoc.id]);

  useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = "unset";
      return () => { document.body.style.overflow = "unset"; };
    }
    document.body.style.overflow = "hidden";
    const w = Math.min(DEFAULT_W, window.innerWidth - 32);
    const h = Math.min(DEFAULT_H, window.innerHeight - 16);
    setModalRect({
      width: w,
      height: h,
      top: Math.max(16, (window.innerHeight - h) / 2),
      left: Math.max(16, (window.innerWidth - w) / 2),
    });
    setSplitRatio(null);
    setResponse(null);
    setRequestError(null);
    setPathValues(initParamValues(apiDoc.pathParams));
    setQueryValues(initParamValues(apiDoc.queryParams));
    setHeaderValues(initParamValues(apiDoc.headerParams));
    setBodyText(initBodyText(apiDoc.bodyParams));
    setActiveTab(getDefaultTab());
    fetchToken();
    return () => { document.body.style.overflow = "unset"; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, apiDoc, fetchToken]);

  const handleSend = async () => {
    if (!tokenUUID || isSending) return;
    setIsSending(true);
    setResponse(null);
    setRequestError(null);
    const t0 = Date.now();

    try {
      const resolvedEndpoint = buildEndpointWithParams(apiDoc.endpoint, pathValues, queryValues);
      const targetUrl = `${PROXY_BASE_URL.replace(/\/$/, "")}${resolvedEndpoint.startsWith("/") ? resolvedEndpoint : `/${resolvedEndpoint}`}`;

      const reqHeaders: Record<string, string> = { "bssm-dev-token": tokenUUID };
      for (const [k, v] of Object.entries(headerValues)) {
        if (k && v) reqHeaders[k] = v;
      }
      const sendBody = bodyText.trim() && apiDoc.method !== "GET" && apiDoc.method !== "DELETE";
      if (sendBody) reqHeaders["Content-Type"] = "application/json";

      const res = await fetch(targetUrl, {
        method: apiDoc.method,
        headers: reqHeaders,
        body: sendBody ? bodyText.trim() : undefined,
      });

      const contentType = res.headers.get("content-type") ?? "";
      const body = contentType.includes("application/json")
        ? await res.json()
        : await res.text();

      setResponse({ status: res.status, statusText: res.statusText, body, time: Date.now() - t0 });
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : "요청 중 오류가 발생했습니다.");
    } finally {
      setIsSending(false);
    }
  };

  if (!mounted || !isOpen) return null;

  const tabLabels: Record<ParamTab, string> = {
    params: "Params",
    body: "Body",
    headers: "Headers",
  };

  const responseBodyStr = response
    ? typeof response.body === "string"
      ? response.body
      : JSON.stringify(response.body, null, 2)
    : "";

  const si = response ? statusInfo(response.status) : null;
  const fullUrl = `${PROXY_BASE_URL}${apiDoc.endpoint}`;

  return createPortal(
    <Overlay>
      <Backdrop onClick={onClose} />
      <Modal style={{ width: modalRect.width, height: modalRect.height, top: modalRect.top, left: modalRect.left }}>
        <ResizeEdgeN  onMouseDown={(e) => handleResizeStart(e, "n")} />
        <ResizeEdgeS  onMouseDown={(e) => handleResizeStart(e, "s")} />
        <ResizeEdgeE  onMouseDown={(e) => handleResizeStart(e, "e")} />
        <ResizeEdgeW  onMouseDown={(e) => handleResizeStart(e, "w")} />
        <ResizeCorner $cursor="nwse-resize" style={{ top: 0, left: 0 }}    onMouseDown={(e) => handleResizeStart(e, "nw")} />
        <ResizeCorner $cursor="nesw-resize" style={{ top: 0, right: 0 }}   onMouseDown={(e) => handleResizeStart(e, "ne")} />
        <ResizeCorner $cursor="nesw-resize" style={{ bottom: 0, left: 0 }} onMouseDown={(e) => handleResizeStart(e, "sw")} />
        <ResizeCorner $cursor="nwse-resize" style={{ bottom: 0, right: 0 }} onMouseDown={(e) => handleResizeStart(e, "se")} />

        {/* ── 헤더 ── */}
        <ModalHeader onMouseDown={handleMoveStart}>
          <HeaderLeft>
            <ApiNameText title={apiDoc.name}>{apiDoc.name}</ApiNameText>
          </HeaderLeft>
          <CloseBtn onClick={onClose} aria-label="닫기">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/>
            </svg>
          </CloseBtn>
        </ModalHeader>

        {/* ── URL 바 ── */}
        <UrlBar>
          <HttpMethodTag method={apiDoc.method} />
          <UrlText title={fullUrl}>{fullUrl}</UrlText>
          <TokenIndicator>
            {isLoadingToken && (
              <><TokenDot color="#F3A941" pulse /><TokenText>토큰 로딩 중</TokenText></>
            )}
            {tokenError && (
              <>
                <TokenDot color="#E6333F" />
                <TokenText error>{tokenError}</TokenText>
                <RetryBtn onClick={fetchToken}>재시도</RetryBtn>
              </>
            )}
            {tokenUUID && !isLoadingToken && (
              <><TokenDot color="#00A9A4" /><TokenText>준비됨</TokenText></>
            )}
          </TokenIndicator>
          <SendBtn onClick={handleSend} disabled={!tokenUUID || isSending}>
            {isSending
              ? <><BtnSpinner />전송 중...</>
              : <>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M1.5 6.5h10M11.5 6.5L7 2m4.5 4.5L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  전송
                </>
            }
          </SendBtn>
        </UrlBar>

        {/* ── 파라미터 탭 ── */}
        <TabBar>
          {(["params", ...(hasBody ? ["body"] : []), ...(headerCount > 0 ? ["headers"] : [])] as ParamTab[]).map((tab) => {
            const count = tab === "params" ? paramsCount : tab === "body" ? bodyCount : headerCount;
            return (
              <TabBtn key={tab} active={activeTab === tab} onClick={() => setActiveTab(tab)}>
                {tabLabels[tab]}
                {count > 0 && <TabBadge active={activeTab === tab}>{count}</TabBadge>}
              </TabBtn>
            );
          })}
        </TabBar>

        {/* ── 파라미터 편집 영역 + 구분선 + 응답 ── */}
        <SplitContainer ref={splitContainerRef}>
        <RequestArea ref={requestAreaRef} style={{ flex: splitRatio !== null ? splitRatio : 1 }}>
          {activeTab === "params" && (
            <>
              {paramsCount === 0 ? (
                <EmptySection>파라미터가 없습니다.</EmptySection>
              ) : (
                <ParamTableWrap>
                  {pathCount > 0 && (
                    <ParamGroup>
                      <ParamGroupLabel>Path Parameters</ParamGroupLabel>
                      {apiDoc.pathParams!.map((p) => (
                        <ParamRow key={p.name}>
                          <ParamNameCell>
                            <PName>{p.name}</PName>
                            {p.required && <ReqMark>*</ReqMark>}
                            <PType>{p.type}</PType>
                          </ParamNameCell>
                          <ParamInputCell>
                            <StyledInput
                              placeholder={p.example ?? p.description ?? `Enter ${p.name}`}
                              value={pathValues[p.name] ?? ""}
                              onChange={(e) => setPathValues((v) => ({ ...v, [p.name]: e.target.value }))}
                            />
                          </ParamInputCell>
                        </ParamRow>
                      ))}
                    </ParamGroup>
                  )}
                  {queryCount > 0 && (
                    <ParamGroup>
                      <ParamGroupLabel>Query Parameters</ParamGroupLabel>
                      {apiDoc.queryParams!.map((p) => (
                        <ParamRow key={p.name}>
                          <ParamNameCell>
                            <PName>{p.name}</PName>
                            {p.required && <ReqMark>*</ReqMark>}
                            <PType>{p.type}</PType>
                          </ParamNameCell>
                          <ParamInputCell>
                            <StyledInput
                              placeholder={p.example ?? p.description ?? `Enter ${p.name}`}
                              value={queryValues[p.name] ?? ""}
                              onChange={(e) => setQueryValues((v) => ({ ...v, [p.name]: e.target.value }))}
                            />
                          </ParamInputCell>
                        </ParamRow>
                      ))}
                    </ParamGroup>
                  )}
                </ParamTableWrap>
              )}
            </>
          )}

          {activeTab === "body" && hasBody && (
            <BodyEditorWrap>
              <BodyTextarea
                value={bodyText}
                onChange={(e) => setBodyText(e.target.value)}
                placeholder="{}"
                spellCheck={false}
              />
            </BodyEditorWrap>
          )}

          {activeTab === "headers" && headerCount > 0 && (
            <ParamTableWrap>
              <ParamGroup>
                <ParamGroupLabel>Header Parameters</ParamGroupLabel>
                {apiDoc.headerParams!.map((p) => (
                  <ParamRow key={p.name}>
                    <ParamNameCell>
                      <PName>{p.name}</PName>
                      {p.required && <ReqMark>*</ReqMark>}
                      <PType>{p.type}</PType>
                    </ParamNameCell>
                    <ParamInputCell>
                      <StyledInput
                        placeholder={p.example ?? p.description ?? `Enter ${p.name}`}
                        value={headerValues[p.name] ?? ""}
                        onChange={(e) => setHeaderValues((v) => ({ ...v, [p.name]: e.target.value }))}
                      />
                    </ParamInputCell>
                  </ParamRow>
                ))}
              </ParamGroup>
            </ParamTableWrap>
          )}
        </RequestArea>

        {/* ── 구분선 ── */}
        <Divider onMouseDown={handleDividerMouseDown}>
          <DividerHandle />
        </Divider>

        {/* ── 응답 영역 ── */}
        <ResponseArea style={{ flex: splitRatio !== null ? 1 - splitRatio : 1 }}>
          <ResponseHeader>
            <ResponseLabel>응답</ResponseLabel>
            {si && response && (
              <ResponseMeta>
                <StatusChip bg={si.bg} fg={si.fg}>
                  {response.status} {response.statusText}
                </StatusChip>
                {response.time !== undefined && (
                  <TimeText>{response.time}ms</TimeText>
                )}
              </ResponseMeta>
            )}
          </ResponseHeader>

          <ResponseBody>
            {requestError && (
              <ErrorState>
                <ErrorIcon>
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                    <circle cx="16" cy="16" r="14" stroke="#E6333F" strokeWidth="1.5"/>
                    <path d="M16 9v9M16 21v2" stroke="#E6333F" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </ErrorIcon>
                <ErrorMsg>{requestError}</ErrorMsg>
              </ErrorState>
            )}

            {!response && !isSending && !requestError && (
              <EmptyState>
                <EmptyMsg>응답을 받으려면 전송을 클릭하세요.</EmptyMsg>
              </EmptyState>
            )}

            {isSending && (
              <EmptyState>
                <LoadingRing />
                <EmptyMsg>응답을 기다리는 중...</EmptyMsg>
              </EmptyState>
            )}

            {response && !isSending && (
              <ResponseCode>
                {responseBodyStr ? (
                  <pre dangerouslySetInnerHTML={{ __html: highlightJson(responseBodyStr) }} />
                ) : (
                  <pre style={{ color: "#8B95A1" }}>(빈 응답)</pre>
                )}
              </ResponseCode>
            )}
          </ResponseBody>
        </ResponseArea>
        </SplitContainer>

      </Modal>
    </Overlay>,
    document.body
  );
}

/* ─── Styled Components ─── */

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 9999;
`;

const Backdrop = styled.div`
  position: absolute;
  inset: 0;
  background: rgba(25, 31, 40, 0.45);
  backdrop-filter: blur(3px);
  animation: fadeIn 0.18s ease-out;
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
`;

const Modal = styled.div`
  position: absolute;
  z-index: 1;
  background: white;
  border-radius: 12px;
  border: 1px solid #E5E8EB;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 24px 60px rgba(25, 31, 40, 0.18), 0 4px 16px rgba(25, 31, 40, 0.08);
  animation: popIn 0.2s cubic-bezier(0.34, 1.15, 0.64, 1);

  @keyframes popIn {
    from { transform: scale(0.97) translateY(4px); opacity: 0; }
    to   { transform: scale(1)    translateY(0);   opacity: 1; }
  }

  @media (max-width: 640px) {
    top: auto !important;
    left: 0 !important;
    bottom: 0;
    width: 100% !important;
    height: 92dvh !important;
    border-radius: 12px 12px 0 0;
  }
`;

const HANDLE_SIZE = 6;
const CORNER_SIZE = 14;

const ResizeEdgeN = styled.div`
  position: absolute; z-index: 10;
  top: 0; left: ${CORNER_SIZE}px;
  width: calc(100% - ${CORNER_SIZE * 2}px); height: ${HANDLE_SIZE}px;
  cursor: ns-resize;
`;

const ResizeEdgeS = styled.div`
  position: absolute; z-index: 10;
  bottom: 0; left: ${CORNER_SIZE}px;
  width: calc(100% - ${CORNER_SIZE * 2}px); height: ${HANDLE_SIZE}px;
  cursor: ns-resize;
`;

const ResizeEdgeE = styled.div`
  position: absolute; z-index: 10;
  right: 0; top: ${CORNER_SIZE}px;
  height: calc(100% - ${CORNER_SIZE * 2}px); width: ${HANDLE_SIZE}px;
  cursor: ew-resize;
`;

const ResizeEdgeW = styled.div`
  position: absolute; z-index: 10;
  left: 0; top: ${CORNER_SIZE}px;
  height: calc(100% - ${CORNER_SIZE * 2}px); width: ${HANDLE_SIZE}px;
  cursor: ew-resize;
`;

const ResizeCorner = styled.div<{ $cursor: string }>`
  position: absolute; z-index: 11;
  width: ${CORNER_SIZE}px; height: ${CORNER_SIZE}px;
  cursor: ${({ $cursor }) => $cursor};
`;

/* ── 헤더 ── */
const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1px solid #E5E8EB;
  background: white;
  flex-shrink: 0;
  cursor: grab;
  &:active { cursor: grabbing; }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
`;

const ApiNameText = styled.span`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 15px;
  font-weight: 700;
  color: #191F28;
  letter-spacing: -0.4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const CloseBtn = styled.button`
  background: none;
  border: none;
  color: #B0B8C1;
  cursor: pointer !important;
  padding: 4px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  flex-shrink: 0;
  transition: color 0.15s, background 0.15s;
  &:hover { color: #4E5968; background: #F2F4F6; }
`;

/* ── URL 바 ── */
const UrlBar = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 20px;
  background: #F9FAFB;
  border-bottom: 1px solid #E5E8EB;
  flex-shrink: 0;
`;

const UrlText = styled.code`
  flex: 1;
  font-family: "SFMono-Regular", "Fira Code", monospace;
  font-size: 12.5px;
  color: #4E5968;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  min-width: 0;
`;

const TokenIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  flex-shrink: 0;
`;

const TokenDot = styled.span<{ color: string; pulse?: boolean }>`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: ${({ color }) => color};
  flex-shrink: 0;
  ${({ pulse }) => pulse && `
    animation: pulse 1.1s ease-in-out infinite;
    @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.25} }
  `}
`;

const TokenText = styled.span<{ error?: boolean }>`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 11.5px;
  color: ${({ error }) => error ? "#E6333F" : "#8B95A1"};
  letter-spacing: -0.2px;
`;

const RetryBtn = styled.button`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 11px;
  font-weight: 500;
  color: #E6333F;
  background: none;
  border: 1px solid #F9A8A8;
  border-radius: 4px;
  padding: 2px 7px;
  cursor: pointer;
  &:hover { background: #FEF2F2; }
`;

const SendBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 20px;
  background: #16335C;
  color: white;
  border: none;
  border-radius: 7px;
  font-family: "Flight Sans", sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(22, 51, 92, 0.25);
  transition: background 0.15s, opacity 0.15s;

  &:disabled { opacity: 0.45; cursor: not-allowed; }
  &:not(:disabled):hover  { background: #1e4080; }
  &:not(:disabled):active { background: #0f2340; }
`;

const BtnSpinner = styled.span`
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

/* ── 탭 바 ── */
const TabBar = styled.div`
  display: flex;
  padding: 0 20px;
  background: white;
  border-bottom: 1px solid #E5E8EB;
  flex-shrink: 0;
`;

const TabBtn = styled.button<{ active: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 10px 14px 9px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: ${({ active }) => (active ? "700" : "400")};
  color: ${({ active }) => (active ? "#16335C" : "#8B95A1")};
  background: none;
  border: none;
  border-bottom: 2px solid ${({ active }) => (active ? "#16335C" : "transparent")};
  cursor: pointer;
  letter-spacing: -0.2px;
  transition: color 0.15s, border-color 0.15s;

  &:hover {
    color: ${({ active }) => (active ? "#16335C" : "#4E5968")};
  }
`;

const TabBadge = styled.span<{ active: boolean }>`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 10px;
  font-weight: 700;
  color: ${({ active }) => (active ? "#16335C" : "#8B95A1")};
  background: ${({ active }) => (active ? "#EEF2F8" : "#F2F4F6")};
  border-radius: 8px;
  padding: 1px 5px;
`;

const SplitContainer = styled.div`
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
`;

/* ── 파라미터 영역 ── */
const RequestArea = styled.div`
  min-height: 0;
  overflow-y: auto;
  background: white;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: #D1D6DB; border-radius: 3px; }
`;

const EmptySection = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #B0B8C1;
  padding: 28px 24px;
  margin: 0;
`;

const ParamTableWrap = styled.div`
  padding: 16px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const ParamGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const ParamGroupLabel = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 11px;
  font-weight: 700;
  color: #8B95A1;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  margin: 0 0 8px;
`;

const ParamRow = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #F2F4F6;

  &:last-child { border-bottom: none; }
`;

const ParamNameCell = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  width: 200px;
  flex-shrink: 0;
`;

const PName = styled.span`
  font-family: "SFMono-Regular", "Fira Code", monospace;
  font-size: 13px;
  font-weight: 500;
  color: #191F28;
  letter-spacing: -0.2px;
`;

const ReqMark = styled.span`
  color: #E6333F;
  font-size: 12px;
  line-height: 1;
`;

const PType = styled.span`
  font-family: "SFMono-Regular", "Fira Code", monospace;
  font-size: 11px;
  color: #B0B8C1;
`;

const ParamInputCell = styled.div`
  flex: 1;
  min-width: 0;
`;

const StyledInput = styled.input`
  width: 100%;
  height: 34px;
  border: 1px solid #E5E8EB;
  border-radius: 6px;
  padding: 0 11px;
  font-family: "SFMono-Regular", "Fira Code", monospace;
  font-size: 13px;
  color: #191F28;
  background: white;
  outline: none;
  box-sizing: border-box;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder { color: #D1D6DB; }
  &:focus {
    border-color: #16335C;
    box-shadow: 0 0 0 3px rgba(22, 51, 92, 0.08);
  }
`;

const BodyEditorWrap = styled.div`
  padding: 16px 24px;
  height: calc(100% - 32px);
  box-sizing: border-box;
`;

const BodyTextarea = styled.textarea`
  width: 100%;
  height: 100%;
  min-height: 160px;
  border: 1px solid #E5E8EB;
  border-radius: 8px;
  padding: 12px 14px;
  font-family: "SFMono-Regular", "Fira Code", monospace;
  font-size: 13px;
  color: #191F28;
  background: white;
  outline: none;
  resize: none;
  box-sizing: border-box;
  line-height: 1.7;
  transition: border-color 0.15s, box-shadow 0.15s;

  &::placeholder { color: #D1D6DB; }
  &:focus {
    border-color: #16335C;
    box-shadow: 0 0 0 3px rgba(22, 51, 92, 0.08);
  }
`;

/* ── 구분선 ── */
const Divider = styled.div`
  height: 24px;
  background: #F9FAFB;
  border-top: 1px solid #E5E8EB;
  border-bottom: 1px solid #E5E8EB;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  cursor: row-resize;
`;

const DividerHandle = styled.div`
  width: 32px;
  height: 3px;
  background: #D1D6DB;
  border-radius: 2px;
`;

/* ── 응답 영역 ── */
const ResponseArea = styled.div`
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: white;
  overflow: hidden;
`;

const ResponseHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 24px;
  border-bottom: 1px solid #E5E8EB;
  background: #F9FAFB;
  flex-shrink: 0;
`;

const ResponseLabel = styled.span`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  font-weight: 700;
  color: #4E5968;
  letter-spacing: -0.3px;
`;

const ResponseMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const StatusChip = styled.span<{ bg: string; fg: string }>`
  font-family: "Flight Sans", monospace;
  font-size: 12px;
  font-weight: 700;
  background: ${({ bg }) => bg};
  color: ${({ fg }) => fg};
  border-radius: 5px;
  padding: 2px 9px;
`;

const TimeText = styled.span`
  font-family: "SFMono-Regular", monospace;
  font-size: 11px;
  color: #8B95A1;
`;

const ResponseBody = styled.div`
  flex: 1;
  overflow-y: auto;
  background: #1E2432;
  display: flex;
  flex-direction: column;

  &::-webkit-scrollbar { width: 5px; }
  &::-webkit-scrollbar-track { background: transparent; }
  &::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.12); border-radius: 3px; }
`;

const EmptyState = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 32px;
`;

const EmptyMsg = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #4B5A6E;
  margin: 0;
  letter-spacing: -0.3px;
`;

const LoadingRing = styled.div`
  width: 26px;
  height: 26px;
  border: 2.5px solid rgba(22, 51, 92, 0.15);
  border-top-color: #16335C;
  border-radius: 50%;
  animation: spin 0.75s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

const ErrorState = styled(EmptyState)``;

const ErrorIcon = styled.div``;

const ErrorMsg = styled.p`
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-size: 13px;
  color: #E6333F;
  margin: 0;
  text-align: center;
  letter-spacing: -0.3px;
`;

const ResponseCode = styled.div`
  padding: 16px 24px;

  pre {
    margin: 0;
    font-family: "SFMono-Regular", "Fira Code", monospace;
    font-size: 13px;
    color: #CDD9E5;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.75;
  }
`;
