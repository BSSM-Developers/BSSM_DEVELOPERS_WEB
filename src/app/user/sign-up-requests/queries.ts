"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { signUpRequestApi } from "./api";

export const signUpRequestKeys = {
  all: ["signup-requests"] as const,
  list: (cursor?: number, size?: number) =>
    [...signUpRequestKeys.all, "list", cursor, size] as const,
};

export function useSignUpRequestListQuery(
  params: { cursor?: number; size?: number } = {},
  enabled: boolean = true
) {
  return useQuery({
    queryKey: signUpRequestKeys.list(params.cursor, params.size),
    queryFn: () => signUpRequestApi.getList(params.cursor, params.size),
    enabled,
  });
}

export function useApproveSignUpRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (signupRequestId: number) => signUpRequestApi.approve(signupRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signUpRequestKeys.all });
    },
  });
}

export function useRejectSignUpRequestMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (signupRequestId: number) => signUpRequestApi.reject(signupRequestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: signUpRequestKeys.all });
    },
  });
}
