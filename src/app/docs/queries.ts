import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { docsApi } from "./api";

export const docsKeys = {
  all: ["docs"] as const,
  list: () => [...docsKeys.all, "list"] as const,
  detail: (id: string) => [...docsKeys.all, "detail", id] as const,
  sidebar: (id: string) => [...docsKeys.all, "sidebar", id] as const,
  page: (id: number, mappedId: string) =>
    [...docsKeys.all, "page", id, mappedId] as const,
};

export function useDocsListQuery() {
  return useQuery({
    queryKey: docsKeys.list(),
    queryFn: () => docsApi.getList(),
  });
}

export function useDocsDetailQuery(id: string) {
  return useQuery({
    queryKey: docsKeys.detail(id),
    queryFn: () => docsApi.getDetail(id),
    enabled: !!id,
  });
}

export function useDocsSidebarQuery(id: string) {
  return useQuery({
    queryKey: docsKeys.sidebar(id),
    queryFn: () => docsApi.getSidebar(id),
    enabled: !!id,
  });
}

export function useCreateOriginalDocsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: docsApi.createOriginal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docsKeys.list() });
    },
  });
}

export function useCreateCustomDocsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: docsApi.createCustom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docsKeys.list() });
    },
  });
}
// Additional mutations can be added as needed
