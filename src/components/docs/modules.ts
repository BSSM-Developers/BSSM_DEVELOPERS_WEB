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

  list: () => css`
    margin: 8px 0;
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

  image: () => css`
    display: flex;
    justify-content: center;
    margin: 32px 0;
    img {
      border-radius: 8px;
      max-width: 100%;
    }
  `,

  api: () => css`
    margin: 12px 0;
    width: 100%;
  `,

  big_space: () => css`
    height: 48px;
    width: 100%;
  `,

  space: () => css`
    height: 16px;
    width: 100%;
  `,
  main: () => css`
    width: 100%;
  `,
  main_title: () => css`
    width: 100%;
  `,
  default: () => css`
    width: 100%;
  `,
  collapse: () => css`
    width: 100%;
  `,
};

export type DocsModuleType = keyof typeof docsModules;