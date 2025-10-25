import { create } from "zustand";

export interface DocsStoreState {
  selected: string;
  setSelected: (key: string) => void;
}

export const useDocsStore = create<DocsStoreState>((set: any) => ({
  selected: "doc-2",
  setSelected: (key: string) => set({ selected: key }),
}));