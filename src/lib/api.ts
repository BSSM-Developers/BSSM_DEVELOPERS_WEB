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

  // Add other methods as needed

  // Docs related methods
  docs: {
    getList: async () => {
      return api.get<any[]>('/docs');
    },
    getSidebar: async (docsId: string) => {
      return api.get<any>(`/docs/${docsId}/sidebar`);
    }
  }
};
