import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "./api";

export const adminKeys = {
  all: ["admin"] as const,
  requests: (cursorId?: number, size?: number) =>
    [...adminKeys.all, "requests", cursorId, size] as const,
};

export function useSignupRequestsQuery(cursorId?: number, size: number = 10) {
  return useQuery({
    queryKey: adminKeys.requests(cursorId, size),
    queryFn: () => adminApi.getRequests(cursorId, size),
  });
}

export function useApproveSignupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

export function useRejectSignupMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminApi.reject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}
