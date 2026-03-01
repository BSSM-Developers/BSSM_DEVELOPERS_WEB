import { fetchClinet } from "@/utils/fetcher";

interface ApiResponse<T> {
  message: string;
  data: T;
}

export const apiUseReasonApi = {
  create: async (apiTokenId: number, apiId: string, apiUseReason: string) => {
    return fetchClinet.post<ApiResponse<null>>(`/api/${apiTokenId}/use-reason`, {
      apiId,
      apiUseReason,
    });
  },
};
