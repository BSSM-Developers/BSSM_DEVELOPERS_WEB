"use client";

import styled from "@emotion/styled";

export const DocsParagraph = styled.p`
  ${({ theme }) => theme.typography.Docs_1};
  color: ${({ theme }) => theme.colors.grey[600]};
  margin-bottom: 8px;
`;