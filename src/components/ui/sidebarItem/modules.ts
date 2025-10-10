import { css } from "@emotion/react";

export const sidebarModules = {
  default: {
    base: ({ theme }: any) => css`
      height: 36px;
      color: ${theme.colors.text};
      &:hover {
        background: ${theme.colors.grey[100]};
      }
    `,
    active: ({ theme }: any) => css`
      background: ${theme.colors.grey[100]};
      color: ${theme.colors.bssmDarkBlue};
    `,
  },
  small: {
    base: ({ theme }: any) => css`
      height: 51px;
      color: ${theme.colors.text};
      &:hover {
        background: ${theme.colors.grey[100]};
      }
    `,
    active: ({ theme }: any) => css`
      background: ${theme.colors.grey[100]};
      color: ${theme.colors.bssmDarkBlue};
    `,
  },

  collapse: {
    base: ({ theme }: any) => css`
      justify-content: flex-start;
      gap: 6px;
      background: transparent;
      color: ${theme.colors.grey[700]};
      &:hover {
        background: ${theme.colors.grey[100]};
      }
    `,
    active: ({ theme }: any) => css`
      background: ${theme.colors.grey[200]};
      color: ${theme.colors.bssmDarkBlue};
    `,
  },

  api: {
    base: ({ theme }: any) => css`
      justify-content: space-between;
      background: ${theme.colors.grey[100]};
      color: ${theme.colors.grey[800]};
      &:hover {
        background: ${theme.colors.grey[200]};
      }
    `,
    active: ({ theme }: any) => css`
      border-left: 4px solid ${theme.colors.bssmBlue};
      background: ${theme.colors.grey[50]};
      color: ${theme.colors.bssmBlue};
      font-weight: 600;
    `,
  },

  main: {
    base: ({ theme }: any) => css`
      height: 83px;
      display: flex;
      align-items: flex-end;
      padding: 24px 16px;
      font-size: 20px;
      color: ${theme.colors.bssmGrey}
    `,
    active: () => css``,
  },

  mainTitle: {
    base: ({ theme }: any) => css`
      display: flex;
      align-items: flex-end;
      height: 63px;
      padding: 32px 24px;
      color: ${theme.colors.bssmGrey};
      font-size: 28px;
      text-underline-offset: 4px;
    `,
    active: () => css``,
  },
} as const;
