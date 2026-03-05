import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { docsApi } from "./api";

export const docsKeys = {
  all: ["docs"] as const,
  list: () => [...docsKeys.all, "list"] as const,
  myList: (type?: string, cursor?: string, size?: number) =>
    [...docsKeys.all, "my-list", type, cursor, size] as const,
  popularList: (type?: string, cursor?: string, size?: number, tokenCount?: number) =>
    [...docsKeys.all, "popular-list", type, cursor, size, tokenCount] as const,
  myPopularList: (type?: string, cursor?: string, size?: number, tokenCount?: number) =>
    [...docsKeys.all, "my-popular-list", type, cursor, size, tokenCount] as const,
  detail: (id: string) => [...docsKeys.all, "detail", id] as const,
  sidebar: (id: string) => [...docsKeys.all, "sidebar", id] as const,
  page: (id: string, mappedId: string) =>
    [...docsKeys.all, "page", id, mappedId] as const,
};

export function useDocsListQuery(enabled: boolean = true) {
  return useQuery({
    queryKey: docsKeys.list(),
    queryFn: () => docsApi.getList(),
    enabled,
  });
}

export function useDocsMyListQuery(
  params: { type?: string; cursor?: string; size?: number } = {},
  enabled: boolean = true
) {
  return useQuery({
    queryKey: docsKeys.myList(params.type, params.cursor, params.size),
    queryFn: () => docsApi.getMyList(params),
    enabled,
  });
}

export function useDocsPopularListQuery(
  params: { type?: string; cursor?: string; size?: number; tokenCount?: number } = {},
  enabled: boolean = true
) {
  return useQuery({
    queryKey: docsKeys.popularList(params.type, params.cursor, params.size, params.tokenCount),
    queryFn: () => docsApi.getPopularList(params),
    enabled,
  });
}

export function useDocsMyPopularListQuery(
  params: { type?: string; cursor?: string; size?: number; tokenCount?: number } = {},
  enabled: boolean = true
) {
  return useQuery({
    queryKey: docsKeys.myPopularList(params.type, params.cursor, params.size, params.tokenCount),
    queryFn: () => docsApi.getMyPopularList(params),
    enabled,
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

export function useDocsPageQuery(id: string, mappedId: string) {
  return useQuery({
    queryKey: docsKeys.page(id, mappedId),
    queryFn: () => docsApi.getPage(id, mappedId),
    enabled: !!id && !!mappedId,
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

export function useUpdateDocsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docsId, data }: { docsId: string | number; data: Parameters<typeof docsApi.update>[1] }) =>
      docsApi.update(docsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docsKeys.all });
    },
  });
}

export function useDeleteDocsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (docsId: string | number) => docsApi.delete(docsId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docsKeys.all });
    },
  });
}

export function useToggleAutoApprovalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docsId, autoApproval }: { docsId: string | number; autoApproval: boolean }) =>
      docsApi.toggleAutoApproval(docsId, autoApproval),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docsKeys.all });
    },
  });
}

export function useReplaceDocsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docsId, data }: { docsId: string | number; data: Parameters<typeof docsApi.replace>[1] }) =>
      docsApi.replace(docsId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docsKeys.all });
    },
  });
}

export function useUpdateDocsPageMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      docsId,
      mappedId,
      docsBlocks,
    }: {
      docsId: string | number;
      mappedId: string | number;
      docsBlocks: unknown[];
    }) => docsApi.updatePage(docsId, mappedId, docsBlocks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docsKeys.all });
    },
  });
}

export function useUpdateDocsSidebarMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ docsId, sideBarBlocks }: { docsId: string | number; sideBarBlocks: unknown[] }) =>
      docsApi.updateSidebar(docsId, sideBarBlocks),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: docsKeys.all });
    },
  });
}
