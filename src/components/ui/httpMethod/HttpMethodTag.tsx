"use client";

import styled from "@emotion/styled";

export type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type HttpMethodTagProps = {
  method: HttpMethod;
  className?: string;
  size?: "small" | "medium";
};

const colorMap: Record<HttpMethod, { bg: string; text: string; bgHover?: string }> = {
  GET: { bg: "#E4F6EC", text: "#19B26B" },
  POST: { bg: "#FDEDE4", text: "#F06820" },
  PUT: { bg: "#FEF3C7", text: "#D97706" },
  DELETE: { bg: "#FDE9E7", text: "#F14437" },
  PATCH: { bg: "#EDE9FE", text: "#8B5CF6" }
};

export function HttpMethodTag({ method, className, size = "medium" }: HttpMethodTagProps) {
  return (
    <StyledTag method={method} className={className} size={size}>
      {method}
    </StyledTag>
  );
}

const StyledTag = styled.span<{ method: HttpMethod; size: "small" | "medium" }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-family: "Spoqa Han Sans Neo", sans-serif;
  line-height: 1;
  text-align: center;
  
  ${({ size }) => size === "medium" ? `
    padding: 8px 12px;
    min-width: 80px;
    height: 32px;
    font-weight: 600;
    font-size: 13px;
    letter-spacing: -0.3px;
  ` : `
    padding: 2px 6px;
    min-width: 40px;
    height: 20px;
    font-weight: 600;
    font-size: 10px;
    letter-spacing: 0;
  `}

  background: ${({ method }) => colorMap[method].bg};
  color: ${({ method }) => colorMap[method].text};
`;
