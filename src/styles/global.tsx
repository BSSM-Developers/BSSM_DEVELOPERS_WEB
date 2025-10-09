"use client";

import { css, Global } from "@emotion/react";

const globalStyle = css`
  * {
    box-sizing: border-box;
  }
  html, body {
    margin: 0;
    padding: 0;
    font-family: var(--font-geist-sans), sans-serif;
    background: #fafafa;
    color: #111827;
  }
`;

export const GlobalStyle = () => <Global styles={globalStyle} />;
