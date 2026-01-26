import { fetchClinet } from "@/utils/fetcher";

interface SidebarBlock {
  sideBarBlockId: number;
  title: string;
  docsId: number;
}

interface CreateOriginalData {
  title: string;
  description: string;
  domain: string;
  repository_url: string;
  auto_approval: boolean;
  sidebar: {
    title: string;
    sideBarBlocks: SidebarBlock[];
  };
}

interface CreateCustomData {
  title: string;
  description: string;
  domain: string;
  repository_url: string;
  auto_approval: boolean;
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

// Interfaces for response types should be defined more strictly ideally
// but keeping minimal structure as per current needs.

export const docsApi = {
  getList: async () => {
    return fetchClinet.get<unknown[]>("/docs");
  },
  getSidebar: async (docsId: string) => {
    return fetchClinet.get<unknown>(`/docs/${docsId}/sidebar`);
  },
  getDetail: async (docsId: string) => {
    return fetchClinet.get<unknown>(`/docs/${docsId}`);
  },
  createOriginal: async (data: CreateOriginalData) => {
    return fetchClinet.post<void>("/docs/original", data);
  },
  createCustom: async (data: CreateCustomData) => {
    return fetchClinet.post<void>("/docs/custom", data);
  },
  delete: async (docsId: number) => {
    return fetchClinet.delete<void>(`/docs/${docsId}`);
  },
  update: async (docsId: number, data: UpdateDocsData) => {
    return fetchClinet.patch<void>(`/docs/${docsId}`, data);
  },
  toggleAutoApproval: async (docsId: number, autoApproval: boolean) => {
    return fetchClinet.patch<void>(`/docs/${docsId}/auto-approval`, {
      auto_approval: autoApproval,
    });
  },
  getPage: async (docsId: number, mappedId: string) => {
    return fetchClinet.get<unknown>(`/docs/${docsId}/page/${mappedId}`);
  },
  updatePage: async (docsId: number, mappedId: string, docsBlocks: unknown[]) => {
    return fetchClinet.put<void>(`/docs/${docsId}/page/${mappedId}`, { docsBlocks });
  },
  updateSidebar: async (docsId: number, sideBarBlocks: unknown[]) => {
    return fetchClinet.put<void>(`/docs/${docsId}/sidebar`, { sideBarBlocks });
  },
  replace: async (docsId: number, data: ReplaceDocsData) => {
    return fetchClinet.put<void>(`/docs/${docsId}`, data);
  },
};
