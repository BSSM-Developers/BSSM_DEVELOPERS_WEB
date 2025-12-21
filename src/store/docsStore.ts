import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ApiDoc, DocsBlock } from "@/types/docs";
import { docsSubData } from "@/app/docs/mock/docsSubData";
import { apiMockData } from "@/app/docs/mock/apiMockData";

type BlockWithId = DocsBlock & { id: string };

export interface DocsStoreState {
  selected: string;
  setSelected: (key: string) => void;
  docsData: Record<string, BlockWithId[]>;
  apiData: Record<string, ApiDoc>;
  updateDocsData: (id: string, blocks: BlockWithId[]) => void;
  updateApiData: (id: string, data: ApiDoc) => void;
}

// 초기 데이터 구성
const initialDocsData: Record<string, BlockWithId[]> = {};
docsSubData.forEach(entry => {
  initialDocsData[entry.id] = entry.blocks as BlockWithId[];
});

export const useDocsStore = create<DocsStoreState>()(
  persist(
    (set) => ({
      selected: "doc-1",
      setSelected: (key: string) => set({ selected: key }),
      docsData: initialDocsData,
      apiData: apiMockData,
      updateDocsData: (id, blocks) => set((state) => ({
        docsData: { ...state.docsData, [id]: blocks }
      })),
      updateApiData: (id, data) => set((state) => ({
        apiData: { ...state.apiData, [id]: data }
      })),
    }),
    {
      name: "docs-storage",
    }
  )
);