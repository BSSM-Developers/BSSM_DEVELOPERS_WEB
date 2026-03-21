import { fetchClient } from "@/utils/fetcher";

interface ApiResponse<T> {
  message: string;
  data: T;
}

export type ApiTokenState = "NORMAL" | "WARNING" | "BLOCKED";

export interface ApiTokenListItem {
  apiTokenId: number;
  apiTokenName: string;
  apiTokenClientId: string;
  state?: ApiTokenState;
}

export interface ApiTokenListData {
  values: ApiTokenListItem[];
  hasNext: boolean;
}

export interface RegisteredApiSummary {
  apiUsageId?: number | string;
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
  state?: ApiTokenState;
  origins: string[];
  domains?: string[];
  registeredApis: RegisteredApiSummary[];
}

export interface ApiTokenWithSecret {
  apiTokenId: number;
  apiTokenName: string;
  apiTokenClientId: string;
  secretKey: string;
  origins: string[];
  domains?: string[];
}

interface ApiTokenDetailRaw extends Omit<ApiTokenDetail, "origins" | "domains"> {
  origins?: string[];
  domains?: string[];
}

interface ApiTokenWithSecretRaw extends Omit<ApiTokenWithSecret, "origins" | "domains"> {
  origins?: string[];
  domains?: string[];
}

const normalizeOrigins = (origins?: string[], domains?: string[]): string[] => {
  const combined = [...(origins ?? []), ...(domains ?? [])];
  return Array.from(new Set(combined.map((item) => item.trim()).filter((item) => item.length > 0)));
};

export const tokenApi = {
  getList: async (cursor?: number, size: number = 20) => {
    const params: Record<string, string> = { size: String(size) };
    if (cursor !== undefined) {
      params.cursor = String(cursor);
    }
    const response = await fetchClient.get<ApiResponse<ApiTokenListData>>("/api/token", { params });
    return response.data;
  },

  getDetail: async (apiTokenId: number) => {
    const response = await fetchClient.get<ApiResponse<ApiTokenDetailRaw>>(`/api/token/${apiTokenId}`);
    const raw = response.data;
    const origins = normalizeOrigins(raw.origins, raw.domains);
    return { ...raw, origins, domains: origins };
  },

  create: async (apiTokenName: string, origins: string[] = []) => {
    const response = await fetchClient.post<ApiResponse<ApiTokenWithSecretRaw>>("/api/token", {
      apiTokenName,
      origins,
    });
    const raw = response.data;
    const normalizedOrigins = normalizeOrigins(raw.origins, raw.domains);
    return { ...raw, origins: normalizedOrigins, domains: normalizedOrigins };
  },

  reissueSecret: async (apiTokenId: number) => {
    const response = await fetchClient.patch<ApiResponse<ApiTokenWithSecret>>(`/api/token/${apiTokenId}/secret`, {});
    return response.data;
  },

  updateName: async (apiTokenId: number, apiTokenName: string) => {
    await fetchClient.patch<ApiResponse<null>>(`/api/token/${apiTokenId}/name`, { apiTokenName }, { suppressLogout: true });
  },
  updateOrigins: async (apiTokenId: number, origins: string[]) => {
    await fetchClient.patch<ApiResponse<null>>(`/api/token/${apiTokenId}/origins`, { origins }, { suppressLogout: true });
  },
  updateUsageName: async (apiId: string, apiTokenId: number, name: string) => {
    await fetchClient.patch<ApiResponse<null>>(`/api/${apiId}/${apiTokenId}/usage/name`, { name }, { suppressLogout: true });
  },
  updateUsageEndpoint: async (apiId: string, apiTokenId: number, endpoint: string) => {
    await fetchClient.patch<ApiResponse<null>>(`/api/${apiId}/${apiTokenId}/usage/endpoint`, { endpoint }, { suppressLogout: true });
  },
};
