import { fetchClinet } from "@/utils/fetcher";
import { SidebarNode } from "@/components/ui/sidebarItem/types";

interface CreateOriginalData {
  title: string;
  description: string;
  domain: string;
  repository_url: string;
  auto_approval: boolean;
  sidebar: {
    title: string;
    sideBarBlocks: SidebarNode[];
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

interface DocsItem {
  docsId: number;
  id?: number; // fallback for older structure if needed
  title: string;
  description: string;
  writer?: string;
  // Add other properties as needed
}

export interface DocsListResponse {
  values: DocsItem[];
}

// Interfaces for response types should be defined more strictly ideally
// but keeping minimal structure as per current needs.

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
    return fetchClinet.post<void>("/docs/original", data);
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
