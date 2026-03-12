export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
  suppressLogout?: boolean;
  omitCredentials?: boolean;
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

interface ParsedRefreshTokens {
  accessToken: string;
  refreshToken?: string;
}

interface RefreshRequestPayload {
  refreshToken?: string;
  refresh_token?: string;
}

const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";
const AUTH_SESSION_HINT_KEY = "authSessionHint";
const TOKEN_EVENT = "auth-token-changed";
let accessTokenMemory: string | null = null;
let refreshTokenMemory: string | null = null;

const emitTokenChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(TOKEN_EVENT));
  }
};

const decodeJwtExpMs = (token: string): number | null => {
  try {
    const payload = token.split(".")[1];
    if (!payload) {
      return null;
    }
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padding = "=".repeat((4 - (normalized.length % 4)) % 4);
    const normalizedWithPadding = `${normalized}${padding}`;
    const decoded = JSON.parse(atob(normalizedWithPadding)) as { exp?: number };
    if (!decoded.exp) {
      return null;
    }
    return decoded.exp * 1000;
  } catch {
    return null;
  }
};

export const tokenManager = {
  setTokens: (accessToken: string, refreshToken?: string) => {
    if (typeof window !== "undefined") {
      accessTokenMemory = accessToken;
      sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(AUTH_SESSION_HINT_KEY, "1");
      localStorage.removeItem("access_token");
      localStorage.removeItem("access-token");
      localStorage.removeItem("accessToken");
      sessionStorage.removeItem("access_token");
      sessionStorage.removeItem("access-token");
      if (refreshToken) {
        refreshTokenMemory = refreshToken;
        sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("refresh-token");
        localStorage.removeItem("refreshToken");
        sessionStorage.removeItem("refresh_token");
        sessionStorage.removeItem("refresh-token");
      }
      scheduleAccessTokenRefresh(accessToken);
      emitTokenChanged();
    }
  },
  getAccessToken: () => {
    if (typeof window !== "undefined") {
      if (accessTokenMemory) {
        return accessTokenMemory;
      }
      const token = sessionStorage.getItem(ACCESS_TOKEN_KEY);
      if (token) {
        accessTokenMemory = token;
        return token;
      }
    }
    return null;
  },
  getRefreshToken: () => {
    if (typeof window !== "undefined") {
      if (refreshTokenMemory) {
        return refreshTokenMemory;
      }
      const token = sessionStorage.getItem(REFRESH_TOKEN_KEY);
      if (token) {
        refreshTokenMemory = token;
        return token;
      }
    }
    return null;
  },
  clearTokens: () => {
    if (typeof window !== "undefined") {
      accessTokenMemory = null;
      refreshTokenMemory = null;
      const keys = [
        ACCESS_TOKEN_KEY, "access_token", "access-token",
        REFRESH_TOKEN_KEY, "refresh_token", "refresh-token",
        "userName", "user_name", AUTH_SESSION_HINT_KEY
      ];
      keys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      clearRefreshTimer();
      emitTokenChanged();
    }
  },
  initializeRefreshCycle: async () => {
    if (typeof window === "undefined") {
      return;
    }
    if (initializePromise) {
      await initializePromise;
      return;
    }
    initializePromise = (async () => {
      const legacyAccessToken =
        localStorage.getItem("accessToken") ||
        localStorage.getItem("access_token") ||
        localStorage.getItem("access-token");

      if (!sessionStorage.getItem(ACCESS_TOKEN_KEY) && legacyAccessToken) {
        sessionStorage.setItem(ACCESS_TOKEN_KEY, legacyAccessToken);
        accessTokenMemory = legacyAccessToken;
      }

      const legacyRefreshToken =
        localStorage.getItem("refreshToken") ||
        localStorage.getItem("refresh_token") ||
        localStorage.getItem("refresh-token");

      if (!sessionStorage.getItem(REFRESH_TOKEN_KEY) && legacyRefreshToken) {
        sessionStorage.setItem(REFRESH_TOKEN_KEY, legacyRefreshToken);
        refreshTokenMemory = legacyRefreshToken;
      }

      localStorage.removeItem("accessToken");
      localStorage.removeItem("access_token");
      localStorage.removeItem("access-token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("refresh-token");

      let accessToken = tokenManager.getAccessToken();
      if (accessToken) {
        scheduleAccessTokenRefresh(accessToken);
        localStorage.setItem(AUTH_SESSION_HINT_KEY, "1");
        emitTokenChanged();
        return;
      }

      const hasAuthSessionHint = localStorage.getItem(AUTH_SESSION_HINT_KEY) === "1";
      if (!hasAuthSessionHint) {
        return;
      }

      accessToken = await ensureRefreshedAccessToken();
      if (accessToken) {
        scheduleAccessTokenRefresh(accessToken);
        emitTokenChanged();
      }
    })();
    try {
      await initializePromise;
    } finally {
      initializePromise = null;
    }
  },
  getUserRole: (): string | null => {
    if (typeof window === "undefined") return null;
    const token = tokenManager.getAccessToken();
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

    const token = tokenManager.getAccessToken();
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
const SHOULD_USE_PROXY = process.env.NEXT_PUBLIC_USE_API_PROXY === "true";
const IS_ABSOLUTE_API_URL = RAW_API_URL.startsWith("http://") || RAW_API_URL.startsWith("https://");
const BASE_URL = SHOULD_USE_PROXY && IS_ABSOLUTE_API_URL ? "/api/proxy" : RAW_API_URL;

const createApiUrl = (endpoint: string): URL => {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const normalizedBaseUrl = BASE_URL.endsWith("/") ? BASE_URL.slice(0, -1) : BASE_URL;
  const fullUrl = `${normalizedBaseUrl}${normalizedEndpoint}`;
  return new URL(
    fullUrl,
    typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"
  );
};

const parseRefreshTokens = async (response: Response): Promise<ParsedRefreshTokens | null> => {
  if (!response.ok) {
    return null;
  }

  const refreshText = await response.text();
  let refreshData: RefreshResponse = {};
  if (refreshText) {
    try {
      refreshData = JSON.parse(refreshText) as RefreshResponse;
    } catch {
      refreshData = {};
    }
  }

  const authorizationHeader = response.headers.get("authorization");
  const bearerToken = authorizationHeader?.startsWith("Bearer ")
    ? authorizationHeader.slice("Bearer ".length).trim()
    : null;

  const headerAccessToken =
    response.headers.get("x-access-token") ||
    response.headers.get("access-token") ||
    response.headers.get("access_token");

  const accessToken =
    bearerToken ||
    headerAccessToken ||
    refreshData.accessToken ||
    refreshData.data?.accessToken ||
    refreshData.data?.access_token ||
    null;
  const refreshToken =
    refreshData.refreshToken ||
    refreshData.data?.refreshToken ||
    refreshData.data?.refresh_token;

  if (!accessToken) {
    return null;
  }

  return {
    accessToken,
    refreshToken: refreshToken || undefined,
  };
};

const requestRefreshFromUrl = async (url: string): Promise<ParsedRefreshTokens | null> => {
  const refreshToken = tokenManager.getRefreshToken();
  const payload: RefreshRequestPayload = refreshToken
    ? { refreshToken, refresh_token: refreshToken }
    : {};

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    credentials: "include",
    cache: "no-store",
  });

  return parseRefreshTokens(response);
};

let refreshPromise: Promise<string | null> | null = null;
let refreshTimer: ReturnType<typeof setTimeout> | null = null;
let timerToken: string | null = null;
let initializePromise: Promise<void> | null = null;

const REFRESH_SKEW_MS = 60_000;
const REFRESH_FALLBACK_MS = 9 * 60 * 1000;
const REFRESH_MIN_DELAY_MS = 5_000;

const clearRefreshTimer = () => {
  if (refreshTimer) {
    clearTimeout(refreshTimer);
    refreshTimer = null;
  }
  timerToken = null;
};

const scheduleAccessTokenRefresh = (accessToken: string) => {
  if (typeof window === "undefined") {
    return;
  }

  if (timerToken === accessToken && refreshTimer) {
    return;
  }

  clearRefreshTimer();
  timerToken = accessToken;

  const expiresAtMs = decodeJwtExpMs(accessToken);
  const delay = expiresAtMs
    ? Math.max(REFRESH_MIN_DELAY_MS, expiresAtMs - Date.now() - REFRESH_SKEW_MS)
    : REFRESH_FALLBACK_MS;

  refreshTimer = setTimeout(async () => {
    const refreshed = await ensureRefreshedAccessToken();
    if (!refreshed) {
      tokenManager.clearTokens();
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return;
    }
    scheduleAccessTokenRefresh(refreshed);
  }, delay);
};

const requestAccessTokenRefresh = async (): Promise<string | null> => {
  const refreshUrl = createApiUrl("/auth/refresh");
  const refreshTokens = await requestRefreshFromUrl(refreshUrl.toString());

  if (!refreshTokens) {
    return null;
  }

  tokenManager.setTokens(refreshTokens.accessToken, refreshTokens.refreshToken);
  return refreshTokens.accessToken;
};

const ensureRefreshedAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = requestAccessTokenRefresh().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

const request = async <T>(
  method: string,
  endpoint: string,
  body?: unknown,
  options: ApiRequestOptions = {}
): Promise<T> => {
  const url = createApiUrl(endpoint);

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
    credentials: options.omitCredentials ? "omit" : "include",
  };

  if (body) {
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(url.toString(), fetchOptions);

  if (response.status === 401 && !options.skipAuth) {
    let refreshedAccessToken: string | null = null;
    try {
      refreshedAccessToken = await ensureRefreshedAccessToken();

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

    if (!options.suppressLogout && !refreshedAccessToken) {
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
