/** @jsxImportSource @emotion/react */
"use client";

import styled from "@emotion/styled";
import { useTheme } from "@emotion/react";
import { docsModules, DocsModuleType } from "./modules";
import { ReactNode } from "react";

interface DocsBlockProps {
  module: DocsModuleType;
  children?: ReactNode;
}

export function DocsBlock({ module, children }: DocsBlockProps) {
  const theme = useTheme();
  return <Block css={docsModules[module](theme)}>{children}</Block>;
}

const Block = styled.div``;