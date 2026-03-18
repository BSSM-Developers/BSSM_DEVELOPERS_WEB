const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
  suppressLogout?: boolean;
}

const normalizeErrorMessage = (value: unknown): string | null => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  if (Array.isArray(value)) {
    const messages = value
      .map((item) => normalizeErrorMessage(item))
      .filter((message): message is string => Boolean(message));
    if (messages.length > 0) {
      return messages.join("\n");
    }
  }

  return null;
};

const extractApiErrorMessage = (errorBody: string): string | null => {
  const trimmed = errorBody.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed) as {
      message?: unknown;
      error?: { message?: unknown };
    };
    const message =
      normalizeErrorMessage(parsed.message) ??
      normalizeErrorMessage(parsed.error?.message);
    if (message) {
      return message;
    }
  } catch {
  }

  if (/^<!doctype html/i.test(trimmed) || /^<html/i.test(trimmed)) {
    return null;
  }

  return trimmed;
};

const buildApiErrorMessage = (status: number, statusText: string, errorBody: string): string => {
  const parsedMessage = extractApiErrorMessage(errorBody);
  if (parsedMessage) {
    return parsedMessage;
  }

  if (statusText) {
    return `요청 처리 중 오류가 발생했습니다. (${status} ${statusText})`;
  }

  return `요청 처리 중 오류가 발생했습니다. (${status})`;
};

export const tokenManager = {
  setTokens: (accessToken: string, refreshToken?: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }
    }
  },
  getAccessToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  },
  getRefreshToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  },
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userName');
    }
  },
  getUserRole: (): string | null => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      return payload.role || null;
    } catch (e) {
      console.error("토큰 디코딩 실패", e);
      return null;
    }
  },
  setUserName: (name: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('userName', name);
    }
  },
  getUserName: (): string | null => {
    if (typeof window === 'undefined') return null;

    const cachedName = localStorage.getItem('userName');
    if (cachedName) return cachedName;

    const token = localStorage.getItem('accessToken');
    if (!token) return null;

    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));

      const payload = JSON.parse(jsonPayload);
      return payload.name || null;
    } catch {
      return null;
    }
  }
};

export const api = {
  request: async <T>(method: string, endpoint: string, body?: unknown, options: ApiRequestOptions = {}): Promise<T> => {
    const url = new URL(`${BASE_URL}${endpoint}`);

    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (!options.skipAuth) {
      const accessToken = tokenManager.getAccessToken();
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const fetchOptions: RequestInit = {
      ...options,
      method,
      headers,
      credentials: 'include',
    };

    if (body !== undefined) {
      fetchOptions.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), fetchOptions);

    if (response.status === 401 && !options.skipAuth) {
      if (!options.suppressLogout) {
        console.warn("Unauthorized access, clearing tokens and redirecting to login.");
        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
      throw new Error('Unauthorized');
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(buildApiErrorMessage(response.status, response.statusText, errorBody));
    }

    if (response.status === 204) {
      return {} as unknown as T;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as unknown as T);
  },

  get: async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    return api.request<T>('GET', endpoint, undefined, options);
  },

  post: async <T>(endpoint: string, body: unknown, options: ApiRequestOptions = {}): Promise<T> => {
    return api.request<T>('POST', endpoint, body, options);
  },

  patch: async <T>(endpoint: string, body: unknown, options: ApiRequestOptions = {}): Promise<T> => {
    return api.request<T>('PATCH', endpoint, body, options);
  },

  auth: {
    loginWithGoogle: async (code: string, codeVerifier: string) => {
      const response = await api.post<{ message: string; data: { accessToken: string; refreshToken?: string } }>('/auth/google/token', { code, codeVerifier }, { skipAuth: true });
      return response.data;
    },
    logout: async () => {
      try {
        await api.post<void>('/auth/logout', {});
      } catch {
      }
      tokenManager.clearTokens();
    },
    refreshToken: async () => {
      throw new Error("Refresh token not supported yet");
    }
  },

  signUp: {
    getMy: async (options: ApiRequestOptions = {}) => {
      const response = await api.get<{
        message: string;
        data: {
          signupFormId: number;
          signupRequestId?: number;
          name: string;
          email: string;
          profile: string;
          purpose: string;
          state: 'PENDING' | 'APPROVED' | 'REJECTED';
        }
      }>('/signup/me', options);
      return response.data;
    },
    updatePurpose: async (id: number, purpose: string) => {
      return api.patch<void>(`/signup/${id}/purpose`, { purpose });
    },
    approve: async (id: number) => {
      return api.patch<void>(`/signup/${id}/approve`, {});
    },
    reject: async (id: number) => {
      return api.patch<void>(`/signup/${id}/reject`, {});
    },
    getRequests: async (cursorId?: number, size: number = 10) => {
      const params: Record<string, string> = { size: size.toString() };
      if (cursorId) {
        params.cursorId = cursorId.toString();
      }
      return api.get<{
        message: string;
        data: {
          hasNext: boolean;
          values: Array<{
            signupFormId: number;
            signupRequestId: number;
            name: string;
            email: string;
            profile: string;
            purpose: string;
            state: 'PENDING' | 'APPROVED' | 'REJECTED';
          }>;
        }
      }>('/signup', { params });
    }
  },

  docs: {
    getList: async () => {
      return api.get<unknown[]>('/docs');
    },
    getSidebar: async (docsId: string) => {
      return api.get<unknown>(`/docs/${docsId}/sidebar`);
    },
    getDetail: async (docsId: string) => {
      return api.get<unknown>(`/docs/${docsId}`);
    },
    createOriginal: async (data: {
      title: string;
      description: string;
      domain: string;
      repository_url: string;
      auto_approval: boolean;
      sidebar: {
        title: string;
        sideBarBlocks: Array<{
          sideBarBlockId: number;
          title: string;
          docsId: number;
        }>;
      };
    }) => {
      return api.post<void>('/docs/original', data);
    },
    createCustom: async (data: {
      title: string;
      description: string;
      domain: string;
      repository_url: string;
      auto_approval: boolean;
    }) => {
      return api.post<void>('/docs/custom', data);
    },
    delete: async (docsId: number) => {
      return api.request<void>('DELETE', `/docs/${docsId}`);
    },
    update: async (docsId: number, data: {
      title?: string;
      description?: string;
      domain?: string;
      repository_url?: string;
    }) => {
      return api.patch<void>(`/docs/${docsId}`, data);
    },
    toggleAutoApproval: async (docsId: number, autoApproval: boolean) => {
      return api.patch<void>(`/docs/${docsId}/auto-approval`, { auto_approval: autoApproval });
    },
    getPage: async (docsId: number, mappedId: string) => {
      return api.get<unknown>(`/docs/${docsId}/page/${mappedId}`);
    },
    updatePage: async (docsId: number, mappedId: string, docsBlocks: unknown[]) => {
      return api.request<void>('PUT', `/docs/${docsId}/page/${mappedId}`, { docsBlocks });
    },
    updateSidebar: async (docsId: number, sideBarBlocks: unknown[]) => {
      return api.request<void>('PUT', `/docs/${docsId}/sidebar`, { sideBarBlocks });
    },
    replace: async (docsId: number, data: {
      title: string;
      description: string;
      domain: string;
      repository_url: string;
      auto_approval: boolean;
    }) => {
      return api.request<void>('PUT', `/docs/${docsId}`, data);
    }
  },

  apiToken: {
    create: async (name: string, domains: string[] = []) => {
      return api.post<{ message: string; data: unknown }>('/api/token', { apiTokenName: name, domains });
    },
    getList: async (cursor?: number, size: number = 20) => {
      const params: Record<string, string> = { size: size.toString() };
      if (cursor) {
        params.cursor = cursor.toString();
      }
      return api.get<{ message: string; data: { values: unknown[]; hasNext: boolean } }>('/api/token', { params });
    },
    getDetail: async (apiTokenId: number) => {
      return api.get<{ message: string; data: unknown }>(`/api/token/${apiTokenId}`);
    },
    registerApi: async (apiTokenId: number, apiId: string, apiUseReason: string) => {
      return api.post<void>(`/api/${apiTokenId}/use-reason`, { apiId, apiUseReason });
    },
    reissueSecret: async (apiTokenId: number) => {
      return api.patch<{ message: string; data: { secretKey: string } }>(`/api/token/${apiTokenId}/secret`, {});
    },
    updateName: async (apiTokenId: number, name: string) => {
      return api.patch<void>(`/api/token/${apiTokenId}/name`, { name });
    },
    updateUsageEndpoint: async (apiUsageId: number, endpoint: string) => {
      return api.patch<void>(`/api/usage/${apiUsageId}/endpoint`, { endpoint });
    }
  },

  healthCheck: async (endpoint: string, method: string) => {
    return api.post<{ message: string; data: { healthy: boolean } }>('/api/healthy', { endpoint, method });
  }
};
