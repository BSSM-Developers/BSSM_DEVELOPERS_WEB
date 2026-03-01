import type { ApiUseStateFilter, ApiUsageByApiItem } from "@/app/apis/useReasonApi";

export type ApiUseFilter = "ALL" | ApiUseStateFilter;

export const FILTER_OPTIONS: Array<{ key: ApiUseFilter; label: string }> = [
  { key: "ALL", label: "전체" },
  { key: "PENDING", label: "대기" },
  { key: "APPROVED", label: "승인" },
  { key: "REJECTED", label: "거절" },
];

export const isAdminRole = (role?: string): boolean => role === "ADMIN" || role === "ROLE_ADMIN";

export const sortApiUseReasonItems = (items: ApiUsageByApiItem[]): ApiUsageByApiItem[] => {
  return [...items].sort((a, b) => Number(b.apiUseReasonId) - Number(a.apiUseReasonId));
};

export const createApiUseReasonRowKey = (item: ApiUsageByApiItem): string => {
  return `${item.apiTokenId}-${item.apiUseReasonId}`;
};
