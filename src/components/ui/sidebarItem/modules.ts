import { css, Theme } from "@emotion/react";

type ThemeProps = {
  theme: Theme;
};
import { applyTypography } from "../../../lib/themeHelper";

export const sidebarModules = {
  default: {
    base: ({ theme }: ThemeProps) => css`
      height: 48px;
      padding: 16px 13px 15px 15px;
      color: ${String(theme.colors.text)};
      ${applyTypography(theme, "Body_1")}
      &:hover {
        background: ${theme.colors.grey[100]};
      }
    `,
    active: ({ theme }: ThemeProps) => css`
      ${applyTypography(theme, "Body_3")}
      background: ${theme.colors.grey[100]};
      color: ${theme.colors.bssmDarkBlue};
    `,
  },
  small: {
    base: ({ theme }: ThemeProps) => css`
      height: 36px;
      padding: 11px 13px 13px 37px;
      ${applyTypography(theme, "Body_2")}
      color: ${String(theme.colors.text)};
      &:hover {
        background: ${theme.colors.grey[100]};
      }
    `,
    active: ({ theme }: ThemeProps) => css`
      ${applyTypography(theme, "Body_4")}
      background: ${theme.colors.grey[100]};
      color: ${theme.colors.bssmDarkBlue};
    `,
  },

  collapse: {
    base: ({ theme }: ThemeProps) => css`
      justify-content: flex-start;
      gap: 6px;
      background: transparent;
      color: ${String(theme.colors.text)};
      &:hover {
        background: ${theme.colors.grey[100]};
      }
    `,
    active: () => css``,
  },

  api: {
    base: ({ theme }: ThemeProps) => css`
      justify-content: space-between;
      height: 48px;
      color: ${theme.colors.grey[800]};
      &:hover {
        background: ${theme.colors.grey[100]};
      }
    `,
    active: ({ theme }: ThemeProps) => css`
      /* border-left removed */
      background: ${theme.colors.grey[100]};
      color: ${theme.colors.bssmBlue};
    `,
  },

  main: {
    base: ({ theme }: ThemeProps) => css`
      height: 83px;
      display: flex;
      align-items: flex-end;
      padding: 26px 13px 11px 5px;
      font-size: 20px;
      ${applyTypography(theme, "Body_1")}
      color: ${theme.colors.bssmGrey}
    `,
    active: () => css``,
  },

  mainTitle: {
    base: ({ theme }: ThemeProps) => css`
      display: flex;
      align-items: flex-end;
      height: 63px;
      padding: 32px 24px;
      color: ${theme.colors.bssmGrey};
      ${applyTypography(theme, "Caption_2")}
    `,
    active: () => css``,
  },
} as const;
