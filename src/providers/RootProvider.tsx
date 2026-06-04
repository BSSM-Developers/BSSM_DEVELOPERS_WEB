"use client";

import { AppThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { InputLengthGuard } from "@/components/common/InputLengthGuard";
import { PostHogProvider } from "@/providers/PostHogProvider";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <QueryProvider>
        <AppThemeProvider>
          <InputLengthGuard />
          {children}
        </AppThemeProvider>
      </QueryProvider>
    </PostHogProvider>
  );
}
