// 쿠키 처리를 위해 프록시 사용 강제
const BASE_URL = '/api';

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
}

export const api = {
  request: async <T>(method: string, endpoint: string, body?: any, options: ApiRequestOptions = {}): Promise<T> => {
    // 상대 경로 BASE_URL 처리
    const base = (BASE_URL.startsWith('/') && typeof window !== 'undefined')
      ? window.location.origin
      : undefined;

    const url = new URL(`${BASE_URL}${endpoint}`, base);

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

    if (body) {
      fetchOptions.body = JSON.stringify(body);
    }

    let response = await fetch(url.toString(), fetchOptions);

    // 401 토큰 만료 처리
    if (response.status === 401 && !options.skipAuth) {
      try {
        console.log("토큰 만료, 갱신 시도 중...");
        // 무한 루프 방지를 위해 별도 요청으로 갱신
        const refreshResponse = await api.auth.refreshToken();
        const newAccessToken = refreshResponse.accessToken;

        if (newAccessToken) {
          console.log("토큰 갱신 성공");
          tokenManager.setTokens(newAccessToken);

          // 새 토큰으로 헤더 업데이트
          headers['Authorization'] = `Bearer ${newAccessToken}`;
          fetchOptions.headers = headers;

          // 원래 요청 재시도
          response = await fetch(url.toString(), fetchOptions);
        }
      } catch (refreshError) {
        console.error("토큰 갱신 실패:", refreshError);
        tokenManager.clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw refreshError;
      }
    }

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error ${response.status}: ${response.statusText} - ${errorBody}`);
    }

    // 204 No Content 처리
    if (response.status === 204) {
      return {} as unknown as T;
    }

    const text = await response.text();
    return text ? JSON.parse(text) : ({} as unknown as T);
  },

  get: async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    return api.request<T>('GET', endpoint, undefined, options);
  },

  post: async <T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Promise<T> => {
    return api.request<T>('POST', endpoint, body, options);
  },

  patch: async <T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Promise<T> => {
    return api.request<T>('PATCH', endpoint, body, options);
  },

  // 인증 관련
  auth: {
    loginWithGoogle: async (code: string, codeVerifier: string) => {
      // 만료된 토큰 전송 방지를 위해 skipAuth 사용
      const response = await api.post<{ message: string; data: { accessToken: string } }>('/auth/google/token', { code, codeVerifier }, { skipAuth: true });
      return response.data;
    },
    logout: async () => {
      return api.post<void>('/auth/logout', {});
    },
    refreshToken: async () => {
      const response = await api.post<{ message: string; data: { accessToken: string } }>('/auth/refresh', {}, { skipAuth: true });
      return response.data;
    }
  },

  // 회원가입 관련
  signUp: {
    getMy: async () => {
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
      }>('/signup/me');
      return response.data;
    },
    updatePurpose: async (id: number, purpose: string) => {
      return api.patch<void>(`/signup/${id}/purpose`, { purpose });
    },
    // 관리자 기능
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

  // 문서 관련
  docs: {
    getList: async () => {
      return api.get<any[]>('/docs');
    },
    getSidebar: async (docsId: string) => {
      return api.get<any>(`/docs/${docsId}/sidebar`);
    },
    getDetail: async (docsId: string) => {
      return api.get<any>(`/docs/${docsId}`);
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
    }
  }
};

// 토큰 관리 헬퍼
export const tokenManager = {
  setTokens: (accessToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      // 쿠키에도 저장 (SSR/미들웨어용)
      document.cookie = `accessToken=${accessToken}; path=/; max-age=3600; SameSite=Lax`;
    }
  },
  getAccessToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  },
  clearTokens: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
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
  }
};
