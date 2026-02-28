import { fetchClinet } from "@/utils/fetcher";

interface DocsPageBlock {
  id?: string;
  module: string;
  content?: string;
}

interface DocsPage {
  id: string;
  endpoint?: string;
  blocks: DocsPageBlock[];
}

interface SidebarBlock {
  id: string;
  label: string;
  module?: string;
  method?: string;
  childrenItems?: SidebarBlock[];
}

interface CreateOriginalData {
  title: string;
  description: string;
  domain: string;
  repository_url: string;
  auto_approval: boolean;
  writerId?: number;
  writer_id?: number;
  sidebar: {
    blocks: SidebarBlock[];
  };
  docs_pages: DocsPage[];
}

interface CreateCustomData {
  title: string;
  description: string;
  domain: string;
  repository_url: string;
  auto_approval: boolean;
  writerId?: number;
  writer_id?: number;
}

interface UpdateDocsData {
  title?: string;
  description?: string;
  domain?: string;
  repository_url?: string;
}

interface ReplaceDocsData {
  title: string;
  description: string;
  domain: string;
  repository_url: string;
  auto_approval: boolean;
}

interface DocsItem {
  docsId: number;
  id?: number;
  title: string;
  description: string;
  writer?: string;
}

export interface DocsListResponse {
  values: DocsItem[];
}


export const docsApi = {
  getList: async () => {
    return fetchClinet.get<DocsListResponse | DocsItem[]>("/docs");
  },
  getSidebar: async (docsId: string) => {
    return fetchClinet.get<unknown>(`/docs/${docsId}/sidebar`);
  },
  getDetail: async (docsId: string) => {
    return fetchClinet.get<unknown>(`/docs/${docsId}`);
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
    return fetchClinet.get<unknown>(`/docs/${docsId}/page/${mappedId}`);
  },
  updatePage: async (docsId: string | number, mappedId: string | number, docsBlocks: unknown[]) => {
    return fetchClinet.put<void>(`/docs/${docsId}/page/${mappedId}`, { docsBlocks });
  },
  updateSidebar: async (docsId: string | number, sideBarBlocks: unknown[]) => {
    return fetchClinet.put<void>(`/docs/${docsId}/sidebar`, { sideBarBlocks });
  },
  replace: async (docsId: string | number, data: ReplaceDocsData) => {
    return fetchClinet.put<void>(`/docs/${docsId}`, data);
  },
};
