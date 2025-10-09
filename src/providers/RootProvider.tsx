"use client";

import { AppThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AppThemeProvider>{children}</AppThemeProvider>
    </QueryProvider>
  );
}