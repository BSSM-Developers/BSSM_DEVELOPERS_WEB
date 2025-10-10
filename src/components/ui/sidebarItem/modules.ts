import { css } from "@emotion/react";

export const sidebarModules = {
  default: {
    base: ({ theme }: any) => css`
      height: 51px;
      padding: 16px 13px 15px 15px;
      color: ${theme.colors.text};
      ${theme.typography.Body_1};
      &:hover {
        background: ${theme.colors.grey[100]};
      }
    `,
    active: ({ theme }: any) => css`
      ${theme.typography.Body_3};
      background: ${theme.colors.grey[100]};
      color: ${theme.colors.bssmDarkBlue};
    `,
  },
  small: {
    base: ({ theme }: any) => css`
      height: 36px;
      padding: 11px 13px 13px 37px;
      ${theme.typography.Body_2};
      color: ${theme.colors.text};
      &:hover {
        background: ${theme.colors.grey[100]};
      }
    `,
    active: ({ theme }: any) => css`
      ${theme.typography.Body_4};
      background: ${theme.colors.grey[100]};
      color: ${theme.colors.bssmDarkBlue};
    `,
  },

  collapse: {
    base: ({ theme }: any) => css`
      justify-content: flex-start;
      gap: 6px;
      background: transparent;
      color: ${theme.colors.text};
      &:hover {
        background: ${theme.colors.grey[100]};
      }
    `,
    active: () => css``,
  },

  api: {
    base: ({ theme }: any) => css`
      justify-content: space-between;
      color: ${theme.colors.grey[800]};
      &:hover {
        background: ${theme.colors.grey[100]};
      }
    `,
    active: ({ theme }: any) => css`
      border-left: 4px solid ${theme.colors.bssmBlue};
      background: ${theme.colors.grey[100]};
      color: ${theme.colors.bssmBlue};
    `,
  },

  main: {
    base: ({ theme }: any) => css`
      height: 83px;
      display: flex;
      align-items: flex-end;
      padding: 26px 13px 11px 5px;
      font-size: 20px;
      ${theme.typography.Body_1};
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
      ${theme.typography.Caption_2};
    `,
    active: () => css``,
  },
} as const;
