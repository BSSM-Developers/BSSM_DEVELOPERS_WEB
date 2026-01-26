import { fetchClinet } from "@/utils/fetcher";

interface ApiTokenResponse {
  message: string;
  data: unknown;
}

interface ApiTokenListResponse {
  message: string;
  data: {
    values: unknown[];
    hasNext: boolean;
  };
}

interface SecretResponse {
  message: string;
  data: {
    secretKey: string;
  };
}

export const apiTokenApi = {
  create: async (name: string, domains: string[] = []) => {
    return fetchClinet.post<ApiTokenResponse>("/api/token", {
      apiTokenName: name,
      domains,
    });
  },
  getList: async (cursor?: number, size: number = 20) => {
    const params: Record<string, string> = { size: size.toString() };
    if (cursor) {
      params.cursor = cursor.toString();
    }
    return fetchClinet.get<ApiTokenListResponse>("/api/token", { params });
  },
  getDetail: async (apiTokenId: number) => {
    return fetchClinet.get<ApiTokenResponse>(`/api/token/${apiTokenId}`);
  },
  registerApi: async (apiTokenId: number, apiId: string, apiUseReason: string) => {
    return fetchClinet.post<void>(`/api/${apiTokenId}/use-reason`, {
      apiId,
      apiUseReason,
    });
  },
  reissueSecret: async (apiTokenId: number) => {
    return fetchClinet.patch<SecretResponse>(`/api/token/${apiTokenId}/secret`, {});
  },
  updateName: async (apiTokenId: number, name: string) => {
    return fetchClinet.patch<void>(`/api/token/${apiTokenId}/name`, { name });
  },
  updateUsageEndpoint: async (apiUsageId: number, endpoint: string) => {
    return fetchClinet.patch<void>(`/api/usage/${apiUsageId}/endpoint`, {
      endpoint,
    });
  },
};
