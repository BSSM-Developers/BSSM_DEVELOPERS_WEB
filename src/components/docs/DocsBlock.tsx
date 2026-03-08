"use client";

import styled from "@emotion/styled";
import { SerializedStyles, useTheme } from "@emotion/react";
import { docsModules, DocsModuleType } from "./modules";
import { ReactNode } from "react";

interface DocsBlockProps {
  module: DocsModuleType;
  children?: ReactNode;
}

export function DocsBlock({ module, children }: DocsBlockProps) {
  const theme = useTheme();
  return <Block moduleStyle={docsModules[module](theme)}>{children}</Block>;
}

const Block = styled("div", {
  shouldForwardProp: (prop) => prop !== "moduleStyle",
})<{ moduleStyle: SerializedStyles }>`
  ${({ moduleStyle }) => moduleStyle}
`;
