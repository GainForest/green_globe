import { create } from "zustand";

export type SidebarState = {
  isOpen: boolean;
};

export type SidebarActions = {
  setIsOpen: (isOpen: boolean) => void;
};

type SidebarStore = SidebarState & SidebarActions;

const useSidebarStore = create<SidebarStore>((set) => ({
  isOpen: true,
  setIsOpen: (isOpen: boolean) => set({ isOpen }),
}));

export default useSidebarStore;
