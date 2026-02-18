import { create } from "zustand";

export type Section = "command" | "learning" | "knowledge" | "tasks";

interface AppState {
  activeSection: Section;
  sidebarOpen: boolean;
  searchOpen: boolean;
  searchQuery: string;
  embeddingStatus: "uninitialized" | "loading" | "ready" | "error";
  embeddingProgress: number;

  setActiveSection: (section: Section) => void;
  toggleSidebar: () => void;
  setSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setEmbeddingStatus: (status: AppState["embeddingStatus"]) => void;
  setEmbeddingProgress: (progress: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: "command",
  sidebarOpen: true,
  searchOpen: false,
  searchQuery: "",
  embeddingStatus: "uninitialized",
  embeddingProgress: 0,

  setActiveSection: (section) => set({ activeSection: section }),
  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  setSearchOpen: (open) => set({ searchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setEmbeddingStatus: (status) => set({ embeddingStatus: status }),
  setEmbeddingProgress: (progress) => set({ embeddingProgress: progress })
}));