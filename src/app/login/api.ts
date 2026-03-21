import { fetchClient, tokenManager } from "@/utils/fetcher";

interface LoginResponse {
  message: string;
  data: {
    accessToken: string;
    refreshToken?: string;
  };
}

interface RefreshResponse {
  message?: string;
  accessToken?: string;
  refreshToken?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
  };
}

interface RefreshResult {
  accessToken?: string;
  refreshToken?: string;
}

export const authApi = {
  loginWithGoogle: async (code: string, codeVerifier: string) => {
    const response = await fetchClient.post<LoginResponse>(
      "/auth/google/token",
      { code, codeVerifier },
      { skipAuth: true }
    );
    return response.data;
  },
  logout: async () => {
    try {
      await fetchClient.post<void>("/auth/logout", {});
    } catch (e) {
      console.error(e);
    }
    tokenManager.clearTokens();
  },
  refreshAccessToken: async (): Promise<RefreshResult> => {
    const response = await fetchClient.post<RefreshResponse>("/auth/refresh", {}, {
      skipAuth: true,
      suppressLogout: true,
    });

    const accessToken =
      response.accessToken ||
      response.data?.accessToken ||
      response.data?.access_token;
    const refreshToken =
      response.refreshToken ||
      response.data?.refreshToken ||
      response.data?.refresh_token;

    return { accessToken, refreshToken };
  },
};
