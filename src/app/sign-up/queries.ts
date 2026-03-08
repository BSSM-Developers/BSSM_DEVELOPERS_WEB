"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { signUpApi } from "./api";

const SIGN_UP_KEYS = {
  me: ["sign-up", "me"] as const,
};

interface UpdatePurposeParams {
  id: number;
  purpose: string;
}

export function useMyProfileQuery() {
  return useQuery({
    queryKey: SIGN_UP_KEYS.me,
    queryFn: () => signUpApi.getMy(),
    retry: false,
    staleTime: 0,
  });
}

export function useUpdatePurposeMutation() {
  return useMutation({
    mutationFn: ({ id, purpose }: UpdatePurposeParams) => signUpApi.updatePurpose(id, purpose),
  });
}
