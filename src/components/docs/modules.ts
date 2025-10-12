/** @jsxImportSource @emotion/react */
import { css, Theme } from "@emotion/react";
import { applyTypography } from "@/lib/themeHelper";

export const docsModules = {
  headline_1: (theme: Theme) => css`
    ${applyTypography(theme, "Headline_1")}
    color: ${theme.colors.grey[900]};
  `,
  headline_2: (theme: Theme) => css`
    ${applyTypography(theme, "Headline_2")}
    color: ${theme.colors.grey[900]};
  `,

  docs_1: (theme: Theme) => css`
    ${applyTypography(theme, "Docs_1")}
    color: ${theme.colors.grey[600]};
  `,

  list: (theme: Theme) => css`
    margin: 12px 0;
    padding-left: 20px;
    li {
      list-style: disc;
      margin-bottom: 4px;
    }
  `,

  code: (theme: Theme) => css`
    background: ${theme.colors.grey[100]};
    font-family: monospace;
    border-radius: 8px;
    padding: 12px;
    white-space: pre-wrap;
  `,

  image: (theme: Theme) => css`
    display: flex;
    justify-content: center;
    margin: 32px 0;
    img {
      border-radius: 8px;
      max-width: 100%;
    }
  `,
  
  space: (theme: Theme) => css`
    margin-bottom: 4px;
  `,

  big_space: (theme: Theme) => css`
    margin-bottom: 72px;
  `,
};

export type DocsModuleType = keyof typeof docsModules;