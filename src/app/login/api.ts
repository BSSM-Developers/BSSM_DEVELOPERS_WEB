import { fetchClinet, tokenManager } from "@/utils/fetcher";

interface AuthResponse {
  message: string;
  data: {
    accessToken: string;
    refreshToken?: string;
  };
}

export const authApi = {
  loginWithGoogle: async (code: string, codeVerifier: string) => {
    const response = await fetchClinet.post<AuthResponse>(
      "/auth/google/token",
      { code, codeVerifier },
      { skipAuth: true }
    );
    return response.data;
  },
  logout: async () => {
    try {
      await fetchClinet.post<void>("/auth/logout", {});
    } catch (e) {
      console.error(e);
    }
    tokenManager.clearTokens();
  },
  refreshAccessToken: async () => {
    const response = await fetchClinet.post<AuthResponse>("/auth/refresh", {}, {
      skipAuth: true,
      suppressLogout: true,
    });
    return response.data;
  },
};
