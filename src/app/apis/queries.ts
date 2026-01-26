import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiTokenApi } from "./api";

export const apiTokenKeys = {
  all: ["apiTokens"] as const,
  list: (cursor?: number, size?: number) =>
    [...apiTokenKeys.all, "list", cursor, size] as const,
  detail: (id: number) => [...apiTokenKeys.all, "detail", id] as const,
};

export function useApiTokenListQuery(cursor?: number, size: number = 20) {
  return useQuery({
    queryKey: apiTokenKeys.list(cursor, size),
    queryFn: () => apiTokenApi.getList(cursor, size),
  });
}

export function useApiTokenDetailQuery(id: number) {
  return useQuery({
    queryKey: apiTokenKeys.detail(id),
    queryFn: () => apiTokenApi.getDetail(id),
    enabled: !!id,
  });
}

export function useCreateApiTokenMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, domains }: { name: string; domains: string[] }) =>
      apiTokenApi.create(name, domains),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiTokenKeys.all });
    },
  });
}
