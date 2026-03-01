export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
  suppressLogout?: boolean;
}

interface RefreshResponse {
  accessToken?: string;
  refreshToken?: string;
  data?: {
    accessToken?: string;
    refreshToken?: string;
    access_token?: string;
    refresh_token?: string;
  };
}

export const tokenManager = {
  setTokens: (accessToken: string, refreshToken?: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("access_token", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
        localStorage.setItem("refresh_token", refreshToken);
      }
    }
  },
  getAccessToken: () => {
    if (typeof window !== "undefined") {
      const keys = ["accessToken", "access_token", "access-token"];
      for (const key of keys) {
        const token = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (token) return token;
      }

      try {
        const userStorage = localStorage.getItem("user-storage");
        if (userStorage) {
          const parsed = JSON.parse(userStorage);
          if (parsed.state?.user?.accessToken) return parsed.state.user.accessToken;
          if (parsed.state?.user?.access_token) return parsed.state.user.access_token;
        }
      } catch {
      }
    }
    return null;
  },
  getRefreshToken: () => {
    if (typeof window !== "undefined") {
      const keys = ["refreshToken", "refresh_token", "refresh-token"];
      for (const key of keys) {
        const token = localStorage.getItem(key) || sessionStorage.getItem(key);
        if (token) return token;
      }
    }
    return null;
  },
  clearTokens: () => {
    if (typeof window !== "undefined") {
      const keys = [
        "accessToken", "access_token", "access-token",
        "refreshToken", "refresh_token", "refresh-token",
        "userName", "user_name"
      ];
      keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
    }
  },
  getUserRole: (): string | null => {
    if (typeof window === "undefined") return null;
    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      const payload = JSON.parse(jsonPayload);
      return payload.role || null;
    } catch {
      return null;
    }
  },
  setUserName: (name: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("userName", name);
    }
  },
  getUserName: (): string | null => {
    if (typeof window === "undefined") return null;

    const cachedName = localStorage.getItem("userName");
    if (cachedName) return cachedName;

    const token = localStorage.getItem("accessToken");
    if (!token) return null;

    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const jsonPayload = decodeURIComponent(
        window
          .atob(base64)
          .split("")
          .map(function (c) {
            return "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2);
          })
          .join("")
      );

      const payload = JSON.parse(jsonPayload);
      return payload.name || null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },
};

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "";
const BASE_URL = RAW_API_URL.startsWith("http://") || RAW_API_URL.startsWith("https://")
  ? "/api/proxy"
  : RAW_API_URL;

let refreshPromise: Promise<string | null> | null = null;

const requestAccessTokenRefresh = async (): Promise<string | null> => {
  const refreshUrl = new URL(
    `${BASE_URL}/auth/refresh`,
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  );

  const refreshResponse = await fetch(refreshUrl.toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include"
  });

  if (!refreshResponse.ok) {
    return null;
  }

  const refreshText = await refreshResponse.text();
  const refreshData: RefreshResponse = refreshText ? JSON.parse(refreshText) : {};
  const newAccessToken =
    refreshData.accessToken ||
    refreshData.data?.accessToken ||
    refreshData.data?.access_token ||
    null;
  const newRefreshToken =
    refreshData.refreshToken ||
    refreshData.data?.refreshToken ||
    refreshData.data?.refresh_token;

  if (!newAccessToken) {
    return null;
  }

  tokenManager.setTokens(newAccessToken, newRefreshToken);
  return newAccessToken;
};

const request = async <T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const fullUrl = `${BASE_URL}${endpoint}`;
  const url = new URL(fullUrl, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");

  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (!options.skipAuth) {
    const accessToken = tokenManager.getAccessToken();
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
  }

  const fetchOptions: RequestInit = {
    ...options,
    method,
    headers,
    credentials: "include",
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (response.status === 401 && !options.skipAuth) {
    if (!options.suppressLogout) {
      let refreshedAccessToken: string | null = null;
      try {
        if (!refreshPromise) {
          refreshPromise = requestAccessTokenRefresh().finally(() => {
            refreshPromise = null;
          });
        }

        refreshedAccessToken = await refreshPromise;

        if (refreshedAccessToken) {
          const retryHeaders = { ...headers, "Authorization": `Bearer ${refreshedAccessToken}` };
          const retryOptions = { ...fetchOptions, headers: retryHeaders };
          const retryResponse = await fetch(url.toString(), retryOptions);

          if (retryResponse.ok) {
            const text = await retryResponse.text();
            return text ? JSON.parse(text) : ({} as T);
          }

          if (retryResponse.status !== 401) {
            const retryErrorBody = await retryResponse.text();
            throw new Error(
              `API Error ${retryResponse.status}: ${retryResponse.statusText} - ${retryErrorBody}`
            );
          }
        }
      } catch {
      }

      if (!refreshedAccessToken) {
        tokenManager.clearTokens();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw new Error("Unauthorized");
      }

      throw new Error("Unauthorized");
    }
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `API Error ${response.status}: ${response.statusText} - ${errorBody}`
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  return text ? JSON.parse(text) : ({} as T);
};

export const fetchClinet = {
  get: async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    return request<T>("GET", endpoint, undefined, options);
  },

  post: async <T>(
    endpoint: string,
    body: unknown,
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    return request<T>("POST", endpoint, body, options);
  },

  patch: async <T>(
    endpoint: string,
    body: unknown,
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    return request<T>("PATCH", endpoint, body, options);
  },

  put: async <T>(
    endpoint: string,
    body: unknown,
    options: ApiRequestOptions = {}
  ): Promise<T> => {
    return request<T>("PUT", endpoint, body, options);
  },

  delete: async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    return request<T>("DELETE", endpoint, undefined, options);
  },
};
