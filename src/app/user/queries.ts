"use client";

import { useQuery } from "@tanstack/react-query";
import { userApi } from "./api";
import { tokenManager } from "@/utils/fetcher";

export const userKeys = {
  all: ["user"] as const,
  profile: () => [...userKeys.all, "profile"] as const,
};

export function useUserQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: userKeys.profile(),
    queryFn: () => userApi.getUser(),
    enabled: enabled && !!tokenManager.getAccessToken(),
    retry: false,
  });
}
