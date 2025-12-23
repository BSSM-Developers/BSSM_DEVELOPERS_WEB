"use client";

import styled from "@emotion/styled";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "UPDATE";

type HttpMethodTagProps = {
  method: HttpMethod;
  className?: string;
};

const colorMap: Record<HttpMethod, { bg: string; text: string; bgHover?: string }> = {
  GET: { bg: "#E4F6EC", text: "#19B26B" },
  POST: { bg: "#FDEDE4", text: "#F06820" },
  PUT: { bg: "#FEF3C7", text: "#D97706" },
  DELETE: { bg: "#FDE9E7", text: "#F14437" },
  PATCH: { bg: "#EDE9FE", text: "#8B5CF6" },
  UPDATE: { bg: "#E0F2FE", text: "#0284C7" }
};

export function HttpMethodTag({ method, className }: HttpMethodTagProps) {
  return (
    <StyledTag method={method} className={className}>
      {method}
    </StyledTag>
  );
}

const StyledTag = styled.span<{ method: HttpMethod }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 0;
  width: 72px;
  height: 24px;
  border-radius: 3px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  font-weight: 500;
  font-size: 12px;
  line-height: 1;
  text-align: center;
  letter-spacing: -0.6px;

  background: ${({ method }) => colorMap[method].bg};
  color: ${({ method }) => colorMap[method].text};
`;