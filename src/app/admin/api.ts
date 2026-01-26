import { fetchClinet } from "@/utils/fetcher";

interface RequestItem {
  signupFormId: number;
  signupRequestId: number;
  name: string;
  email: string;
  profile: string;
  purpose: string;
  state: "PENDING" | "APPROVED" | "REJECTED";
}

interface RequestListResponse {
  message: string;
  data: {
    hasNext: boolean;
    values: RequestItem[];
  };
}

export const adminApi = {
  approve: async (id: number) => {
    return fetchClinet.patch<void>(`/signup/${id}/approve`, {});
  },
  reject: async (id: number) => {
    return fetchClinet.patch<void>(`/signup/${id}/reject`, {});
  },
  getRequests: async (cursorId?: number, size: number = 10) => {
    const params: Record<string, string> = { size: size.toString() };
    if (cursorId) {
      params.cursorId = cursorId.toString();
    }
    return fetchClinet.get<RequestListResponse>("/signup", { params });
  },
};
