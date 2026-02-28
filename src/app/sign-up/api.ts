import { fetchClinet, ApiRequestOptions } from "@/utils/fetcher";

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
    const response = await fetchClinet.get<UserProfileResponse>("/signup/me", options);
    return response.data;
  },
  updatePurpose: async (id: number, purpose: string) => {
    return fetchClinet.patch<void>(`/signup/${id}/purpose`, { purpose });
  },
};
