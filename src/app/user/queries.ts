import { useQuery } from "@tanstack/react-query";
import { userApi } from "./api";
import { tokenManager } from "@/utils/fetcher";

export const userKeys = {
  all: ["user"] as const,
  my: () => [...userKeys.all, "my"] as const,
};

export function useUserQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: userKeys.my(),
    queryFn: () => userApi.getUser(),
    enabled: enabled && !!tokenManager.getAccessToken(),
    retry: false,
  });
}
