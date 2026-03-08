import { fetchClinet } from "@/utils/fetcher";

interface ApiResponse<T> {
  message: string;
  data: T;
}

interface CursorPage<T> {
  values: T[];
  hasNext: boolean;
}

export type ApiUseStateFilter = "PENDING" | "APPROVED" | "REJECTED";

export interface ApiUseReasonMineItem {
  apiUseReasonId: number;
  writerId: number;
  apiUseReason: string;
  apiUseState: string;
}

export interface ApiUsageByApiItem {
  apiTokenId: number | string;
  apiId: string;
  name: string;
  endpoint: string;
  apiName: string;
  apiDomain: string;
  apiMethod: string;
  apiUseReasonId: number | string;
  apiUseState: string;
  apiUseReason?: string;
  writerId?: number | string;
  writer?: string;
}

export const apiUseReasonApi = {
  create: async (apiTokenId: number, apiId: string, apiUseReason: string) => {
    return fetchClinet.post<ApiResponse<null>>(`/api/${apiTokenId}/use-reason`, {
      apiId,
      apiUseReason,
    });
  },
  getMine: async (cursor?: number, size: number = 20) => {
    const params: Record<string, string> = { size: String(size) };
    if (cursor !== undefined) {
      params.cursor = String(cursor);
    }
    return fetchClinet.get<ApiResponse<CursorPage<ApiUseReasonMineItem>>>("/api/use-reason/me", { params });
  },
  getUsageByApi: async (apiId: string, cursor?: number, size: number = 20) => {
    const params: Record<string, string> = { size: String(size) };
    if (cursor !== undefined) {
      params.cursor = String(cursor);
    }
    return fetchClinet.get<ApiResponse<CursorPage<ApiUsageByApiItem>>>(`/api/use-reason/by-api/${apiId}`, { params });
  },
  getAll: async (state?: ApiUseStateFilter, cursor?: number, size: number = 20) => {
    const params: Record<string, string> = { size: String(size) };
    if (cursor !== undefined) {
      params.cursor = String(cursor);
    }
    if (state) {
      params.state = state;
    }
    return fetchClinet.get<ApiResponse<CursorPage<ApiUsageByApiItem>>>("/api/use-reason", { params });
  },
  approve: async (apiTokenId: string | number, apiUseReasonId: string | number) => {
    return fetchClinet.patch<ApiResponse<null>>(`/api/${apiTokenId}/use-reason/${apiUseReasonId}/approve`, {});
  },
  reject: async (apiTokenId: string | number, apiUseReasonId: string | number) => {
    return fetchClinet.patch<ApiResponse<null>>(`/api/${apiTokenId}/use-reason/${apiUseReasonId}/reject`, {});
  },
};
