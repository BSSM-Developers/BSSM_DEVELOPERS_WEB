import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { signUpApi } from "./api";
import { tokenManager } from "@/utils/fetcher";

export const signUpKeys = {
  all: ["signUp"] as const,
  my: () => [...signUpKeys.all, "my"] as const,
};

export function useMyProfileQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: signUpKeys.my(),
    queryFn: () => signUpApi.getMy({ suppressLogout: true }),
    enabled: enabled && !!tokenManager.getAccessToken(),
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
