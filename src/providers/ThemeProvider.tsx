"use client";

import * as Emotion from "@emotion/react";
import { lightTheme } from "@/lib/theme";
import { GlobalStyle } from "@/styles/global";

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <Emotion.ThemeProvider theme={lightTheme}>
      <GlobalStyle />
      {children}
    </Emotion.ThemeProvider>
  );
}
