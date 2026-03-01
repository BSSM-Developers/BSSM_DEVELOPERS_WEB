"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { signUpApi } from "./api";

export const signUpKeys = {
  all: ["signUp"] as const,
  my: () => [...signUpKeys.all, "my"] as const,
};

export function useMyProfileQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: signUpKeys.my(),
    queryFn: () => signUpApi.getMy(),
    enabled,
    retry: false,
  });
}

export function useUpdatePurposeMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, purpose }: { id: number; purpose: string }) =>
      signUpApi.updatePurpose(id, purpose),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signUpKeys.my() });
    },
  });
}
