import { fetchClient, ApiRequestOptions } from "@/utils/fetcher";

interface UserProfile {
  signupFormId: number;
  signupRequestId?: number;
  name: string;
  email: string;
  profile: string;
  purpose: string;
  state: "PENDING" | "APPROVED" | "REJECTED";
}

interface UserProfileResponse {
  message: string;
  data: UserProfile;
}

export const signUpApi = {
  getMy: async (options: ApiRequestOptions = {}) => {
    const response = await fetchClient.get<UserProfileResponse>("/signup/me", {
      ...options,
      skipAuth: true,
      suppressLogout: true,
    });
    return response.data;
  },
  updatePurpose: async (signupRequestId: number, purpose: string) => {
    return fetchClient.patch<void>(`/signup/${signupRequestId}/purpose`, { purpose }, {
      skipAuth: true,
      suppressLogout: true,
    });
  },
};
