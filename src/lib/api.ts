const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://dev.bssm-dev.com';

interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export const api = {
  get: async <T>(endpoint: string, options: ApiRequestOptions = {}): Promise<T> => {
    const url = new URL(`${BASE_URL}${endpoint}`);
    if (options.params) {
      Object.entries(options.params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });
    }

    const response = await fetch(url.toString(), {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  post: async <T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  patch: async <T>(endpoint: string, body: any, options: ApiRequestOptions = {}): Promise<T> => {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  },

  // Add other methods as needed

  // Auth methods
  auth: {
    // Google Login URL needs to be constructed on client or fetched if endpoint exists. 
    // Assuming manual construction for now as endpoint wasn't found.
    loginWithGoogle: async (code: string) => {
      return api.post<{ accessToken: string }>('/auth/google/token', { code });
    },
    logout: async () => {
      return api.post<void>('/auth/logout', {});
    },
    refreshToken: async (refreshToken: string) => {
      // Endpoint for refresh might be different or handled via cookie. 
      // Keeping as is for now but noting it wasn't explicitly verified in screenshots.
      return api.get<{ accessToken: string }>('/auth/refresh', { headers: { 'refresh-token': refreshToken } });
    }
  },

  // Sign Up methods
  signUp: {
    getMy: async () => {
      return api.get<{
        signupFormId: number;
        name: string;
        email: string;
        profile: string;
        purpose: string;
        state: 'PENDING' | 'APPROVED' | 'REJECTED';
      }>('/signup/me');
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
  setTokens: (accessToken: string, refreshToken: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
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
    }
  }
};
