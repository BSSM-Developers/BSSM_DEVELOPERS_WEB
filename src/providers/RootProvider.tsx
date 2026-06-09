"use client";

import { AppThemeProvider } from "@/providers/ThemeProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { InputLengthGuard } from "@/components/common/InputLengthGuard";
import { PostHogProvider } from "@/providers/PostHogProvider";
import { TutorialEditorGate } from "@/components/onboarding/TutorialEditorGate";
import { TutorialPlayer } from "@/components/onboarding/TutorialPlayer";

export function RootProvider({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider>
      <QueryProvider>
        <AppThemeProvider>
          <InputLengthGuard />
          <TutorialPlayer />
          <TutorialEditorGate />
          {children}
        </AppThemeProvider>
      </QueryProvider>
    </PostHogProvider>
  );
}
