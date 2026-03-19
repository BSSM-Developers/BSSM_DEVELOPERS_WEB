"use client";

import { AppThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { InputLengthGuard } from "@/components/common/InputLengthGuard";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <AppThemeProvider>
        <InputLengthGuard />
        {children}
      </AppThemeProvider>
    </QueryProvider>
  );
}
