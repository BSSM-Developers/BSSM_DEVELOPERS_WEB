import { create } from "zustand";

export interface DocsStoreState {
  selected: string;
  setSelected: (key: string) => void;
}

export const useDocsStore = create<DocsStoreState>((set: any) => ({
  selected: "시작하기",
  setSelected: (key: string) => set({ selected: key }),
}));


