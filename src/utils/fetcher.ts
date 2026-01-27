export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
  suppressLogout?: boolean;
}

export const tokenManager = {
  setTokens: (accessToken: string, refreshToken?: string) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", accessToken);
      if (refreshToken) {
        localStorage.setItem("refreshToken", refreshToken);
      }
    }
  },
  getAccessToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("accessToken");
    }
    return null;
  },
  getRefreshToken: () => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("refreshToken");
    }
    return null;
  },
  clearTokens: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("userName");
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
    } catch (e) {
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

const BASE_URL = process.env.NEXT_PUBLIC_API_URL === "https://prod.bssm-dev.com" ? "/api/proxy" : (process.env.NEXT_PUBLIC_API_URL || "");

const request = async <T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options: ApiRequestOptions = {}
): Promise<T> => {
  // BASE_URL이 상대 경로(/api/proxy)일 때 new URL()이 실패하지 않도록 항상 Base를 제공
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
      tokenManager.clearTokens();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
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
