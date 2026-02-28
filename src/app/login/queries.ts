"use client";

import { useMutation } from "@tanstack/react-query";
import { authApi } from "./api";

export const authKeys = {
  all: ["auth"] as const,
};

export function useLoginMutation() {
  return useMutation({
    mutationFn: ({ code, codeVerifier }: { code: string; codeVerifier: string }) =>
      authApi.loginWithGoogle(code, codeVerifier),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => authApi.logout(),
  });
}
