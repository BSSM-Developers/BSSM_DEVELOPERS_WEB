import { fetchClinet } from "@/utils/fetcher";

interface ApiResponse<T> {
  message: string;
  data: T;
}

export interface ApiTokenListItem {
  apiTokenId: number;
  apiTokenName: string;
  apiTokenClientId: string;
}

export interface ApiTokenListData {
  values: ApiTokenListItem[];
  hasNext: boolean;
}

export interface RegisteredApiSummary {
  apiId: string;
  name: string;
  endpoint: string;
  apiMethod: string;
  apiUseState: string;
}

export interface ApiTokenDetail {
  apiTokenId: number;
  apiTokenName: string;
  apiTokenClientId: string;
  secretKey: string;
  domains: string[];
  registeredApis: RegisteredApiSummary[];
}

export interface ApiTokenWithSecret {
  apiTokenId: number;
  apiTokenName: string;
  apiTokenClientId: string;
  secretKey: string;
  domains: string[];
}

export const tokenApi = {
  getList: async (cursor?: number, size: number = 20) => {
    const params: Record<string, string> = { size: String(size) };
    if (cursor !== undefined) {
      params.cursor = String(cursor);
    }
    const response = await fetchClinet.get<ApiResponse<ApiTokenListData>>("/api/token", { params });
    return response.data;
  },

  getDetail: async (apiTokenId: number) => {
    const response = await fetchClinet.get<ApiResponse<ApiTokenDetail>>(`/api/token/${apiTokenId}`);
    return response.data;
  },

  create: async (apiTokenName: string, domains: string[] = []) => {
    const response = await fetchClinet.post<ApiResponse<ApiTokenWithSecret>>("/api/token", {
      apiTokenName,
      domains,
    });
    return response.data;
  },

  reissueSecret: async (apiTokenId: number) => {
    const response = await fetchClinet.patch<ApiResponse<ApiTokenWithSecret>>(`/api/token/${apiTokenId}/secret`, {});
    return response.data;
  },

  updateName: async (apiTokenId: number, apiTokenName: string) => {
    await fetchClinet.patch<ApiResponse<null>>(`/api/token/${apiTokenId}/name`, { apiTokenName });
  },
};
