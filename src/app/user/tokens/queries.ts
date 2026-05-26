import { useQuery } from "@tanstack/react-query";
import { tokenApi } from "./api";
import { apiUseReasonApi } from "@/app/apis/useReasonApi";

export const tokenPageKeys = {
  all: ["token-page"] as const,
  tokenList: (cursor?: number, size: number = 20) =>
    [...tokenPageKeys.all, "tokens", cursor, size] as const,
  myUseReasons: (cursor?: number, size: number = 50) =>
    [...tokenPageKeys.all, "use-reasons", cursor, size] as const,
};

export function useTokenListQuery(cursor?: number, size: number = 20) {
  return useQuery({
    queryKey: tokenPageKeys.tokenList(cursor, size),
    queryFn: () => tokenApi.getList(cursor, size),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export function useMyUseReasonsQuery(cursor?: number, size: number = 50) {
  return useQuery({
    queryKey: tokenPageKeys.myUseReasons(cursor, size),
    queryFn: () => apiUseReasonApi.getMine(cursor, size),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}

export const unblockRequestKeys = {
  all: ["unblock-request-page"] as const,
  unblockRequestList: (cursor?: number, size: number = 20) =>
    [...unblockRequestKeys.all, "unblock-requests", cursor, size] as const,
};

export function useUnblockRequestsQuery(cursor?: number, size: number = 20) {
  return useQuery({
    queryKey: unblockRequestKeys.unblockRequestList(cursor, size),
    queryFn: () => tokenApi.getUnblockRequests(cursor, size),
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
