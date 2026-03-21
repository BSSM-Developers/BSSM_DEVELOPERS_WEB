import { fetchClient } from "@/utils/fetcher";

export type SignUpRequestState = "PENDING" | "APPROVED" | "REJECTED" | string;

export interface SignUpRequestItem {
  signupFormId?: number;
  signupRequestId?: number;
  name: string;
  email: string;
  profile: string;
  purpose: string;
  state: SignUpRequestState;
}

interface CursorPage<T> {
  values: T[];
  hasNext: boolean;
}

interface ApiResponse<T> {
  message: string;
  data: T;
}

export const signUpRequestApi = {
  getList: async (cursor?: number, size: number = 20) => {
    const params: Record<string, string> = {
      size: String(size),
    };

    if (cursor !== undefined) {
      params.cursor = String(cursor);
    }

    return fetchClient.get<ApiResponse<CursorPage<SignUpRequestItem>>>("/signup", { params });
  },
  approve: async (signupRequestId: number) => {
    return fetchClient.patch<ApiResponse<null>>(`/signup/${signupRequestId}/approve`, {});
  },
  reject: async (signupRequestId: number) => {
    return fetchClient.patch<ApiResponse<null>>(`/signup/${signupRequestId}/reject`, {});
  },
};
