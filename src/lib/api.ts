// Force using proxy to handle cookies correctly
const BASE_URL = '/api';

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string>;
  skipAuth?: boolean;
}

export const api = {
  get: async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    // Handle relative BASE_URL (e.g., '/api') by providing current origin as base
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

    const response = await fetch(url.toString(), {
      ...options,
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error ${response.status}: ${response.statusText} - ${errorBody}`);
    }

    return response.json();
  },

  post: async <T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Promise<T> => {
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

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error ${response.status}: ${response.statusText} - ${errorBody}`);
    }

    return response.json();
  },

  patch: async <T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Promise<T> => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (!options.skipAuth) {
      const accessToken = tokenManager.getAccessToken();
      console.log('Patch Request - AccessToken:', accessToken ? 'Present' : 'Missing');
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      method: 'PATCH',
      headers,
      body: JSON.stringify(body),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error ${response.status}: ${response.statusText} - ${errorBody}`);
    }

    return response.json();
  },

  // Add other methods as needed

  // Auth methods
  auth: {
    // Google Login URL needs to be constructed on client or fetched if endpoint exists. 
    // Assuming manual construction for now as endpoint wasn't found.
    loginWithGoogle: async (code: string, codeVerifier: string) => {
      // Skip auth header to avoid sending expired token which causes 401
      const response = await api.post<{ message: string; data: { accessToken: string } }>('/auth/google/token', { code, codeVerifier }, { skipAuth: true });
      return response.data;
    },
    logout: async () => {
      return api.post<void>('/auth/logout', {});
    },
    refreshToken: async () => {
      // Updated to POST and cookie-based as per screenshot
      // Skip auth header here too just in case
      const response = await api.post<{ message: string; data: { accessToken: string } }>('/auth/refresh', {}, { skipAuth: true });
      return response.data;
    }
  },

  // Sign Up methods
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
    // Admin methods
    approve: async (id: number) => {
      return api.patch<void>(`/signup/${id}/approve`, {});
    },
    reject: async (id: number) => {
      return api.patch<void>(`/signup/${id}/reject`, {});
    }
  },

  // Docs related methods
  docs: {
    getList: async () => {
      return api.get<any[]>('/docs');
    },
    getSidebar: async (docsId: string) => {
      return api.get<any>(`/docs/${docsId}/sidebar`);
    },
    getDetail: async (docsId: string) => {
      return api.get<any>(`/docs/${docsId}`);
    }
  }
};

// Token management helpers
export const tokenManager = {
  setTokens: (accessToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      // Also set in cookie as requested
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
      // Clear cookie
      document.cookie = 'accessToken=; path=/; max-age=0; SameSite=Lax';
    }
  }
};
