import { fetchClinet } from "@/utils/fetcher";

export interface DocsBlock {
  id: string;
  mappedId: string;
  module: "main_title" | "default" | "collapse" | "api" | "docs_1" | "headline_1" | "headline_2" | "code" | "main";
  content: string;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
}

export interface SidebarBlock {
  id: string;
  mappedId?: string;
  label: string;
  module: "main_title" | "default" | "collapse" | "api";
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  childrenItems?: SidebarBlock[];
}

export interface DocsItem {
  docsId: string;
  id?: string;
  title: string;
  description: string;
  domain?: string;
  writer?: string;
  writerId?: number;
  autoApproval?: boolean;
  auto_approval?: boolean;
  repositoryUrl?: string;
  repository_url?: string;
  type?: string;
}

export interface DocsListResponse {
  message: string;
  data: {
    values: DocsItem[];
    hasNext: boolean;
  };
}

export interface SidebarResponse {
  message: string;
  data: {
    id: string;
    docsId: string;
    blocks: SidebarBlock[];
  };
}

export interface DocsPageResponse {
  message: string;
  data: {
    id: string;
    mappedId: string;
    docsId: string;
    endpoint: string;
    docsBlocks: DocsBlock[];
    sourceDocsId?: string;
    sourceMappedId?: string;
  };
}

export interface DocsDetailResponse {
  message: string;
  data: DocsItem;
}

export interface CreateOriginalData {
  title: string;
  description: string;
  domain: string;
  repository_url: string;
  auto_approval: boolean;
  writer_id?: number;
  sidebar: {
    blocks: SidebarBlock[];
  };
  docs_pages: {
    id: string;
    endpoint?: string;
    blocks: {
      id?: string;
      module: string;
      content?: string;
    }[];
  }[];
}

export interface CreateCustomData {
  title: string;
  description: string;
  writer_id?: number;
}

export interface UpdateDocsData {
  title: string;
  description: string;
  domain: string;
  repositoryUrl: string;
}

export interface DocsSideBarBlockRequest {
  id: string;
  label: string;
  module: "main_title" | "default" | "collapse" | "api";
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  childrenItems?: DocsSideBarBlockRequest[];
}

export interface DocsPageBlockRequest {
  id: string;
  module: string;
  content: string;
}

export interface ReplaceDocsData {
  title: string;
  description: string;
  domain: string;
  repository_url: string;
  auto_approval: boolean;
  sidebar: {
    blocks: DocsSideBarBlockRequest[];
  };
  docs_pages: {
    id: string;
    endpoint?: string;
    blocks?: DocsPageBlockRequest[];
    sourceDocsId?: string;
    sourceMappedId?: string;
  }[];
}

interface DocsCursorQueryParams {
  type?: string;
  cursor?: string;
  size?: number;
}

interface DocsPopularQueryParams extends DocsCursorQueryParams {
  tokenCount?: number;
}

export const docsApi = {
  getList: async () => {
    return fetchClinet.get<DocsListResponse>("/docs", { skipAuth: true });
  },
  getMyList: async ({ type, cursor, size = 20 }: DocsCursorQueryParams = {}) => {
    const params: Record<string, string> = {};
    if (type) {
      params.type = type;
    }
    if (cursor) {
      params.cursor = cursor;
    }
    params.size = String(size);
    return fetchClinet.get<DocsListResponse>("/docs/my", { params });
  },
  getPopularList: async ({ type, cursor, size = 20, tokenCount }: DocsPopularQueryParams = {}) => {
    const params: Record<string, string> = {};
    if (type) {
      params.type = type;
    }
    if (cursor) {
      params.cursor = cursor;
    }
    if (tokenCount !== undefined) {
      params.tokenCount = String(tokenCount);
    }
    params.size = String(size);
    return fetchClinet.get<DocsListResponse>("/docs/popular", { params, skipAuth: true });
  },
  getMyPopularList: async ({ type, cursor, size = 20, tokenCount }: DocsPopularQueryParams = {}) => {
    const params: Record<string, string> = {};
    if (type) {
      params.type = type;
    }
    if (cursor) {
      params.cursor = cursor;
    }
    if (tokenCount !== undefined) {
      params.tokenCount = String(tokenCount);
    }
    params.size = String(size);
    return fetchClinet.get<DocsListResponse>("/docs/my/popular", { params });
  },
  getSidebar: async (docsId: string, usePublic: boolean = true) => {
    if (usePublic) {
      return fetchClinet.get<SidebarResponse>(`/docs/${docsId}/sidebar`, {
        skipAuth: true,
        omitCredentials: true,
      });
    }
    return fetchClinet.get<SidebarResponse>(`/docs/${docsId}/sidebar`, {
      suppressLogout: true,
    });
  },
  getDetail: async (docsId: string) => {
    return fetchClinet.get<DocsDetailResponse>(`/docs/${docsId}`, { skipAuth: true });
  },
  createOriginal: async (data: CreateOriginalData) => {
    return fetchClinet.post<{ id: number }>("/docs/original", data);
  },
  createCustom: async (data: CreateCustomData) => {
    return fetchClinet.post<void>("/docs/custom", data);
  },
  delete: async (docsId: string | number) => {
    return fetchClinet.delete<void>(`/docs/${docsId}`);
  },
  update: async (docsId: string | number, data: UpdateDocsData) => {
    return fetchClinet.patch<void>(`/docs/${docsId}`, data);
  },
  toggleAutoApproval: async (docsId: string | number, autoApproval: boolean) => {
    return fetchClinet.patch<void>(`/docs/${docsId}/auto-approval`, {
      auto_approval: autoApproval,
    });
  },
  getPage: async (docsId: string | number, mappedId: string) => {
    return fetchClinet.get<DocsPageResponse>(`/docs/${docsId}/page/${mappedId}`, {
      suppressLogout: true,
    });
  },
  getPublicPage: async (docsId: string | number, mappedId: string) => {
    return fetchClinet.get<DocsPageResponse>(`/docs/${docsId}/page/${mappedId}`, {
      skipAuth: true,
      suppressLogout: true,
      omitCredentials: true,
    });
  },
  updatePage: async (docsId: string | number, mappedId: string | number, docsBlocks: unknown[]) => {
    return fetchClinet.put<void>(`/docs/${docsId}/page/${mappedId}`, { docsBlocks });
  },
  updateSidebar: async (docsId: string | number, blocks: unknown[]) => {
    return fetchClinet.put<void>(`/docs/${docsId}/sidebar`, {
      blocks,
      sideBarBlocks: blocks,
    });
  },
  replace: async (docsId: string | number, data: ReplaceDocsData) => {
    return fetchClinet.put<void>(`/docs/${docsId}`, data);
  },
};
